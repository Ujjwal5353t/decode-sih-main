import "./global.css";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/context/AuthContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import { PreferencesProvider } from "./src/context/PreferencesContext";
import RootNavigator from "./src/navigation/RootNavigator";

// Light theme only — no dark-mode variant, by design (see docs/LOCAL_FIRST.md).
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#F8FAFC",
    card: "#FFFFFF",
    primary: "#0284C7",
    border: "#E2E8F0",
    text: "#0F172A",
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <PreferencesProvider>
            <AuthProvider>
              <StatusBar style="dark" backgroundColor="#F8FAFC" />
              <NavigationContainer theme={AppTheme}>
                <RootNavigator />
              </NavigationContainer>
            </AuthProvider>
          </PreferencesProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
