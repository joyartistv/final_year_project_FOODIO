import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { supabase } from "../lib/supabase";

export default function SaveButton({ recipeId }: { recipeId: string }) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkIfSaved();
  }, [recipeId]);

  const checkIfSaved = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("saved_recipes")
        .select("*")
        .eq("user_id", user.id)
        .eq("recipe_id", recipeId)
        .maybeSingle(); // maybeSingle handles 0 results without throwing an error

      if (data) setIsSaved(true);
    } catch (err) {
      console.error("Check saved error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert("Authentication", "Please log in to save recipes!");
      return;
    }

    // Optimistic UI update
    const wasSaved = isSaved;
    setIsSaved(!wasSaved);

    if (wasSaved) {
      // DELETE Logic
      const { error } = await supabase
        .from("saved_recipes")
        .delete()
        .eq("user_id", user.id)
        .eq("recipe_id", recipeId);

      if (error) {
        console.error("Unsave Error:", error.message);
        setIsSaved(true); // Revert UI
      }
    } else {
      // INSERT Logic
      const { error } = await supabase.from("saved_recipes").insert([
        {
          user_id: user.id,
          recipe_id: recipeId,
        },
      ]);

      if (error) {
        console.error("Save Error:", error.message);
        setIsSaved(false); // Revert UI
        Alert.alert("Error", "Could not save recipe: " + error.message);
      }
    }
  };

  if (loading) return <ActivityIndicator size="small" color="#f8ad04" />;

  return (
    <TouchableOpacity onPress={toggleSave}>
      <Ionicons
        name={isSaved ? "bookmark" : "bookmark-outline"}
        size={28}
        color={isSaved ? "#f8ad04" : "#ccc"}
      />
    </TouchableOpacity>
  );
}
