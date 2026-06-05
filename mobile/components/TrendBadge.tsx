import React from "react";
import { View, Text } from "react-native";

type Trend = "up" | "down" | "flat";

const config: Record<Trend, { icon: string; color: string }> = {
  up: { icon: "↗", color: "#22c55e" },
  down: { icon: "↘", color: "#ef4444" },
  flat: { icon: "→", color: "#6b7280" },
};

export function TrendBadge({ trend }: { trend: Trend }) {
  const { icon, color } = config[trend];
  return (
    <View
      style={{
        backgroundColor: color + "22",
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color, fontSize: 13, fontWeight: "600" }}>{icon}</Text>
    </View>
  );
}
