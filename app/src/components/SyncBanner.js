import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useLearningSync } from "../hooks/useLearningSync";

/**
 * Makes the local-first behavior visible: how many activity events are
 * sitting in this device's queue, and a manual way to push them now. Stays
 * hidden when the queue is empty so it never distracts a student who is
 * simply online and synced.
 */
export function SyncBanner({ studentId }) {
  const { pendingCount, syncing, sync } = useLearningSync(studentId);

  if (pendingCount === 0 && !syncing) return null;

  return (
    <Pressable
      onPress={sync}
      disabled={syncing}
      className="mb-4 flex-row items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200"
    >
      <View className="flex-row items-center gap-2 flex-1">
        <Text className="text-base">📶</Text>
        <Text className="text-xs font-semibold text-amber-700 flex-1">
          {syncing
            ? "Syncing your progress…"
            : `${pendingCount} activity update${pendingCount === 1 ? "" : "s"} saved on this device, waiting to sync`}
        </Text>
      </View>
      {syncing ? (
        <ActivityIndicator size="small" color="#D97706" />
      ) : (
        <Text className="text-xs font-bold text-amber-700 underline">Sync now</Text>
      )}
    </Pressable>
  );
}
