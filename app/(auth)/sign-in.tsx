import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/hooks/useSession';

export default function SignInScreen() {
  const { signInWithGoogle, signInWithApple } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  const missingConfig = useMemo(() => {
    const missing: string[] = [];

    if (!webClientId) {
      missing.push('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
    }

    if (Platform.OS === 'ios' && !iosClientId) {
      missing.push('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');
    }

    if (Platform.OS === 'android' && !androidClientId) {
      missing.push('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID');
    }

    return missing;
  }, [androidClientId, iosClientId, webClientId]);

  useEffect(() => {
    if (missingConfig.length > 0) {
      return;
    }

    GoogleSignin.configure({
      webClientId,
      iosClientId: iosClientId || undefined,
    });
  }, [iosClientId, missingConfig.length, webClientId]);

  const handleGooglePress = async () => {
    if (missingConfig.length > 0) {
      setErrorMessage(`Missing env: ${missingConfig.join(', ')}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        return;
      }

      if (!response.data.idToken) {
        setErrorMessage('Google idToken was not returned.');
        return;
      }

      const sessionLabel = response.data.user.email || response.data.user.name || 'google-user';
      signInWithGoogle(sessionLabel);
    } catch (error) {
      if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }

      if (isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setErrorMessage('Google Play Services is not available on this device.');
        return;
      }

      setErrorMessage('Google sign-in failed. Check app.json plugin and env values.');
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
        <Pressable onPress={() => signInWithApple()} style={[styles.button, styles.appleButton]}>
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
