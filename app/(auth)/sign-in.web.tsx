import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '@/lib/supabase.web';

export default function SignInWebScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailPasswordSignIn = async () => {
    if (!supabase) {
      setErrorMessage('Missing env: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
      return;
    }

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message || 'Email sign-in failed.');
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
        <Text style={styles.subtitle}>Email/Password または OAuth でサインインできます。</Text>

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          editable={!isSubmitting}
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={email}
        />

        <TextInput
          autoCapitalize="none"
          autoComplete="password"
          editable={!isSubmitting}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          style={styles.input}
          value={password}
        />

        <Pressable
          disabled={isSubmitting}
          onPress={handleEmailPasswordSignIn}
          style={[styles.button, styles.emailButton, isSubmitting ? styles.buttonDisabled : null]}>
          <Text style={styles.buttonText}>Sign in with Email</Text>
        </Pressable>

        <Pressable
          disabled={isSubmitting}
          onPress={() => router.push({ pathname: '/(auth)/sign-up', params: { email: email.trim() } })}
          style={[styles.textButton, isSubmitting ? styles.buttonDisabled : null]}>
          <Text style={styles.textButtonText}>Create account</Text>
        </Pressable>

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
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    borderRadius: 12,
    backgroundColor: '#1d4ed8',
    paddingVertical: 14,
    alignItems: 'center',
  },
  emailButton: {
    backgroundColor: '#16a34a',
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  textButtonText: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '600',
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
