import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ParentHomeScreen from "../screens/parent/HomeScreen";
import ChildDetailScreen from "../screens/parent/ChildDetailScreen";
import ProfileScreen from "../screens/shared/ProfileScreen";
import { useTranslation } from "../context/LanguageContext";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="ChildrenList" component={ParentHomeScreen} />
      <HomeStack.Screen name="ChildDetail" component={ChildDetailScreen} />
    </HomeStack.Navigator>
  );
}

const ICONS = { HomeTab: "👪", ProfileTab: "⚙️" };

export default function ParentTabs() {
  const { t } = useTranslation();
  const LABELS = { HomeTab: t("mobile.parentHome.childrenTab"), ProfileTab: t("mobile.parentHome.profileTab") };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#0284C7",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarLabel: LABELS[route.name],
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>,
        tabBarStyle: { borderTopColor: "#E2E8F0" },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
