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
            <CardContent className="p-10 flex flex-col items-center text-center space-y-8">
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
        <Card className="rounded-[2rem] border-0 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 border-b-4 border-slate-50 dark:border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 rounded-2xl bg-primary/5 border border-primary/10">
                  <AvatarFallback className="text-lg font-bold text-primary">
                    {getInitials(userProfile?.first_name, userProfile?.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : "Chargement..."}
                  </h3>
                  <div className="flex gap-0.5 mt-1">
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
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {(userProfile?.can_publish_coupons || 
                  userProfile?.is_staff || 
                  (userProfile as any)?.is_superuser || 
                  (userProfile as any)?.is_supperuser
                ) && (
                  <Button
                    size="icon"
                    onClick={() => router.push("/coupon/create")}
                    className="h-10 w-10 p-0 rounded-xl shadow-lg shadow-primary/20"
                  >
                    <Plus className="h-6 w-6" strokeWidth={3} />
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
                className="rounded-2xl px-5 font-bold h-11 border-slate-100"
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
                      className="rounded-2xl px-5 font-bold h-11 border-slate-100"
                    >
                      <img src={platform.image} className="w-4 h-4 mr-2 object-contain" alt="" />
                      {platform.name}
                    </Button>
                  ))}
            </div>
            <ScrollBar orientation="horizontal" />
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
                <Card
                  key={coupon.id}
                  className="group relative overflow-hidden rounded-[2.5rem] border-0 bg-white dark:bg-slate-950 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all active:scale-[0.98] border-b-8 border-slate-50 dark:border-slate-900"
                >
                  <CardContent className="p-8 space-y-7">
                    {/* Premium Header: Author & Verified Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/20 rounded-[1.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          <Avatar className="h-16 w-16 rounded-[1.5rem] bg-slate-100 dark:bg-slate-900 border-2 border-white dark:border-slate-800 shadow-md relative z-10 transition-transform group-hover:scale-105">
                            <AvatarFallback className="text-xl font-black text-primary uppercase">
                              {getInitials(coupon.author_first_name, coupon.author_last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center text-white shadow-lg z-20">
                            <Check size={10} strokeWidth={4} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-black text-xl text-slate-900 dark:text-white leading-none tracking-tight">
                              {coupon.author_first_name} {coupon.author_last_name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="rounded-xl px-3 py-0.5 h-5 border-primary/20 bg-primary/5 text-primary text-[9px] uppercase font-black tracking-widest">Premium Tipster</Badge>
                            <div className="flex items-center gap-1">
                              <Star size={12} className="fill-amber-400 text-amber-400" />
                              <span className="text-[11px] font-black text-slate-900 dark:text-white">{coupon.author_rating || 4.8}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                        <Trophy size={20} className="text-amber-500" />
                      </div>
                    </div>

                    {/* Premium Odds Display */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative group/odds bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 transition-all hover:border-primary/20 overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                          <Ticket size={40} className="rotate-12" />
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 leading-none">CÔTE TOTALE</p>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                            {coupon.odds}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-950 p-2.5 shadow-sm border border-slate-100 dark:border-slate-800/50 flex items-center justify-center">
                          <img src={coupon.bet_app.image} className="w-full h-full object-contain" alt="" />
                        </div>
                        <span className="font-black text-[10px] uppercase tracking-widest text-slate-500 leading-none">
                          {coupon.bet_app.name}
                        </span>
                      </div>
                    </div>

                    {/* Summary Bar */}
                    <div className="flex items-center gap-4 py-1">
                      <div className="h-px flex-1 bg-slate-100 dark:bg-slate-900" />
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800">
                        <Ticket size={14} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          {coupon.coupon_type === "combine" ? `${coupon.match_count} Évènements` : 'Pari Simple'}
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-slate-100 dark:bg-slate-900" />
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => coupon.can_rate && handleVote(coupon.id, "like")}
                            disabled={!coupon.can_rate && !coupon.user_liked && !coupon.user_disliked}
                            className={cn(
                              "h-12 px-5 rounded-[1.5rem] flex items-center gap-2 transition-all active:scale-95 border-2",
                              coupon.user_liked 
                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                                : "bg-slate-50 dark:bg-slate-900 border-transparent text-slate-500"
                            )}
                          >
                            <ThumbsUp size={18} className={cn("transition-transform", coupon.user_liked && "scale-110")} />
                            <span className="text-xs font-black">{coupon.likes_count || 0}</span>
                          </button>
                          
                          <button
                            onClick={() => coupon.can_rate && handleVote(coupon.id, "dislike")}
                            disabled={!coupon.can_rate && !coupon.user_liked && !coupon.user_disliked}
                            className={cn(
                              "h-12 px-5 rounded-[1.5rem] flex items-center gap-2 transition-all active:scale-95 border-2",
                              coupon.user_disliked 
                                ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-200" 
                                : "bg-slate-50 dark:bg-slate-900 border-transparent text-slate-500"
                            )}
                          >
                            <ThumbsDown size={18} className={cn("transition-transform", coupon.user_disliked && "scale-110")} />
                            <span className="text-xs font-black">{coupon.dislikes_count || 0}</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleOpenComments(coupon)}
                          className="h-12 w-12 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-primary transition-all active:scale-95 border border-transparent hover:border-primary/20"
                        >
                          <div className="relative">
                            <MessageCircle size={20} />
                            {(coupon.total_comments || 0) > 0 && (
                              <div className="absolute -top-2 -right-2 h-4 w-4 bg-primary rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                <span className="text-[8px] font-black text-white">{coupon.total_comments}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>

                      <Button
                        size="lg"
                        onClick={() => handleCopy(coupon.code)}
                        className={cn(
                          "h-14 px-8 rounded-[1.75rem] font-mono font-black tracking-[0.2em] text-lg uppercase transition-all shadow-xl active:scale-95 border-0",
                          copiedCode === coupon.code
                            ? "bg-emerald-500 text-white shadow-emerald-200"
                            : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                        )}
                      >
                        {copiedCode === coupon.code ? <Check size={24} /> : coupon.code}
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
