import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
    Dimensions,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background Image - Using a high-quality cooking visual */}
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
        }}
        style={styles.background}
      >
        {/* Dark overlay to make text pop */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🍳</Text>
            </View>

            <Text style={styles.title}>Welcome to Foodio</Text>
            <Text style={styles.tagline}>
              Master your kitchen with the world's best recipes.
            </Text>
            <Text style={styles.quote}>"The chef is always right"</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.getStartedBtn}
                onPress={() => router.push("/signup")} // Or your signup path
              >
                <Text style={styles.btnText}>Get Started</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => router.push("/login")}
              >
                <Text style={styles.loginText}>
                  Already have an account?{" "}
                  <Text style={styles.loginLink}>Log In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { width: width, height: height },
  gradient: { flex: 1, justifyContent: "flex-end", paddingBottom: 50 },
  content: { paddingHorizontal: 30, alignItems: "center" },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logoEmoji: { fontSize: 40 },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
  },
  tagline: {
    fontSize: 18,
    color: "#eee",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 24,
  },
  quote: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#f8ad04",
    marginTop: 15,
    fontWeight: "600",
  },
  buttonContainer: { width: "100%", marginTop: 40 },
  getStartedBtn: {
    backgroundColor: "#f8ad04",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  btnText: { color: "#824c21", fontSize: 18, fontWeight: "bold" },
  loginBtn: { marginTop: 20, alignItems: "center" },
  loginText: { color: "#fff", fontSize: 14 },
  loginLink: {
    color: "#f8ad04",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
