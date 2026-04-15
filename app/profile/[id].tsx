import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function PublicProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [userRecipes, setUserRecipes] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProfileData();
  }, [id]);

  async function fetchProfileData() {
    setLoading(true);
    try {
      // 1. Fetch Profile info (Username and Avatar)
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      setProfileData(profile);

      // 2. Fetch Stats
      const { count: followers } = await supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("following_id", id);
      const { count: following } = await supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", id);
      setStats({ followers: followers || 0, following: following || 0 });

      // 3. Fetch Recipes (matching your grid style)
      // Using user_id -> public.profiles.id relation
      const { data: recipes } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false });
      setUserRecipes(recipes || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#824c21" />
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#824c21" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Chef Profile</Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="share-outline" size={22} color="#824c21" />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profileData?.avatar_url ? (
            <Image
              source={{ uri: profileData.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profileData?.username?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.usernameText}>
          {profileData?.username || "Guest Chef"}
        </Text>
        <Text style={styles.bioText}>
          {profileData?.bio || "Cooking up something delicious!"}
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userRecipes.length}</Text>
            <Text style={styles.statLabel}>Recipes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followBtnText}>Follow</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() => router.push("/messages/room")}
          >
            <Ionicons name="mail-outline" size={20} color="#824c21" />
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={userRecipes}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.recipeCard}
            // ✅ Redirect to recipes/[id].tsx
            onPress={() => router.push(`/recipes/${item.id}`)}
          >
            <Image
              source={{ uri: item.image_url }}
              style={styles.recipeImage}
            />
            <Text style={styles.recipeTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No recipes yet.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  navHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  navTitle: { fontSize: 18, fontWeight: "bold", color: "#824c21" },
  header: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatarContainer: { marginBottom: 10 },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#824c21",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "bold" },
  usernameText: { fontSize: 20, fontWeight: "bold", color: "#2d3436" },
  bioText: {
    fontSize: 13,
    color: "#636e72",
    marginTop: 4,
    paddingHorizontal: 20,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 15,
  },
  statBox: { alignItems: "center" },
  statNumber: { fontSize: 17, fontWeight: "bold", color: "#2d3436" },
  statLabel: { fontSize: 12, color: "#636e72", textTransform: "uppercase" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 5 },
  followBtn: {
    backgroundColor: "#824c21",
    paddingHorizontal: 35,
    paddingVertical: 10,
    borderRadius: 25,
  },
  followBtnText: { color: "#fff", fontWeight: "bold" },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#824c21",
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 25,
  },
  messageBtnText: { color: "#824c21", fontWeight: "bold" },
  listContent: { padding: 8 },
  recipeCard: {
    flex: 1,
    margin: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowOpacity: 0.1,
  },
  recipeImage: { width: "100%", height: 120 },
  recipeTitle: { padding: 8, fontSize: 13, fontWeight: "600" },
  emptyText: { textAlign: "center", marginTop: 40, color: "#999" },
});
