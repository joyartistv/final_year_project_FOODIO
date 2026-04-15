import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function AdminBroadcast() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBroadcast = async () => {
    if (!title || !content) return Alert.alert("Error", "Fill in all fields");

    setLoading(true);
    try {
      const { error } = await supabase
        .from("announcements")
        .insert([{ title, content }]);

      if (error) throw error;

      Alert.alert("Success", "Broadcast sent to all users!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#824c21" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Global Broadcast</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Broadcast Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Weekend Cooking Contest"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Message Content</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What's the big news?"
          value={content}
          onChangeText={setContent}
          multiline
        />

        <TouchableOpacity
          style={[styles.sendBtn, loading && { opacity: 0.7 }]}
          onPress={handleBroadcast}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="megaphone-outline" size={20} color="#fff" />
              <Text style={styles.sendBtnText}>Broadcast Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#824c21" },
  form: { padding: 20 },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  textArea: { height: 120, textAlignVertical: "top" },
  sendBtn: {
    backgroundColor: "#824c21",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    borderRadius: 12,
    gap: 10,
  },
  sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
