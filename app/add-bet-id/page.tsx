"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Search } from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AuthGuard } from "@/components/auth-guard"
import { AppBar } from "@/components/ui/app-bar"
import api from "@/lib/api"
import type { Platform } from "@/lib/types"

interface SearchUserResponse {
  UserId: number
  Name: string
  CurrencyId: number
}

function AddBetIdContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const flow = searchParams.get("flow") || "deposit"
  const returnPath =
    searchParams.get("return") || (flow === "withdraw" ? "/withdraw" : "/deposit")
  const targetStep = Number(searchParams.get("targetStep") || "3")

  const [appId, setAppId] = useState("")
  const [platformId, setPlatformId] = useState<string>(searchParams.get("platform") || "")
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [searchResult, setSearchResult] = useState<SearchUserResponse | null>(null)
  const [pendingBetId, setPendingBetId] = useState<{ appId: string; platformId: string } | null>(null)

  // Fetch platforms
  const { data: platforms, isLoading: loadingPlatforms } = useQuery({
    queryKey: ["platforms", flow],
    queryFn: async () => {
      const response = await api.get<Platform[]>("/mobcash/plateform", {
        params: { type: flow === "withdraw" ? "withdrawal" : "deposit" }
      })
      return response.data.filter((p) => p.enable)
    },
  })

  // Search user mutation
  const searchUserMutation = useMutation({
    mutationFn: async () => {
      if (!platformId || !appId) {
        throw new Error("Veuillez sélectionner une plateforme et saisir un identifiant")
      }
      const response = await api.post<SearchUserResponse>("/mobcash/search-user", {
        app_id: platformId,
        userid: appId,
      })
      return response.data
    },
    onSuccess: (data) => {
      // Validate user exists
      if (data.UserId === 0) {
        setErrorMessage("Utilisateur non trouvé. Veuillez vérifier l'identifiant de pari.")
        setShowErrorModal(true)
        return
      }

      // Validate currency
      if (data.CurrencyId !== 27) {
        setErrorMessage("La devise de cet utilisateur n'est pas valide. Seule la devise XOF (27) est acceptée.")
        setShowErrorModal(true)
        return
      }

      // Valid user - show confirmation modal
      setSearchResult(data)
      setPendingBetId({ appId, platformId })
      setShowConfirmModal(true)
    },
    onError: (error: any) => {
      const errorData =
        error?.originalError?.response?.data ||
        error?.response?.data ||
        error?.data

      // Handle field-specific errors (400 status)
      if (error?.originalError?.response?.status === 400) {
        const errorMsg = errorData?.details || errorData?.detail || errorData?.error || errorData?.message || error.message
        setErrorMessage(errorMsg || "Erreur lors de la recherche de l'utilisateur")
      } else {
        setErrorMessage(error.message || "Erreur lors de la recherche de l'utilisateur")
      }
      setShowErrorModal(true)
    },
  })

  // Add bet ID mutation
  const addBetIdMutation = useMutation({
    mutationFn: async () => {
      if (!pendingBetId) {
        throw new Error("Données manquantes")
      }
      const response = await api.post("/mobcash/user-app-id/", {
        user_app_id: pendingBetId.appId,
        app_name: pendingBetId.platformId,
      })
      return response.data
    },
    onSuccess: () => {
      const pendingData = pendingBetId
      toast.success("Identifiant de pari ajouté avec succès!")
      queryClient.invalidateQueries({ queryKey: ["bet-ids"] })
      setShowConfirmModal(false)
      setAppId("")
      setPendingBetId(null)
      setSearchResult(null)
      if (pendingData && typeof window !== "undefined") {
        const storageKey = flow === "withdraw" ? "withdrawReturnData" : "depositReturnData"
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            action: "addBet",
            platformId: pendingData.platformId,
            user_app_id: pendingData.appId,
            targetStep,
          }),
        )
      }
      router.push(returnPath)
    },
    onError: (error: any) => {
      const errorData =
        error?.originalError?.response?.data ||
        error?.response?.data ||
        error?.data

      // Handle field-specific errors (400 status)
      if (error?.originalError?.response?.status === 400) {
        const errorMsg = errorData?.details || errorData?.detail || errorData?.error || errorData?.message || error.message
        toast.error(errorMsg || "Erreur lors de l'ajout de l'identifiant")
      } else {
        toast.error(error.message || "Erreur lors de l'ajout de l'identifiant")
      }
      setShowConfirmModal(false)
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (!appId || appId.length < 3) {
      toast.error("Veuillez saisir un identifiant valide")
      return
    }

    if (!platformId) {
      toast.error("Veuillez sélectionner une plateforme")
      return
    }

    searchUserMutation.mutate()
  }

  const handleConfirmAdd = () => {
    if (pendingBetId) {
      addBetIdMutation.mutate()
    }
  }

  return (
    <div className="min-h-screen pb-24 pt-16 sm:pt-20">
      {/* Header */}
      <AppBar />

      <main className="mx-auto w-full max-w-md p-4 sm:p-6 md:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(returnPath)}
              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{t("addBetId")}</h1>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
          
          <div className="relative space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nouvel identifiant</h2>
              <p className="text-xs text-slate-500">Ajoutez votre ID de compte de la plateforme de paris</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="platform" className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("platform")}</Label>
                {loadingPlatforms ? (
                  <div className="h-12 w-full animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl" />
                ) : (
                  <Select value={platformId} onValueChange={setPlatformId}>
                    <SelectTrigger className="h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary">
                      <SelectValue placeholder="Sélectionner une plateforme" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl">
                      {platforms?.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id} className="rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              src={platform.image || "/placeholder.svg"}
                              alt={platform.name}
                              className="w-6 h-6 object-contain"
                            />
                            <span className="font-medium">{platform.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="appId" className="text-xs font-bold uppercase tracking-wider text-slate-500">Identifiant de pari</Label>
                <div className="relative">
                  <Input
                    id="appId"
                    type="text"
                    placeholder="Ex: 123456789"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    className="h-12 text-base font-medium bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl pl-4 focus:ring-primary"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Entrez votre ID de compte depuis votre plateforme de paris. Il sera validé avant l'ajout.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                disabled={searchUserMutation.isPending || addBetIdMutation.isPending}
              >
                {searchUserMutation.isPending ? (
                  <>
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                    Validation en cours...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher et ajouter
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'ajout</DialogTitle>
            <DialogDescription>
              Voulez-vous ajouter cet identifiant de pari?
            </DialogDescription>
          </DialogHeader>
          {searchResult && (
            <div className="space-y-3 py-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nom:</span>
                <span className="font-medium">{searchResult.Name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Identifiant:</span>
                <span className="font-medium">{appId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plateforme:</span>
                <span className="font-medium">
                  {platforms?.find((p) => p.id === platformId)?.name || platformId}
                </span>
              </div>
            </div>
          )}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmModal(false)
                setPendingBetId(null)
                setSearchResult(null)
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirmAdd}
              disabled={addBetIdMutation.isPending}
              className="flex-1"
            >
              {addBetIdMutation.isPending ? t("loading") : "Confirmer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-destructive">Erreur</DialogTitle>
            <DialogDescription>
              {errorMessage || "Une erreur est survenue"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowErrorModal(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AddBetIdPage() {
  return (
    <AuthGuard>
      <AddBetIdContent />
    </AuthGuard>
  )
}