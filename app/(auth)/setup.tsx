import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function SetupScreen() {
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const router = useRouter();

  const handleCompleteSetup = async () => {
    // Get user session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    // Age validation
    const userAge = parseInt(age);
    if (isNaN(userAge) || userAge < 16) {
      Alert.alert(
        "Access Denied",
        "You must be at least 16 years old to join Foodio.",
      );
      return;
    }

    if (!username.trim()) {
      Alert.alert("Error", "Please choose a username.");
      return;
    }

    // Save to profiles
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      username: username.trim(),
      age: userAge,
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/icons/my-background.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Semi-transparent overlay to make text pop */}
      <View style={styles.overlay}>
        <Text style={styles.title}>Almost there!</Text>
        <Text style={styles.subtitle}>
          Choose a username and tell us your age.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#636e72"
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          style={styles.input}
          placeholder="Age"
          placeholderTextColor="#636e72"
          value={age}
          keyboardType="numeric"
          onChangeText={setAge}
        />

        <TouchableOpacity style={styles.button} onPress={handleCompleteSetup}>
          <Text style={styles.buttonText}>Get Cooking!</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#824c21" },
  subtitle: {
    fontSize: 16,
    color: "#2d3436",
    marginBottom: 30,
    fontWeight: "500",
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#824c21",
    padding: 10,
    marginBottom: 20,
    fontSize: 18,
    color: "#000",
  },
  button: {
    backgroundColor: "#824c21",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
});
