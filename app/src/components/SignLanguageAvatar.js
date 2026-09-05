import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated } from "react-native";

// Placeholder for the product's generative sign-language avatar layer
// (DETAILS.md: "a generative/live avatar demonstrates key signs alongside
// lesson content"). Building a real generative avatar is out of scope for
// this build; this renders a small looping hand-sign glyph in the same
// position a live avatar would occupy, driven by the same "text changed"
// trigger a real one would use, so the integration seam is in the right
// place.
const SIGNS = ["👋", "🤟", "✋", "👍", "🙌"];

export function SignLanguageAvatar({ active, text }) {
  const [frame, setFrame] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;
    setFrame(0);
    const interval = setInterval(() => setFrame((f) => (f + 1) % SIGNS.length), 900);
    return () => clearInterval(interval);
  }, [active, text]);

  useEffect(() => {
    if (!active) return;
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.15, duration: 250, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [frame, active, pulse]);

  if (!active) return null;

  return (
    <View className="items-center gap-1 mt-3">
      <Animated.View
        style={{ transform: [{ scale: pulse }] }}
        className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 items-center justify-center"
      >
        <Text className="text-3xl">{SIGNS[frame]}</Text>
      </Animated.View>
      <Text className="text-xs font-semibold text-sky-600 uppercase tracking-wide">Sign Assist</Text>
    </View>
  );
}
