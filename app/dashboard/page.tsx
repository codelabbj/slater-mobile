"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowDownCircle, ArrowUpCircle, LogOut, Bell, Gift, Moon, Sun, Ticket, UserCircle, ArrowDownToLine, ArrowUpFromLine, ArrowRight, Copy, Coins, RefreshCw, Wallet, Loader2, Clock, ChevronDown, User as UserIcon } from "lucide-react"
import { AppBar } from "@/components/ui/app-bar"

// Telegram Icon Component
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.891 7.02l-1.912 9.062c-.145.648-.529.81-.174.551l-4.57-3.37-2.203 2.12c-.244.244-.448.448-.916.448l.327-4.64 8.445-7.63c.367-.327-.08-.509-.571-.18l-10.437 6.571-4.493-1.404c-.977-.306-.997-.977.204-1.447l17.545-6.76c.812-.306 1.522.245 1.282 1.354z" />
  </svg>
)
import type { PaginatedResponse, Notification, Transaction } from "@/lib/types"
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
import { getUser, logout, type User } from "@/lib/auth"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"
import Link from "next/link"
import TransactionCard from "@/components/ui/transaction-card"

function DashboardContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const { referralBonusEnabled, settings } = useSettings()
  const [adImageErrors, setAdImageErrors] = useState<Set<number>>(new Set())
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [isCarouselPaused, setIsCarouselPaused] = useState(false)
  const [carouselApi, setCarouselApi] = useState<any>(null)
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

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUser()
        setUser(userData)
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    fetchUser()
  }, [])

  // Reset current index when advertisements change
  useEffect(() => {
    if (advertisements && advertisements.length > 0) {
      setCurrentAdIndex(0)
      setAdImageErrors(new Set())
    }
  }, [advertisements])

  // Auto-play carousel
  useEffect(() => {
    if (!advertisements || advertisements.length <= 1 || isCarouselPaused || !carouselApi) return

    const interval = setInterval(() => {
      carouselApi.scrollNext()
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [advertisements, isCarouselPaused, carouselApi])

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
    <div className="min-h-screen">
      <AppBar />
      <main className="min-h-screen pb-20 pt-20 sm:pt-24 lg:pt-28">

        <div className="flex justify-center px-4 sm:px-6 lg:px-8 mt-4 sm:mt-8 pb-32">
          <div className="w-full max-w-md">
            {/* Advertisement Banner */}
            <div className="relative rounded-2xl overflow-hidden mb-6 sm:mb-8">
              {(!advertisements || advertisements.length === 0) ? (
                <div className="w-full aspect-[16/9] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl flex items-center justify-center">
                  <p className="text-slate-500">Aucune publicité</p>
                </div>
              ) : (
                <Carousel
                  opts={{ align: "start", loop: advertisements.length > 1 }}
                  setApi={setCarouselApi}
                  className="w-full"
                  onTouchStart={() => setIsCarouselPaused(true)}
                  onTouchEnd={() => setIsCarouselPaused(false)}
                  onMouseEnter={() => setIsCarouselPaused(true)}
                  onMouseLeave={() => setIsCarouselPaused(false)}
                >
                  <CarouselContent className="w-full">
                    {advertisements.map((ad, index) => {
                      if (!ad.image || adImageErrors.has(index)) return null
                      return (
                        <CarouselItem key={index} className="md:basis-full">
                          <div className="relative w-full aspect-[16/9]">
                            <img
                              src={ad.image}
                              alt={ad.title || "Publicité"}
                              className="w-full h-full object-cover rounded-2xl"
                              onError={() => handleImageError(index)}
                              onClick={() => {
                                if (ad.link) {
                                  window.open(ad.link, "_blank", "noopener,noreferrer")
                                }
                              }}
                            />
                            {ad.link && (
                              <a href={ad.link} target="_blank" rel="noopener noreferrer" className="absolute inset-0" />
                            )}
                          </div>
                        </CarouselItem>
                      )
                    })}
                  </CarouselContent>
                </Carousel>
              )}
            </div>

            {/* Quick Actions */}
            <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg mb-6 sm:mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-primary" />
              
              <div className="relative flex items-center justify-around gap-3">
                <Link href="/deposit" className="group flex flex-col items-center gap-2 flex-1">
                  <div className="relative p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg ring-1 ring-blue-400/20 group-hover:shadow-blue-500/50 group-hover:scale-110 transition-all duration-300">
                    <ArrowDownToLine className="h-5 w-5" />
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-md bg-blue-400" />
                  </div>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Dépôt</span>
                </Link>

                <div className="h-10 w-px bg-gradient-to-b from-transparent via-border to-transparent" />

                <Link href="/withdraw" className="group flex flex-col items-center gap-2 flex-1">
                  <div className="relative p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg ring-1 ring-emerald-400/20 group-hover:shadow-emerald-500/50 group-hover:scale-110 transition-all duration-300">
                    <ArrowUpFromLine className="h-5 w-5" />
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-md bg-emerald-400" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Retrait</span>
                </Link>

                <div className="h-10 w-px bg-gradient-to-b from-transparent via-border to-transparent" />

                <Link href="/coupon" className="group flex flex-col items-center gap-2 flex-1">
                  <div className="relative p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg ring-1 ring-amber-400/20 group-hover:shadow-amber-500/50 group-hover:scale-110 transition-all duration-300">
                    <Ticket className="h-5 w-5" />
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-md bg-amber-400" />
                  </div>
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Coupons</span>
                </Link>

                {referralBonusEnabled && (
                  <>
                    <div className="h-10 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
                    
                    <Link href="/bonus" className="group flex flex-col items-center gap-2 flex-1">
                      <div className="relative p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg ring-1 ring-purple-400/20 group-hover:shadow-purple-500/50 group-hover:scale-110 transition-all duration-300">
                        <Gift className="h-5 w-5" />
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-md bg-purple-400" />
                      </div>
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Bonus</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            {referralBonusEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="group relative overflow-hidden rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white shadow-lg">
                      <Copy className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 font-medium mb-0.5">Code de parrainage</p>
                      <p className="text-sm font-mono font-bold truncate">
                        {user?.referral_code || "N/A"}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" 
                      onClick={() => {
                          if (user?.referral_code) {
                              navigator.clipboard.writeText(user.referral_code)
                          }
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-lg">
                      <Coins className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-0.5">Bonus disponible</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {(user?.bonus_available || 0).toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "XOF",
                          minimumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-xl font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-900 dark:text-white" />
                  Transactions
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl"
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="h-9 text-xs sm:text-sm rounded-xl">
                    <Link href="/transactions">
                      Tout voir
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-900 dark:text-white" />
                </div>
              ) : !transactions || transactions.length === 0 ? (
                <div className="relative overflow-hidden rounded-2xl p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4 mx-auto">
                    <Wallet className="h-8 w-8 text-slate-500 dropdown-icon" />
                  </div>
                  <p className="text-base font-semibold mb-1">Aucune transaction</p>
                  <p className="text-sm text-slate-500">Vos transactions apparaîtront ici</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <TransactionCard key={transaction.id} transaction={transaction} network={undefined} />
                  ))}
                </div>
              )}
            </div>



          </div>
        </div>
      </main>

      {/* Modern Floating Message Button */}
      <Popover open={messageMenuOpen} onOpenChange={setMessageMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            className="fixed right-4 bottom-24 h-14 w-14 rounded-2xl bg-slate-900 text-white shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 ring-4 ring-slate-900/20 z-50 flex items-center justify-center"
            aria-label="Ouvrir le chat"
          >
            <TelegramIcon className="h-7 w-7" />
            <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity blur-md bg-slate-900/40" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2 mb-2 mr-2 rounded-2xl border-2 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900" align="end" side="top" sideOffset={12}>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              onClick={() => {
                const whatsappUrl = settings?.whatsapp_phone
                  ? `https://wa.me/${settings.whatsapp_phone}`
                  : "https://wa.me/2250544360901"
                window.open(whatsappUrl, "_blank")
                setMessageMenuOpen(false)
              }}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-md">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </div>
              <span className="font-semibold text-sm">WhatsApp</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              onClick={() => {
                const telegramUrl = settings?.telegram
                  ? `${settings.telegram}`
                  : "https://t.me/Slater"
                window.open(telegramUrl, "_blank")
                setMessageMenuOpen(false)
              }}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                <TelegramIcon className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sm">Telegram</span>
            </Button>
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