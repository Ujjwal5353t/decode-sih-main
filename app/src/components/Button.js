import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";

const VARIANTS = {
  primary: { container: "bg-sky-600 active:bg-sky-700", text: "text-white" },
  secondary: { container: "bg-slate-100 active:bg-slate-200", text: "text-slate-700" },
  outline: { container: "bg-white border border-sky-600 active:bg-sky-50", text: "text-sky-600" },
  danger: { container: "bg-rose-50 border border-rose-200 active:bg-rose-100", text: "text-rose-600" },
};

export function Button({ title, onPress, variant = "primary", loading, disabled, className = "", textClassName = "" }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      // `opacity-N` toggled via className (rather than inline style) is a known
      // react-native-css-interop crash trigger on the New Architecture — see Card.js.
      // Button toggles this constantly (every loading/disabled state change), so
      // it's applied as inline style instead.
      style={isDisabled ? { opacity: 0.5 } : undefined}
      className={`rounded-2xl px-5 py-3.5 items-center justify-center flex-row gap-2 ${v.container} ${className}`}
    >
      {loading && <ActivityIndicator size="small" color={variant === "primary" ? "#fff" : "#0284C7"} />}
      <Text className={`text-sm font-bold ${v.text} ${textClassName}`}>{title}</Text>
    </Pressable>
  );
}
