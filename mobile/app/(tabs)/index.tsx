import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useSets } from "../../hooks/useSets";
import { SetCard } from "../../components/SetCard";

export default function HomeScreen() {
  const { sets, loading, fetchSets } = useSets();

  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  return (
    <View className="flex-1 bg-bg">
      <View className="px-5 pt-14 pb-4">
        <Text className="text-white text-2xl font-bold">Your Sets</Text>
      </View>

      {loading && sets.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#f5a623" />
        </View>
      ) : (
        <FlatList
          data={sets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <SetCard set={item} onPress={() => router.push(`/set/${item.id}`)} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchSets}
              tintColor="#f5a623"
            />
          }
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-muted text-base">No sets yet.</Text>
              <Text className="text-muted text-sm mt-1">
                Tap "Log Set" to add your first performance.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
