import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const missingConfig = useMemo(() => {
    const missing: string[] = [];

    if (!supabaseUrl) {
      missing.push('EXPO_PUBLIC_SUPABASE_URL');
    }

    if (!supabaseAnonKey) {
      missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
    }

    if (!supabase) {
      missing.push('Supabase client init failed');
    }

    return missing;
  }, [supabaseAnonKey, supabaseUrl]);

  const handleGooglePress = async () => {
    if (missingConfig.length > 0) {
      setErrorMessage(`Missing env: ${missingConfig.join(', ')}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (!supabase) {
        setErrorMessage('Supabase client is not configured.');
        return;
      }

      const redirectTo = makeRedirectUri({
        scheme: 'rap-lyrics-app',
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Supabase sign-in failed.');
        return;
      }

      if (!data.url) {
        setErrorMessage('Supabase did not return an OAuth URL.');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== 'success') {
        return;
      }

      const parsed = Linking.parse(result.url);
      const code = typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : null;

      if (!code) {
        setErrorMessage('No auth code was returned from OAuth callback.');
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        setErrorMessage(exchangeError.message || 'Failed to create Supabase session.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(`Google OAuth failed: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>iOS / Android で共通UI。Appleは iOS のみ表示。</Text>

      <Pressable
        disabled={isSubmitting}
        onPress={handleGooglePress}
        style={[styles.button, styles.googleButton, isSubmitting ? styles.buttonDisabled : null]}>
        <Text style={styles.buttonText}>Continue with Google</Text>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Pressable
          disabled
          style={[styles.button, styles.appleButton, styles.buttonDisabled]}
          onPress={() => undefined}>
          <Text style={styles.buttonText}>Continue with Apple</Text>
        </Pressable>
      ) : null}

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#0e1117',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#2563eb',
  },
  appleButton: {
    backgroundColor: '#111827',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    marginTop: 8,
    color: '#fca5a5',
    fontSize: 13,
  },
});
