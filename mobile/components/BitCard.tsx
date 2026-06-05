import React from "react";
import { View, Text, Pressable } from "react-native";
import { TrendBadge } from "./TrendBadge";
import type { Bit } from "../hooks/useBits";

type Props = {
  bit: Bit;
  onPress: () => void;
};

export function BitCard({ bit, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-surface rounded-xl p-4 mb-3 active:opacity-70"
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-1 gap-1.5">
          <Text className="text-white font-semibold text-base">{bit.name}</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-muted text-sm">
              {bit.performance_count}{" "}
              {bit.performance_count === 1 ? "set" : "sets"}
            </Text>
            {bit.performance_count >= 2 && <TrendBadge trend={bit.trend} />}
          </View>
        </View>
        {bit.avg_rating != null && (
          <View className="items-end gap-0.5">
            <Text className="text-accent font-bold text-lg">
              {bit.avg_rating.toFixed(1)}
            </Text>
            <Text className="text-muted text-xs">avg</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
