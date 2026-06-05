import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../../hooks/useAuth";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Login failed", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-bg"
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-white text-3xl font-bold mb-1">Comediq</Text>
        <Text className="text-muted text-base mb-10">Track your sets. Level up your craft.</Text>

        <View className="gap-4">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            keyboardType="email-address"
            className="bg-surface text-white rounded-xl px-4 py-3.5 border border-border"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#6b7280"
            secureTextEntry
            className="bg-surface text-white rounded-xl px-4 py-3.5 border border-border"
          />
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className="bg-accent rounded-xl py-4 items-center active:opacity-80"
          >
            <Text className="text-black font-bold text-base">
              {loading ? "Logging in..." : "Log in"}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row justify-center mt-6 gap-1">
          <Text className="text-muted">Don't have an account?</Text>
          <Link href="/(auth)/register">
            <Text className="text-accent font-semibold">Sign up</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
