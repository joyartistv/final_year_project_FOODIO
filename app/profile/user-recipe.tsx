import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

// Veg/Non-Veg symbol
const DietarySymbol = ({ isVeg }: { isVeg: boolean }) => (
  <View style={[styles.symbolSquare, { borderColor: isVeg ? "green" : "red" }]}>
    <View
      style={[
        styles.symbolCircle,
        { backgroundColor: isVeg ? "green" : "red" },
      ]}
    />
  </View>
);

export default function UserRecipesScreen() {
  const { id } = useLocalSearchParams(); // userId
  const router = useRouter();

  const [recipes, setRecipes] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchUserRecipes = async () => {
    setRefreshing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id || null;
      setCurrentUserId(userId);

      const { data, error } = await supabase
        .from("recipes")
        .select(
          `
          *,
          profiles:user_id (id, username),
          likes(user_id),
          comments(count)
        `,
        )
        .eq("user_id", id) // ✅ ONLY this user's recipes
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = data?.map((recipe) => ({
        ...recipe,
        likeCount: recipe.likes?.length || 0,
        commentCount: recipe.comments?.[0]?.count || 0,
        userLiked: recipe.likes?.some((l: any) => l.user_id === currentUserId),
      }));

      setRecipes(formatted || []);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleLike = async (recipeId: string) => {
    if (!currentUserId) return;

    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId
          ? {
              ...r,
              userLiked: !r.userLiked,
              likeCount: r.userLiked ? r.likeCount - 1 : r.likeCount + 1,
            }
          : r,
      ),
    );

    try {
      const recipe = recipes.find((r) => r.id === recipeId);

      if (recipe?.userLiked) {
        await supabase
          .from("likes")
          .delete()
          .match({ user_id: currentUserId, recipe_id: recipeId });
      } else {
        await supabase
          .from("likes")
          .insert([{ user_id: currentUserId, recipe_id: recipeId }]);
      }
    } catch {
      fetchUserRecipes();
    }
  };

  useEffect(() => {
    if (id) fetchUserRecipes();
  }, [id]);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#824c21" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Recipes</Text>

        <View style={{ width: 24 }} />
      </View>

      {recipes.length === 0 && !refreshing ? (
        <View style={styles.center}>
          <Text>No recipes yet</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchUserRecipes}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              {/* USER */}
              <View style={styles.userInfo}>
                <Text style={styles.username}>@{item.profiles?.username}</Text>
              </View>

              {/* IMAGE */}
              <TouchableOpacity
                onPress={() => router.push(`/recipes/${item.id}`)}
              >
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.recipeImage}
                />
              </TouchableOpacity>

              {/* ACTIONS */}
              <View style={styles.actionBar}>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => toggleLike(item.id)}
                >
                  <Ionicons
                    name={item.userLiked ? "heart" : "heart-outline"}
                    size={24}
                    color={item.userLiked ? "red" : "black"}
                  />
                  <Text>{item.likeCount}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ marginLeft: 20 }}
                  onPress={() => router.push(`/comments/${item.id}`)}
                >
                  <Ionicons name="chatbubble-outline" size={22} />
                </TouchableOpacity>
              </View>

              {/* CONTENT */}
              <View style={styles.content}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <DietarySymbol isVeg={item.is_veg ?? true} />
                  <Text style={styles.title}>{item.title}</Text>
                </View>
                <Text numberOfLines={2}>{item.description}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  postCard: {
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  userInfo: { padding: 10 },
  username: { fontWeight: "bold" },
  recipeImage: { width: "100%", height: 300 },
  actionBar: { flexDirection: "row", padding: 10 },
  actionItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  content: { padding: 10 },
  title: { fontWeight: "bold", marginLeft: 6 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  symbolSquare: {
    width: 14,
    height: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  symbolCircle: { width: 6, height: 6, borderRadius: 3 },
});
