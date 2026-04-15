import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import { supabase } from "../../lib/supabase";

export default function ChatRoom() {
  const router = useRouter();
  const { recipientId, username } = useLocalSearchParams();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const fetchMessages = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${session.user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${session.user.id})`,
      )
      .order("created_at", { ascending: true });

    if (!error) setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel(`chat_${recipientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const isThisChat =
            payload.new.sender_id === recipientId ||
            payload.new.receiver_id === recipientId;
          if (isThisChat) {
            setMessages((prev) => [...prev, payload.new]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recipientId]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("messages").insert([
      {
        sender_id: session.user.id,
        receiver_id: recipientId,
        content: message.trim(),
      },
    ]);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setMessage("");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#824c21" />
        </TouchableOpacity>
        <Text style={styles.headerName}>{username || "Chat"}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#f8ad04" />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 15 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item }) => {
            const isMine = item.sender_id !== recipientId;
            return (
              <View
                style={[
                  styles.bubble,
                  isMine ? styles.myBubble : styles.theirBubble,
                ]}
              >
                <Text style={isMine ? styles.myText : styles.theirText}>
                  {item.content}
                </Text>
                <Text
                  style={[
                    styles.timestamp,
                    isMine ? styles.myTimestamp : styles.theirTimestamp,
                  ]}
                >
                  {formatTime(item.created_at)}
                </Text>
              </View>
            );
          }}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Write message..."
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
            <Ionicons name="send" size={24} color="#f8ad04" />
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
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: { marginRight: 15 },
  headerName: { fontSize: 18, fontWeight: "bold", color: "#2d3436" },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 15, marginBottom: 10 },
  myBubble: { alignSelf: "flex-end", backgroundColor: "#f8ad04" },
  theirBubble: { alignSelf: "flex-start", backgroundColor: "#f1f2f6" },
  myText: { color: "#fff", fontSize: 16 },
  theirText: { color: "#2d3436", fontSize: 16 },
  timestamp: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  myTimestamp: { color: "rgba(255, 255, 255, 0.7)" },
  theirTimestamp: { color: "#a4b0be" },
  inputBar: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
    paddingBottom: Platform.OS === "android" ? 25 : 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendBtn: {
    padding: 5,
  },
});
