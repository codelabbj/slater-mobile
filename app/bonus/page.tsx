"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { ArrowLeft, Gift, TrendingUp } from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AuthGuard } from "@/components/auth-guard"
import { AppBar } from "@/components/ui/app-bar"
import { getUser, type User } from "@/lib/auth"
import api from "@/lib/api"
import type { Bonus, PaginatedResponse, Platform, UserAppId } from "@/lib/types"
import { formatDate, cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"
import { useEffect } from "react"

function BonusContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const { referralBonusEnabled, isLoading: settingsLoading } = useSettings()

  // Form state for bonus transaction
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedBetId, setSelectedBetId] = useState<UserAppId | null>(null)
  const [amount, setAmount] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

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

  // Redirect if referral bonus is disabled
  useEffect(() => {
    if (!settingsLoading && !referralBonusEnabled) {
      router.push("/dashboard")
    }
  }, [referralBonusEnabled, settingsLoading, router])

  // Show loading or nothing while checking settings
  if (settingsLoading) {
    return (
      <div className="min-h-screen gradient-background flex items-center justify-center mobile-safe-touch">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-2"></div>
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    )
  }

  // Don't render if referral bonus is disabled
  if (!referralBonusEnabled) {
    return null
  }

  // Fetch platforms
  const { data: platforms, isLoading: loadingPlatforms } = useQuery({
    queryKey: ["platforms"],
    queryFn: async () => {
      const response = await api.get<Platform[]>("/mobcash/plateform")
      return response.data.filter((p) => p.enable)
    },
  })

  // Fetch bet IDs
  const { data: betIds, isLoading: loadingBetIds } = useQuery({
    queryKey: ["bet-ids", selectedPlatform?.id],
    queryFn: async () => {
      if (!selectedPlatform) return []
      const response = await api.get<UserAppId[]>("/mobcash/user-app-id", {
        params: { app_name: selectedPlatform.id },
      })
      return response.data
    },
    enabled: !!selectedPlatform,
  })

  // Fetch user profile to get current bonus_available
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const response = await api.get("/auth/me")
      return response.data
    },
  })

  const { data: bonusData, isLoading: bonusLoading } = useQuery<PaginatedResponse<Bonus>>({
    queryKey: ["bonus"],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Bonus>>("/mobcash/bonus")
      return response.data
    },
  })

  // Use bonus_available from user profile, fallback to localStorage user
  const bonusAvailable = userProfile?.bonus_available ?? user?.bonus_available ?? 0

  // Create bonus transaction mutation
  const bonusTransactionMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/mobcash/transaction-bonus", {
        app: selectedPlatform!.id,
        user_app_id: selectedBetId!.user_app_id,
        amount: Number(amount),
      })
      return response.data
    },
    onSuccess: () => {
      toast.success("Transaction bonus créée avec succès!")
      queryClient.invalidateQueries({ queryKey: ["bonus"] })
      queryClient.invalidateQueries({ queryKey: ["recent-transactions"] })
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })
      setShowConfirmDialog(false)
      setAmount("")
      setSelectedPlatform(null)
      setSelectedBetId(null)
    },
    onError: (error: any) => {
      const errorData = 
        error?.originalError?.response?.data || 
        error?.response?.data || 
        error?.data
      
      if (error?.originalError?.response?.status === 400) {
        const errorMsg = errorData?.details || errorData?.detail || errorData?.error || errorData?.message || error.message
        toast.error(errorMsg || "Erreur lors de la création de la transaction bonus")
      } else {
        toast.error(error.message || "Erreur lors de la création de la transaction bonus")
      }
    },
  })

  const totalBonus = bonusData?.results.reduce((sum, bonus) => sum + Number(bonus.amount), 0) || 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPlatform) {
      toast.error("Veuillez sélectionner une plateforme")
      return
    }

    if (!selectedBetId) {
      toast.error("Veuillez sélectionner un identifiant de pari")
      return
    }

    const amountNum = Number(amount)
    if (!amount || amountNum <= 0) {
      toast.error("Veuillez saisir un montant valide")
      return
    }

    if (amountNum > bonusAvailable) {
      toast.error("Le montant ne peut pas dépasser votre bonus disponible")
      return
    }

    setShowConfirmDialog(true)
  }

  const handleConfirm = () => {
    setShowConfirmDialog(false)
    bonusTransactionMutation.mutate()
  }

  return (
    <div className="min-h-screen pb-24 pt-16 sm:pt-20">
      <AppBar />

      <main className="mx-auto w-full max-w-md p-4 sm:p-6 md:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{t("bonus")}</h1>
          </div>
        </div>

        {/* Premium Bonus Card */}
        <div className="relative overflow-hidden rounded-3xl p-8 bg-slate-900 shadow-2xl mb-8">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/10 shadow-inner">
              <Gift className="h-8 w-8 text-primary shadow-sm" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Bonus Disponible</p>
            <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
              {bonusAvailable.toLocaleString()} <span className="text-primary">FCFA</span>
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Cumul: {totalBonus} FCFA</span>
            </div>
          </div>
        </div>

        {/* Use Bonus Form */}
        <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl mb-8">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Utiliser mon bonus</h3>
            <p className="text-xs text-slate-500 mt-1">Créez une transaction vers votre plateforme</p>
          </div>

          {bonusAvailable > 0 ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t("platform")}</Label>
                {loadingPlatforms ? (
                  <div className="h-12 w-full animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
                ) : (
                  <Select
                    value={selectedPlatform?.id || ""}
                    onValueChange={(value) => {
                      const platform = platforms?.find((p) => p.id === value)
                      setSelectedPlatform(platform || null)
                      setSelectedBetId(null)
                    }}
                  >
                    <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl">
                      <SelectValue placeholder="Sélectionner une plateforme" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms?.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id}>
                          <div className="flex items-center gap-2">
                            <img
                              src={platform.image || "/placeholder.svg"}
                              alt={platform.name}
                              className="w-5 h-5 object-contain"
                            />
                            <span className="font-medium text-sm">{platform.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedPlatform && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t("selectBetId")}</Label>
                  {loadingBetIds ? (
                    <div className="h-12 w-full animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
                  ) : (
                    <Select
                      value={selectedBetId?.id.toString() || ""}
                      onValueChange={(value) => {
                        const betId = betIds?.find((b) => b.id.toString() === value)
                        setSelectedBetId(betId || null)
                      }}
                    >
                      <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl">
                        <SelectValue placeholder="Sélectionner un identifiant" />
                      </SelectTrigger>
                      <SelectContent>
                        {betIds?.map((betId) => (
                          <SelectItem key={betId.id} value={betId.id.toString()}>
                            <span className="font-mono text-xs">{betId.user_app_id}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Montant (FCFA)</Label>
                <div className="relative group">
                  <Input
                    type="number"
                    placeholder="Ex: 5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-5 h-12 text-sm bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary/20"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity">
                    MAX: {bonusAvailable}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className={cn(
                  "w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg",
                  bonusTransactionMutation.isPending ? "scale-95 opacity-80" : "hover:scale-[1.02] shadow-primary/20"
                )}
                disabled={!selectedPlatform || !selectedBetId || !amount || bonusTransactionMutation.isPending}
              >
                {bonusTransactionMutation.isPending ? "Traitement..." : "Créer la transaction"}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Gift className="h-12 w-12 text-slate-200 dark:text-slate-700 mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-6 line-clamp-2">
                Vous n'avez pas de bonus disponible
              </p>
            </div>
          )}
        </div>

        {/* Bonus History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Historique des bonus</h3>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
              {bonusData?.count || 0} Total
            </span>
          </div>

          {bonusLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 w-full animate-pulse bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
              ))}
            </div>
          ) : !bonusData?.results || bonusData.results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Gift className="h-10 w-10 text-slate-200 mb-4" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucun historique</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bonusData.results.map((bonus) => (
                <div
                  key={bonus.id}
                  className="group relative overflow-hidden rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Gift className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{bonus.reason_bonus}</p>
                        <p className="text-[10px] font-medium text-slate-400">
                          {formatDate(bonus.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-500">
                        +{bonus.amount.toLocaleString()} <span className="text-[10px]">FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Dialog Redesigned */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="rounded-3xl border-0 p-8 shadow-2xl">
          <DialogHeader className="mb-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
              <Gift className="h-8 w-8 text-primary shadow-sm" />
            </div>
            <DialogTitle className="text-xl font-black text-center text-slate-900 dark:text-white">Confirmer l'utilisation</DialogTitle>
            <DialogDescription className="text-center text-slate-500">
              Veuillez vérifier les informations de votre transaction bonus.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mb-8">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider">{t("platform")}</span>
                <span className="text-slate-900 dark:text-white font-bold">{selectedPlatform?.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Identifiant</span>
                <span className="text-slate-900 dark:text-white font-mono font-bold">{selectedBetId?.user_app_id}</span>
              </div>
              <div className="h-px bg-slate-200 dark:border-slate-700" />
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Montant Total</span>
                <span className="text-xl font-black text-primary">{Number(amount).toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => setShowConfirmDialog(false)} className="flex-1 h-12 rounded-xl text-xs font-bold text-slate-400">
              ANNULER
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={bonusTransactionMutation.isPending}
              className="flex-1 h-12 rounded-xl text-xs font-bold shadow-lg shadow-primary/20"
            >
              {bonusTransactionMutation.isPending ? "EN COURS..." : "CONFIRMER"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function BonusPage() {
  return (
    <AuthGuard>
      <BonusContent />
    </AuthGuard>
  )
}