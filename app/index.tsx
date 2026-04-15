import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

const SPLASH_IMAGES = [
  "https://blog.inivie.com/wp-content/uploads/2025/05/traditional-food-of-india.jpg",
  "https://t4.ftcdn.net/jpg/02/84/46/89/360_F_284468940_1bg6BwgOfjCnE3W0wkMVMVqddJgtMynE.jpg",
  "https://i.pinimg.com/236x/42/05/33/420533ff94414f8294c4dc6fbef447be.jpg",
];

export default function SplashScreen() {
  const router = useRouter();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [loadingFinished, setLoadingFinished] = useState(false);

  const isMounted = useRef(false);

  // Animation Values
  const imageFade = useRef(new Animated.Value(1)).current;
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    isMounted.current = true;

    // RAPID-FIRE SLIDESHOW
    const imageInterval = setInterval(() => {
      if (!loadingFinished) {
        Animated.timing(imageFade, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setCurrentImgIndex((prev) => (prev + 1) % SPLASH_IMAGES.length);
          Animated.timing(imageFade, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }).start();
        });
      }
    }, 600);

    const checkUserAndTransition = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Show rapid food for 3.5 seconds
      setTimeout(() => {
        if (!isMounted.current) return;

        setLoadingFinished(true);
        clearInterval(imageInterval);

        // Logo Reveal Animation
        Animated.parallel([
          Animated.timing(logoFade, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            friction: 4,
            tension: 50,
            useNativeDriver: true,
          }),
        ]).start(() => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(textPulse, {
                toValue: 1.05, // Subtle pulse
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(textPulse, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
            ]),
          ).start();
        });

        // Redirect after logo display
        setTimeout(() => {
          if (isMounted.current) {
            requestAnimationFrame(() => {
              if (session) {
                router.replace("/(tabs)");
              } else {
                router.replace("/welcome");
              }
            });
          }
        }, 4000); // Reduced total time slightly for better UX
      }, 3000);
    };

    checkUserAndTransition();

    return () => {
      isMounted.current = false;
      clearInterval(imageInterval);
    };
  }, [loadingFinished]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {!loadingFinished ? (
        <Animated.View style={[styles.imageContainer, { opacity: imageFade }]}>
          <Image
            source={{ uri: SPLASH_IMAGES[currentImgIndex] }}
            style={styles.splashImage}
          />
        </Animated.View>
      ) : (
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: logoFade, transform: [{ scale: logoScale }] },
          ]}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🍳</Text>
          </View>

          <Animated.Text
            style={[styles.logoText, { transform: [{ scale: textPulse }] }]}
          >
            Foodio
          </Animated.Text>

          <Text style={styles.caption}>"The chef is always right"</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8ad04",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: 220, // Scaled down for better fit
    height: 220,
    borderRadius: 110,
    borderWidth: 6,
    borderColor: "#fff",
    overflow: "hidden",
    elevation: 15,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  splashImage: {
    width: "100%",
    height: "100%",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoCircle: {
    width: 100, // Compact circle
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 45, // Scaled emoji
  },
  logoText: {
    fontSize: 42, // Clean, readable size
    fontWeight: "900",
    color: "#824c21",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  caption: {
    fontSize: 16, // Professional caption size
    fontStyle: "italic",
    color: "#824c21",
    marginTop: 10,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
