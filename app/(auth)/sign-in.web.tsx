import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase.web';

export default function SignInWebScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGooglePress = async () => {
    if (!supabase) {
      setErrorMessage('Missing env: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Supabase sign-in failed.');
        return;
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(`Unexpected error: ${error.message}`);
        return;
      }
      setErrorMessage(`Unexpected error: ${String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Rap Lyrics App</Text>
        <Text style={styles.title}>Sign in on Web</Text>
        <Text style={styles.subtitle}>Web版は独立したUIで管理できます。</Text>

        <Pressable
          disabled={isSubmitting}
          onPress={handleGooglePress}
          style={[styles.button, isSubmitting ? styles.buttonDisabled : null]}>
          <Text style={styles.buttonText}>Continue with Google</Text>
        </Pressable>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 18,
    padding: 28,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  eyebrow: {
    color: '#475569',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: '#0f172a',
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: '#334155',
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#1d4ed8',
    paddingVertical: 14,
    alignItems: 'center',
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
    color: '#b91c1c',
    fontSize: 13,
  },
});
