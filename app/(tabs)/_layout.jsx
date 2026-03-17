import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Colors, styles } from "../../constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 0,
          elevation: 5,
          height: 70,
          paddingBottom: 10,
          ...styles.shadow
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: -5,
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
            // Market icon is already safely commented out!
            case "Assistant":
              iconName = focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline";
              break;
            case "Market":
              iconName = focused ? "storefront" : "storefront-outline";
              break;
            // You might want to add an icon case for your Goals tab here!
            case "Goals":
              iconName = focused ? "flag" : "flag-outline";
              break;
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="Wallet" options={{ title: "Wallet" }} />
      <Tabs.Screen name="Assistant" options={{ title: "AI" }} />
      <Tabs.Screen name="Goals" options={{ title: "Goal" }} />

      {/* ADDED href: null TO HIDE THE MARKET TAB */}
      <Tabs.Screen name="Market" options={{ title: "Market" }} />

      <Tabs.Screen name="Profile" options={{ title: "Profile", href: "/Profile" }} />
      <Tabs.Screen name="Statistic" options={{ title: "Statistic", href: null }} />
    </Tabs>
  );
}