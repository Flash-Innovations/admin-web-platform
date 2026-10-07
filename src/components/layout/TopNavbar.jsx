import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  ChevronDown,
  ShieldCheck,
  Building2,
  BookOpen,
  LayoutDashboard,
  LogOut
} from "lucide-react";
import Avatar from "../common/Avatar";
import { useAuth } from "../../context/AuthContext";

export function TopNavbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search institutions, onboarding requests, global questions..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 hover:bg-slate-100 text-xs sm:text-sm rounded-xl border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right: Security Badge & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-xl text-xs font-semibold text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Root Security Guard</span>
        </div>

        {/* User Menu Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Avatar
              src={user?.avatar}
              name={user?.name || "Super Admin"}
              isCollege={false}
              size="sm"
              className="border border-slate-200 shrink-0"
            />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "Platform SuperAdmin"}</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">{user?.email || "superadmin@sips.edu"}</p>
                <span className="mt-1 inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  SuperAdmin Root
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    navigate("/super-admin/dashboard");
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-semibold text-indigo-600"
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                  Platform Overview
                </button>
                <button
                  onClick={() => {
                    navigate("/super-admin/approvals");
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-slate-400" />
                  College Approvals
                </button>
                <button
                  onClick={() => {
                    navigate("/super-admin/questions");
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  Global Question Bank
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
