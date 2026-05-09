import { useEffect } from "react";
import { View, ImageBackground, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function Index() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/screens/LoginScreen");
    }, 700); // 0.7 seconds = 700 milliseconds

    // Cleanup the timer if the component unmounts
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <ImageBackground 
      source={require('../assets/images/main-bg.png')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }
      ]}>
        <View style={styles.content}>
          {/* Your content will go here */}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  }
});