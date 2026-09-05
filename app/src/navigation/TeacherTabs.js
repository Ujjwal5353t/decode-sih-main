import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TeacherHomeScreen from "../screens/teacher/HomeScreen";
import ClassesListScreen from "../screens/teacher/ClassesListScreen";
import ClassDetailScreen from "../screens/teacher/ClassDetailScreen";
import AssignmentsScreen from "../screens/teacher/AssignmentsScreen";
import ProfileScreen from "../screens/shared/ProfileScreen";
import { useTranslation } from "../context/LanguageContext";

const Tab = createBottomTabNavigator();
const ClassesStack = createNativeStackNavigator();

function ClassesStackNavigator() {
  return (
    <ClassesStack.Navigator screenOptions={{ headerShown: false }}>
      <ClassesStack.Screen name="ClassesList" component={ClassesListScreen} />
      <ClassesStack.Screen name="ClassDetail" component={ClassDetailScreen} />
    </ClassesStack.Navigator>
  );
}

const ICONS = { HomeTab: "🏠", ClassesTab: "🏫", AssignmentsTab: "📝", ProfileTab: "⚙️" };

export default function TeacherTabs() {
  const { t } = useTranslation();
  const LABELS = {
    HomeTab: t("teacherDashboard.mobile.tabs.home"),
    ClassesTab: t("teacherDashboard.mobile.tabs.classes"),
    AssignmentsTab: t("teacherDashboard.mobile.tabs.assignments"),
    ProfileTab: t("teacherDashboard.mobile.tabs.profile"),
  };
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
      <Tab.Screen name="HomeTab" component={TeacherHomeScreen} />
      <Tab.Screen name="ClassesTab" component={ClassesStackNavigator} />
      <Tab.Screen name="AssignmentsTab" component={AssignmentsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
