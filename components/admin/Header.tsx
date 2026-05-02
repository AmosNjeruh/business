// Business Suite – Admin Header
// Mirrors frontend/components/vendor/Header pattern with full light/dark support

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FaBars,
  FaBell,
  FaChevronDown,
  FaSignOutAlt,
  FaCog,
  FaUser,
  FaSun,
  FaMoon,
  FaCode,
  FaBuilding,
  FaTimes,
  FaSearch,
  FaArrowRight,
  FaBullhorn,
  FaFileAlt,
  FaChartBar,
  FaWallet,
  FaUsers,
  FaEnvelope,
  FaRobot,
} from "react-icons/fa";
import { getCurrentUser, logout } from "@/services/auth";
import { useTheme } from "@/contexts/ThemeContext";
import { useBrand } from "@/contexts/BrandContext";
import { useBusinessAssistant } from "@/contexts/BusinessAssistantContext";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  getVendorProfile,
} from "@/services/vendor";
import toast from "react-hot-toast";

interface HeaderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { brands, selectedBrand, setSelectedBrand, isLoading: brandsLoading } = useBrand();
  const [vendorPremium, setVendorPremium] = useState(false);
  const {
    aiAssistantOpen,
    setAiAssistantOpen,
    resetAssistantSession,
  } = useBusinessAssistant();
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBrandMenu, setShowBrandMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // If the user was added to a new vendor/team (e.g. hired as an agent),
  // surface a prompt and refresh/select the new brand automatically.
  useEffect(() => {
    const u = getCurrentUser();
    if (!u?.id) return;
    if (!brands || brands.length === 0) return;

    const storageKey = `t360:business:knownBrandIds:${u.id}`;
    const prevRaw = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    const prev = new Set<string>(
      (prevRaw ? prevRaw.split(",") : []).map((x) => x.trim()).filter(Boolean)
    );

    const current = brands.map((b: any) => String(b.id || "")).filter(Boolean);
    const newOnes = current.filter((id) => !prev.has(id));

    // Persist current set immediately so we don't re-toast on re-render.
    try {
      window.localStorage.setItem(storageKey, current.join(","));
    } catch {
      // ignore
    }

    if (newOnes.length === 0) return;

    // Prefer a newly-added staff brand (non-owner) if available.
    const picked =
      brands.find((b: any) => newOnes.includes(String(b.id)) && (b as any).isOwner === false) ||
      brands.find((b: any) => newOnes.includes(String(b.id)));

    if (picked) {
      toast.success(`You were added to ${picked.name || "a vendor"} team`);
      // Switch context so the agent immediately sees the new account.
      setSelectedBrand(picked as any);
    } else {
      toast.success("You were added to a new vendor team");
    }
  }, [brands, setSelectedBrand]);

  useEffect(() => {
    setUser(getCurrentUser());
    fetchUnreadCount();
    
    // Refresh unread count every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    // Keyboard shortcut for search (Cmd+K or Ctrl+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchQuery("");
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSearch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getVendorProfile();
        if (!cancelled) setVendorPremium(!!s?.isPremium);
      } catch {
        if (!cancelled) setVendorPremium(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedBrand?.id]);

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  // Prevent body scroll when search modal is open
  useEffect(() => {
    if (showSearch) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSearch]);

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch unread count", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const result = await getNotifications({ limit: 10 });
      setNotifications(result.data || []);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read", error);
      toast.error("Failed to mark all as read");
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleLogout = () => {
    resetAssistantSession();
    logout();
    router.push("/admin/auth");
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    
    // Navigate to partners page with search query
    router.push({
      pathname: '/admin/partners',
      query: { search: query.trim() }
    });
    setShowSearch(false);
    setSearchQuery("");
  };

  const searchQuickLinks = [
    { label: "Campaigns", href: "/admin/campaigns", icon: FaBullhorn },
    { label: "Partners", href: "/admin/partners", icon: FaUsers },
    { label: "Applications", href: "/admin/applications", icon: FaFileAlt },
    { label: "Analytics", href: "/admin/analytics", icon: FaChartBar },
    { label: "Finance", href: "/admin/finance", icon: FaWallet },
    { label: "Messages", href: "/admin/messages", icon: FaEnvelope },
  ];

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "BS";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 sm:h-20 bg-white/97 dark:bg-[#0c1221]/97 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/25 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_6px_rgba(0,0,0,0.35)] flex items-center transition-colors duration-200">
      <div className="flex items-center justify-between w-full px-3 sm:px-4 lg:px-6">
        {/* Left – logo + mobile menu toggle */}
        <div className="flex items-center gap-3">
          <button
            className="sm:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <FaBars className="h-4 w-4" />
          </button>

          <Link href="/admin" className="flex items-center gap-2.5 sm:gap-3">
            {/* Light-mode logo */}
            <img
              src="/logo-dark.png"
              alt="Trend360"
              className="h-9 sm:h-11 w-auto object-contain dark:hidden"
            />
            {/* Dark-mode logo */}
            <img
              src="/logo.png"
              alt="Trend360"
              className="h-9 sm:h-11 w-auto object-contain hidden dark:block"
            />
            <span className="hidden sm:block text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase border-l border-slate-200 dark:border-slate-700/60 pl-3 leading-none">
              Business Suite
            </span>
          </Link>
        </div>

        {/* Center – Brand switcher + quick search hint */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-2xl">
          {/* Brand Switcher */}
          {brands.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBrandMenu(!showBrandMenu)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/40 hover:bg-slate-200/60 dark:hover:bg-slate-700/50 transition-all duration-150 shadow-sm dark:shadow-none"
              >
                <FaBuilding className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[80px] sm:max-w-[120px] truncate tracking-tight">
                  {selectedBrand?.name || "Select Brand"}
                </span>
                <FaChevronDown className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
              </button>
              {showBrandMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowBrandMenu(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 z-20 w-[calc(100vw-2rem)] sm:w-64 md:w-72 rounded-xl border border-slate-200/70 dark:border-slate-700/40 bg-white dark:bg-[#111827] shadow-xl shadow-black/8 dark:shadow-black/50 overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-slate-200/60 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-800/20">
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 tracking-tight">Switch Brand</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {brands.map((brand) => (
                        <button
                          key={brand.id}
                          onClick={() => {
                            setSelectedBrand(brand);
                            setShowBrandMenu(false);
                            router.reload();
                          }}
                          className={`w-full text-left px-3 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                            selectedBrand?.id === brand.id
                              ? "bg-emerald-50 dark:bg-emerald-500/10 border-l-2 border-emerald-500"
                              : ""
                          }`}
                        >
                          <p className="font-medium text-slate-900 dark:text-white truncate">{brand.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {brand.activeCampaigns || 0} active campaign{brand.activeCampaigns !== 1 ? 's' : ''}
                          </p>
                        </button>
                      ))}
                      <Link
                        href="/admin/brands"
                        onClick={() => setShowBrandMenu(false)}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border-t border-slate-200 dark:border-white/8"
                      >
                        <FaBuilding className="h-3 w-3" />
                        Manage Brands
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {/* Quick search hint */}
          <button
            onClick={() => setShowSearch(true)}
            className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/35 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/40 transition-all duration-150 flex-1 text-left shadow-sm dark:shadow-none group"
          >
            <FaSearch className="h-3 w-3 text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400 flex-shrink-0 transition-colors" />
            <span className="text-[11px] text-slate-400 dark:text-slate-500 flex-1 font-medium">
              Search anything…
            </span>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/50 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right – AI assistant + theme toggle + notifications + user */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={() => {
              if (!vendorPremium) {
                toast.error("Vendor Premium unlocks the AI assistant. Open Settings → Vendor Premium.");
                router.push("/admin/settings?premium=1");
                return;
              }
              setAiAssistantOpen((o) => !o);
            }}
            title={
              vendorPremium
                ? aiAssistantOpen
                  ? "Close AI assistant"
                  : "Open AI assistant"
                : "Vendor Premium required — open settings"
            }
            aria-label={
              vendorPremium
                ? aiAssistantOpen
                  ? "Close AI assistant"
                  : "Open AI assistant"
                : "Vendor Premium required for AI assistant"
            }
            aria-pressed={aiAssistantOpen}
            className={`relative p-2 rounded-lg transition-all duration-150 ${
              aiAssistantOpen
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/[0.12]"
                : "text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
            }`}
          >
            <FaRobot
              className={`h-[15px] w-[15px] ${
                aiAssistantOpen
                  ? "drop-shadow-[0_0_10px_rgba(16,185,129,0.95)] dark:drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]"
                  : "assistant-header-robot-glow"
              }`}
            />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="relative p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all duration-150"
          >
            {theme === "dark" ? (
              <FaSun className="h-[15px] w-[15px]" />
            ) : (
              <FaMoon className="h-[15px] w-[15px]" />
            )}
          </button>

          {/* API Access quick link */}
          <Link
            href="/admin/api-access"
            title="API Access & Developer Portal"
            className="hidden sm:flex p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all duration-150"
          >
            <FaCode className="h-[15px] w-[15px]" />
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all duration-150"
            >
              <FaBell className="h-[15px] w-[15px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 shadow-[0_0_0_1.5px_white] dark:shadow-[0_0_0_1.5px_#0c1221] text-[8px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-20 w-80 sm:w-96 rounded-xl border border-slate-200/70 dark:border-slate-700/40 bg-white dark:bg-[#111827] shadow-xl shadow-black/8 dark:shadow-black/50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200/60 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Notifications</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {isLoadingNotifications ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <FaBell className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-200 dark:divide-white/8">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => {
                              if (!notification.read) {
                                handleMarkAsRead(notification.id);
                              }
                              setShowNotifications(false);
                              // Navigate based on notification type
                              if (notification.link) {
                                router.push(notification.link);
                              }
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                              !notification.read ? "bg-emerald-50/50 dark:bg-emerald-500/5" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {!notification.read && (
                                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-900 dark:text-white line-clamp-2">
                                  {notification.title || notification.message}
                                </p>
                                {notification.message && notification.title && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                )}
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                  {formatNotificationTime(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-slate-200 dark:border-white/8">
                      <Link
                        href="/admin/messages"
                        onClick={() => setShowNotifications(false)}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium text-center block"
                      >
                        View all notifications
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* User dropdown */}
          <div className="relative ml-1">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all duration-150"
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-slate-950 shadow-[0_0_0_2px_white] dark:shadow-[0_0_0_2px_#0c1221]">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 max-w-[120px] truncate tracking-tight">
                  {user?.name || user?.email || "Agency User"}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize font-medium">
                  {(user?.role || "agency")?.toLowerCase()}
                </span>
              </div>
              <FaChevronDown className="h-2 w-2 text-slate-400 dark:text-slate-500" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-20 w-52 rounded-xl border border-slate-200/70 dark:border-slate-700/40 bg-white dark:bg-[#111827] shadow-xl shadow-black/8 dark:shadow-black/50 overflow-hidden">
                  <div className="px-3.5 py-3 border-b border-slate-200/60 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-800/20">
                    <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 truncate tracking-tight">
                      {user?.name || "Agency User"}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                  <Link
                    href="/admin/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-all duration-100"
                  >
                    <FaCog className="h-3 w-3 text-slate-400 dark:text-slate-500" /> Settings
                  </Link>
                  <Link
                    href="/admin/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-all duration-100"
                  >
                    <FaUser className="h-3 w-3 text-slate-400 dark:text-slate-500" /> Profile
                  </Link>
                  <Link
                    href="/admin/api-access"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-all duration-100"
                  >
                    <FaCode className="h-3 w-3 text-slate-400 dark:text-slate-500" /> API Access
                  </Link>
                  <div className="border-t border-slate-200/60 dark:border-slate-700/30">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[12px] text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50/60 dark:hover:bg-red-500/[0.08] transition-all duration-100"
                    >
                      <FaSignOutAlt className="h-3 w-3" /> Log out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal - Rendered via Portal */}
      {showSearch && mounted && typeof window !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            style={{ zIndex: 9999 }}
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
            }}
          />
          <div 
            className="fixed inset-0 flex items-start justify-center pt-[10vh] px-3 sm:px-4 overflow-y-auto pointer-events-none"
            style={{ zIndex: 10000 }}
          >
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200/70 dark:border-slate-700/40 bg-white dark:bg-[#111827] shadow-2xl shadow-black/10 dark:shadow-black/60 overflow-hidden my-4 pointer-events-auto">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-4 border-b border-slate-200/60 dark:border-slate-700/30">
                <FaSearch className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      e.preventDefault();
                      handleSearch(searchQuery);
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setShowSearch(false);
                      setSearchQuery("");
                    }
                  }}
                  placeholder="Search campaigns, partners, applications..."
                  className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    <FaTimes className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Quick Links */}
              <div className="px-3 sm:px-4 py-3 border-b border-slate-200 dark:border-white/8">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Quick Navigation</p>
                <div className="bus-responsive-tile-grid gap-2">
                  {searchQuickLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => {
                          setShowSearch(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Search Results / Actions */}
              {searchQuery.trim() && (
                <div className="px-3 sm:px-4 py-3">
                  <button
                    onClick={() => handleSearch(searchQuery)}
                    className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-medium truncate">
                      Search "{searchQuery}" in Partners
                    </span>
                    <FaArrowRight className="h-3.5 sm:h-4 w-3.5 sm:w-4 flex-shrink-0 ml-2" />
                  </button>
                </div>
              )}

              {/* Footer hint */}
              <div className="px-3 sm:px-4 py-2 bg-slate-50 dark:bg-white/3 border-t border-slate-200 dark:border-white/8">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                  Press <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10">Esc</kbd> to close
                </p>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

    </header>
  );
};

export default Header;
