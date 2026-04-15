import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Fixed: Path updated to reach root lib folder from (tabs)/comments/
import { supabase } from "../../../lib/supabase";

export default function CommentsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchComments();
  }, [id]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          profiles!fk_user_profile (username)
        `,
        ) // Fixed: Added !fk_user_profile to resolve the relationship error
        .eq("recipe_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err: any) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return Alert.alert("Join Foodio", "Log in to comment!");

      const { error } = await supabase.from("comments").insert([
        {
          recipe_id: id,
          user_id: user.id,
          text: newComment.trim(),
        },
      ]);

      if (error) throw error;
      setNewComment("");
      fetchComments(); // Refresh list after posting
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#824c21" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main List */}
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#f8ad04" />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.commentCard}>
              <Text style={styles.commentUser}>
                @{item.profiles?.username || "chef"}
              </Text>
              <Text style={styles.commentText}>{item.text}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No comments yet. Start the conversation!
            </Text>
          }
        />
      )}

      {/* Sticky Input Field */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 95 : 0}
      >
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={postComment} disabled={!newComment.trim()}>
            <Text
              style={[styles.postBtn, !newComment.trim() && { color: "#ccc" }]}
            >
              Post
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#2d3436" },
  listContent: { padding: 15, paddingBottom: 40 },
  commentCard: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  commentUser: { fontWeight: "bold", color: "#824c21", marginBottom: 2 },
  commentText: { fontSize: 15, color: "#2d3436", lineHeight: 20 },
  emptyText: { textAlign: "center", marginTop: 50, color: "#999" },
  inputArea: {
    flexDirection: "row",
    padding: 12,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f2f6",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  postBtn: { color: "#f8ad04", fontWeight: "bold", fontSize: 16 },
});
