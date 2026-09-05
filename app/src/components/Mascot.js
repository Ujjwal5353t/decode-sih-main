import React from "react";
import { Text } from "react-native";

const MOOD_EMOJI = {
  idle: "🐼",
  dance: "🐼",
  happy: "😄",
  celebrate: "🎉",
  encourage: "💪",
};

export function Mascot({ mood = "idle", size = 40 }) {
  return <Text style={{ fontSize: size }}>{MOOD_EMOJI[mood] || MOOD_EMOJI.idle}</Text>;
}
