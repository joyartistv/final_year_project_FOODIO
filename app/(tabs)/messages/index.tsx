import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import this
import { useRouter } from "expo-router";
import { Megaphone, MessageCircle, ShieldCheck } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";

export default function MessagesScreen() {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const MY_ADMIN_ID = "YOUR_SUPABASE_USER_ID_HERE";

  const fetchChatableUsers = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      if (session.user.id === MY_ADMIN_ID) setIsAdmin(true);

      // 1. Fetch Latest Global Broadcast
      const { data: latestAnnounce } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // 2. CHECK NOTIFICATION STATUS
      // Get the ID of the last announcement the user actually clicked on
      const lastSeenId = await AsyncStorage.getItem(
        "last_seen_announcement_id",
      );
      const hasNewMessage = latestAnnounce && lastSeenId !== latestAnnounce.id;

      // 3. Fetch Followed Users
      const { data: following, error } = await supabase
        .from("connections")
        .select(
          `
          following_id, 
          profiles!connections_following_id_fkey (id, username, avatar_url)
        `,
        )
        .eq("follower_id", session.user.id);

      if (error) console.error("Database Error:", error.message);

      // 4. Construct Community Item
      const foodioCommunity = {
        id: "foodio-community-global",
        username: "Foodio Community",
        isCommunity: true,
        // Only show the announcement title/text if it's NEW
        subtitle: hasNewMessage ? latestAnnounce.title : "No new updates",
        lastMsg: hasNewMessage
          ? latestAnnounce.content
          : "You're all caught up!",
        hasBadge: hasNewMessage, // Track this for the UI
        rawAnnounce: latestAnnounce, // Keep reference to save later
      };

      const userList =
        following
          ?.map((item: any) => item.profiles)
          .filter((p) => p !== null) || [];
      setFriends([foodioCommunity, ...userList]);
    } catch (err) {
      console.error("System Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatableUsers();
  }, []);

  // Function to clear notification when clicked
  const handlePressCommunity = async (item: any) => {
    if (item.hasBadge && item.rawAnnounce) {
      // Save this ID so the notification disappears
      await AsyncStorage.setItem(
        "last_seen_announcement_id",
        item.rawAnnounce.id,
      );

      Alert.alert(item.subtitle, item.lastMsg, [
        { text: "Awesome", onPress: fetchChatableUsers }, // Refresh to clear badge
      ]);
    } else {
      Alert.alert(
        "Foodio Community",
        "No new announcements right now. Check back later!",
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#824c21" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => router.push("../messages/admin-broadcast")}
            style={styles.adminBtn}
          >
            <Ionicons name="add-circle" size={32} color="#f8ad04" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#f8ad04" size="large" />
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={fetchChatableUsers}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, item.isCommunity && styles.commCard]}
              onPress={() =>
                item.isCommunity
                  ? handlePressCommunity(item)
                  : router.push({
                      pathname: "/messages/room",
                      params: { recipientId: item.id, username: item.username },
                    })
              }
            >
              <View
                style={[styles.avatar, item.isCommunity && styles.commAvatar]}
              >
                {item.isCommunity ? (
                  <Megaphone color="#fff" size={22} />
                ) : (
                  <Text style={styles.avText}>
                    {item.username?.[0].toUpperCase() || "?"}
                  </Text>
                )}
                {/* RED DOT BADGE */}
                {item.isCommunity && item.hasBadge && (
                  <View style={styles.redDot} />
                )}
              </View>

              <View style={styles.info}>
                <View style={styles.row}>
                  <Text
                    style={[styles.name, item.isCommunity && styles.commText]}
                  >
                    {item.username}
                  </Text>
                  {item.isCommunity && (
                    <ShieldCheck
                      size={14}
                      color="#824c21"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
                <Text
                  style={[styles.sub, item.hasBadge && styles.activeSub]}
                  numberOfLines={1}
                >
                  {item.lastMsg}
                </Text>
              </View>

              <MessageCircle
                size={20}
                color={item.hasBadge ? "#f8ad04" : "#cbd5e0"}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  backBtn: { marginRight: 15 },
  adminBtn: { marginLeft: "auto" },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#824c21" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    flexDirection: "row",
    padding: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  commCard: { backgroundColor: "#fffcf5" },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f8ad04",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  commAvatar: { backgroundColor: "#824c21" },
  redDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#ff4757",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  info: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "bold", color: "#2d3436" },
  commText: { color: "#824c21" },
  sub: { fontSize: 13, color: "#a4b0be" },
  activeSub: { color: "#2d3436", fontWeight: "600" }, // Bold text for new messages
});
