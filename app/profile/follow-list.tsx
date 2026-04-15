import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function FollowList() {
  const { userId, type } = useLocalSearchParams();
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchList();
  }, [userId, type]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const targetColumn =
        type === "followers" ? "following_id" : "follower_id";
      const profileToJoin =
        type === "followers" ? "follower_id" : "following_id";

      const { data, error } = await supabase
        .from("connections")
        .select(
          `
          profiles!${profileToJoin} (id, username, avatar_url)
        `,
        )
        .eq(targetColumn, userId);

      if (error) throw error;

      // Filter out nulls to prevent the "username of null" error
      const formattedList = data
        .map((item: any) => item.profiles)
        .filter((profile) => profile !== null);

      setList(formattedList);
    } catch (err) {
      console.error("Follow list error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ FIXED NAVIGATION LOGIC
   * We use replace to the specific tab route to ensure
   * it lands on the Profile screen, not back in the list.
   */
  const handleBack = () => {
    // If your tab route is named 'profile', use this:
    router.replace("../(tabs)/myprofile");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#824c21" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {type === "followers" ? "Followers" : "Following"}
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#f8ad04" size="large" />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item, index) =>
            item?.id?.toString() || index.toString()
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            if (!item) return null;

            return (
              <TouchableOpacity
                style={styles.userCard}
                onPress={() => router.push(`/profile/${item.id}`)}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {item.username?.[0]?.toUpperCase() || "?"}
                  </Text>
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.username}>@{item.username}</Text>
                  <Text style={styles.viewProfileText}>View Profile</Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={60} color="#e2e8f0" />
              <Text style={styles.empty}>No users found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  backButton: { padding: 5, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#824c21" },
  listContent: { paddingBottom: 20 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f8ad04",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  userInfo: { flex: 1 },
  username: { fontSize: 16, fontWeight: "700", color: "#1a202c" },
  viewProfileText: { fontSize: 12, color: "#a0aec0", marginTop: 2 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  empty: { textAlign: "center", marginTop: 15, color: "#a4b0be", fontSize: 15 },
});
