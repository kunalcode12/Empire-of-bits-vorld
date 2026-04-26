import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// import { LinearGradient } from 'expo-linear-gradient';
import { useLoginWithEmail } from "@privy-io/expo";
import { useRouter } from "expo-router";
import { GlassCard } from "@/components/glass/GlassCard";

const { width, height } = Dimensions.get("window");
const arcadeFont = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

type AuthStep = "landing" | "email" | "otp";

export default function AuthScreen() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>("landing");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const otpDigits = otp.replace(/\D/g, "").slice(0, 6);
  const canSubmitOtp = otpDigits.length === 6 && !loading;
  const neonPulse = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const scanLine = useRef(new Animated.Value(0)).current;
  const titleDrift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => {
        // Keep default animation behavior if unavailable.
      });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => setReduceMotion(enabled),
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      neonPulse.setValue(0);
      floatY.setValue(0);
      scanLine.setValue(0);
      titleDrift.setValue(0);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(neonPulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(neonPulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const scan = Animated.loop(
      Animated.timing(scanLine, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const titleWave = Animated.loop(
      Animated.sequence([
        Animated.timing(titleDrift, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(titleDrift, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    float.start();
    scan.start();
    titleWave.start();

    return () => {
      pulse.stop();
      float.stop();
      scan.stop();
      titleWave.stop();
    };
  }, [reduceMotion, floatY, neonPulse, scanLine, titleDrift]);

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) {
      if (err.message.toLowerCase().includes("ping reached timeout")) {
        return "Network timeout while contacting Privy. Check internet and try again.";
      }
      return err.message;
    }
    return fallback;
  };

  const { sendCode, loginWithCode } = useLoginWithEmail({
    onLoginSuccess: () => {
      router.replace("/(tabs)/dashboard");
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, "Authentication failed. Please try again."));
      setLoading(false);
    },
    onSendCodeSuccess: () => {
      setStep("otp");
      setLoading(false);
    },
  });

  const handleGetStarted = () => {
    setStep("email");
    setError(null);
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendCode({ email });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to send code. Please try again."));
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otpDigits)) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await loginWithCode({ code: otpDigits, email });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Authentication failed. Please try again."));
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setOtp("");
    setError(null);
    setLoading(true);
    try {
      await sendCode({ email });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to resend code. Please try again."));
      setLoading(false);
    }
  };

  const cardStyle = step === "landing" ? { ...styles.card, ...styles.cardLanding } : styles.card;
  const cardInnerStyle =
    step === "landing" ? { ...styles.glassInner, ...styles.glassInnerLanding } : styles.glassInner;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.arcadeGrid} pointerEvents="none" />
      <Animated.View
        style={[
          styles.glowOrbPrimary,
          {
            opacity: neonPulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.52, 0.86],
            }),
            transform: [
              {
                scale: neonPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1.08],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowOrbSecondary,
          {
            opacity: neonPulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.28, 0.6],
            }),
            transform: [
              {
                scale: neonPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.94, 1.05],
                }),
              },
            ],
          },
        ]}
      />
      <View style={styles.vignette} pointerEvents="none" />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.scanLine,
          {
            transform: [
              {
                translateY: scanLine.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-40, height + 20],
                }),
              },
            ],
            opacity: neonPulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.28, 0.5],
            }),
          },
        ]}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.content}>
          <View style={styles.hudStrip}>
            <View style={styles.hudCell}>
              <Text style={styles.hudLabel}>SEASON</Text>
              <Text style={styles.hudValue}>ALPHA-01</Text>
            </View>
            <View style={styles.hudCell}>
              <Text style={styles.hudLabel}>REGION</Text>
              <Text style={styles.hudValue}>GLOBAL</Text>
            </View>
          </View>

          <View style={styles.brandContainer}>
            <Animated.View
              style={[
                styles.logoRing,
                {
                  transform: [
                    {
                      translateY: floatY.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -8],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.logoAura} />
              <Image
                source={require("../../assets/images/empire.jpg")}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </Animated.View>
            <Animated.View
              style={[
                styles.brandTitleRow,
                {
                  transform: [
                    {
                      translateX: titleDrift.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 2],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={[styles.brandName, styles.brandEmpire]}>EMPIRE</Text>
              <Text style={[styles.brandName, styles.brandOf]}> OF </Text>
              <Text style={[styles.brandName, styles.brandBits]}>BITS</Text>
            </Animated.View>
            <Text style={styles.brandTagline}>WEB3 ARCADE // RETRO GAMING COLLECTIVE</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, styles.badgePurple]}>
                <Text style={styles.badgeText}>CRYPTO</Text>
              </View>
              <View style={[styles.badge, styles.badgePink]}>
                <Text style={styles.badgeText}>WEB3</Text>
              </View>
              <View style={[styles.badge, styles.badgeCyan]}>
                <Text style={styles.badgeText}>ARCADE</Text>
              </View>
            </View>
          </View>

          <GlassCard
            style={cardStyle}
            intensity={28}
            innerStyle={cardInnerStyle}
          >
            {step === "landing" && (
              <View style={styles.cardBody}>
                <View style={styles.walletEdgeTop} />
                <View style={styles.walletStitchRow}>
                  <View style={styles.walletStitch} />
                  <View style={styles.walletStitch} />
                  <View style={styles.walletStitch} />
                  <View style={styles.walletStitch} />
                  <View style={styles.walletStitch} />
                </View>
                <View style={styles.walletChip} />
                <Text style={styles.kicker}>PLAYER ACCESS</Text>
                <Text style={styles.cardTitle}>Insert Coin. Start Journey.</Text>
                <Text style={styles.cardSubtitle}>
                  Enter the Empire of Bits arcade universe to unlock game passes,
                  wallet-ready identity, and collectible progression.
                </Text>
                <View style={styles.featureRow}>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureLabel}>MODE</Text>
                    <Text style={styles.featureValue}>PvE + PvP</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureLabel}>CHAIN</Text>
                    <Text style={styles.featureValue}>SOLANA</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureLabel}>LOOT</Text>
                    <Text style={styles.featureValue}>ON-CHAIN</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleGetStarted}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Get Started</Text>
                  <Text style={styles.buttonArrow}>{">>"}</Text>
                </TouchableOpacity>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>SECURED BY PRIVY AUTH</Text>
                  <View style={styles.dividerLine} />
                </View>
                <Text style={styles.disclaimer}>
                  By continuing, you accept Terms and Privacy Policy.
                </Text>
                <View style={styles.walletEdgeBottom} />
              </View>
            )}

            {step === "email" && (
              <View style={styles.cardBody}>
                <TouchableOpacity
                  onPress={() => {
                    setStep("landing");
                    setError(null);
                  }}
                  style={styles.backButton}
                >
                  <Text style={styles.backArrow}>{"<"}</Text>
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.kicker}>PLAYER IDENTIFICATION</Text>
                <Text style={styles.cardTitle}>Enter Email Access Key</Text>
                <Text style={styles.cardSubtitle}>
                  We will beam a one-time secure code to your inbox.
                </Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      setError(null);
                    }}
                    placeholder="you@example.com"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    returnKeyType="send"
                    onSubmitEditing={handleSendCode}
                  />
                </View>
                {error && <ErrorBanner message={error} />}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleSendCode}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#F7F8FF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Send Code</Text>
                      <Text style={styles.buttonArrow}>{">>"}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {step === "otp" && (
              <View style={styles.cardBody}>
                <TouchableOpacity
                  onPress={() => {
                    setStep("email");
                    setError(null);
                  }}
                  style={styles.backButton}
                >
                  <Text style={styles.backArrow}>{"<"}</Text>
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.kicker}>SECURITY CHECKPOINT</Text>
                <Text style={styles.cardTitle}>Verify Access Code</Text>
                <Text style={styles.cardSubtitle}>
                  Enter the 6-digit code sent to{" "}
                  <Text style={styles.emailHighlight}>{email}</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>One-Time Code</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    value={otpDigits}
                    onChangeText={(t) => {
                      setOtp(t.replace(/\D/g, "").slice(0, 6));
                      setError(null);
                    }}
                    placeholder="••••••"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOtp}
                  />
                </View>
                {error && <ErrorBanner message={error} />}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    !canSubmitOtp && styles.buttonDisabled,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={!canSubmitOtp}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#F7F8FF" size="small" />
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.primaryButtonText,
                          !canSubmitOtp && styles.primaryButtonTextDisabled,
                        ]}
                      >
                        Verify & Sign In
                      </Text>
                      <Text
                        style={[
                          styles.buttonArrow,
                          !canSubmitOtp && styles.buttonArrowDisabled,
                        ]}
                      >
                        {">>"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleResendCode}
                  style={styles.resendButton}
                  disabled={loading}
                >
                  <Text style={styles.resendText}>
                    Did not receive it? Resend code
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorIcon}>⚠</Text>
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  arcadeGrid: {
    position: "absolute",
    width,
    height,
    backgroundColor: "#050505",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  glowOrbPrimary: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 190,
    backgroundColor: "rgba(255,255,255,0.09)",
    top: -170,
    right: -150,
  },
  glowOrbSecondary: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 160,
    backgroundColor: "rgba(255,255,255,0.07)",
    bottom: -130,
    left: -100,
  },
  vignette: {
    position: "absolute",
    width,
    height,
    backgroundColor: "rgba(0,0,0,0.56)",
  },
  scanLine: {
    position: "absolute",
    width,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  hudStrip: {
    alignSelf: "flex-end",
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  hudCell: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingVertical: 7,
    paddingHorizontal: 10,
    minWidth: 104,
  },
  hudLabel: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 9,
    letterSpacing: 1.1,
    fontFamily: arcadeFont,
    fontWeight: "700",
  },
  hudValue: {
    color: "#FFFFFF",
    fontSize: 12,
    letterSpacing: 1.2,
    fontFamily: arcadeFont,
    fontWeight: "900",
  },
  brandContainer: {
    alignItems: "flex-start",
    marginTop: 12,
    maxWidth: "85%",
  },
  logoRing: {
    width: 128,
    height: 128,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: "rgba(14,14,16,0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    padding: 4,
    overflow: "visible",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 18,
  },
  logoAura: {
    position: "absolute",
    width: 136,
    height: 136,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.03)",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
  },
  logoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  brandName: {
    fontFamily: arcadeFont,
    fontSize: 33,
    fontWeight: "900",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    textShadowColor: "rgba(255,255,255,0.28)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
  },
  brandEmpire: {
    color: "#d2d4df",
  },
  brandOf: {
    color: "#9ea3b5",
  },
  brandBits: {
    color: "#767c93",
  },
  brandTagline: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    letterSpacing: 1.3,
    fontFamily: arcadeFont,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 5,
    textAlign: "left",
  },
  badgeRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    borderRadius: 0,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderWidth: 1,
  },
  badgePurple: {
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  badgePink: {
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  badgeCyan: {
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: arcadeFont,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  glassInner: {
    padding: 20,
  },
  card: {
    width: "96%",
    alignSelf: "center",
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.42)",
    backgroundColor: "rgba(8,8,8,0.86)",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 18,
    marginTop: 14,
  },
  cardLanding: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "#111215",
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 20,
  },
  glassInnerLanding: {
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  cardBody: {},
  walletEdgeTop: {
    height: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 12,
  },
  walletStitchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    opacity: 0.7,
  },
  walletStitch: {
    width: 16,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  walletChip: {
    width: 44,
    height: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 10,
  },
  walletEdgeBottom: {
    height: 5,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginHorizontal: -20,
    marginTop: 16,
    marginBottom: -20,
  },
  kicker: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    fontFamily: arcadeFont,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontFamily: arcadeFont,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.2,
    marginBottom: 10,
    textShadowColor: "rgba(255,255,255,0.2)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  cardSubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 22,
  },
  emailHighlight: {
    color: "#FFFFFF",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  featureItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  featureLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 9,
    fontFamily: arcadeFont,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  featureValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: arcadeFont,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  primaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 10,
  },
  buttonDisabled: {
    backgroundColor: "rgba(120,120,120,0.66)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: "#050505",
    fontSize: 16,
    fontFamily: arcadeFont,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  buttonArrow: {
    color: "#050505",
    fontSize: 16,
    fontFamily: arcadeFont,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  primaryButtonTextDisabled: {
    color: "rgba(0,0,0,0.56)",
  },
  buttonArrowDisabled: {
    color: "rgba(0,0,0,0.56)",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  dividerText: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 10,
    fontFamily: arcadeFont,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  disclaimer: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 18,
    alignSelf: "flex-start",
    minHeight: 44,
    paddingHorizontal: 4,
    justifyContent: "center",
  },
  backArrow: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: arcadeFont,
    fontWeight: "800",
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: arcadeFont,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 10,
    fontFamily: arcadeFont,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: arcadeFont,
    fontWeight: "600",
    letterSpacing: 0.6,
    minHeight: 48,
  },
  otpInput: {
    fontSize: 24,
    fontFamily: arcadeFont,
    letterSpacing: 9,
    textAlign: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 8,
  },
  errorIcon: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  errorBannerText: {
    color: "#FFFFFF",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  resendButton: {
    marginTop: 18,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  resendText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: arcadeFont,
    fontWeight: "600",
    textDecorationLine: "underline",
    textDecorationColor: "rgba(255,255,255,0.5)",
  },
});
