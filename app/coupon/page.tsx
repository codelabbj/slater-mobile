"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Copy,
  Check,
  Ticket,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Plus,
  Star,
  Send,
  Loader2,
  Trophy,
  Wallet,
  X,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { AuthGuard } from "@/components/auth-guard"
import api from "@/lib/api"
import type { Coupon, PaginatedResponse, Platform, Comment as CouponComment, User } from "@/lib/types"
import { formatDate, cn } from "@/lib/utils"
import { AppBar } from "@/components/ui/app-bar"
import toast from "react-hot-toast"

// ─────────────────────────────────────────────────────────────────────────────
// CouponContent — exact functional parity with blaffa-mobile/coupon/page.tsx
// Endpoints: all use /mobcash/* instead of /blaffa/*
// Design: slater-mobile shadcn components kept as-is
// ─────────────────────────────────────────────────────────────────────────────
function CouponContent() {
  const router = useRouter()

  // --- Core state (mirrors blaffa-mobile 1-to-1) ---
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [platformsLoading, setPlatformsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // --- Comment state (mirrors blaffa-mobile 1-to-1) ---
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [comments, setComments] = useState<CouponComment[]>([])
  const [commentText, setCommentText] = useState("")
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState<CouponComment | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isAccessRestricted, setIsAccessRestricted] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [minDepositRequired, setMinDepositRequired] = useState(0)
  const [globalSettings, setGlobalSettings] = useState<any>(null)

  // ── Fetch helpers (same logic as blaffa, mobcash endpoints) ──────────────

  const fetchPlatforms = async () => {
    try {
      const response = await api.get<Platform[]>("/mobcash/plateform")
      if (response.status === 200) {
        setPlatforms(response.data || [])
      }
    } catch (err) {
      console.error("Error fetching platforms:", err)
    } finally {
      setPlatformsLoading(false)
    }
  }

  const fetchCoupons = async (platformId: string | null = null) => {
    setLoading(true)
    try {
      const url = platformId ? `/mobcash/v2/coupons?bet_app=${platformId}` : `/mobcash/v2/coupons`
      const response = await api.get<PaginatedResponse<Coupon>>(url)
      if (response.status === 200) {
        const data = response.data
        const results = (data.results || data || []) as any[]
        // Map API response → internal Coupon shape
        const mappedCoupons = results.map((c: any) => {
          // Author: API returns combined "author_name" e.g. "ALPHA rarsh"
          const authorParts = (c.author_name || "").trim().split(" ")
          const author_first_name = c.author_first_name || authorParts[0] || "Utilisateur"
          const author_last_name = c.author_last_name || authorParts.slice(1).join(" ") || ""

          // bet_app: API returns a UUID string + separate bet_app_details object
          const bet_app = typeof c.bet_app === "string"
            ? { id: c.bet_app, name: c.bet_app_details?.name || "App", image: c.bet_app_details?.image || "" }
            : c.bet_app

          return {
            ...c,
            author_first_name,
            author_last_name,
            bet_app,
            // Odds may be returned as "odds" or legacy "cote"
            odds: c.odds ?? c.cote ?? "—",
            user_liked: c.user_liked ?? false,
            user_disliked: c.user_disliked ?? false,
            // Default to true if missing, or allow if explicitly true
            can_rate: c.can_rate ?? true,
            total_comments: c.total_comments ?? 0,
          }
        })
        setCoupons(mappedCoupons)
      }
    } catch (err: any) {
      console.error("Error fetching coupons:", err)
      setError(err.message || "Failed to load coupons.")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      // Fetch from API like blaffa-mobile (not from local storage)
      const response = await api.get<User>("/auth/me")
      if (response.status === 200) {
        setUserProfile(response.data)
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
    }
  }

  // ── useEffect #1: settings check → then load (blaffa-mobile pattern) ─────
  useEffect(() => {
    setMounted(true)
    const checkSettingsAndAccess = async () => {
      setCheckingAccess(true)
      try {
        const response = await api.get("/mobcash/setting")
        const settings = Array.isArray(response.data) ? response.data[0] : response.data
        setGlobalSettings(settings)
        
        if (settings?.requires_deposit_to_view_coupon) {
          const minReq = settings.minimun_deposit_before_view_coupon || 0
          setMinDepositRequired(minReq)
          
          // Check transaction history for a single accepted deposit >= minReq
          const historyResponse = await api.get<PaginatedResponse<any>>("/mobcash/transaction-history", {
            params: {
              type_trans: "deposit",
              status: "accept",
              page: 1,
              page_size: 50
            }
          })
          
          const results = historyResponse.data.results || []
          const hasValidDeposit = results.some((t: any) => t.amount >= minReq)
          
          if (!hasValidDeposit) {
            setIsAccessRestricted(true)
          }
        }
      } catch (err) {
        console.error("Error checking coupon access:", err)
      } finally {
        setCheckingAccess(false)
      }
      fetchPlatforms()
      fetchCoupons()
      fetchUserProfile()
    }
    checkSettingsAndAccess()
  }, [])

  // ── useEffect #2: re-fetch coupons on platform change (blaffa-mobile pattern) ──
  useEffect(() => {
    if (selectedPlatformId !== null) {
      fetchCoupons(selectedPlatformId)
    } else {
      fetchCoupons()
    }
  }, [selectedPlatformId])

  // ── Handlers (exact blaffa-mobile logic) ─────────────────────────────────

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleVote = async (couponId: string, voteType: "like" | "dislike") => {
    // Allow staff, superusers, or users with explicit permission
    const canRate = 
      userProfile?.can_rate_coupons || 
      userProfile?.is_staff || 
      (userProfile as any)?.is_superuser || 
      (userProfile as any)?.is_supperuser

    if (!canRate) {
      setError(
        "Vous n'avez pas l'autorisation de noter des coupons. Pour noter, vous devez avoir au moins 1 mois d'ancienneté et 15 000 FCFA de transactions acceptées."
      )
      setTimeout(() => setError(null), 5000)
      return
    }

    try {
      const response = await api.post(`/mobcash/v2/coupons/${couponId}/vote`, { vote_type: voteType })
      if (response.status === 200) {
        setError(null)
        // Update local coupon state directly from response (exact blaffa approach)
        setCoupons((prevCoupons) =>
          prevCoupons.map((c) => {
            if (c.id === couponId) {
              return {
                ...c,
                likes_count: response.data.coupon?.likes ?? response.data.coupon?.likes_count ?? response.data.likes ?? response.data.likes_count ?? c.likes_count,
                dislikes_count: response.data.coupon?.dislikes ?? response.data.coupon?.dislikes_count ?? response.data.dislikes ?? response.data.dislikes_count ?? c.dislikes_count,
                user_liked: response.data.coupon?.user_liked ?? response.data.user_liked ?? c.user_liked,
                user_disliked: response.data.coupon?.user_disliked ?? response.data.user_disliked ?? c.user_disliked,
              }
            }
            return c
          })
        )
      }
    } catch (err: any) {
      console.error("Error voting coupon:", err)
      const errorMessage =
        err.message ||
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Erreur lors du vote."
      setError(errorMessage)
      toast.error(errorMessage)
      setTimeout(() => setError(null), 5000)
    }
  }

  const fetchComments = async (couponId: string) => {
    setCommentsLoading(true)
    try {
      // API filters by the coupon author's user ID
      const response = await api.get<any>(
        `/mobcash/v2/author-comments?coupon_author_id=${couponId}`
      )
      if (response.status === 200) {
        const raw = Array.isArray(response.data)
          ? response.data
          : response.data.results || []
        // Normalize: split author_name into first/last for rendering
        const normalized = raw.map((comment: any) => {
          const parts = (comment.author_name || "").trim().split(" ")
          return {
            ...comment,
            author: {
              id: comment.author,
              first_name: parts[0] || "?",
              last_name: parts.slice(1).join(" ") || "",
            },
          }
        })
        setComments(normalized)
      }
    } catch (err: any) {
      console.error("Error fetching comments:", err)
      const msg = err.message || "Erreur lors du chargement des commentaires."
      setError(msg)
      setTimeout(() => setError(null), 3000)
    } finally {
      setCommentsLoading(false)
    }
  }

  const createComment = async (couponId: string, content: string, parentId: string | null = null) => {
    if (!content.trim()) return

    try {
      const payload: any = { coupon_id: couponId, content: content.trim() }

      const response = await api.post("/mobcash/v2/author-comments", payload)
      if (response.status === 200 || response.status === 201) {
        // Refresh comments after creating (blaffa pattern)
        if (selectedCoupon) {
          await fetchComments(selectedCoupon.author)
          // Increment total_comments locally (blaffa pattern)
          setCoupons((prevCoupons) =>
            prevCoupons.map((c) => {
              if (c.id === couponId) {
                return { ...c, total_comments: (c.total_comments || 0) + 1 }
              }
              return c
            })
          )
        }
        setCommentText("")
        setReplyingTo(null)
      }
    } catch (err: any) {
      console.error("Error creating comment:", err)
      const errorMessage =
        err.message ||
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Erreur lors de la création du commentaire."
      setError(errorMessage)
      toast.error(errorMessage)
      setTimeout(() => setError(null), 3000)
    }
  }

  // fetchComments by coupon author ID
  const handleOpenComments = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setShowCommentModal(true)
    fetchComments(coupon.author)
  }

  // Blaffa: resets all comment state on close
  const handleCloseComments = () => {
    setShowCommentModal(false)
    setSelectedCoupon(null)
    setComments([])
    setCommentText("")
    setReplyingTo(null)
  }

  const handleSendComment = () => {
    if (selectedCoupon && commentText.trim()) {
      createComment(selectedCoupon.id, commentText, replyingTo?.id || null)
    }
  }

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getInitials = (first?: string, last?: string) => {
    if (!first && !last) return "?"
    return `${(first || "").charAt(0)}${(last || "").charAt(0)}`.toUpperCase()
  }

  if (!mounted) return null

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Vérification des accès...</p>
      </div>
    )
  }

  if (isAccessRestricted) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <AppBar showBackButton={true} backHref="/dashboard" title="Accès Restreint" />
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full rounded-[3rem] border-0 shadow-2xl overflow-hidden bg-white dark:bg-slate-900 border-b-[12px] border-red-50 dark:border-red-900/10">
            <CardContent className="px-10 py-6 flex flex-col items-center text-center space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/10 rounded-[2.5rem] blur-3xl opacity-50" />
                <div className="relative h-24 w-24 rounded-[2.5rem] bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-900/20 flex items-center justify-center border border-red-200 dark:border-red-800 shadow-inner">
                  <Lock className="h-10 w-10 text-red-500" strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Accès Limité</h2>
                <div className="h-1.5 w-12 bg-red-500 rounded-full mx-auto" />
                <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed text-sm pt-2">
                  Vous n'êtes pas autorisé à accéder à la page des coupons tant qu'un dépôt minimum de 
                  <span className="text-red-500 mx-1 block text-lg font-black mt-1">
                    {minDepositRequired.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "XOF",
                      minimumFractionDigits: 0,
                    })}
                  </span> 
                  n'a pas été effectué.
                </p>
              </div>

              <div className="w-full pt-4 space-y-4">
                <Button 
                  onClick={() => router.push("/deposit")}
                  className="w-full rounded-[1.75rem] h-16 text-base font-black shadow-xl shadow-primary/20 active:scale-[0.95] transition-all bg-primary hover:bg-primary/90"
                >
                  Effectuer un dépôt
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => router.push("/dashboard")}
                  className="w-full h-14 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                >
                  Retour
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 pt-20">
      <AppBar showBackButton={true} backHref="/dashboard" title="Coupons" />

      <main className="mx-auto w-full max-w-md px-4 space-y-6">

        {/* Error Banner (blaffa pattern — inline, dismissible) */}
        {error && (
          <div className="fixed top-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-4 rounded-2xl border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-400 flex items-center gap-3 shadow-lg backdrop-blur-md">
              <span className="font-medium text-sm flex-1">{error}</span>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-full transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── User Profile Card (blaffa-mobile style) ── */}
        <Card className="rounded-[2.5rem] border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white dark:bg-slate-900 border-b-4 border-slate-50 dark:border-slate-800 transition-all">
          <CardContent className="px-6 py-4 sm:px-7 sm:py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6">
              <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 rounded-[1.25rem] sm:rounded-[1.5rem] bg-primary/5 border border-primary/10 shadow-sm shrink-0">
                  <AvatarFallback className="text-lg sm:text-xl font-bold text-primary">
                    {getInitials(userProfile?.first_name, userProfile?.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-xl sm:text-2xl text-slate-900 dark:text-white truncate">
                      {userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : "Chargement..."}
                    </h3>
                    <Badge variant="outline" className="rounded-xl px-2.5 py-0.5 border-primary/20 text-primary text-[9px] sm:text-[10px] uppercase font-black shrink-0">Tipster Pro</Badge>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          size={14}
                          className={cn(
                            i <= 4 ? "fill-yellow-400 text-yellow-400" : "text-slate-200 fill-slate-200"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-[13px] font-bold text-slate-400">• 4.0 de note</span>
                  </div>
                </div>
              </div>
              
              <div className="flex w-full sm:w-auto mt-2 sm:mt-0">
                {(globalSettings?.allow_all_users_publish_coupons ||
                  userProfile?.can_publish_coupons || 
                  userProfile?.is_staff || 
                  (userProfile as any)?.is_superuser || 
                  (userProfile as any)?.is_supperuser
                ) && (
                  <Button
                    onClick={() => router.push("/coupon/create")}
                    className="w-full sm:w-auto rounded-[1.1rem] h-12 sm:h-11 px-7 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all flex items-center gap-2 text-sm text-white"
                  >
                    <Plus className="h-4 w-4" strokeWidth={3} />
                    Publier
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Platform Scroll ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Plateformes</h2>
          </div>
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={selectedPlatformId === null ? "default" : "outline"}
                onClick={() => setSelectedPlatformId(null)}
                className="rounded-2xl px-5 font-bold h-11 border-slate-100 dark:border-slate-800"
              >
                <Trophy className={cn("h-4 w-4 mr-2", selectedPlatformId === null ? "text-white" : "text-primary")} />
                Tous
              </Button>
              {platformsLoading
                ? [1, 2, 3].map((i) => (
                    <div key={i} className="h-11 w-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ))
                : platforms.map((platform) => (
                    <Button
                      key={platform.id}
                      size="sm"
                      variant={selectedPlatformId === platform.id ? "default" : "outline"}
                      onClick={() => setSelectedPlatformId(platform.id)}
                      className="rounded-2xl px-5 font-bold h-11 border-slate-100 dark:border-slate-800"
                    >
                      <img src={platform.image} className="w-4 h-4 mr-2 object-contain" alt="" />
                      {platform.name}
                    </Button>
                  ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>

        {/* ── Coupons List ── */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-xs font-black uppercase tracking-widest">Chargement...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
              <Ticket size={48} className="text-slate-200 mb-4 opacity-50" />
              <p className="text-base font-bold text-slate-900 dark:text-white">Aucun coupon trouvé</p>
            </div>
          ) : (
            <div className="space-y-6">
              {coupons.map((coupon) => (
                <Card key={coupon.id} className="flex flex-col border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-[2rem] overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-900 border-b-4 border-slate-50 dark:border-slate-800">
                  <CardContent className="px-6 py-4 sm:px-7 sm:py-5 flex flex-col h-full justify-between gap-5">
                    <div className="space-y-5">
                      {/* Top Row: Author & Ticket Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 rounded-[1.25rem] bg-slate-100 dark:bg-slate-800 border border-slate-50 dark:border-slate-700 shadow-sm">
                            <AvatarFallback className="text-xs font-bold text-slate-500">
                              {getInitials(coupon.author_first_name, coupon.author_last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-[15px] text-slate-900 dark:text-white leading-tight line-clamp-1">
                              {coupon.author_first_name} {coupon.author_last_name}
                            </h3>
                            <div className="flex gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                  key={i}
                                  size={11}
                                  className={cn(
                                    i <= Math.round(coupon.author_rating || 4)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-slate-200 fill-slate-200"
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Bet Type Pill */}
                        <Badge className="shrink-0 rounded-xl px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-0 text-[9px] uppercase font-black tracking-tight flex items-center gap-1.5">
                          <Ticket size={12} className="rotate-45" />
                          {coupon.coupon_type === "combine"
                            ? `Combi (${coupon.match_count})`
                            : "Simple"}
                        </Badge>
                      </div>

                      {/* Côte & Platform */}
                      <div className="flex items-center justify-between rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800/60">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                            Côte totale
                          </p>
                          <span className="text-[26px] font-black text-slate-900 dark:text-white leading-none tracking-tight">
                            {coupon.odds}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center p-1.5 shadow-sm border border-slate-100 dark:border-slate-700">
                            <img src={coupon.bet_app.image} className="w-full h-full object-contain" alt="" />
                          </div>
                          <span className="font-bold text-[9px] text-slate-500 dark:text-slate-400 max-w-[70px] truncate text-center">
                            {coupon.bet_app.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between pt-2 mt-auto">
                      <div className="flex items-center gap-5">
                        <button
                          onClick={() => coupon.can_rate && handleVote(coupon.id, "like")}
                          disabled={!coupon.can_rate && !coupon.user_liked && !coupon.user_disliked}
                          className={cn(
                            "flex items-center gap-1.5 text-[13px] font-bold transition-all",
                            coupon.user_liked ? "text-primary scale-110" : "text-slate-400 hover:text-primary"
                          )}
                        >
                          <ThumbsUp size={18} className={coupon.user_liked ? "fill-current" : ""} />
                          {coupon.likes_count || 0}
                        </button>
                        <button
                          onClick={() => coupon.can_rate && handleVote(coupon.id, "dislike")}
                          disabled={!coupon.can_rate && !coupon.user_liked && !coupon.user_disliked}
                          className={cn(
                            "flex items-center gap-1.5 text-[13px] font-bold transition-all",
                            coupon.user_disliked ? "text-red-500 scale-110" : "text-slate-400 hover:text-red-500"
                          )}
                        >
                          <ThumbsDown size={18} className={coupon.user_disliked ? "fill-current" : ""} />
                          {coupon.dislikes_count || 0}
                        </button>
                        <button
                          onClick={() => handleOpenComments(coupon)}
                          className="flex items-center gap-1.5 text-[13px] font-bold text-slate-400 hover:text-primary transition-all"
                        >
                          <MessageCircle size={18} />
                          {coupon.total_comments || 0}
                        </button>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleCopy(coupon.code)}
                        className={cn(
                          "rounded-[1.1rem] h-10 px-6 font-mono font-black tracking-widest text-xs uppercase transition-all shadow-sm active:scale-95 border-0",
                          copiedCode === coupon.code
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-primary text-white shadow-primary/20 hover:bg-primary/90"
                        )}
                      >
                        {copiedCode === coupon.code ? <Check className="h-3.5 w-3.5" /> : coupon.code}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Comments Drawer (Blaffa Native Feel) ── */}
      <Drawer open={showCommentModal} onOpenChange={(open) => !open && handleCloseComments()}>
        <DrawerContent className="rounded-t-[3rem] bg-white dark:bg-slate-950 border-0 h-[85vh] outline-none">
          <div className="mx-auto w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-4 mb-2" />
          
          <DrawerHeader className="px-8 pb-4 text-left">
            <DrawerTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Discussion</DrawerTitle>
            <DrawerDescription className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
              {selectedCoupon?.total_comments || 0} avis sur ce pronostic
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 px-8">
              <div className="space-y-6 pb-24 pt-2">
                {commentsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-20 px-10 space-y-6">
                    <p className="text-slate-400 text-xs font-bold leading-relaxed">Soyez le premier à commenter.</p>
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-4 animate-in slide-in-from-bottom-5 fade-in duration-500">
                      <Avatar className="h-10 w-10 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-sm">
                        <AvatarFallback className="text-[11px] font-black text-primary uppercase">
                          {getInitials(c.author.first_name, c.author.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1.5">
                        <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-[2rem] rounded-tl-none border border-slate-100 dark:border-slate-800/50 shadow-sm">
                          <p className="text-sm text-slate-700 dark:text-slate-300 font-bold">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="p-6 pt-2 absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-950">
              <div className="relative group">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendComment()
                    }
                  }}
                  placeholder="Écrire une analyse..."
                  className="h-16 pl-6 pr-20 rounded-[2rem] bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 focus-visible:ring-primary focus-visible:ring-offset-0 text-sm font-bold shadow-inner placeholder:text-slate-400"
                />
                <div className="absolute right-2 top-2">
                  <Button
                    onClick={handleSendComment}
                    disabled={!commentText.trim()}
                    className="h-12 w-12 rounded-[1.5rem] bg-primary text-white shadow-lg p-0"
                  >
                    <Send size={20} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default function CouponPage() {
  return (
    <AuthGuard>
      <CouponContent />
    </AuthGuard>
  )
}
