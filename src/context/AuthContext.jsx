import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("sips_token");
    const savedUser = localStorage.getItem("sips_auth_user");
    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.role === "super_admin" || parsed?.isSuperAdmin) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved auth user:", e);
      }
    }
    return null;
  });

  const [role, setRole] = useState(() => user?.role || null);

  useEffect(() => {
    if (user && localStorage.getItem("sips_token")) {
      localStorage.setItem("sips_auth_user", JSON.stringify(user));
      setRole("super_admin");
    } else {
      localStorage.removeItem("sips_auth_user");
      setRole(null);
    }
  }, [user]);

  /**
   * Helper to process authenticated SuperAdmin login
   */
  const applyLoginResponse = (data, identifier = "") => {
    if (!data || !data.token) {
      throw new Error(data?.message || "Authentication failed");
    }

    const isSuperAdmin = Boolean(
      data.role === "SUPERADMIN" ||
      data.role === "SUPER_ADMIN" ||
      data.isSuperAdmin ||
      data.user?.isSuperAdmin ||
      data.user?.role === "SUPERADMIN" ||
      data.user?.role === "SUPER_ADMIN"
    );

    if (!isSuperAdmin) {
      throw new Error("Access Denied: This portal is strictly reserved for Platform Super Administrators.");
    }

    localStorage.setItem("sips_token", data.token);

    const userData = {
      id: data.userId || "super_admin_root",
      name: data.name || data.user?.name || "System Super Administrator",
      email: data.email || data.user?.email || (identifier.includes("@") ? identifier : "superadmin@sips.edu"),
      username: data.username || data.user?.username || "superadmin",
      role: "super_admin",
      backendRole: data.role || "SUPERADMIN",
      isSuperAdmin: true,
      avatar: data.avatar || null,
      status: "Active"
    };

    localStorage.setItem("sips_auth_user", JSON.stringify(userData));
    setUser(userData);
    setRole("super_admin");

    return { user: userData, role: "super_admin" };
  };

  /**
   * SuperAdmin Login
   */
  const login = async (identifier, password) => {
    let data;
    try {
      data = await authService.institutionLogin(identifier, password);
    } catch (e) {
      // Fallback to general login endpoint
      data = await authService.login(identifier, password);
    }
    return applyLoginResponse(data, identifier);
  };

  /**
   * Change password
   */
  const changePassword = async (currentPassword, newPassword) => {
    const res = await authService.changePassword(currentPassword, newPassword);
    updateUser({ needsPasswordReset: false });
    return res;
  };

  /**
   * Update user details in memory and storage
   */
  const updateUser = (fields) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...fields };
      localStorage.setItem("sips_auth_user", JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem("sips_token");
    localStorage.removeItem("sips_auth_user");
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: "super_admin",
        isAuthenticated: !!user && !!localStorage.getItem("sips_token"),
        login,
        changePassword,
        updateUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
