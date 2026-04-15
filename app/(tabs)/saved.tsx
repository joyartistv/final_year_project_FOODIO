import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function SavedRecipesScreen() {
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchSavedRecipes();
    }, []),
  );

  const fetchSavedRecipes = async () => {
    setRefreshing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("saved_recipes")
        .select(
          `
          recipes (
            id,
            title,
            image_url,
            profiles(
              username
            )
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Extract and format the data
      const formatted = data
        ?.map((item: any) => {
          const recipe = item.recipes;
          if (!recipe) return null;

          // Handle the case where the join might return an array or object
          const profileData = Array.isArray(recipe.profiles)
            ? recipe.profiles[0]
            : recipe.profiles;

          return {
            ...recipe,
            profiles: profileData,
          };
        })
        .filter((recipe: any) => recipe !== null);

      setSavedItems(formatted || []);
    } catch (err: any) {
      console.error("Error fetching saved:", err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/recipes/${item.id}`)}
    >
      <Image
        source={{ uri: item.image_url || "https://via.placeholder.com/70" }}
        style={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.author}>
          by @{item.profiles?.username || "chef"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookmarks</Text>
      </View>

      <FlatList
        data={savedItems}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchSavedRecipes}
            tintColor="#f8ad04"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No saved recipes yet!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 20, borderBottomWidth: 1, borderColor: "#eee" },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#824c21" },
  card: {
    flexDirection: "row",
    padding: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#f9f9f9",
  },
  image: { width: 70, height: 70, borderRadius: 10, backgroundColor: "#eee" },
  info: { flex: 1, marginLeft: 15 },
  title: { fontSize: 16, fontWeight: "bold", color: "#2d3436" },
  author: { fontSize: 14, color: "#999", marginTop: 2 },
  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 10,
    color: "#999",
    fontSize: 16,
    textAlign: "center",
  },
});
