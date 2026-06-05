import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSets, type SetWithBits } from "../../hooks/useSets";

export default function SetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSet, deleteSet } = useSets();
  const [set, setSet] = useState<SetWithBits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getSet(id).then((data) => {
      setSet(data);
      setLoading(false);
    });
  }, [id, getSet]);

  async function handleDelete() {
    Alert.alert("Delete set?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!id) return;
          await deleteSet(id);
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

  if (!set) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <Text className="text-muted">Set not found.</Text>
      </View>
    );
  }

  const date = new Date(set.performed_at).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <ScrollView className="flex-1 bg-bg">
      <View className="px-5 pt-14 pb-4 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} className="mr-1">
          <Text className="text-accent text-base">← Back</Text>
        </Pressable>
      </View>

      <View className="px-5">
        <View className="flex-row justify-between items-start mb-6">
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">
              {set.venue ?? "Unknown venue"}
            </Text>
            <Text className="text-muted mt-1">{date}</Text>
            {set.stage_time_minutes != null && (
              <Text className="text-muted">{set.stage_time_minutes} min on stage</Text>
            )}
          </View>
          {set.rating != null && (
            <View className="bg-accent/20 rounded-xl px-4 py-2 items-center">
              <Text className="text-accent font-bold text-2xl">
                {set.rating.toFixed(1)}
              </Text>
              <Text className="text-accent/60 text-xs">rating</Text>
            </View>
          )}
        </View>

        {set.notes && (
          <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
            <Text className="text-muted text-xs mb-1">Notes</Text>
            <Text className="text-white">{set.notes}</Text>
          </View>
        )}

        {set.bits.length > 0 && (
          <View className="mb-6">
            <Text className="text-muted text-xs uppercase tracking-wide mb-3">
              Bits ({set.bits.length})
            </Text>
            {set.bits.map((bit) => (
              <Pressable
                key={bit.id}
                onPress={() => router.push(`/bit/${bit.bit_id}`)}
                className="bg-surface rounded-xl p-3 mb-2 flex-row justify-between items-center border border-border active:opacity-70"
              >
                <Text className="text-white font-medium">{bit.name}</Text>
                {bit.rating != null && (
                  <Text className="text-accent font-bold">
                    {bit.rating.toFixed(1)}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          onPress={handleDelete}
          className="border border-red-900 rounded-xl py-3 items-center mb-10"
        >
          <Text className="text-red-400 font-semibold">Delete Set</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
