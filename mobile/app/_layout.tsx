import React, { createContext, useContext } from "react";
import { Stack, Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth, type AuthUser } from "../hooks/useAuth";
import "../global.css";

type AuthCtx = {
  user: AuthUser | null;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({ user: null, logout: async () => {} });
export const useAuthContext = () => useContext(AuthContext);

export default function RootLayout() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#f5a623" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {!user ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
        </Stack>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="set/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="bit/[id]" options={{ presentation: "card" }} />
        </Stack>
      )}
    </AuthContext.Provider>
  );
}
