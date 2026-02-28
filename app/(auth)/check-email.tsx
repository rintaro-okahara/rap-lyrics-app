import { makeRedirectUri } from 'expo-auth-session';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';

export default function CheckEmailScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleResend = async () => {
    if (missingConfig.length > 0) {
      setErrorMessage(`Missing env: ${missingConfig.join(', ')}`);
      return;
    }

    if (!email) {
      setErrorMessage('Email is missing. Please go back and sign up again.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      if (!supabase) {
        setErrorMessage('Supabase client is not configured.');
        return;
      }

      const emailRedirectTo = makeRedirectUri({ scheme: 'rap-lyrics-app', path: 'sign-in' });
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Failed to resend confirmation email.');
        return;
      }

      setSuccessMessage('Confirmation email resent.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(`Failed to resend confirmation email: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.subtitle}>確認リンクを開くとアプリに戻ってサインインされます。</Text>
      {email ? <Text style={styles.emailText}>{email}</Text> : null}

      <Pressable
        disabled={isSubmitting}
        onPress={handleResend}
        style={[styles.button, isSubmitting ? styles.buttonDisabled : null]}>
        <Text style={styles.buttonText}>Resend confirmation email</Text>
      </Pressable>

      <Pressable disabled={isSubmitting} onPress={() => router.replace('/(auth)/sign-in')} style={styles.textButton}>
        <Text style={styles.textButtonText}>Back to sign in</Text>
      </Pressable>

      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
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
    marginBottom: 8,
  },
  emailText: {
    color: '#bfdbfe',
    fontSize: 14,
    marginBottom: 4,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  textButtonText: {
    color: '#bfdbfe',
    fontSize: 14,
    fontWeight: '600',
  },
  successText: {
    marginTop: 8,
    color: '#86efac',
    fontSize: 13,
  },
  errorText: {
    marginTop: 8,
    color: '#fca5a5',
    fontSize: 13,
  },
});
