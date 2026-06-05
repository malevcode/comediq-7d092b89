import { Tabs } from "expo-router";
import { Text } from "react-native";

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{label}</Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1a1a1a",
          borderTopColor: "#2a2a2a",
          paddingBottom: 4,
        },
        tabBarActiveTintColor: "#f5a623",
        tabBarInactiveTintColor: "#6b7280",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Sets",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="🎤" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: "Log Set",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="+" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bits"
        options={{
          title: "Bits",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="💡" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="👤" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
