import { useEmbeddedEthereumWallet } from "@privy-io/expo";
import { BlurView } from "expo-blur";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GlassCard } from "@/components/glass/GlassCard";

export default function WalletScreen() {
  const { wallets } = useEmbeddedEthereumWallet();
  const wallet = wallets?.[0];
  const [signing, setSigning] = useState(false);
  const [lastSig, setLastSig] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fadeAnim.stopAnimation();
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        fadeAnim.setValue(1);
      }
    });
  }, [fadeAnim]);

  const signTestMessage = async () => {
    if (!wallet) return;
    setSigning(true);
    setLastSig(null);
    try {
      const provider = await wallet.getProvider();
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      const message = `EOB App signature request\nTimestamp: ${new Date().toISOString()}`;
      const signature = await provider.request({
        method: "personal_sign",
        params: [message, accounts[0]],
      });
      setLastSig(signature);
    } catch (e: any) {
      Alert.alert("Signing Failed", e.message ?? "Unable to sign the message.");
    } finally {
      setSigning(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.bgOrb} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.pageTitle}>Wallet</Text>
          <Text style={styles.pageSubtitle}>
            Manage your embedded Ethereum wallet
          </Text>

          {!wallet ? (
            <GlassCard innerStyle={styles.glassInner}>
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>⬡</Text>
                <Text style={styles.emptyTitle}>No Wallet Found</Text>
                <Text style={styles.emptySub}>
                  Enable embedded wallets in your Privy dashboard. Wallets are
                  auto-created on first login.
                </Text>
              </View>
            </GlassCard>
          ) : (
            <>
              <GlassCard style={styles.addressCard} innerStyle={styles.glassInner}>
                <Text style={styles.cardLabel}>Ethereum Address</Text>
                <Text style={styles.addressValue}>{wallet.address}</Text>
                <View style={styles.networkBadge}>
                  <View style={styles.networkDot} />
                  <Text style={styles.networkText}>Mainnet Ready</Text>
                </View>
              </GlassCard>

              <Text style={styles.sectionLabel}>Actions</Text>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  signing && styles.actionButtonDisabled,
                ]}
                onPress={signTestMessage}
                disabled={signing}
                activeOpacity={0.8}
              >
                <BlurView
                  intensity={15}
                  tint="dark"
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.actionButtonInner}>
                  {signing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.actionIcon}>✍️</Text>
                  )}
                  <View>
                    <Text style={styles.actionTitle}>Sign Test Message</Text>
                    <Text style={styles.actionDesc}>
                      Sign a message with your wallet to verify ownership
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {lastSig && (
                <GlassCard style={styles.sigCard} innerStyle={styles.glassInner}>
                  <Text style={styles.sigLabel}>Last Signature</Text>
                  <Text style={styles.sigValue} numberOfLines={4}>
                    {lastSig}
                  </Text>
                  <View style={styles.sigSuccessBadge}>
                    <Text style={styles.sigSuccessText}>
                      ✓ Signed Successfully
                    </Text>
                  </View>
                </GlassCard>
              )}

              <Text style={styles.sectionLabel}>Wallet Info</Text>
              <GlassCard innerStyle={styles.glassInner}>
                <InfoRow label="Chain" value="Ethereum (EIP-1193)" />
                <View style={styles.rowDivider} />
                <InfoRow label="Type" value="Embedded (Privy)" />
                <View style={styles.rowDivider} />
                <InfoRow label="Recovery" value="Privy Managed" />
              </GlassCard>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  bgOrb: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255,255,255,0.03)",
    top: 0,
    left: -80,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  pageTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    marginBottom: 28,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 8,
  },
  glassInner: { padding: 20 },
  addressCard: {},
  cardLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  addressValue: {
    color: "#fff",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 20,
    marginBottom: 14,
  },
  networkBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ade80",
  },
  networkText: { color: "#4ade80", fontSize: 12, fontWeight: "600" },
  actionButton: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 12,
  },
  actionButtonDisabled: { opacity: 0.5 },
  actionButtonInner: {
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  actionIcon: { fontSize: 24 },
  actionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  actionDesc: { color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 17 },
  sigCard: {},
  sigLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  sigValue: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 18,
    marginBottom: 12,
  },
  sigSuccessBadge: {
    backgroundColor: "rgba(74,222,128,0.12)",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.25)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  sigSuccessText: { color: "#4ade80", fontSize: 12, fontWeight: "600" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginVertical: 12,
  },
  infoLabel: { color: "rgba(255,255,255,0.4)", fontSize: 13 },
  infoValue: { color: "#fff", fontSize: 13, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 20 },
  emptyIcon: { fontSize: 40, marginBottom: 14 },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});
