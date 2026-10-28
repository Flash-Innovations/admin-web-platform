import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  ChevronDown,
  ShieldCheck,
  Building2,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Trophy,
  MessageSquare,
  FileText,
  Plus,
  ArrowRight,
  X,
  CreditCard
} from "lucide-react";
import Avatar from "../common/Avatar";
import { useAuth } from "../../context/AuthContext";

export function TopNavbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Global Command Palette & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Quick navigation items & actions index
  const searchIndex = useMemo(
    () => [
      {
        id: "dash",
        title: "Platform Overview & Pulse",
        category: "Navigation",
        icon: LayoutDashboard,
        path: "/super-admin/dashboard"
      },
      {
        id: "contests",
        title: "Global Contests & Assessments",
        category: "Navigation",
        icon: Trophy,
        path: "/super-admin/contests"
      },
      {
        id: "new-contest",
        title: "Launch Global Contest",
        category: "Quick Action",
        icon: Plus,
        path: "/super-admin/contests?action=new"
      },
      {
        id: "gd",
        title: "GD Arena (Peer Discussions)",
        category: "Navigation",
        icon: MessageSquare,
        path: "/super-admin/gd"
      },
      {
        id: "new-gd",
        title: "Schedule Official GD Session",
        category: "Quick Action",
        icon: Plus,
        path: "/super-admin/gd?action=new"
      },
      {
        id: "questions",
        title: "Universal Question Bank",
        category: "Navigation",
        icon: BookOpen,
        path: "/super-admin/questions"
      },
      {
        id: "new-question",
        title: "Add New Question to Bank",
        category: "Quick Action",
        icon: Plus,
        path: "/super-admin/questions?action=new"
      },
      {
        id: "rep-self",
        title: "Financial Ledger & GST Reports",
        category: "4-Pillar Reports",
        icon: CreditCard,
        path: "/super-admin/reports?tab=self"
      },
      {
        id: "rep-inv",
        title: "Investor Metrics Pitch Deck",
        category: "4-Pillar Reports",
        icon: FileText,
        path: "/super-admin/reports?tab=investor"
      },
      {
        id: "rep-col",
        title: "College Partnerships & Readiness",
        category: "4-Pillar Reports",
        icon: Building2,
        path: "/super-admin/reports?tab=college"
      },
      {
        id: "rep-brand",
        title: "Brand Collaborations Fact Sheet",
        category: "4-Pillar Reports",
        icon: FileText,
        path: "/super-admin/reports?tab=brand"
      }
    ],
    []
  );

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return searchIndex.slice(0, 6);
    const q = searchQuery.toLowerCase().trim();
    return searchIndex.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [searchQuery, searchIndex]);

  const handleSelectResult = (path) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Functional Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg" ref={searchContainerRef}>
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
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search modules, questions, contests, reports..."
            className="w-full pl-9 pr-14 py-1.5 bg-slate-100/80 hover:bg-slate-100 text-xs sm:text-sm rounded-xl border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 rounded">
              ⌘K
            </kbd>
          </div>

          {/* Search Dropdown Results */}
          {searchOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-96 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>{searchQuery ? "Matching Results" : "Quick Navigation"}</span>
                <span className="text-[10px] font-normal text-slate-400">Esc to close</span>
              </div>

              <div className="space-y-0.5 px-1.5">
                {filteredResults.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectResult(item.path)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-indigo-50/70 hover:text-indigo-900 flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 group-hover:text-indigo-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-400 group-hover:text-indigo-600/80">
                            {item.category}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}

                {searchQuery && (
                  <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                    <button
                      onClick={() => handleSelectResult(`/super-admin/questions?search=${encodeURIComponent(searchQuery)}`)}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-indigo-600 hover:bg-indigo-50 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Search Question Bank for &ldquo;{searchQuery}&rdquo;
                    </button>
                    <button
                      onClick={() => handleSelectResult(`/super-admin/contests?search=${encodeURIComponent(searchQuery)}`)}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-indigo-600 hover:bg-indigo-50 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Search Contests for &ldquo;{searchQuery}&rdquo;
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
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
                <p className="text-[11px] text-slate-400 font-mono truncate">{user?.email || "admin@flashedu.in"}</p>
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
                    navigate("/super-admin/reports?tab=college");
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-slate-400" />
                  College Partnerships
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
