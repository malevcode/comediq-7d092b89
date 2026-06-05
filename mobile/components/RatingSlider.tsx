import React from "react";
import { View, Text } from "react-native";
import Slider from "@react-native-community/slider";

type Props = {
  value: number;
  onChange: (v: number) => void;
  label?: string;
};

export function RatingSlider({ value, onChange, label }: Props) {
  return (
    <View className="gap-1">
      {label && <Text className="text-muted text-xs">{label}</Text>}
      <View className="flex-row items-center gap-3">
        <Slider
          style={{ flex: 1 }}
          minimumValue={1}
          maximumValue={10}
          step={0.5}
          value={value}
          onValueChange={onChange}
          minimumTrackTintColor="#f5a623"
          maximumTrackTintColor="#2a2a2a"
          thumbTintColor="#f5a623"
        />
        <Text className="text-accent font-bold w-8 text-right">
          {value.toFixed(1)}
        </Text>
      </View>
    </View>
  );
}
