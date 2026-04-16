"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Bell, Sun, Moon, UserCircle, LogOut, ChevronDown, User as UserIcon, Home, Wallet, History, Ticket, Gift, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getUser, logout, type User } from "@/lib/auth"
import api from "@/lib/api"
import type { PaginatedResponse, Notification } from "@/lib/types"

const navLinks = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/deposit", label: "Dépôt", icon: Wallet },
  { href: "/withdraw", label: "Retrait", icon: History },
  { href: "/coupon", label: "Coupons", icon: Ticket },
  { href: "/bonus", label: "Bonus", icon: Gift },
]

export function AppBar({
  showBackButton = false,
  backHref = "/dashboard",
  title,
}: {
  showBackButton?: boolean
  backHref?: string
  title?: string
} = {}) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUser()
        setUser(userData)
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Fetch notification count
  const { data: notificationData } = useQuery({
    queryKey: ["notification-count"],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Notification>>("/mobcash/notification")
      return response.data
    },
    refetchInterval: 120000, // Refresh every 2 minutes
  })

  const unreadNotificationCount = notificationData?.results.filter((n) => !n.is_read).length || 0

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between">
          {/* Navigation/Logo */}
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <button
                onClick={() => router.push(backHref)}
                className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-slate-600 dark:text-slate-300" />
              </button>
            ) : (
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                  <img src="/Slater-logo.png" alt="Slater" className="w-full h-full object-cover" />
                </div>
                {!title && (
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 drop-shadow-sm">
                    Slater
                  </span>
                )}
              </Link>
            )}
            {title && (
              <span className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-none">
                {title}
              </span>
            )}
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
              >
                <link.icon className="h-4 w-4 inline-block mr-2 group-hover:scale-110 transition-transform duration-200" />
                {link.label}
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full group-hover:-translate-x-1/2" />
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl relative hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => router.push("/notifications")}
            >
              <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              {unreadNotificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-500 text-white animate-pulse border-none">
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </Badge>
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 px-2 sm:px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 sm:gap-2"
                  >
                    <UserIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {user.first_name}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 rounded-2xl border-2 shadow-xl bg-white dark:bg-slate-900 p-0 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  {/* Mobile Theme Toggle visible inside menu since screen space is tight */}
                  <div
                    className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    <div className="flex items-center gap-3">
                      {theme === "dark" ? (
                        <Sun className="h-4 w-4 text-slate-500" />
                      ) : (
                        <Moon className="h-4 w-4 text-slate-500" />
                      )}
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Thème sombre
                      </span>
                    </div>
                    <div
                      className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${
                        theme === "dark" ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    >
                      <div
                        className={`w-3 h-3 bg-white rounded-full transition-transform ${
                          theme === "dark" ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>

                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-3 m-1 rounded-xl"
                  >
                    <UserCircle className="h-4 w-4 mr-3 text-slate-500" />
                    <span className="font-medium text-slate-700 dark:text-slate-200">Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    variant="destructive"
                    className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 m-1 rounded-xl"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    <span className="font-medium">Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                className="h-10 px-3 rounded-xl text-slate-500 dark:text-slate-400"
                disabled
              >
                <UserIcon className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
