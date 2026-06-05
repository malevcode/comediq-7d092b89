import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useBits } from "../../hooks/useBits";
import { BitCard } from "../../components/BitCard";

export default function BitsScreen() {
  const { bits, loading, fetchBits, createBit } = useBits();
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBits();
  }, [fetchBits]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createBit({ name: newName.trim() });
      setNewName("");
      setModalVisible(false);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-bg">
      <View className="px-5 pt-14 pb-4 flex-row items-center justify-between">
        <Text className="text-white text-2xl font-bold">Bit Library</Text>
        <Pressable
          onPress={() => setModalVisible(true)}
          className="bg-accent rounded-full w-9 h-9 items-center justify-center"
        >
          <Text className="text-black text-xl font-bold">+</Text>
        </Pressable>
      </View>

      {loading && bits.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#f5a623" />
        </View>
      ) : (
        <FlatList
          data={bits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <BitCard bit={item} onPress={() => router.push(`/bit/${item.id}`)} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchBits}
              tintColor="#f5a623"
            />
          }
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-muted text-base">No bits yet.</Text>
              <Text className="text-muted text-sm mt-1">
                Tap + to add your first joke.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/60"
          onPress={() => setModalVisible(false)}
        />
        <View className="bg-surface rounded-t-2xl px-5 pt-6 pb-10">
          <Text className="text-white text-lg font-bold mb-4">New Bit</Text>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Bit name"
            placeholderTextColor="#6b7280"
            autoFocus
            className="bg-bg text-white rounded-xl px-4 py-3 border border-border mb-4"
          />
          <Pressable
            onPress={handleCreate}
            disabled={saving || !newName.trim()}
            className="bg-accent rounded-xl py-3.5 items-center"
          >
            <Text className="text-black font-bold">
              {saving ? "Adding..." : "Add Bit"}
            </Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
