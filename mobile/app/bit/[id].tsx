import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useBits, type BitDetail } from "../../hooks/useBits";
import { TrendBadge } from "../../components/TrendBadge";
import { Sparkline } from "../../components/Sparkline";

export default function BitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getBit, updateBit, deleteBit } = useBits();
  const [bit, setBit] = useState<BitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    if (!id) return;
    getBit(id).then((data) => {
      setBit(data);
      setNameInput(data.name);
      setLoading(false);
    });
  }, [id, getBit]);

  async function handleSaveName() {
    if (!bit || !nameInput.trim()) return;
    const updated = await updateBit(bit.id, { name: nameInput.trim() });
    setBit((prev) => (prev ? { ...prev, name: updated.name } : prev));
    setEditingName(false);
  }

  async function handleDelete() {
    Alert.alert("Delete bit?", "All performance history will be unlinked.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!bit) return;
          await deleteBit(bit.id);
          router.back();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#f5a623" />
      </View>
    );
  }

  if (!bit) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <Text className="text-muted">Bit not found.</Text>
      </View>
    );
  }

  const ratings = bit.history
    .filter((h) => h.rating != null)
    .map((h) => h.rating as number);

  return (
    <ScrollView className="flex-1 bg-bg">
      <View className="px-5 pt-14 pb-4">
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-accent text-base">← Back</Text>
        </Pressable>

        {editingName ? (
          <View className="flex-row gap-2 items-center mb-2">
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              className="flex-1 text-white text-xl font-bold bg-surface rounded-lg px-3 py-2 border border-accent"
            />
            <Pressable onPress={handleSaveName}>
              <Text className="text-accent font-semibold">Save</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setEditingName(true)} className="mb-2">
            <Text className="text-white text-xl font-bold">{bit.name}</Text>
            <Text className="text-muted text-xs mt-0.5">Tap to rename</Text>
          </Pressable>
        )}

        <View className="flex-row items-center gap-3 mt-3">
          {bit.avg_rating != null && (
            <View className="bg-accent/20 rounded-lg px-3 py-1.5">
              <Text className="text-accent font-bold">
                {bit.avg_rating.toFixed(1)} avg
              </Text>
            </View>
          )}
          <Text className="text-muted text-sm">
            {bit.performance_count}{" "}
            {bit.performance_count === 1 ? "set" : "sets"}
          </Text>
          {bit.performance_count >= 2 && <TrendBadge trend={bit.trend} />}
        </View>

        {ratings.length >= 2 && (
          <View className="mt-5 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-xs mb-3">Rating over time</Text>
            <Sparkline data={ratings} width={280} height={50} />
          </View>
        )}
      </View>

      <View className="px-5">
        <Text className="text-muted text-xs uppercase tracking-wide mb-3">
          Performance history
        </Text>
        {bit.history.length === 0 ? (
          <Text className="text-muted text-sm">
            No performances logged yet.
          </Text>
        ) : (
          [...bit.history].reverse().map((h, i) => {
            const date = new Date(h.performed_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            return (
              <Pressable
                key={i}
                onPress={() => router.push(`/set/${h.set_id}`)}
                className="bg-surface rounded-xl p-3 mb-2 flex-row justify-between items-center border border-border active:opacity-70"
              >
                <View>
                  <Text className="text-white font-medium">
                    {h.venue ?? "Unknown venue"}
                  </Text>
                  <Text className="text-muted text-sm">{date}</Text>
                  {h.notes && (
                    <Text className="text-muted text-xs mt-0.5">{h.notes}</Text>
                  )}
                </View>
                {h.rating != null && (
                  <Text className="text-accent font-bold">
                    {h.rating.toFixed(1)}
                  </Text>
                )}
              </Pressable>
            );
          })
        )}

        <Pressable
          onPress={handleDelete}
          className="border border-red-900 rounded-xl py-3 items-center mt-4 mb-10"
        >
          <Text className="text-red-400 font-semibold">Delete Bit</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
