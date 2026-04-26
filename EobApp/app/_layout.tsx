import { PrivyProvider } from "@privy-io/expo";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LogBox } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const appId =
    process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? "cmobji7c701my0clgdn1x52m0";
  const clientId =
    process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID ??
    "client-WY6Ye8Dii1wRpYkRB6vw5KPRJNWnsRCL6ua8xgda7uicW";

  useEffect(() => {
    LogBox.ignoreLogs([
      "SafeAreaView has been deprecated",
      'Attempted to import the module "C:\\Users\\kunal\\OneDrive\\Desktop\\EobApp\\node_modules\\@noble\\hashes\\crypto.js"',
    ]);
  }, []);

  return (
    <GluestackUIProvider mode="dark">
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <PrivyProvider appId={appId} clientId={clientId}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="screens/AuthScreen" />
            <Stack.Screen name="screens/HomeScreen" />
            <Stack.Screen name="screens/ErrorScreen" />
            <Stack.Screen
              name="modal"
              options={{
                presentation: "modal",
                headerShown: true,
                title: "Modal",
              }}
            />
          </Stack>
        </PrivyProvider>
        <StatusBar style="light" />
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
