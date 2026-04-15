import { Tabs } from "expo-router";
import {
  Home,
  MessageSquare,
  PlusSquare,
  Search,
  User,
} from "lucide-react-native";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#824c21",
        tabBarInactiveTintColor: "#57606f",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f1f2f6",
          height:
            Platform.OS === "ios" ? 85 + insets.bottom : 70 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontWeight: "600",
          fontSize: 11,
          marginBottom: Platform.OS === "ios" ? 0 : 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <Search color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="messages/index"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => <MessageSquare color={color} size={24} />,
          // REMOVED: tabBarBadge and tabBarBadgeStyle
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: "Post",
          tabBarIcon: ({ color }) => <PlusSquare color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="myprofile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />

      {/* --- HIDDEN SCREENS & EXTERNAL GROUPS --- */}

      <Tabs.Screen name="comments/[id]" options={{ href: null }} />
      <Tabs.Screen name="saved" options={{ href: null }} />
    </Tabs>
  );
}
