import {
    Bookmark,
    Heart,
    MessageCircle,
    MoreHorizontal,
} from "lucide-react-native";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const RecipePost = ({ username, dishName, imageUri, description }: any) => {
  const [liked, setLiked] = useState(false);

  return (
    <View style={styles.card}>
      {/* 1. Header */}
      <View style={styles.header}>
        <Text style={styles.username}>{username || "Chef"}</Text>
        <MoreHorizontal color="#2f3542" size={20} />
      </View>

      {/* 2. Image */}
      <Image
        source={{ uri: imageUri || "https://via.placeholder.com/400" }}
        style={styles.image}
      />

      {/* 3. Interaction Bar */}
      <View style={styles.iconRow}>
        <View style={styles.leftIcons}>
          <TouchableOpacity onPress={() => setLiked(!liked)}>
            <Heart
              color={liked ? "#ff4757" : "#2f3542"}
              fill={liked ? "#ff4757" : "none"}
              size={24}
            />
          </TouchableOpacity>
          <MessageCircle color="#2f3542" size={24} style={styles.iconSpacer} />
        </View>
        <Bookmark color="#2f3542" size={24} />
      </View>

      {/* 4. Text Content */}
      <View style={styles.details}>
        <Text style={styles.title}>{dishName}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {description}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    alignItems: "center",
  },
  username: { fontWeight: "bold" },
  image: { width: "100%", height: 350, backgroundColor: "#f1f2f6" },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  leftIcons: { flexDirection: "row" },
  iconSpacer: { marginLeft: 15 },
  details: { paddingHorizontal: 12, paddingBottom: 15 },
  title: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  desc: { color: "#57606f" },
});

export default RecipePost;
