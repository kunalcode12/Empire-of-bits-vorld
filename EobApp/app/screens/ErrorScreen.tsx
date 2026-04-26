import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ErrorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ message?: string; code?: string }>();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const errorMessage =
    params.message ?? "Something went wrong. Please try again.";
  const errorCode = params.code ?? "UNKNOWN_ERROR";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Error icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconRing}>
            <Text style={styles.iconText}>✕</Text>
          </View>
        </View>

        {/* Text */}
        <Text style={styles.title}>Oops.</Text>
        <Text style={styles.subtitle}>Something went wrong</Text>
        <Text style={styles.message}>{errorMessage}</Text>

        {/* Error code badge */}
        <View style={styles.codeBadge}>
          <BlurView
            intensity={15}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.codeBadgeInner}>
            <Text style={styles.codeLabel}>Error Code</Text>
            <Text style={styles.codeValue}>{errorCode}</Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace("/")}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Return to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </TouchableOpacity>

        {/* Help text */}
        <Text style={styles.helpText}>
          If this keeps happening, try signing out and back in.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  bgOrb1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255,70,70,0.04)",
    top: -60,
    right: -80,
  },
  bgOrb2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.03)",
    bottom: 100,
    left: -60,
  },
  content: { alignItems: "center", width: "100%" },
  iconContainer: { marginBottom: 28 },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "rgba(255,70,70,0.4)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,70,70,0.08)",
  },
  iconText: { color: "#ff6b6b", fontSize: 28, fontWeight: "300" },
  title: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1.5,
    marginBottom: 6,
  },
  subtitle: { color: "rgba(255,255,255,0.5)", fontSize: 16, marginBottom: 12 },
  message: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
    maxWidth: 280,
  },
  codeBadge: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,70,70,0.2)",
    marginBottom: 32,
    alignSelf: "center",
  },
  codeBadgeInner: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  codeLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  codeValue: {
    color: "#ff6b6b",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  primaryButton: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: { color: "#000", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    fontWeight: "600",
  },
  helpText: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
