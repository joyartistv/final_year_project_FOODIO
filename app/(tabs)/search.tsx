import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

// List of cuisines for the filter row
const CUISINES = [
  "All",
  "Indian",
  "Italian",
  "Chinese",
  "Mexican",
  "Continental",
  "Thai",
  "Arabic",
];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"users" | "recipes">("users");
  const [dietFilter, setDietFilter] = useState<"all" | "veg" | "non-veg">(
    "all",
  );
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (
    query: string,
    diet = dietFilter,
    cuisine = selectedCuisine,
  ) => {
    setSearchQuery(query);

    // If searching users and query is empty, clear results
    if (query.trim().length === 0 && searchMode === "users") {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      if (searchMode === "users") {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .ilike("username", `%${query}%`)
          .limit(20);

        if (error) throw error;
        setResults(data || []);
      } else {
        // RECIPE SEARCH LOGIC
        let supabaseQuery = supabase
          .from("recipes")
          .select("*, profiles!user_id(username)");

        // 1. Text Search (Title/Category)
        if (query.trim().length > 0) {
          supabaseQuery = supabaseQuery.or(
            `title.ilike.%${query}%,category.ilike.%${query}%`,
          );
        }

        // 2. STRICT Diet Filter
        if (diet === "veg") {
          supabaseQuery = supabaseQuery.eq("is_veg", true);
        } else if (diet === "non-veg") {
          supabaseQuery = supabaseQuery.eq("is_veg", false);
        }

        // 3. Cuisine Filter
        if (cuisine !== "All") {
          supabaseQuery = supabaseQuery.ilike("cuisine", cuisine);
        }

        const { data, error } = await supabaseQuery
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;
        setResults(data || []);
      }
    } catch (err: any) {
      console.error("Search error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Re-run search whenever tabs or filters change
  useEffect(() => {
    handleSearch(searchQuery, dietFilter, selectedCuisine);
  }, [searchMode, dietFilter, selectedCuisine]);

  const renderItem = ({ item }: { item: any }) => {
    if (searchMode === "users") {
      return (
        <TouchableOpacity
          style={styles.userCard}
          onPress={() => router.push(`/profile/${item.id}`)}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.username?.[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>@{item.username}</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => router.push(`/recipes/${item.id}`)}
      >
        <Image source={{ uri: item.image_url }} style={styles.recipeThumb} />
        <View style={styles.recipeInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.recipeTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.cuisine && (
              <View style={styles.cuisineTag}>
                <Text style={styles.cuisineTagText}>{item.cuisine}</Text>
              </View>
            )}
          </View>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.dietBadge,
                { borderColor: item.is_veg ? "#27ae60" : "#e74c3c" },
              ]}
            >
              <Text
                style={{
                  color: item.is_veg ? "#27ae60" : "#e74c3c",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              >
                {item.is_veg ? "VEG" : "NON-VEG"}
              </Text>
            </View>
            <Text style={styles.recipeAuthor}>
              by @{item.profiles?.username}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Search Input */}
      <View style={styles.searchBarContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#824c21"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={
            searchMode === "users" ? "Search chefs..." : "Search recipes..."
          }
          value={searchQuery}
          onChangeText={(text) => handleSearch(text)}
          autoCapitalize="none"
        />
      </View>

      {/* Mode Tabs (Chefs / Recipes) */}
      <View style={styles.tabContainer}>
        {["users", "recipes"].map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.tab, searchMode === mode && styles.activeTab]}
            onPress={() => setSearchMode(mode as any)}
          >
            <Text
              style={[
                styles.tabText,
                searchMode === mode && styles.activeTabText,
              ]}
            >
              {mode === "users" ? "Chefs" : "Recipes"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recipe Filters */}
      {searchMode === "recipes" && (
        <View>
          {/* Diet Toggle */}
          <View style={styles.filterRow}>
            {["all", "veg", "non-veg"].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, dietFilter === f && styles.activeChip]}
                onPress={() => setDietFilter(f as any)}
              >
                {f !== "all" && (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: f === "veg" ? "#27ae60" : "#e74c3c" },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.chipText,
                    dietFilter === f && styles.activeChipText,
                  ]}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cuisine Horizontal Scroll */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CUISINES}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.cuisineList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.cuisineChip,
                  selectedCuisine === item && styles.activeCuisineChip,
                ]}
                onPress={() => setSelectedCuisine(item)}
              >
                <Text
                  style={[
                    styles.cuisineChipText,
                    selectedCuisine === item && styles.activeCuisineChipText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#f8ad04" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            searchQuery.length > 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f2f6",
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    height: 50,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: "#2d3436" },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#f1f2f6",
  },
  activeTab: { borderBottomColor: "#f8ad04" },
  tabText: { color: "#a4b0be", fontWeight: "bold" },
  activeTabText: { color: "#824c21" },
  filterRow: { flexDirection: "row", paddingHorizontal: 15, marginBottom: 12 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f1f2f6",
    marginRight: 10,
  },
  activeChip: {
    backgroundColor: "#fff2d5",
    borderColor: "#f8ad04",
    borderWidth: 1,
  },
  chipText: { fontSize: 13, color: "#636e72", fontWeight: "600" },
  activeChipText: { color: "#824c21" },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  cuisineList: { paddingHorizontal: 15, marginBottom: 15 },
  cuisineChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  activeCuisineChip: { backgroundColor: "#824c21", borderColor: "#824c21" },
  cuisineChipText: { fontSize: 13, color: "#636e72" },
  activeCuisineChipText: { color: "#fff", fontWeight: "bold" },
  list: { paddingHorizontal: 15 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#f8ad04",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  username: { flex: 1, fontSize: 16, fontWeight: "600", color: "#2d3436" },
  recipeCard: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f2f6",
  },
  recipeThumb: { width: 90, height: 90 },
  recipeInfo: { flex: 1, padding: 10, justifyContent: "center" },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recipeTitle: { fontSize: 15, fontWeight: "bold", color: "#2d3436", flex: 1 },
  cuisineTag: {
    backgroundColor: "#fdf2e9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 5,
  },
  cuisineTagText: { fontSize: 10, color: "#824c21", fontWeight: "bold" },
  badgeRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  dietBadge: {
    borderWidth: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
    marginRight: 8,
  },
  recipeAuthor: { fontSize: 12, color: "#a4b0be" },
  emptyContainer: { marginTop: 50, alignItems: "center" },
  emptyText: { color: "#a4b0be" },
});
