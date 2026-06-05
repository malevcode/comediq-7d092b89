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

export default function RegisterScreen() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stageName, setStageName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password) return;
    if (password.length < 8) {
      Alert.alert("Password too short", "Must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, stageName.trim() || undefined);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Registration failed", (e as Error).message);
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
        <Text className="text-white text-3xl font-bold mb-1">Create account</Text>
        <Text className="text-muted text-base mb-10">Start tracking your comedy journey.</Text>

        <View className="gap-4">
          <TextInput
            value={stageName}
            onChangeText={setStageName}
            placeholder="Stage name (optional)"
            placeholderTextColor="#6b7280"
            className="bg-surface text-white rounded-xl px-4 py-3.5 border border-border"
          />
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
            placeholder="Password (min 8 chars)"
            placeholderTextColor="#6b7280"
            secureTextEntry
            className="bg-surface text-white rounded-xl px-4 py-3.5 border border-border"
          />
          <Pressable
            onPress={handleRegister}
            disabled={loading}
            className="bg-accent rounded-xl py-4 items-center active:opacity-80"
          >
            <Text className="text-black font-bold text-base">
              {loading ? "Creating account..." : "Sign up"}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row justify-center mt-6 gap-1">
          <Text className="text-muted">Already have an account?</Text>
          <Link href="/(auth)/login">
            <Text className="text-accent font-semibold">Log in</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
