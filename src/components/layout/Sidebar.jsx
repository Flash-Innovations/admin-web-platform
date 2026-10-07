import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import Avatar from "../common/Avatar";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";

export function Sidebar({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const adminLinks = [
    { to: "/super-admin/dashboard", label: "Platform Overview", icon: LayoutDashboard },
    { to: "/super-admin/approvals", label: "College Approvals", icon: Building2, badge: "Review" },
    { to: "/super-admin/institutions", label: "Institutions Directory", icon: Users },
    { to: "/super-admin/questions", label: "Global Question Bank", icon: BookOpen, badge: "Global" }
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 ease-in-out select-none",
          isCollapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800 bg-slate-950/60">
          <div
            onClick={() => navigate("/super-admin/dashboard")}
            className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
          >
            {isCollapsed ? (
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold mx-auto shadow-md shadow-indigo-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black tracking-wider uppercase text-white truncate flex items-center gap-1.5">
                    SIPS Admin
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Root
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    Platform SuperAdmin
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto no-scrollbar">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Governance & Operations
            </div>
          )}

          {adminLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                    isActive
                      ? "bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30 shadow-xs"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        "w-5 h-5 shrink-0 transition-colors",
                        isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1">{link.label}</span>
                    )}
                    {!isCollapsed && link.badge && (
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                          isActive
                            ? "bg-indigo-500/30 text-indigo-200 border border-indigo-500/40"
                            : "bg-slate-800 text-slate-400"
                        )}
                      >
                        {link.badge}
                      </span>
                    )}

                    {/* Collapsed Tooltip */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-950 text-white text-xs font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap border border-slate-800">
                        {link.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* SuperAdmin User Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <div
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl transition-all",
              !isCollapsed && "hover:bg-slate-800/60"
            )}
          >
            <Avatar
              src={user?.avatar}
              name={user?.name || "Super Admin"}
              isCollege={false}
              size="sm"
              className="border border-slate-700 shrink-0"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {user?.name || "Platform SuperAdmin"}
                </p>
                <p className="text-[11px] text-slate-400 truncate font-mono">
                  {user?.email || "superadmin@sips.edu"}
                </p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
