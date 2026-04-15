import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

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

export default function RecipeDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user.id || null;
      setCurrentUserId(userId);

      // Fetches recipe + username + saved status + all likes for counting
      const { data, error } = await supabase
        .from("recipes")
        .select(
          `
          *, 
          profiles(username),
          saved_recipes(user_id),
          likes(user_id)
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setRecipe(data);

      // Check if current user has saved/liked this
      setIsSaved(data.saved_recipes?.some((s: any) => s.user_id === userId));
      setIsLiked(data.likes?.some((l: any) => l.user_id === userId));
      setLikeCount(data.likes?.length || 0);
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
      Alert.alert("Error", "Could not load recipe.");
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!currentUserId)
      return Alert.alert("Join Foodio", "Log in to like recipes!");

    const previousLiked = isLiked;
    const previousCount = likeCount;

    // Optimistic UI Update
    setIsLiked(!previousLiked);
    setLikeCount((prev) => (previousLiked ? prev - 1 : prev + 1));

    try {
      if (previousLiked) {
        await supabase
          .from("likes")
          .delete()
          .match({ user_id: currentUserId, recipe_id: id });
      } else {
        await supabase
          .from("likes")
          .insert([{ user_id: currentUserId, recipe_id: id }]);
      }
    } catch (err) {
      // Revert if DB call fails
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
    }
  };

  const toggleSave = async () => {
    if (!currentUserId)
      return Alert.alert("Join Foodio", "Log in to save recipes!");
    try {
      if (isSaved) {
        await supabase
          .from("saved_recipes")
          .delete()
          .match({ user_id: currentUserId, recipe_id: id });
        setIsSaved(false);
      } else {
        await supabase
          .from("saved_recipes")
          .insert([{ user_id: currentUserId, recipe_id: id }]);
        setIsSaved(true);
      }
    } catch (err: any) {
      console.error("Save Error:", err.message);
    }
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Check out ${recipe.title} by @${recipe.profiles?.username} on Foodio!`,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f8ad04" />
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#824c21" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe Details</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={toggleLike}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "#e74c3c" : "#824c21"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { marginLeft: 10 }]}
            onPress={onShare}
          >
            <Ionicons name="share-outline" size={24} color="#824c21" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { marginLeft: 10 }]}
            onPress={toggleSave}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isSaved ? "#f8ad04" : "#824c21"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: recipe.image_url }} style={styles.mainImage} />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <DietarySymbol isVeg={recipe.is_veg ?? true} />
            <Text style={styles.title}>{recipe.title}</Text>
          </View>

          <View style={styles.metaRow}>
            <TouchableOpacity
              onPress={() => router.push(`/profile/${recipe.user_id}`)}
            >
              <Text style={styles.author}>
                By @{recipe.profiles?.username || "chef"}
              </Text>
            </TouchableOpacity>
            <View style={styles.likeBadge}>
              <Ionicons name="heart" size={14} color="#e74c3c" />
              <Text style={styles.likeCountText}>{likeCount} likes</Text>
            </View>
          </View>

          {recipe.description && (
            <Text style={styles.descriptionText}>{recipe.description}</Text>
          )}

          <View style={styles.infoBar}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color="#824c21" />
              <Text style={styles.infoLabel}>
                Prep: {recipe.prep_time || 0}m
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="flame-outline" size={20} color="#e67e22" />
              <Text style={styles.infoLabel}>
                Cook: {recipe.cook_time || 0}m
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={22} color="#824c21" />
            <Text style={styles.sectionTitle}>Ingredients</Text>
          </View>
          <View style={styles.ingredientsContainer}>
            {Array.isArray(recipe.ingredients) ? (
              recipe.ingredients.map((item: string, i: number) => (
                <Text key={i} style={styles.ingredientItem}>
                  • {item}
                </Text>
              ))
            ) : (
              <Text>No ingredients listed.</Text>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant-outline" size={22} color="#824c21" />
            <Text style={styles.sectionTitle}>Instructions</Text>
          </View>
          <Text style={styles.instructions}>
            {recipe.instructions || "No instructions provided."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#2d3436" },
  headerRight: { flexDirection: "row" },
  headerButton: { padding: 8, borderRadius: 20, backgroundColor: "#f8f9fa" },
  mainImage: { width: "100%", height: 350, backgroundColor: "#f0f2f5" },
  content: { padding: 20 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 5,
  },
  symbolSquare: {
    width: 18,
    height: 18,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 2,
  },
  symbolCircle: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 26, fontWeight: "bold", color: "#2d3436", flex: 1 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  author: { color: "#824c21", fontSize: 16, fontWeight: "600" },
  likeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  likeCountText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#e74c3c",
  },
  descriptionText: {
    fontSize: 16,
    color: "#636e72",
    marginTop: 15,
    fontStyle: "italic",
  },
  infoBar: {
    flexDirection: "row",
    backgroundColor: "#fdf7ed",
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
  },
  infoItem: { flexDirection: "row", alignItems: "center", marginRight: 25 },
  infoLabel: { marginLeft: 6, fontWeight: "700", color: "#824c21" },
  divider: { height: 1, backgroundColor: "#f1f2f6", marginVertical: 25 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#2d3436",
  },
  ingredientsContainer: { marginBottom: 25, paddingLeft: 5 },
  ingredientItem: { fontSize: 16, color: "#2d3436", marginBottom: 6 },
  instructions: {
    fontSize: 16,
    lineHeight: 26,
    color: "#636e72",
    paddingBottom: 40,
  },
});
