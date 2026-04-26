import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { usePrivy } from '@privy-io/expo';

export default function Index() {
  const { isReady, user } = usePrivy();

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#fff" size="large" />
        <Text style={styles.text}>Initializing secure session...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/screens/AuthScreen" />;
  }

  return <Redirect href="/(tabs)/dashboard" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    gap: 12,
  },
  text: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
});
