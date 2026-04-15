import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

// Component for the Veg/Non-Veg indicator
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

export default function HomeFeed() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  const fetchFeed = async () => {
    setRefreshing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id || null;
      setCurrentUserId(userId);

      const { data: recipeData, error } = await supabase
        .from("recipes")
        .select(
          `
          *,
          profiles:user_id (id, username, avatar_url),
          likes(user_id), 
          comments(count)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (userId) {
        const { data: connData } = await supabase
          .from("connections")
          .select("following_id")
          .eq("follower_id", userId);
        setFollowingIds(connData?.map((c) => c.following_id) || []);
      }

      const formattedData = recipeData?.map((recipe) => ({
        ...recipe,
        likeCount: recipe.likes?.length || 0,
        commentCount: recipe.comments?.[0]?.count || 0,
        userLiked: recipe.likes?.some((like: any) => like.user_id === userId),
      }));

      setRecipes(formattedData || []);
    } catch (err: any) {
      console.error("Feed error:", err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleConnect = async (targetUserId: string) => {
    if (!currentUserId)
      return Alert.alert("Join Foodio", "Log in to follow chefs!");
    if (currentUserId === targetUserId) return;

    const isFollowing = followingIds.includes(targetUserId);

    try {
      if (isFollowing) {
        setFollowingIds((prev) => prev.filter((id) => id !== targetUserId));
        await supabase
          .from("connections")
          .delete()
          .match({ follower_id: currentUserId, following_id: targetUserId });
      } else {
        setFollowingIds((prev) => [...prev, targetUserId]);
        await supabase
          .from("connections")
          .insert([{ follower_id: currentUserId, following_id: targetUserId }]);
      }
    } catch (err: any) {
      fetchFeed();
      console.error("Connection error:", err.message);
    }
  };

  const toggleLike = async (recipeId: string) => {
    if (!currentUserId) return Alert.alert("Join Foodio", "Log in to like!");

    setRecipes((prev) =>
      prev.map((r) => {
        if (r.id === recipeId) {
          return {
            ...r,
            userLiked: !r.userLiked,
            likeCount: r.userLiked ? r.likeCount - 1 : r.likeCount + 1,
          };
        }
        return r;
      }),
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
    } catch (err: any) {
      fetchFeed();
      console.error("Like error:", err.message);
    }
  };

  const onShare = async (recipe: any) => {
    try {
      await Share.share({
        message: `Check out this recipe on Foodio: ${recipe.title}\n\n${recipe.description}`,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* App Header */}
      <View style={styles.header}>
        {/* Left: AI Assistant */}
        <View style={styles.headerSideLeft}>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => router.push("/ai-assistant")}
          >
            <Ionicons name="sparkles" size={22} color="#824c21" />
            <Text style={styles.aiLabel}>AI</Text>
          </TouchableOpacity>
        </View>

        {/* Center: Logo */}
        <Text style={styles.logoText}>Foodio</Text>

        {/* Right: Saved/Bookmarks */}
        <View style={styles.headerSideRight}>
          <TouchableOpacity onPress={() => router.push("/saved")}>
            <Ionicons name="bookmark" size={24} color="#824c21" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchFeed}
            tintColor="#824c21"
          />
        }
        renderItem={({ item }) => {
          const isFollowing = followingIds.includes(item.profiles?.id);
          const isMe = item.profiles?.id === currentUserId;

          return (
            <View style={styles.postCard}>
              <View style={styles.userInfo}>
                <TouchableOpacity
                  style={styles.userRow}
                  onPress={() => router.push(`/profile/${item.profiles?.id}`)}
                >
                  <View style={styles.userAvatarSmall}>
                    <Text style={styles.avatarLetter}>
                      {item.profiles?.username?.charAt(0).toUpperCase() || "U"}
                    </Text>
                  </View>
                  <Text style={styles.username}>
                    @{item.profiles?.username || "chef"}
                  </Text>
                </TouchableOpacity>

                {!isMe && (
                  <TouchableOpacity
                    style={[
                      styles.connectBtn,
                      isFollowing ? styles.btnFollowing : styles.btnFollow,
                    ]}
                    onPress={() => toggleConnect(item.profiles.id)}
                  >
                    <Ionicons
                      name={isFollowing ? "checkmark" : "person-add"}
                      size={14}
                      color={isFollowing ? "#fff" : "#824c21"}
                    />
                    <Text
                      style={[
                        styles.connectText,
                        { color: isFollowing ? "#fff" : "#824c21" },
                      ]}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push(`/recipes/${item.id}`)}
              >
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.recipeImage}
                  resizeMode="cover"
                />
                <View style={styles.cuisineOverlay}>
                  <Text style={styles.cuisineOverlayText}>
                    {item.cuisine || "General"}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.actionBar}>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => toggleLike(item.id)}
                >
                  <Ionicons
                    name={item.userLiked ? "heart" : "heart-outline"}
                    size={26}
                    color={item.userLiked ? "#e74c3c" : "#2d3436"}
                  />
                  <Text
                    style={[
                      styles.actionCount,
                      item.userLiked && { color: "#e74c3c" },
                    ]}
                  >
                    {item.likeCount}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionItem, { marginLeft: 20 }]}
                  onPress={() => router.push(`/comments/${item.id}`)}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={24}
                    color="#2d3436"
                  />
                  <Text style={styles.actionCount}>{item.commentCount}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionItem, { marginLeft: 20 }]}
                  onPress={() => onShare(item)}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={24}
                    color="#2d3436"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <DietarySymbol isVeg={item.is_veg ?? true} />
                  <Text style={styles.recipeTitle}>{item.title}</Text>
                </View>
                <Text style={styles.recipeDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 60,
    backgroundColor: "#f8ad04",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerSideLeft: {
    width: 60,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerSideRight: {
    width: 60,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#824c21",
    marginLeft: 2,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#824c21",
    textAlign: "center",
  },
  listContent: { paddingBottom: 130 },
  postCard: {
    backgroundColor: "#fff",
    marginBottom: 15,
    borderRadius: 12,
    marginHorizontal: 10,
    elevation: 3,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  userInfo: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  userRow: { flexDirection: "row", alignItems: "center" },
  userAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#824c21",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarLetter: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  username: { fontWeight: "bold", color: "#2d3436", fontSize: 15 },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  btnFollow: {
    borderColor: "#824c21",
    backgroundColor: "transparent",
  },
  btnFollowing: {
    borderColor: "#824c21",
    backgroundColor: "#824c21",
  },
  connectText: { fontSize: 12, fontWeight: "bold", marginLeft: 4 },
  recipeImage: { width: "100%", height: 380, backgroundColor: "#f0f2f5" },
  cuisineOverlay: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  cuisineOverlayText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    gap: 8,
  },
  symbolSquare: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 2,
  },
  symbolCircle: { width: 6, height: 6, borderRadius: 3 },
  actionBar: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  actionItem: { flexDirection: "row", alignItems: "center" },
  actionCount: { marginLeft: 6, fontWeight: "700", fontSize: 15 },
  content: { padding: 15 },
  recipeTitle: { fontSize: 18, fontWeight: "bold", color: "#2d3436" },
  recipeDescription: {
    color: "#636e72",
    marginTop: 2,
    lineHeight: 18,
    fontSize: 14,
  },
});
