import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { usePrivy, useEmbeddedEthereumWallet } from '@privy-io/expo';
import { Redirect, useRouter } from 'expo-router';
import { GlassCard } from '@/components/glass/GlassCard';

Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout, isReady } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.stopAnimation();
    slideAnim.stopAnimation();
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished) {
        fadeAnim.setValue(1);
        slideAnim.setValue(0);
      }
    });
  }, [fadeAnim, slideAnim]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/screens/AuthScreen');
    } catch {
      router.replace('/screens/ErrorScreen');
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#fff" size="large" />
        <Text style={styles.loadingText}>Loading your account…</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/screens/AuthScreen" />;
  }

  const linkedAccounts = user.linked_accounts ?? [];
  const emailLinked = linkedAccounts.find(
    (account) => 'type' in account && account.type === 'email'
  );
  const getLinkedAccountValue = (account: (typeof linkedAccounts)[number]) => {
    if ('address' in account && typeof account.address === 'string') return account.address;
    if ('username' in account && typeof account.username === 'string') return account.username;
    if ('subject' in account && typeof account.subject === 'string') return account.subject;
    return 'N/A';
  };

  const getLinkedAccountType = (account: (typeof linkedAccounts)[number]) => {
    if ('type' in account && typeof account.type === 'string') return account.type;
    return 'unknown';
  };

  const walletAddress = wallets?.[0]?.address;
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : null;

  const linkedCount = linkedAccounts.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.bg1} />
      <View style={styles.bg2} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.emailText}>
                {String(emailLinked?.address ?? `${user.id?.slice(0, 16)}…`)}
              </Text>
            </View>
            <TouchableOpacity style={styles.avatarBadge}>
              <Text style={styles.avatarText}>
                {(typeof emailLinked?.address === 'string' && emailLinked.address[0]?.toUpperCase()) ?? 'U'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status card */}
          <GlassCard style={styles.statusCard} innerStyle={styles.glassInner}>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Identity Verified</Text>
            </View>
            <Text style={styles.userIdLabel}>Privy User ID</Text>
            <Text style={styles.userIdValue} numberOfLines={1} ellipsizeMode="middle">
              {user.id}
            </Text>
          </GlassCard>

          {/* Wallet card */}
          <Text style={styles.sectionLabel}>Embedded Wallet</Text>
          {walletAddress ? (
            <GlassCard style={styles.walletCard} innerStyle={styles.glassInner}>
              <View style={styles.walletHeader}>
                <View style={styles.walletIconBg}>
                  <Text style={styles.walletIcon}>⬡</Text>
                </View>
                <View style={styles.walletInfo}>
                  <Text style={styles.walletType}>Ethereum Wallet</Text>
                  <Text style={styles.walletAddress}>{shortAddress}</Text>
                </View>
                <View style={styles.walletBadge}>
                  <Text style={styles.walletBadgeText}>Active</Text>
                </View>
              </View>
              <View style={styles.walletDivider} />
              <Text style={styles.fullAddressLabel}>Full Address</Text>
              <Text style={styles.fullAddress}>{walletAddress}</Text>
            </GlassCard>
          ) : (
            <GlassCard style={styles.walletCard} innerStyle={styles.glassInner}>
              <Text style={styles.noWalletText}>No wallet provisioned yet.</Text>
              <Text style={styles.noWalletSub}>
                Enable embedded wallets in your Privy dashboard to auto-create wallets on login.
              </Text>
            </GlassCard>
          )}

          {/* Account details */}
          <Text style={styles.sectionLabel}>Account Details</Text>
          <GlassCard innerStyle={styles.glassInner}>
            <StatRow label="Linked Accounts" value={String(linkedCount)} />
            <View style={styles.statDivider} />
            <StatRow label="Account Type" value="Email" />
            <View style={styles.statDivider} />
            <StatRow label="Auth Method" value="One-Time Password" />
            <View style={styles.statDivider} />
            <StatRow label="Created" value={formatDate(user.created_at)} />
          </GlassCard>

          {/* Linked accounts list */}
          {linkedAccounts.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Linked Accounts</Text>
              {linkedAccounts.map((account, i: number) => (
                <GlassCard key={i} style={styles.accountCard} innerStyle={styles.glassInner}>
                  <View style={styles.accountRow}>
                    <View style={styles.accountTypeTag}>
                      <Text style={styles.accountTypeText}>
                        {getLinkedAccountType(account).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.accountValue} numberOfLines={1} ellipsizeMode="middle">
                      {getLinkedAccountValue(account)}
                    </Text>
                  </View>
                </GlassCard>
              ))}
            </>
          )}

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function formatDate(ts?: number | string | null) {
  if (!ts) return 'Unknown';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bg1: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -80,
  },
  bg2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.03)', bottom: 200, left: -50,
  },
  loadingContainer: {
    flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28,
  },
  greeting: { color: 'rgba(255,255,255,0.45)', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  emailText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  avatarBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#000', fontSize: 18, fontWeight: '800' },
  glassInner: { padding: 20 },
  statusCard: { marginBottom: 24 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  statusText: { color: '#4ade80', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  userIdLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  userIdValue: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  sectionLabel: {
    color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, marginTop: 8,
  },
  walletCard: {},
  walletHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletIconBg: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  walletIcon: { fontSize: 20, color: '#fff' },
  walletInfo: { flex: 1 },
  walletType: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  walletAddress: { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  walletBadge: {
    backgroundColor: 'rgba(74,222,128,0.15)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  walletBadgeText: { color: '#4ade80', fontSize: 11, fontWeight: '600' },
  walletDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 16 },
  fullAddressLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  fullAddress: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', lineHeight: 18 },
  noWalletText: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '600', marginBottom: 6 },
  noWalletSub: { color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 19 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 12 },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  statValue: { color: '#fff', fontSize: 13, fontWeight: '600' },
  accountCard: { marginBottom: 8 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accountTypeTag: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  accountTypeText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  accountValue: { color: '#fff', fontSize: 13, flex: 1 },
  logoutButton: {
    marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, paddingVertical: 15, alignItems: 'center',
  },
  logoutText: { color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
});