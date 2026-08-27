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
      if (currentRole === "student") {
        const profile = await getStudentProfile();
        setUser(profile);
      } else if (currentRole === "school") {
        const profile = await getSchoolProfile();
        setUser(profile);
      } else if (currentRole === "parent") {
        const profile = await getParentProfile();
        setUser(profile);
      } else if (currentRole === "admin") {
        const profile = await getAdminProfile();
        setUser(profile);
      } else if (currentRole === "teacher") {
        const profile = await getTeacherProfile();
        setUser(profile);
      }
    } catch (err: any) {
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
      const storedToken = getStoredToken();
      const storedRole = getStoredRole();

      if (storedToken && storedRole) {
        setToken(storedToken);
        setRole(storedRole);
        await fetchProfileForRole(storedRole);
      }
      setLoading(false);
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
