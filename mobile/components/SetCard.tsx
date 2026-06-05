import React from "react";
import { View, Text, Pressable } from "react-native";
import type { ComedySet } from "../hooks/useSets";

type Props = {
  set: ComedySet;
  onPress: () => void;
};

export function SetCard({ set, onPress }: Props) {
  const date = new Date(set.performed_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Pressable
      onPress={onPress}
      className="bg-surface rounded-xl p-4 mb-3 active:opacity-70"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-white font-semibold text-base">
            {set.venue ?? "Unknown venue"}
          </Text>
          <Text className="text-muted text-sm mt-0.5">{date}</Text>
          {set.stage_time_minutes != null && (
            <Text className="text-muted text-sm">
              {set.stage_time_minutes} min
            </Text>
          )}
        </View>
        {set.rating != null && (
          <View className="bg-accent/20 rounded-lg px-2.5 py-1">
            <Text className="text-accent font-bold text-lg">
              {set.rating.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
