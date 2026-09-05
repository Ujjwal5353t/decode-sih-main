import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "../context/LanguageContext";
import StudentHomeScreen from "../screens/student/HomeScreen";
import AssignmentsListScreen from "../screens/student/AssignmentsListScreen";
import AssignmentQuizScreen from "../screens/student/AssignmentQuizScreen";
import LearnListScreen from "../screens/student/LearnListScreen";
import LessonViewerScreen from "../screens/student/LessonViewerScreen";
import QuizScreen from "../screens/student/QuizScreen";
import ProgressScreen from "../screens/student/ProgressScreen";
import GapModuleScreen from "../screens/student/GapModuleScreen";
import GapQuizScreen from "../screens/student/GapQuizScreen";
import ProfileScreen from "../screens/shared/ProfileScreen";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const LearnStack = createNativeStackNavigator();
const ProgressStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={StudentHomeScreen} />
      <HomeStack.Screen name="AssignmentsList" component={AssignmentsListScreen} />
      <HomeStack.Screen name="AssignmentQuiz" component={AssignmentQuizScreen} />
    </HomeStack.Navigator>
  );
}

function LearnStackNavigator() {
  return (
    <LearnStack.Navigator screenOptions={{ headerShown: false }}>
      <LearnStack.Screen name="LearnList" component={LearnListScreen} />
      <LearnStack.Screen name="LessonViewer" component={LessonViewerScreen} />
    </LearnStack.Navigator>
  );
}

function ProgressStackNavigator() {
  return (
    <ProgressStack.Navigator screenOptions={{ headerShown: false }}>
      <ProgressStack.Screen name="ProgressMain" component={ProgressScreen} />
      <ProgressStack.Screen name="GapModule" component={GapModuleScreen} />
      <ProgressStack.Screen name="GapQuiz" component={GapQuizScreen} />
    </ProgressStack.Navigator>
  );
}

const ICONS = { HomeTab: "🏠", Learn: "📚", Quiz: "🎯", Progress: "📊", ProfileTab: "⚙️" };

export default function StudentTabs() {
  const { t } = useTranslation();
  const LABELS = {
    HomeTab: t("mobile.tabs.home"),
    Learn: t("mobile.tabs.learn"),
    Quiz: t("mobile.tabs.quiz"),
    Progress: t("mobile.tabs.progress"),
    ProfileTab: t("mobile.tabs.profile"),
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
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen name="Learn" component={LearnStackNavigator} />
      <Tab.Screen name="Quiz" component={QuizScreen} />
      <Tab.Screen name="Progress" component={ProgressStackNavigator} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
