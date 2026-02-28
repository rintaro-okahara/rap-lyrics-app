import * as AppleAuthentication from 'expo-apple-authentication';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type CodedError = Error & { code?: string };

export default function SignInScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const url = Linking.useURL();

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

  const createSessionFromUrl = useCallback(async (callbackUrl: string) => {
    if (!supabase) {
      setErrorMessage('Supabase client is not configured.');
      return;
    }

    const { params, errorCode } = QueryParams.getQueryParams(callbackUrl);
    if (errorCode) {
      setErrorMessage(errorCode);
      return;
    }

    const code = typeof params.code === 'string' ? params.code : null;
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setErrorMessage(error.message || 'Failed to create Supabase session.');
      }
      return;
    }

    const accessToken = typeof params.access_token === 'string' ? params.access_token : null;
    const refreshToken = typeof params.refresh_token === 'string' ? params.refresh_token : null;
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setErrorMessage(error.message || 'Failed to create Supabase session.');
      }
      return;
    }

    setErrorMessage('No auth code or tokens were returned from OAuth callback.');
  }, []);

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

      const redirectTo = makeRedirectUri({ scheme: 'rap-lyrics-app', path: 'sign-in' });

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
      if (result.type === 'success') {
        await createSessionFromUrl(result.url);
        return;
      }

      setErrorMessage('Google sign-in was cancelled.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(`Google OAuth failed: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplePress = async () => {
    if (Platform.OS !== 'ios') {
      return;
    }

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

      const isAppleSignInAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAppleSignInAvailable) {
        setErrorMessage('Apple Sign In is not available on this device.');
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        setErrorMessage('Apple did not return an identity token.');
        return;
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        setErrorMessage(error.message || 'Failed to create Supabase session.');
      }
    } catch (error) {
      const codedError = error as CodedError;
      if (codedError.code === 'ERR_REQUEST_CANCELED') {
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(`Apple sign-in failed: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!url) {
      return;
    }

    void createSessionFromUrl(url);
  }, [createSessionFromUrl, url]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>iOS / Android で共通UI。Appleは iOS のみ表示。</Text>

      <Pressable
        disabled={isSubmitting}
        onPress={() => router.push('/(auth)/sign-in-email')}
        style={[styles.button, styles.emailSignInButton, isSubmitting ? styles.buttonDisabled : null]}>
        <Text style={styles.buttonText}>Sign in with Email</Text>
      </Pressable>

      <Pressable
        disabled={isSubmitting}
        onPress={() => router.push('/(auth)/sign-up')}
        style={[styles.button, styles.emailButton, isSubmitting ? styles.buttonDisabled : null]}>
        <Text style={styles.buttonText}>Sign Up with Email</Text>
      </Pressable>

      <Pressable
        disabled={isSubmitting}
        onPress={handleGooglePress}
        style={[styles.button, styles.googleButton, isSubmitting ? styles.buttonDisabled : null]}>
        <Text style={styles.buttonText}>Continue with Google</Text>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Pressable
          disabled={isSubmitting}
          style={[styles.button, styles.appleButton, isSubmitting ? styles.buttonDisabled : null]}
          onPress={handleApplePress}>
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
  emailButton: {
    backgroundColor: '#16a34a',
  },
  emailSignInButton: {
    backgroundColor: '#0f766e',
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
