import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function ProfileScreen() {
  const [userRecipes, setUserRecipes] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const router = useRouter();

  useEffect(() => {
    getProfileData();
  }, []);

  async function getProfileData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUserId(user.id);
      setUserEmail(user.email ?? "");
      fetchConnectionCounts(user.id);
      fetchProfile(user.id);

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) setUserRecipes(data || []);
    }
  }

  async function fetchProfile(uid: string) {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", uid)
      .single();

    if (data?.avatar_url) setAvatarUrl(data.avatar_url);
  }

  async function fetchConnectionCounts(uid: string) {
    const { count: followersCount } = await supabase
      .from("connections")
      .select("*", { count: "exact", head: true })
      .eq("following_id", uid);

    const { count: followingCount } = await supabase
      .from("connections")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", uid);

    setStats({
      followers: followersCount || 0,
      following: followingCount || 0,
    });
  }

  async function pickAndUploadAvatar() {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled) return;

      const imageUri = result.assets[0].uri;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const fileExtension = imageUri.split(".").pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExtension}`;

      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: fileName,
        type: `image/${fileExtension}`,
      } as any);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, formData, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      setAvatarUrl(publicUrl);
      Alert.alert("Success", "Profile image updated!");
    } catch (error: any) {
      Alert.alert("Upload Error", error.message);
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  };

  const openFollowers = () => {
    if (!userId) return;
    router.push({
      pathname: "/profile/follow-list",
      params: { userId: userId, type: "followers" },
    });
  };

  const openFollowing = () => {
    if (!userId) return;
    router.push({
      pathname: "/profile/follow-list",
      params: { userId: userId, type: "following" },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={pickAndUploadAvatar}
          style={styles.avatarContainer}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {userEmail?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>

        <Text style={styles.emailText}>{userEmail}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userRecipes.length}</Text>
            <Text style={styles.statLabel}>Recipes</Text>
          </View>
          <TouchableOpacity style={styles.statBox} onPress={openFollowers}>
            <Text style={styles.statNumber}>{stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statBox} onPress={openFollowing}>
            <Text style={styles.statNumber}>{stats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={userRecipes}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.recipeCard}
            // ✅ REDIRECT FIXED: Opens the same detail view as the Home Feed
            onPress={() => router.push(`/recipes/${item.id}`)}
          >
            <Image
              source={{ uri: item.image_url }}
              style={styles.recipeImage}
            />
            <View style={styles.titleOverlay}>
              <Text style={styles.recipeTitle} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            You haven't posted any recipes yet!
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatarContainer: { alignItems: "center", marginBottom: 10 },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#824c21",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#eee",
  },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "bold" },
  changePhotoText: {
    marginTop: 8,
    color: "#824c21",
    fontSize: 12,
    fontWeight: "600",
  },
  emailText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3436",
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 15,
  },
  statBox: { alignItems: "center", paddingHorizontal: 20 },
  statNumber: { fontSize: 16, fontWeight: "bold", color: "#2d3436" },
  statLabel: { fontSize: 11, color: "#636e72", textTransform: "uppercase" },
  signOutBtn: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#824c21",
  },
  signOutText: { color: "#824c21", fontWeight: "700", fontSize: 13 },
  listContent: { padding: 4 },
  recipeCard: {
    flex: 0.5,
    margin: 4,
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f8f9fa",
  },
  recipeImage: { width: "100%", height: "100%", position: "absolute" },
  titleOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
  },
  recipeTitle: { color: "#fff", fontSize: 12, fontWeight: "600" },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#a4b0be",
    fontSize: 14,
  },
});
