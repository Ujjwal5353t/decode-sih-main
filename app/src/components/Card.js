import React from "react";
import { View } from "react-native";

// `shadow-sm` as a NativeWind className (rather than inline style) is a known
// trigger for a react-native-css-interop race condition on the New
// Architecture that intermittently throws "Couldn't find a navigation
// context" — see https://github.com/nativewind/nativewind/issues/1536.
// Applied as inline style instead; Card is used on nearly every screen so
// this one change removes most of that risk from the app.
const SHADOW_SM = { boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)" };

export function Card({ children, className = "" }) {
  return (
    <View style={SHADOW_SM} className={`bg-white rounded-2xl border border-slate-200 p-4 ${className}`}>
      {children}
    </View>
  );
}
