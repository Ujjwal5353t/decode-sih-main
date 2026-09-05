import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/Screen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import StudentTabs from "./StudentTabs";
import TeacherTabs from "./TeacherTabs";
import ParentTabs from "./ParentTabs";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, role, loading } = useAuth();

  if (loading) return <LoadingScreen label="Loading VidyaSetu…" />;

  if (!user || !role) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  const RoleTabs = role === "teacher" ? TeacherTabs : role === "parent" ? ParentTabs : StudentTabs;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoleTabs" component={RoleTabs} />
    </Stack.Navigator>
  );
}
