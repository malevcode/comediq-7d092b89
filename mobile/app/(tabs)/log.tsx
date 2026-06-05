import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSets } from "../../hooks/useSets";
import { useBits } from "../../hooks/useBits";
import { RatingSlider } from "../../components/RatingSlider";
import { BitPicker } from "../../components/BitPicker";
import type { Bit } from "../../hooks/useBits";

type SelectedBit = { bit: Bit; rating?: number };

export default function LogSetScreen() {
  const { createSet, linkBit } = useSets();
  const { bits, fetchBits } = useBits();

  const [venue, setVenue] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [stageTime, setStageTime] = useState("");
  const [rating, setRating] = useState(7);
  const [notes, setNotes] = useState("");
  const [selectedBits, setSelectedBits] = useState<SelectedBit[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBits();
  }, [fetchBits]);

  function toggleBit(bit: Bit) {
    setSelectedBits((prev) => {
      const exists = prev.find((s) => s.bit.id === bit.id);
      return exists ? prev.filter((s) => s.bit.id !== bit.id) : [...prev, { bit }];
    });
  }

  function updateBitRating(bitId: string, r: number) {
    setSelectedBits((prev) =>
      prev.map((s) => (s.bit.id === bitId ? { ...s, rating: r } : s))
    );
  }

  async function handleSave() {
    if (!date) return;
    setSaving(true);
    try {
      const set = await createSet({
        venue: venue.trim() || undefined,
        performed_at: date,
        stage_time_minutes: stageTime ? parseInt(stageTime) : undefined,
        rating,
        notes: notes.trim() || undefined,
      });

      for (let i = 0; i < selectedBits.length; i++) {
        const sb = selectedBits[i];
        await linkBit(set.id, sb.bit.id, sb.rating, undefined, i);
      }

      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-bg"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="pt-14 pb-4">
          <Text className="text-white text-2xl font-bold">Log a Set</Text>
        </View>

        <View className="gap-4">
          <View className="gap-1.5">
            <Text className="text-muted text-xs uppercase tracking-wide">Venue</Text>
            <TextInput
              value={venue}
              onChangeText={setVenue}
              placeholder="Comedy Cellar, Gotham, etc."
              placeholderTextColor="#6b7280"
              className="bg-surface text-white rounded-xl px-4 py-3 border border-border"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-muted text-xs uppercase tracking-wide">Date</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#6b7280"
              className="bg-surface text-white rounded-xl px-4 py-3 border border-border"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-muted text-xs uppercase tracking-wide">Stage time (minutes)</Text>
            <TextInput
              value={stageTime}
              onChangeText={setStageTime}
              placeholder="5"
              placeholderTextColor="#6b7280"
              keyboardType="number-pad"
              className="bg-surface text-white rounded-xl px-4 py-3 border border-border"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-muted text-xs uppercase tracking-wide">
              Overall rating
            </Text>
            <View className="bg-surface rounded-xl px-4 py-3 border border-border">
              <RatingSlider value={rating} onChange={setRating} />
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="text-muted text-xs uppercase tracking-wide">Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything worth remembering..."
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={3}
              className="bg-surface text-white rounded-xl px-4 py-3 border border-border"
              style={{ textAlignVertical: "top" }}
            />
          </View>

          {bits.length > 0 && (
            <View className="gap-1.5">
              <Text className="text-muted text-xs uppercase tracking-wide">
                Bits performed
              </Text>
              <View className="bg-surface rounded-xl px-4 py-3 border border-border">
                <BitPicker
                  bits={bits}
                  selected={selectedBits}
                  onToggle={toggleBit}
                  onUpdateRating={updateBitRating}
                />
              </View>
            </View>
          )}

          <Pressable
            onPress={handleSave}
            disabled={saving || !date}
            className="bg-accent rounded-xl py-4 items-center mt-2 active:opacity-80"
          >
            <Text className="text-black font-bold text-base">
              {saving ? "Saving..." : "Save Set"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
