"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowDownCircle, ArrowUpCircle, LogOut, Bell, Gift, Moon, Sun, Ticket, UserCircle, MessageCircleMore, ArrowDownToLine, ArrowUpFromLine, ArrowRight, Copy, Coins, RefreshCw, Wallet, Loader2 } from "lucide-react"
import type { PaginatedResponse, Notification } from "@/lib/types"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { AuthGuard } from "@/components/auth-guard"
import { getUser, logout } from "@/lib/auth"
import api from "@/lib/api"
import type { Transaction } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"
import Link from "next/link"

function DashboardContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const user = getUser()
  const { referralBonusEnabled, settings } = useSettings()
  const [adImageErrors, setAdImageErrors] = useState<Set<number>>(new Set())
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [isCarouselPaused, setIsCarouselPaused] = useState(false)
  const { theme, setTheme } = useTheme()
  const [messageMenuOpen, setMessageMenuOpen] = useState(false)

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const response = await api.get<{
        count: number
        results: Transaction[]
      }>("/mobcash/transaction-history", {
        params: {
          page: 1,
          page_size: 5,
        },
      })
      return response.data.results
    },
    refetchInterval: 120000, // Refresh every 2 minutes
  })

  type AdvertisementEntry = {
    enable?: boolean
    image?: string
    image_url?: string
    url?: string
    banner?: string
    title?: string
    name?: string
    link?: string
  }

  type AdvertisementResponse =
    | AdvertisementEntry[]
    | {
        results?: AdvertisementEntry[]
      }
    | null
    | undefined

  // Fetch notification count
  const { data: notificationData } = useQuery({
    queryKey: ["notification-count"],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Notification>>("/mobcash/notification")
      return response.data
    },
    refetchInterval: 120000, // Refresh every 2 minutes
  })

  // Fetch advertisements
  const { data: advertisements } = useQuery({
    queryKey: ["advertisements"],
    queryFn: async () => {
      try {
        const response = await api.get<any>("/mobcash/ann")
        const payload: AdvertisementResponse = response.data

        const entries: AdvertisementEntry[] = Array.isArray(payload)
          ? payload
          : payload && "results" in payload && Array.isArray(payload.results)
            ? payload.results
            : []

        if (!entries.length) {
          return []
        }

        // Filter and map enabled advertisements
        const enabledAds = entries
          .filter((item: AdvertisementEntry) => item?.enable === true)
          .map((item: AdvertisementEntry) => {
            const imageUrl =
              item.image ||
              item.image_url ||
              item.url ||
              item.banner ||
              null

            if (!imageUrl) {
              return null
            }

            return {
              image: imageUrl,
              title: item.title || item.name || null,
              link: item.link || item.url || null,
            }
          })
          .filter((ad): ad is { image: string; title: string | null; link: string | null } => ad !== null)

        return enabledAds
      } catch (error) {
        // Return empty array if API fails
        return []
      }
    },
  })

  // Reset current index when advertisements change
  useEffect(() => {
    if (advertisements && advertisements.length > 0) {
      setCurrentAdIndex(0)
      setAdImageErrors(new Set())
    }
  }, [advertisements])

  // Auto-play carousel
  useEffect(() => {
    if (!advertisements || advertisements.length <= 1 || isCarouselPaused) return

    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % advertisements.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [advertisements, isCarouselPaused])

  const handleImageError = (index: number) => {
    setAdImageErrors(prev => new Set([...prev, index]))
  }

  const goToSlide = (index: number) => {
    setCurrentAdIndex(index)
  }

  const handleCarouselPressStart = () => {
    if (!advertisements || advertisements.length <= 1) return
    setIsCarouselPaused(true)
  }

  const handleCarouselPressEnd = () => {
    setIsCarouselPaused(false)
  }

  // Calculate unread notification count
  const unreadNotificationCount = notificationData?.results.filter(n => !n.is_read).length || 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accept":
        return <Badge className="bg-primary">{t("accept")}</Badge>
      case "reject":
        return <Badge variant="destructive">{t("reject")}</Badge>
      default:
        return <Badge variant="secondary">{t("pending")}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    return type === "deposit" ? (
      <ArrowDownCircle className="h-5 w-5 text-primary" />
    ) : (
      <ArrowUpCircle className="h-5 w-5 text-primary" />
    )
  }

  return (
    <div>
      <main className="min-h-screen pb-20">
        {/* Header Design - Exact Specifications */}
        <header className="sticky top-0 z-50 w-full bg-transparent">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="mt-3 sm:mt-4 mb-3 sm:mb-4 rounded-2xl glass-panel shadow-lg">
              <div className="flex items-center justify-between px-4 py-3">
                {/* Logo Section */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30 glow-primary overflow-hidden">
                    <img
                      src="/Slater-logo.png"
                      alt="Slater Logo"
                      width={48}
                      height={16}
                      className="h-8 w-auto object-contain"
                    />
                  </div>
                  <div className="hidden sm:flex flex-col leading-tight">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Slater</span>
                    <span className="text-sm font-semibold text-foreground">Espace client</span>
                  </div>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="glass"
                    size="icon"
                    className="h-10 w-10 rounded-2xl relative"
                    onClick={() => router.push("/notifications")}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotificationCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-500 animate-pulse">
                        {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                      </Badge>
                    )}
                  </Button>

                  <Button
                    variant="glass"
                    size="icon"
                    className="h-10 w-10 rounded-2xl"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>

                  {/* User Avatar Button - Exact Specifications */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="relative h-12 w-12 sm:h-14 sm:w-14 p-0 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 border border-primary/30 shadow-lg shadow-primary/20 glow-primary hover:shadow-primary/30 hover:scale-105 transition-all duration-200">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-2xl bg-primary/10 ring-2 ring-offset-1 ring-offset-background flex items-center justify-center">
                          <span className="text-sm sm:text-base font-bold ">
                            {(user?.first_name?.[0]?.toUpperCase() || "") + (user?.last_name?.[0]?.toUpperCase() || "") || "U"}
                          </span>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>

                    {/* User Dropdown Menu - Exact Specifications */}
                    <DropdownMenuContent className="w-64 p-0 glass-panel border-primary/20 shadow-2xl shadow-primary/10 rounded-2xl overflow-hidden">
                      <div className="bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 p-4 border-b border-primary/20">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 ring-2 ring-primary/30 flex items-center justify-center">
                            <span className="text-base font-bold text-primary">
                              {(user?.first_name?.[0]?.toUpperCase() || "") + (user?.last_name?.[0]?.toUpperCase() || "") || "U"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">
                              {user?.first_name} {user?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      <DropdownMenuItem onClick={() => router.push("/profile")} className="hover:bg-primary/10 mx-2 my-1 rounded-xl">
                        <UserCircle className="h-4 w-4 mr-2" />
                        Profil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={logout} variant="destructive" className="hover:bg-red-500/10 mx-2 my-1 rounded-xl">
                        <LogOut className="h-4 w-4 mr-2" />
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-3 sm:px-4 space-y-5 sm:space-y-8">
          {/* Hero Section - Exact Specifications */}
          <Card className="border-0 floating-card overflow-hidden rounded-2xl sm:rounded-3xl">
            <CardContent className="p-4 sm:p-6 relative z-10">
              {/* Decorative blur element */}
              <div className="absolute -top-10 right-2 h-28 w-28 rounded-full bg-primary/20 blur-3xl" />

              {/* Welcome Text */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight break-words">
                  Bonjour, {user?.first_name} {user?.last_name}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
                  Votre hub pour suivre vos dépôts, retraits et notifications en un clin d'œil.
                </p>
              </div>

              {/* Referral & Bonus Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6">
                {/* Referral Code Card */}
                <Card className="glass-panel border-primary/15 rounded-xl sm:rounded-2xl">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/15 text-primary flex-shrink-0">
                          <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm text-muted-foreground">Code de parrainage</p>
                          <p className="text-sm sm:text-base font-mono font-semibold text-foreground truncate">
                            {user?.referral_code || "SLATER123"}
                          </p>
                        </div>
                      </div>
                      <Button className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 rounded-lg hover:bg-primary/10">
                        <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Bonus Card */}
                {referralBonusEnabled && user && user.bonus_available > 0 && (
                  <Card className="glass-panel border-primary/15 rounded-xl sm:rounded-2xl">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/15 text-primary flex-shrink-0">
                            <Coins className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground">Bonus disponible</p>
                            <p className="text-sm sm:text-base font-semibold text-foreground">
                              {user.bonus_available.toLocaleString()} FCFA
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline-glow"
                          size="sm"
                          className="h-8 px-3"
                          onClick={() => router.push("/bonus")}
                        >
                          Utiliser
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Primary Action Buttons */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6">
                {/* Deposit Button */}
                <Button
                  className="h-12 sm:h-12 justify-between bg-primary text-primary-foreground shadow-lg glow-primary rounded-xl sm:rounded-2xl"
                  onClick={() => router.push("/deposit")}
                >
                  <div className="flex items-center justify-between w-full gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-background/20">
                        <ArrowDownToLine className="h-4 w-4 sm:h-5 sm:w-5" />
                      </span>
                      <div className="text-left min-w-0">
                        <span className="text-xs sm:text-sm font-semibold">Dépôt</span>
                      </div>
                    </div>
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                </Button>

                {/* Withdrawal Button */}
                <Button
                  className="h-12 sm:h-12 justify-between border-primary/30 bg-primary/5 text-foreground hover:bg-primary/10 rounded-xl sm:rounded-2xl"
                  onClick={() => router.push("/withdraw")}
                >
                  <div className="flex items-center justify-between w-full gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-secondary/20">
                        <ArrowUpFromLine className="h-4 w-4 sm:h-5 sm:w-5" />
                      </span>
                      <div className="text-left min-w-0">
                        <span className="text-xs sm:text-sm font-semibold">Retrait</span>
                      </div>
                    </div>
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                </Button>
              </div>

              {/* Quick Access Pills */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-6">
                <Button
                  variant="ghost"
                  className="h-10 sm:h-10 px-3 sm:px-4 rounded-full border border-primary/20 bg-primary/5 text-foreground hover:bg-primary/10"
                  onClick={() => router.push("/coupon")}
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  <span className="text-sm font-semibold">Coupons</span>
                </Button>

                {referralBonusEnabled && (
                  <Button
                    variant="ghost"
                    className="h-10 sm:h-10 px-3 sm:px-4 rounded-full border border-primary/20 bg-primary/5 text-foreground hover:bg-primary/10"
                    onClick={() => router.push("/bonus")}
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    <span className="text-sm font-semibold">Bonus</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Advertisement Section - Exact Specifications */}
          <div className="w-full">
            {advertisements && advertisements.length > 0 ? (
              <Card className="overflow-hidden border border-primary/20 glass-panel p-0 py-0 rounded-2xl sm:rounded-3xl">
                <CardContent className="p-0">
                  <Carousel
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                    className="w-full"
                    onTouchStart={() => setIsCarouselPaused(true)}
                    onTouchEnd={() => setIsCarouselPaused(false)}
                  >
                    <CarouselContent>
                      {advertisements.map((ad, index) => (
                        <CarouselItem key={index}>
                          <div className="relative w-full h-32 sm:h-40 md:h-44 lg:h-48">
                            {!adImageErrors.has(index) ? (
                              <img
                                src={ad.image}
                                alt={ad.title || "Publicité"}
                                className="object-cover cursor-pointer transition-transform duration-300 hover:scale-105 w-full h-full"
                                onClick={() => {
                                  if (ad.link) {
                                    window.open(ad.link, "_blank", "noopener,noreferrer")
                                  }
                                }}
                                onError={() => handleImageError(index)}
                              />
                            ) : (
                              <div className="relative w-full h-32 sm:h-40 md:h-44 lg:h-48 bg-muted/20 flex items-center justify-center">
                                <div className="text-center p-4 text-muted-foreground">
                                  <p className="text-sm sm:text-base font-semibold text-foreground/80">Espace publicitaire</p>
                                  <p className="text-xs text-muted-foreground mt-1">Vos campagnes apparaîtront ici</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden border border-primary/20 glass-panel p-0 py-0 rounded-2xl sm:rounded-3xl">
                <CardContent className="p-0">
                <div className="relative w-full h-32 sm:h-40 md:h-44 lg:h-48 bg-muted/20 flex items-center justify-center rounded-2xl sm:rounded-3xl">
                  <div className="text-center p-4 text-muted-foreground">
                    <p className="text-sm sm:text-base font-semibold text-foreground/80">Espace publicitaire</p>
                    <p className="text-xs text-muted-foreground mt-1">Vos campagnes apparaîtront ici</p>
                  </div>
                </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Activities Section - Exact Specifications */}
          <div className="space-y-5 sm:space-y-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold section-title">Activité récente</h2>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button className="h-9 sm:h-10 sm:w-auto px-3 bg-primary/10 border-primary/30 text-foreground hover:bg-primary/15">
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Actualiser</span>
                </Button>
                <Button className="h-9 sm:h-10 text-xs sm:text-sm hover:bg-primary/10">
                  <Link href="/transactions" className="flex items-center gap-1 sm:gap-2">
                    <span className="hidden sm:inline">Voir tout</span>
                    <span className="sm:hidden">Tout</span>
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Transaction Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
              {isLoading ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !transactions || transactions.length === 0 ? (
                <Card className="col-span-full glass-panel rounded-2xl sm:rounded-3xl">
                  <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12">
                    <Wallet className="h-12 w-12 text-primary mb-4" />
                    <p className="text-foreground font-semibold">Aucune transaction récente</p>
                    <p className="text-sm text-muted-foreground text-center mt-1">Vos transactions apparaîtront ici</p>
                  </CardContent>
                </Card>
              ) : (
                transactions.slice(0, 4).map((transaction, index) => (
                  <Card key={transaction.id} className="glass-panel hover:shadow-lg transition-all duration-200 border-primary/10 rounded-2xl sm:rounded-3xl relative overflow-hidden">
                    {/* Color bar at top */}
                    <div className="absolute inset-x-0 top-0 h-1.5"
                         style={{
                           background: transaction.type_trans === "deposit"
                             ? "linear-gradient(90deg, rgba(50,251,255,0.35), rgba(23,161,255,0.25))"
                             : "linear-gradient(90deg, rgba(15,34,55,0.35), rgba(50,251,255,0.15))"
                         }}>
                    </div>

                    <CardContent className="p-3.5 sm:p-4">
                      <div className="flex items-start justify-between gap-3">
                        {/* Left side - Icon and details */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2 rounded-xl flex-shrink-0 ${
                            transaction.type_trans === "deposit"
                              ? "bg-primary/15 text-primary"
                              : "bg-secondary/20 text-foreground"
                          }`}>
                            {transaction.type_trans === "deposit" ? (
                              <ArrowDownToLine className="h-4 w-4" />
                            ) : (
                              <ArrowUpFromLine className="h-4 w-4" />
                            )}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <h3 className="font-semibold text-sm sm:text-base truncate">
                                #{transaction.reference || `TXN-${transaction.id}`}
                              </h3>
                              {/* Status and type badges */}
                              <Badge className={`text-xs ${
                                transaction.status === "accept"
                                  ? "bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20"
                                  : transaction.status === "error"
                                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                                  : "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20"
                              }`}>
                                {transaction.status === "accept" ? "Succès" :
                                 transaction.status === "error" ? "Échec" : "En attente"}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {transaction.app_details?.name || transaction.app} • {transaction.phone_number || "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Right side - Amount and timestamp */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-base sm:text-lg font-semibold">
                            {transaction.amount.toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "XOF",
                              minimumFractionDigits: 0,
                            })}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modern Floating Message Button */}
      <Popover open={messageMenuOpen} onOpenChange={setMessageMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="glow"
            className="fixed right-4 bottom-24 sm:bottom-10 sm:right-8 h-16 w-16 p-0 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-xl shadow-primary/40 hover:shadow-primary/60 transition-all duration-300 transform hover:-translate-y-2 hover:scale-110 border border-primary/30"
            size="icon"
          >
            <MessageCircleMore className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 glass-panel border-primary/20 shadow-2xl shadow-primary/10 rounded-2xl overflow-hidden" side="top" align="end">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <MessageCircleMore className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Support Client</h3>
                <p className="text-sm text-muted-foreground">Comment pouvons-nous vous aider ?</p>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => {
                  const whatsappUrl = settings?.whatsapp
                    ? `https://wa.me/${settings.whatsapp}`
                    : "https://wa.me/1234567890"
                  window.open(whatsappUrl, "_blank")
                  setMessageMenuOpen(false)
                }}
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span className="font-medium">WhatsApp</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => {
                  const telegramUrl = settings?.telegram
                    ? `https://t.me/${settings.telegram}`
                    : "https://t.me/Slater"
                  window.open(telegramUrl, "_blank")
                  setMessageMenuOpen(false)
                }}
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-1.447-1.462-1.413-2.11.034-.66.283-1.942.933-3.115 1.2-2.172 2.033-4.25 2.573-5.195.139-.242.061-.516.052-.614-.028-.406-.787-.217-.976-.137-.434.12-2.07.88-4.95 2.605-1.685 1.006-3.3 2.454-3.3 2.454s-.113.083-.202.11a.505.505 0 0 1-.384-.062.505.505 0 0 1-.171-.325c-.02-.093-.036-.306-.02-.472.18-1.898.962-6.502 1.36-8.627.168-.9.499-1.201.82-1.23.696-.065 1.225.46 1.9.902 1.056.693 1.653 1.124 2.678 1.8 1.185.78 1.447 1.462 1.413 2.11-.034.66-.283 1.942-.933 3.115-1.2 2.172-2.033 4.25-2.573 5.195-.139.242-.061.516-.052.614.028.406.787.217.976.137.434-.12 2.07-.88 4.95-2.605 1.685-1.006 3.3-2.454 3.3-2.454s.113-.083.202-.11a.505.505 0 0 1 .384.062.505.505 0 0 1 .171.325z" />
                </svg>
                <span className="font-medium">Telegram</span>
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}