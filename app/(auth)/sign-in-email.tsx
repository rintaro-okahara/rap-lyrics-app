import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '@/lib/supabase';

export default function SignInEmailScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  const handleEmailSignIn = async () => {
    if (missingConfig.length > 0) {
      setErrorMessage(`Missing env: ${missingConfig.join(', ')}`);
      return;
    }

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (!supabase) {
        setErrorMessage('Supabase client is not configured.');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message || 'Email sign-in failed.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(`Email sign-in failed: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in with Email</Text>
      <Text style={styles.subtitle}>登録済みのメールアドレスでログインします。</Text>

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
        onPress={handleEmailSignIn}
        style={[styles.button, isSubmitting ? styles.buttonDisabled : null]}>
        <Text style={styles.buttonText}>Sign in with Email</Text>
      </Pressable>

      <Pressable disabled={isSubmitting} onPress={() => router.back()} style={styles.textButton}>
        <Text style={styles.textButtonText}>Back</Text>
      </Pressable>

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
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#0f766e',
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
  errorText: {
    marginTop: 8,
    color: '#fca5a5',
    fontSize: 13,
  },
});
