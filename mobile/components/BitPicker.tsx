import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
} from "react-native";
import type { Bit } from "../hooks/useBits";

type Selected = { bit: Bit; rating?: number; notes?: string };

type Props = {
  bits: Bit[];
  selected: Selected[];
  onToggle: (bit: Bit) => void;
  onUpdateRating: (bitId: string, rating: number) => void;
};

export function BitPicker({ bits, selected, onToggle, onUpdateRating }: Props) {
  const [search, setSearch] = useState("");
  const selectedIds = new Set(selected.map((s) => s.bit.id));

  const filtered = bits.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="gap-3">
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search bits..."
        placeholderTextColor="#6b7280"
        className="bg-surface text-white rounded-lg px-3 py-2.5 border border-border"
      />
      <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
        {filtered.map((bit) => {
          const isSelected = selectedIds.has(bit.id);
          const entry = selected.find((s) => s.bit.id === bit.id);
          return (
            <View key={bit.id}>
              <Pressable
                onPress={() => onToggle(bit)}
                className={`flex-row items-center justify-between rounded-lg px-3 py-2.5 mb-2 ${
                  isSelected ? "bg-accent/20 border border-accent/40" : "bg-surface"
                }`}
              >
                <Text
                  className={`font-medium ${
                    isSelected ? "text-accent" : "text-white"
                  }`}
                >
                  {bit.name}
                </Text>
                {isSelected && (
                  <Text className="text-accent text-sm font-bold">
                    {entry?.rating != null ? entry.rating.toFixed(1) : "—"}
                  </Text>
                )}
              </Pressable>
              {isSelected && (
                <View className="flex-row items-center gap-2 mb-3 px-1">
                  <Text className="text-muted text-xs w-8">Rate:</Text>
                  {[5, 6, 7, 8, 9, 10].map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => onUpdateRating(bit.id, r)}
                      className={`rounded-md px-2 py-1 ${
                        entry?.rating === r ? "bg-accent" : "bg-surface"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          entry?.rating === r ? "text-black" : "text-muted"
                        }`}
                      >
                        {r}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
