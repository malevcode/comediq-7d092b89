import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { useAuthContext } from "../_layout";

export default function ProfileScreen() {
  const { user, logout } = useAuthContext();

  async function handleLogout() {
    Alert.alert("Log out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-bg px-5">
      <View className="pt-14 pb-6">
        <Text className="text-white text-2xl font-bold">Profile</Text>
      </View>

      <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
        {user?.stage_name && (
          <Text className="text-white font-semibold text-lg mb-1">
            {user.stage_name}
          </Text>
        )}
        <Text className="text-muted">{user?.email}</Text>
      </View>

      <Pressable
        onPress={handleLogout}
        className="bg-surface rounded-xl p-4 border border-border"
      >
        <Text className="text-red-400 font-semibold">Log out</Text>
      </Pressable>
    </View>
  );
}
