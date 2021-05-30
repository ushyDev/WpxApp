import React from "react";
import { StyleSheet, View, ActivityIndicator, Dimensions } from "react-native";
import { Colors } from "../config";

const width = Dimensions.get("window").width;
const height = Dimensions.get("window").height;

export default function Indicator() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
});
