import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/useSession';

export default function SignInWebScreen() {
  const { signInWithGoogle } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  useEffect(() => {
    if (!webClientId) {
      return;
    }

    GoogleSignin.configure({ webClientId });
  }, [webClientId]);

  const handleGooglePress = async () => {
    if (!webClientId) {
      setErrorMessage('Missing env: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
      return;
    }
    if (!supabase) {
      setErrorMessage('Missing env: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        return;
      }

      if (!response.data.idToken) {
        setErrorMessage('Google idToken was not returned.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.data.idToken,
      });

      if (error) {
        setErrorMessage(error.message || 'Supabase sign-in failed.');
        return;
      }

      const sessionLabel =
        data.user?.email || response.data.user.email || response.data.user.name || 'google-user';
      signInWithGoogle(sessionLabel);
    } catch (error) {
      if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }

      setErrorMessage('Google or Supabase sign-in failed. Check env values and provider settings.');
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
