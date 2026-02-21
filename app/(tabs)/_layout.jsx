import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "../../constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.textLight,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.neutral800,
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "home";

          switch (route.name) {
            case "index":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Profile":
              iconName = focused ? "person" : "person-outline";
              break;
            case "Wallet":
              iconName = focused ? "wallet" : "wallet-outline";
              break;
            case "Market":
              iconName = focused ? "cart" : "cart-outline";
              break;
            case "Assistant":
              iconName = focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline";
              break;
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="Wallet" options={{ title: "Wallet" }} />
      <Tabs.Screen name="Assistant" options={{ title: "AI" }} />
      <Tabs.Screen name="Market" options={{ title: "Market" }} />
      <Tabs.Screen name="Profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="Statistic" options={{ title: "Statistic", href: null }} />
    </Tabs>
  );
}
