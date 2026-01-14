import { Tabs } from "expo-router";
import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { GymStoreProvider } from "./gym-store";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <GymStoreProvider>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
              headerShown: false,
              tabBarButton: HapticTab,
            }}
            backBehavior="history"
          >
            <Tabs.Screen
              name="index"
              options={{
                title: "Home",
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
              }}
            />
            <Tabs.Screen name="workout" options={{ href: null }} />
            <Tabs.Screen name="list" options={{ href: null }} />
            <Tabs.Screen name="add" options={{ href: null }} />
            <Tabs.Screen name="detail" options={{ href: null }} />
            <Tabs.Screen name="select-exercises" options={{ href: null }} />
          </Tabs>
        </SafeAreaView>
      </GymStoreProvider>
    </SafeAreaProvider>
  );
}
