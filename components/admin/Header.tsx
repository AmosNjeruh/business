// Business Suite – Admin Header
// Mirrors frontend/components/vendor/Header pattern with full light/dark support

import React, { useEffect, useState } from "react";
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
} from "react-icons/fa";
import { getCurrentUser, logout } from "@/services/auth";
import { useTheme } from "@/contexts/ThemeContext";
import { useBrand } from "@/contexts/BrandContext";
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } from "@/services/vendor";
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
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBrandMenu, setShowBrandMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    fetchUnreadCount();
    
    // Refresh unread count every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

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
    logout();
    router.push("/admin/auth");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "BS";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 sm:h-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-white/8 flex items-center transition-colors duration-200">
      <div className="flex items-center justify-between w-full px-3 sm:px-4 lg:px-6">
        {/* Left – logo + mobile menu toggle */}
        <div className="flex items-center gap-3">
          <button
            className="sm:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <FaBars className="h-4 w-4" />
          </button>

          <Link href="/admin" className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Business Suite
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Agency control room
              </span>
            </div>
          </Link>
        </div>

        {/* Center – Brand switcher + quick search hint */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-2xl">
          {/* Brand Switcher */}
          {brands.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBrandMenu(!showBrandMenu)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 hover:bg-slate-200 dark:hover:bg-white/8 transition-colors"
              >
                <FaBuilding className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium text-slate-900 dark:text-white max-w-[80px] sm:max-w-[120px] truncate">
                  {selectedBrand?.name || "Select Brand"}
                </span>
                <FaChevronDown className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-slate-400 flex-shrink-0" />
              </button>
              {showBrandMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowBrandMenu(false)}
                  />
                  <div className="absolute left-0 top-full mt-1.5 z-20 w-[calc(100vw-2rem)] sm:w-64 md:w-72 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-200 dark:border-white/8">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">Switch Brand</p>
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
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 cursor-pointer hover:bg-slate-200 dark:hover:bg-white/8 transition-colors flex-1">
            <svg
              className="h-3.5 w-3.5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Search anything…
            </span>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right – theme toggle + notifications + user */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            {theme === "dark" ? (
              <FaSun className="h-4 w-4" />
            ) : (
              <FaMoon className="h-4 w-4" />
            )}
          </button>

          {/* API Access quick link */}
          <Link
            href="/admin/api-access"
            title="API Access & Developer Portal"
            className="hidden sm:flex p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <FaCode className="h-4 w-4" />
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <FaBell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 text-[8px] font-bold text-white flex items-center justify-center">
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
                <div className="absolute right-0 top-full mt-1.5 z-20 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-white/8 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
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
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-slate-950">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold text-slate-900 dark:text-white max-w-[120px] truncate">
                  {user?.name || user?.email || "Agency User"}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                  {(user?.role || "agency")?.toLowerCase()}
                </span>
              </div>
              <FaChevronDown className="h-2.5 w-2.5 text-slate-400 dark:text-slate-500" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 z-20 w-52 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-slate-200 dark:border-white/8">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {user?.name || "Agency User"}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <Link
                    href="/admin/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <FaCog className="h-3.5 w-3.5" /> Settings
                  </Link>
                  <Link
                    href="/admin/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <FaUser className="h-3.5 w-3.5" /> Profile
                  </Link>
                  <Link
                    href="/admin/api-access"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <FaCode className="h-3.5 w-3.5" /> API Access
                  </Link>
                  <div className="border-t border-slate-200 dark:border-white/8">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <FaSignOutAlt className="h-3.5 w-3.5" /> Log out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
