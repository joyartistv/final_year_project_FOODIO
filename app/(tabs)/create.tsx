import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Camera } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

const CUISINES = [
  "Indian",
  "Mexican",
  "Italian",
  "Chinese",
  "Continental",
  "American",
  "Thai",
  "Others",
];

export default function CreateRecipe() {
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [isVeg, setIsVeg] = useState<boolean>(true);
  const [cuisine, setCuisine] = useState("Indian");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Please allow access to your photos.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      const filePath = `recipes/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(filePath, decode(base64), {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error("Failed to upload image to storage.");
    }
  };

  const resetForm = () => {
    setImage(null);
    setTitle("");
    setDescription("");
    setIngredients("");
    setInstructions("");
    setPrepTime("");
    setCookTime("");
    setIsVeg(true);
    setCuisine("Indian");
  };

  async function handlePost() {
    if (
      !image ||
      !title.trim() ||
      !ingredients.trim() ||
      !instructions.trim()
    ) {
      return Alert.alert("Missing Info", "Please fill all required fields.");
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to post.");

      const publicImageUrl = await uploadImage(image);
      const ingredientsArray = ingredients
        .split(",")
        .map((i) => i.trim())
        .filter((i) => i !== "");

      const { error } = await supabase.from("recipes").insert([
        {
          title: title.trim(),
          description: description.trim(),
          instructions: instructions.trim(),
          ingredients: ingredientsArray,
          prep_time: parseInt(prepTime) || 0,
          cook_time: parseInt(cookTime) || 0,
          image_url: publicImageUrl,
          user_id: user.id,
          is_veg: isVeg,
          cuisine: cuisine,
        },
      ]);

      if (error) throw error;

      Alert.alert("Success!", "Your recipe has been posted!");
      resetForm();
      router.push("/");
    } catch (err: any) {
      Alert.alert("Post Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.header}>New Recipe</Text>

          <TouchableOpacity style={styles.imageBox} onPress={pickMedia}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderInner}>
                <Camera color="#824c21" size={32} />
                <Text style={styles.imageText}>Add recipe photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.label}>Dietary Preference</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.dietBtn, isVeg && styles.vegActive]}
                onPress={() => setIsVeg(true)}
              >
                <View style={[styles.vegSquare, { borderColor: "green" }]}>
                  <View
                    style={[styles.vegCircle, { backgroundColor: "green" }]}
                  />
                </View>
                <Text style={[styles.dietText, isVeg && { color: "green" }]}>
                  Veg
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dietBtn, !isVeg && styles.nonVegActive]}
                onPress={() => setIsVeg(false)}
              >
                <View style={[styles.vegSquare, { borderColor: "red" }]}>
                  <View
                    style={[styles.vegCircle, { backgroundColor: "red" }]}
                  />
                </View>
                <Text style={[styles.dietText, !isVeg && { color: "red" }]}>
                  Non-Veg
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Cuisine Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.cuisineScroll}
            >
              {CUISINES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.cuisineChip,
                    cuisine === item && styles.activeChip,
                  ]}
                  onPress={() => setCuisine(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      cuisine === item && styles.activeChipText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Recipe Title"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={styles.input}
            placeholder="Brief Description"
            value={description}
            onChangeText={setDescription}
          />

          <TextInput
            style={styles.input}
            placeholder="Ingredients (comma separated)"
            value={ingredients}
            onChangeText={setIngredients}
          />

          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Instructions"
            value={instructions}
            multiline
            onChangeText={setInstructions}
            textAlignVertical="top"
          />

          <View style={styles.timeRow}>
            <TextInput
              style={[styles.input, { width: "48%" }]}
              placeholder="Prep (mins)"
              value={prepTime}
              keyboardType="numeric"
              onChangeText={setPrepTime}
            />
            <TextInput
              style={[styles.input, { width: "48%" }]}
              placeholder="Cook (mins)"
              value={cookTime}
              keyboardType="numeric"
              onChangeText={setCookTime}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handlePost}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Post Recipe</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={resetForm} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear All Fields</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 20 },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2d3436",
  },
  section: { marginBottom: 20 },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#2d3436",
  },
  imageBox: {
    height: 180,
    backgroundColor: "#f1f2f6",
    borderRadius: 15,
    marginBottom: 20,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e2e6",
    borderStyle: "dashed",
  },
  previewImage: { width: "100%", height: "100%" },
  placeholderInner: { alignItems: "center" },
  imageText: { color: "#824c21", marginTop: 8, fontWeight: "600" },
  toggleRow: { flexDirection: "row", gap: 12 },
  dietBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#f9f9f9",
  },
  vegActive: { borderColor: "green", backgroundColor: "#e6ffed" },
  nonVegActive: { borderColor: "red", backgroundColor: "#fff5f5" },
  dietText: { marginLeft: 8, fontWeight: "bold", color: "#636e72" },
  vegSquare: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 2,
  },
  vegCircle: { width: 8, height: 8, borderRadius: 4 },
  cuisineScroll: { flexDirection: "row" },
  cuisineChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f2f6",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#f1f2f6",
  },
  activeChip: { backgroundColor: "#824c21", borderColor: "#824c21" },
  chipText: { color: "#636e72", fontWeight: "500" },
  activeChipText: { color: "#fff" },
  input: {
    backgroundColor: "#f1f2f6",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: "#2d3436",
  },
  timeRow: { flexDirection: "row", justifyContent: "space-between" },
  button: {
    backgroundColor: "#824c21",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  clearButton: { marginTop: 20, alignItems: "center", paddingBottom: 40 },
  clearButtonText: { color: "#a4b0be", fontSize: 14 },
});
