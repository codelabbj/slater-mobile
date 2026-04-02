"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthGuard } from "@/components/auth-guard"
import { AppBar } from "@/components/ui/app-bar"
import { Check } from "lucide-react"
import api from "@/lib/api"
import type { Network } from "@/lib/types"

const COUNTRY_OPTIONS = [
  { code: "CI", name: "Côte d'Ivoire", indication: "225" },
  { code: "BF", name: "Burkina Faso", indication: "226" },
  { code: "SN", name: "Sénégal", indication: "221" },
  { code: "BJ", name: "Bénin", indication: "229" },
] as const

const DEFAULT_COUNTRY_CODE = "CI"

function AddPhoneContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const flow = searchParams.get("flow") || "deposit"
  const returnPath =
    searchParams.get("return") || (flow === "withdraw" ? "/withdraw" : "/deposit")
  const platformId = searchParams.get("platform") || ""
  const betUserAppId = searchParams.get("betUserAppId") || ""
  const targetStep = Number(searchParams.get("targetStep") || "5")

  const [phone, setPhone] = useState("")
  const [countryCode, setCountryCode] = useState<string>(DEFAULT_COUNTRY_CODE)
  const [networkId, setNetworkId] = useState<string>("")

  // Get network from URL params
  const preselectedNetworkId = searchParams.get("network")

  // Fetch networks
  const { data: networks, isLoading: loadingNetworks } = useQuery({
    queryKey: ["networks", flow],
    queryFn: async () => {
      const response = await api.get<Network[]>("/mobcash/network", {
        params: { type: flow === "withdraw" ? "withdrawal" : "deposit" }
      })
      return response.data.filter((n) => n.active_for_deposit)
    },
  })

  // Set preselected network when networks are loaded
  useEffect(() => {
    if (preselectedNetworkId && networks && !networkId) {
      setNetworkId(preselectedNetworkId)
    }
  }, [preselectedNetworkId, networks, networkId])

  // Format phone number: remove +, spaces, and all non-digit characters, keep only digits
  const formatPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '')
  }

  // Add phone mutation
  const addPhoneMutation = useMutation({
    mutationFn: async () => {
      const digitsOnly = formatPhoneNumber(phone)
      const country = COUNTRY_OPTIONS.find((c) => c.code === countryCode) ?? COUNTRY_OPTIONS[0]
      const finalPhone = `${country.indication}${digitsOnly}`
      const response = await api.post("/mobcash/user-phone/", {
        phone: finalPhone,
        network: Number(networkId),
      })
      return response.data
    },
    onSuccess: () => {
      toast.success("Numéro de téléphone ajouté avec succès!")
      queryClient.invalidateQueries({ queryKey: ["phones"] })
      if (
        typeof window !== "undefined" &&
        networkId &&
        platformId &&
        betUserAppId
      ) {
        const storageKey = flow === "withdraw" ? "withdrawReturnData" : "depositReturnData"
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            action: "addPhone",
            platformId,
            betUserAppId,
            networkId: Number(networkId),
            phone: `${COUNTRY_OPTIONS.find((c) => c.code === countryCode)?.indication ?? COUNTRY_OPTIONS[0].indication}${formatPhoneNumber(
              phone,
            )}`,
            targetStep,
          }),
        )
      }
      router.push(returnPath)
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de l'ajout du numéro")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const digitsOnly = formatPhoneNumber(phone)

    if (!phone || digitsOnly.length < 6) {
      toast.error("Veuillez saisir un numéro de téléphone valide")
      return
    }

    if (!networkId) {
      toast.error("Veuillez sélectionner un réseau")
      return
    }

    addPhoneMutation.mutate()
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
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{t("addPhone")}</h1>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
          
          <div className="relative space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nouveau numéro</h2>
              <p className="text-xs text-slate-500">
                {preselectedNetworkId
                  ? `Ajoutez un numéro pour ${networks?.find(n => n.id.toString() === preselectedNetworkId)?.public_name || 'le réseau'}`
                  : "Ajoutez un nouveau numéro pour vos transactions"
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("network")}</Label>
                {loadingNetworks ? (
                  <div className="h-12 w-full animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl" />
                ) : preselectedNetworkId ? (
                  <div className="p-3 bg-white/40 dark:bg-slate-900/40 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                    <img
                      src={networks?.find(n => n.id.toString() === preselectedNetworkId)?.image || "/placeholder.svg"}
                      alt={networks?.find(n => n.id.toString() === preselectedNetworkId)?.public_name}
                      className="w-8 h-8 object-contain"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-sm block">
                        {networks?.find(n => n.id.toString() === preselectedNetworkId)?.public_name}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Réseau sélectionné</span>
                    </div>
                    <Check className="h-4 w-4 text-emerald-500" />
                  </div>
                ) : (
                  <Select value={networkId} onValueChange={setNetworkId}>
                    <SelectTrigger className="h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary">
                      <SelectValue placeholder="Sélectionner un réseau" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl">
                      {networks?.map((network) => (
                        <SelectItem key={network.id} value={network.id.toString()} className="rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              src={network.image || "/placeholder.svg"}
                              alt={network.name}
                              className="w-6 h-6 object-contain"
                            />
                            <span className="font-medium">{network.public_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("phone")}</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[110px] h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl">
                      {COUNTRY_OPTIONS.map((country) => (
                        <SelectItem key={country.code} value={country.code} className="rounded-lg">
                          +{country.indication}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Ex: 0700000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 h-12 text-base font-medium bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl px-4 focus:ring-primary"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Pays: {COUNTRY_OPTIONS.find((c) => c.code === countryCode)?.name} (+{COUNTRY_OPTIONS.find((c) => c.code === countryCode)?.indication})
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                disabled={addPhoneMutation.isPending}
              >
                {addPhoneMutation.isPending ? (
                   <>
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                    {t("loading")}
                  </>
                ) : (
                  "Ajouter le numéro"
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AddPhonePage() {
  return (
    <AuthGuard>
      <AddPhoneContent />
    </AuthGuard>
  )
}