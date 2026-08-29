"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  Role,
  StudentProfile,
  SchoolProfile,
  ParentProfile,
  AdminProfile,
  TeacherProfile,
  getStoredToken,
  getStoredRole,
  clearStoredAuth,
  loginStudent,
  loginSchool,
  loginParent,
  loginAdmin,
  loginTeacher,
  loginWithOTP,
  registerStudent,
  registerSchool,
  registerParent,
  registerTeacher,
  getStudentProfile,
  getSchoolProfile,
  getParentProfile,
  getAdminProfile,
  getTeacherProfile,
  setupStudentClass as setupStudentClassApi,
} from "@/lib/api";
import { readCache, writeCache } from "@/lib/offline/db";

type UserProfile = StudentProfile | SchoolProfile | ParentProfile | AdminProfile | TeacherProfile | null;

interface AuthContextType {
  user: UserProfile;
  role: Role | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (role: Role, data: any) => Promise<void>;
  loginOTP: (role: Role, phone_number: string, otp_code: string, branch_name?: string) => Promise<void>;
  register: (role: Role, data: any) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  setupClass: (data: { class_number: number; section: string }) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileForRole = useCallback(async (currentRole: Role) => {
    try {
      let profile: UserProfile = null;
      if (currentRole === "student") {
        profile = await getStudentProfile();
      } else if (currentRole === "school") {
        profile = await getSchoolProfile();
      } else if (currentRole === "parent") {
        profile = await getParentProfile();
      } else if (currentRole === "admin") {
        profile = await getAdminProfile();
      } else if (currentRole === "teacher") {
        profile = await getTeacherProfile();
      }
      setUser(profile);
      // Kept so an offline-first session can resume without a round trip.
      if (profile) void writeCache(`profile:${currentRole}`, profile);
    } catch (err: any) {
      // Only an actual rejection by the server means the session is invalid.
      // A request that never got there (offline, server down) must not sign
      // the learner out — offline learning depends on the session surviving
      // a dead network.
      const rejectedByServer = err?.status === 401 || err?.status === 403;
      if (!rejectedByServer) {
        const cached = await readCache<UserProfile>(`profile:${currentRole}`);
        if (cached) {
          setUser(cached);
          return;
        }
      }
      console.error("Failed to fetch user profile:", err);
      // Clear invalid session
      clearStoredAuth();
      setUser(null);
      setRole(null);
      setToken(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const activeRole = getStoredRole();
    if (activeRole) {
      await fetchProfileForRole(activeRole);
    }
  }, [fetchProfileForRole]);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const storedToken = getStoredToken();
        const storedRole = getStoredRole();

        if (storedToken && storedRole) {
          setToken(storedToken);
          setRole(storedRole);
          await fetchProfileForRole(storedRole);
        }
      } catch (e) {
        console.error("Auth initialization error:", e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [fetchProfileForRole]);

  const login = async (loginRole: Role, data: any) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (loginRole === "student") {
        res = await loginStudent(data);
      } else if (loginRole === "school") {
        res = await loginSchool(data);
      } else if (loginRole === "parent") {
        res = await loginParent(data);
      } else if (loginRole === "admin") {
        res = await loginAdmin(data);
      } else if (loginRole === "teacher") {
        res = await loginTeacher(data);
      }
      if (res) {
        setToken(res.access_token);
        setRole(loginRole);
        await fetchProfileForRole(loginRole);
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginOTP = async (
    loginRole: Role,
    phone_number: string,
    otp_code: string,
    branch_name?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithOTP({
        phone_number,
        otp_code,
        role: loginRole,
        branch_name,
      });
      if (res) {
        setToken(res.access_token);
        setRole(loginRole);
        await fetchProfileForRole(loginRole);
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in with OTP.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (regRole: Role, data: any) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (regRole === "student") {
        res = await registerStudent(data);
      } else if (regRole === "school") {
        res = await registerSchool(data);
      } else if (regRole === "parent") {
        res = await registerParent(data);
      } else if (regRole === "teacher") {
        res = await registerTeacher(data);
      }
      if (res) {
        setToken(res.access_token);
        setRole(regRole);
        await fetchProfileForRole(regRole);
      }
    } catch (err: any) {
      setError(err.message || "Failed to register.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setupClass = async (data: { class_number: number; section: string }) => {
    if (role !== "student") return;
    setLoading(true);
    try {
      const updated = await setupStudentClassApi(data);
      setUser(updated);
    } catch (err: any) {
      setError(err.message || "Failed to setup class.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
    setRole(null);
    setToken(null);
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        loading,
        error,
        login,
        loginOTP,
        register,
        logout,
        refreshProfile,
        setupClass,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
