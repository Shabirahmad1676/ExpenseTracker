import { View, Text, Image, StyleSheet } from "react-native";
import React, { useEffect } from "react";
import { colors, spacingX, spacingY, radius } from "../../constants/theme";
import { useRouter } from "expo-router";
import CustomButton from "../../components/CustomButton";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";

const Welcome = () => {
  const router = useRouter();

  // Shared animation values
  const imageScale = useSharedValue(0.5);
  const footerY = useSharedValue(100);
  const footerOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate image scale
    imageScale.value = withTiming(1, { duration: 800 });

    // Animate footer after image
    footerY.value = withDelay(400, withTiming(0, { duration: 800 }));
    footerOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));

    // Animate button after footer
    buttonOpacity.value = withDelay(900, withTiming(1, { duration: 600 }));
  }, []);

  // Animated styles
  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const footerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: footerY.value }],
    opacity: footerOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.headerAction}>
        <CustomButton
          title="Sign In"
          variant="outline"
          onPress={() => router.push("/(auth)/Register")}
          style={{ paddingHorizontal: 20, paddingVertical: 10 }}
          textStyle={{ fontSize: 14 }}
        />
      </View>

      <Animated.Image
      entering={FadeIn.duration(500)}
        style={[styles.illustration, imageStyle]}
        source={require("../../assets/images/welcome.png")}
      />

      <Animated.View entering={FadeInDown.duration(500).springify().damping(12)} style={[styles.footer, footerStyle]}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Always take control</Text>
          <Text style={styles.title}>of your finances</Text>
        </View>

        <View style={styles.subtitleWrap}>
          <Text style={styles.subtitle}>
            Finance should be organized to build a better
          </Text>
          <Text style={styles.subtitle}>lifecycle for the future.</Text>
        </View>

        <Animated.View style={buttonStyle}>
          <CustomButton
            title="Get Started"
            onPress={() => router.push("/(auth)/Login")}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: "#a3e635",
            }}
            textStyle={{ fontSize: 14 }}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral900,
  },
  headerAction: {
    position: "absolute",
    top: spacingY._20,
    right: spacingX._20,
    zIndex: 2,
  },
  illustration: {
    alignSelf: "center",
    width:380,
    height: 380,
    resizeMode: "contain",
    marginTop: spacingY._60,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.neutral800,
    paddingHorizontal: spacingX._25,
    paddingTop: spacingY._25,
    paddingBottom: spacingY._30,
    borderTopLeftRadius: radius._30,
    borderTopRightRadius: radius._30,
  },
  titleWrap: {
    marginBottom: spacingY._15,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    textAlign: "center",
    fontWeight: "700",
  },
  subtitleWrap: {
    marginBottom: spacingY._25,
  },
  subtitle: {
    textAlign: "center",
    color: colors.textLight,
    fontSize: 14,
  },
});
