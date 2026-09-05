import React from "react";
import { View, ScrollView, ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Screen({ children, scroll = true, className = "", contentClassName = "", refreshControl }) {
  const Container = scroll ? ScrollView : View;
  const containerProps = scroll
    ? {
        contentContainerStyle: { flexGrow: 1 },
        className: `flex-1 ${contentClassName}`,
        showsVerticalScrollIndicator: false,
        refreshControl,
      }
    : { className: `flex-1 ${contentClassName}` };
  return (
    <SafeAreaView className={`flex-1 bg-slate-50 ${className}`} edges={["top", "left", "right"]}>
      <Container {...containerProps}>{children}</Container>
    </SafeAreaView>
  );
}

export function LoadingScreen({ label = "Loading..." }) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 gap-3">
      <ActivityIndicator size="large" color="#0284C7" />
      <Text className="text-sm text-slate-500 font-medium">{label}</Text>
    </View>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <View className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200">
      <Text className="text-rose-600 text-xs font-medium">{message}</Text>
    </View>
  );
}

export function EmptyState({ emoji = "📭", title, subtitle }) {
  return (
    <View className="items-center justify-center py-16 px-6">
      <Text className="text-5xl mb-3">{emoji}</Text>
      {title && <Text className="text-sm font-bold text-slate-700 text-center">{title}</Text>}
      {subtitle && <Text className="text-xs text-slate-500 text-center mt-1">{subtitle}</Text>}
    </View>
  );
}
