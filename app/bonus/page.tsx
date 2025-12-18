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
import { getUser } from "@/lib/auth"
import api from "@/lib/api"
import type { Bonus, PaginatedResponse, Platform, UserAppId } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"
import { useEffect } from "react"

function BonusContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = getUser()
  const { referralBonusEnabled, isLoading: settingsLoading } = useSettings()

  // Form state for bonus transaction
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedBetId, setSelectedBetId] = useState<UserAppId | null>(null)
  const [amount, setAmount] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

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
    <div className="min-h-screen gradient-background mobile-safe-touch">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b sticky top-0 z-20 safe-area-top">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">{t("bonus")}</h1>
            <p className="text-xs text-muted-foreground">
              Consultez et utilisez votre bonus de parrainage
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto space-y-4">
        {/* Current Bonus Card */}
        <Card className="floating-card border-0 shadow-lg relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-primary/15 dark:from-primary/20 dark:via-primary/10 dark:to-primary/25">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/10 animate-pulse"></div>
          <CardContent className="relative pt-6 pb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <p className="text-xs font-medium text-primary/80 uppercase tracking-wider">{t("bonusAvailable")}</p>
                </div>
                <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-primary via-primary/80 to-primary/90 bg-clip-text text-transparent">
                  {bonusAvailable.toLocaleString()} FCFA
                </p>
                <p className="text-xs text-muted-foreground/80 font-medium">
                  Utilisable pour vos transactions éligibles
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl scale-110 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-primary/15 to-primary/25 border border-primary/20 rounded-3xl p-5 flex items-center justify-center shadow-xl shadow-primary/10">
                  <Gift className="h-12 w-12 sm:h-14 sm:w-14 text-primary drop-shadow-sm" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Earned Card */}
        <Card className="floating-card border-0 shadow-lg">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total gagné</p>
                <p className="text-2xl font-bold">{totalBonus} FCFA</p>
              </div>
              <div className="bg-emerald-500/10 rounded-2xl p-3">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Bonus Transaction */}
        <Card className="floating-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">Utiliser mon bonus</CardTitle>
            <CardDescription className="text-xs">
              Créez une transaction avec votre bonus disponible
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bonusAvailable > 0 ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">{t("platform")}</Label>
                  {loadingPlatforms ? (
                    <div className="text-sm text-muted-foreground">{t("loading")}</div>
                  ) : (
                    <Select
                      value={selectedPlatform?.id || ""}
                      onValueChange={(value) => {
                        const platform = platforms?.find((p) => p.id === value)
                        setSelectedPlatform(platform || null)
                        setSelectedBetId(null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une plateforme" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms?.map((platform) => (
                          <SelectItem key={platform.id} value={platform.id}>
                            <div className="flex items-center gap-2">
                              <img
                                src={platform.image || "/placeholder.svg"}
                                alt={platform.name}
                                className="w-6 h-6 object-contain"
                              />
                              {platform.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedPlatform && (
                  <div className="space-y-2">
                    <Label htmlFor="betId">{t("selectBetId")}</Label>
                    {loadingBetIds ? (
                      <div className="text-sm text-muted-foreground">{t("loading")}</div>
                    ) : (
                      <Select
                        value={selectedBetId?.id.toString() || ""}
                        onValueChange={(value) => {
                          const betId = betIds?.find((b) => b.id.toString() === value)
                          setSelectedBetId(betId || null)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un identifiant de pari" />
                        </SelectTrigger>
                        <SelectContent>
                          {betIds?.map((betId) => (
                            <SelectItem key={betId.id} value={betId.id.toString()}>
                              {betId.user_app_id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="amount">Montant (FCFA)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="1000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={bonusAvailable}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum: {bonusAvailable} FCFA
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!selectedPlatform || !selectedBetId || !amount || bonusTransactionMutation.isPending}
                >
                  {bonusTransactionMutation.isPending ? t("loading") : "Créer la transaction"}
                </Button>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  Vous n&apos;avez pas de bonus disponible pour le moment.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Vos bonus apparaîtront ici une fois que vous en aurez reçu.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bonus History */}
        <Card className="floating-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">Historique des bonus</CardTitle>
            <CardDescription className="text-xs">
              {bonusData?.count || 0} bonus reçu
              {(bonusData?.count || 0) > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bonusLoading ? (
              <div className="text-center py-10 text-muted-foreground">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mb-2" />
                <p className="text-sm">{t("loading")}</p>
              </div>
            ) : !bonusData?.results || bonusData.results.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 mb-3">
                  <Gift className="h-6 w-6 text-muted-foreground/70" />
                </div>
                <p className="font-semibold text-foreground">Aucun bonus pour le moment</p>
                <p className="text-xs mt-1">
                  Vos bonus apparaîtront ici dès qu&apos;ils seront crédités.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bonusData.results.map((bonus) => (
                  <div
                    key={bonus.id}
                    className="p-4 rounded-2xl border border-amber-500/20 bg-background/80 hover:bg-amber-500/5 hover:border-amber-500/50 hover:shadow-md transition-all duration-200 ease-out"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-500/10 rounded-2xl p-2.5">
                          <Gift className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{bonus.reason_bonus}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDate(bonus.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm sm:text-base text-amber-500">
                          +{bonus.amount} FCFA
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la transaction bonus</DialogTitle>
            <DialogDescription>Veuillez vérifier les informations avant de confirmer</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("platform")}</span>
              <span className="font-medium">{selectedPlatform?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID de pari</span>
              <span className="font-medium">{selectedBetId?.user_app_id}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Montant</span>
              <span className="text-primary">{amount} FCFA</span>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="flex-1">
              {t("cancel")}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={bonusTransactionMutation.isPending}
              className="flex-1"
            >
              {bonusTransactionMutation.isPending ? t("loading") : "Confirmer"}
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
