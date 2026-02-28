import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type StartupLogoSplashProps = {
  onFinished: () => void;
};

export function StartupLogoSplash({ onFinished }: StartupLogoSplashProps) {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.92);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withSequence(
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
      withDelay(450, withTiming(0, { duration: 600, easing: Easing.in(Easing.cubic) })),
    );

    logoScale.value = withSequence(
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
      withDelay(450, withTiming(0.98, { duration: 600, easing: Easing.in(Easing.cubic) })),
    );

    containerOpacity.value = withSequence(
      withDelay(
        1150,
        withTiming(0, { duration: 280, easing: Easing.linear }, (finished) => {
          if (finished) {
            runOnJS(onFinished)();
          }
        }),
      ),
    );
  }, [containerOpacity, logoOpacity, logoScale, onFinished]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <Animated.View style={[styles.overlay, containerAnimatedStyle]}>
      <Animated.View style={logoAnimatedStyle}>
        <Image
          source={require('@/assets/images/splash-icon.png')}
          contentFit="contain"
          style={styles.logo}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    zIndex: 10,
  },
  logo: {
    width: 170,
    height: 170,
  },
});
