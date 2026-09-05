import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  getStoredToken,
  getStoredRole,
  setStoredAuth,
  clearStoredAuth,
} from "../api/client";
import {
  loginStudent,
  loginTeacher,
  loginParent,
  registerStudent,
  registerTeacher,
  registerParent,
  getStudentProfile,
  getTeacherProfile,
  getParentProfile,
  setupStudentClass as setupStudentClassApi,
} from "../api/auth";
import { readCache, writeCache } from "../offline/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfileForRole = useCallback(async (currentRole) => {
    try {
      let profile = null;
      if (currentRole === "student") profile = await getStudentProfile();
      else if (currentRole === "teacher") profile = await getTeacherProfile();
      else if (currentRole === "parent") profile = await getParentProfile();
      setUser(profile);
      if (profile) void writeCache(`profile:${currentRole}`, profile);
    } catch (err) {
      // Only a real rejection from the server invalidates the session — a
      // request that never landed (offline, server unreachable) must not
      // sign the learner out, since offline learning depends on the
      // session surviving a dead network.
      const rejectedByServer = err?.status === 401 || err?.status === 403;
      if (!rejectedByServer) {
        const cached = await readCache(`profile:${currentRole}`);
        if (cached) {
          setUser(cached);
          return;
        }
      }
      await clearStoredAuth();
      setUser(null);
      setRole(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [storedToken, storedRole] = await Promise.all([getStoredToken(), getStoredRole()]);
        if (storedToken && storedRole) {
          setRole(storedRole);
          await fetchProfileForRole(storedRole);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchProfileForRole]);

  const login = async (loginRole, data) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (loginRole === "student") res = await loginStudent(data);
      else if (loginRole === "teacher") res = await loginTeacher(data);
      else if (loginRole === "parent") res = await loginParent(data);
      if (res) {
        setRole(loginRole);
        await fetchProfileForRole(loginRole);
      }
    } catch (err) {
      setError(err.message || "Failed to log in.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (regRole, data) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (regRole === "student") res = await registerStudent(data);
      else if (regRole === "teacher") res = await registerTeacher(data);
      else if (regRole === "parent") res = await registerParent(data);
      if (res) {
        setRole(regRole);
        await fetchProfileForRole(regRole);
      }
    } catch (err) {
      setError(err.message || "Failed to register.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setupClass = async (data) => {
    if (role !== "student") return;
    const updated = await setupStudentClassApi(data);
    setUser(updated);
  };

  const logout = async () => {
    await clearStoredAuth();
    setUser(null);
    setRole(null);
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{ user, role, loading, error, login, register, logout, setupClass, clearError, refreshProfile: () => role && fetchProfileForRole(role) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
