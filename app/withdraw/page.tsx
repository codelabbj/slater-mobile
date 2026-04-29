"use client"

import { useState, useEffect, MouseEvent } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Plus, Pencil, Trash, Loader2, Info } from "lucide-react"
import { TransactionProgressBar } from "@/components/ui/transaction-progress-bar"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Youtube } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AuthGuard } from "@/components/auth-guard"
import { AppBar } from "@/components/ui/app-bar"
import api from "@/lib/api"
import type { Platform, Network, UserPhone, UserAppId, Transaction } from "@/lib/types"

const COUNTRY_OPTIONS = [
  { code: "CI", name: "Côte d'Ivoire", indication: "225" },
  { code: "BF", name: "Burkina Faso", indication: "226" },
  { code: "SN", name: "Sénégal", indication: "221" },
  { code: "BJ", name: "Bénin", indication: "229" },
] as const

const DEFAULT_COUNTRY_CODE = "CI"
function WithdrawContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()

  type WithdrawReturnData =
    | {
      action: "addBet"
      platformId: string
      user_app_id: string
      targetStep?: number
    }
    | {
      action: "addPhone"
      platformId: string
      betUserAppId: string
      networkId: number
      phone: string
      targetStep?: number
    }

  type SearchUserResponse = {
    UserId: number
    Name: string
    CurrencyId: number
  }

  // Step state
  const [step, setStep] = useState(1)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  
  const hasHelpStep = !!(selectedPlatform?.withdrawal_tuto_link || selectedPlatform?.why_withdrawal_fail)
  const totalSteps = hasHelpStep ? 6 : 5
  const [selectedBetId, setSelectedBetId] = useState<UserAppId | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [selectedPhone, setSelectedPhone] = useState<UserPhone | null>(null)
  const [amount, setAmount] = useState("")
  const [withdrawalCode, setWithdrawalCode] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showTransactionLinkDialog, setShowTransactionLinkDialog] = useState(false)
  const [transactionLink, setTransactionLink] = useState<string | null>(null)
  const [returnData, setReturnData] = useState<WithdrawReturnData | null>(null)
  const [betEditDialogOpen, setBetEditDialogOpen] = useState(false)
  const [betToEdit, setBetToEdit] = useState<UserAppId | null>(null)
  const [betEditValue, setBetEditValue] = useState("")
  const [betEditError, setBetEditError] = useState<string | null>(null)
  const [phoneEditDialogOpen, setPhoneEditDialogOpen] = useState(false)
  const [phoneToEdit, setPhoneToEdit] = useState<UserPhone | null>(null)
  const [phoneEditValue, setPhoneEditValue] = useState("")
  const [phoneEditError, setPhoneEditError] = useState<string | null>(null)
  const [phoneEditCountry, setPhoneEditCountry] = useState<string>(DEFAULT_COUNTRY_CODE)
  const [betDeleteDialogOpen, setBetDeleteDialogOpen] = useState(false)
  const [betToDelete, setBetToDelete] = useState<UserAppId | null>(null)
  const [phoneDeleteDialogOpen, setPhoneDeleteDialogOpen] = useState(false)
  const [phoneToDelete, setPhoneToDelete] = useState<UserPhone | null>(null)
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null)
  const [lastTransactionLoading, setLastTransactionLoading] = useState(false)
  const [lastTransactionActionType, setLastTransactionActionType] = useState<"cancel" | "finalize" | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem("withdrawReturnData")
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as WithdrawReturnData
        setReturnData(parsed)
      } catch (error) {
        console.error("Failed to parse withdrawReturnData", error)
      }
      window.localStorage.removeItem("withdrawReturnData")
    }

    // Refresh all API data on mount
    queryClient.invalidateQueries({ queryKey: ["platforms"] })
    queryClient.invalidateQueries({ queryKey: ["bet-ids"] })
    queryClient.invalidateQueries({ queryKey: ["networks"] })
    queryClient.invalidateQueries({ queryKey: ["phones"] })
    queryClient.invalidateQueries({ queryKey: ["last-transaction"] })
  }, [queryClient])

  // Fetch platforms
  const { data: platforms, isLoading: loadingPlatforms } = useQuery({
    queryKey: ["platforms"],
    queryFn: async () => {
      const response = await api.get<Platform[]>("/mobcash/plateform", {
        params: { type: "withdrawal" }
      })
      return response.data.filter((p) => p.enable)
    },
  })

  // Fetch bet IDs
  const { data: betIds, isLoading: loadingBetIds } = useQuery({
    queryKey: ["bet-ids", "withdrawal", selectedPlatform?.id],
    queryFn: async () => {
      if (!selectedPlatform) return []
      const response = await api.get<UserAppId[]>("/mobcash/user-app-id", {
        params: { app_name: selectedPlatform.id, type: "withdrawal" },
      })
      return response.data
    },
    enabled: !!selectedPlatform,
  })

  // Fetch networks
  const { data: networks, isLoading: loadingNetworks } = useQuery({
    queryKey: ["networks"],
    queryFn: async () => {
      const response = await api.get<Network[]>("/mobcash/network", {
        params: { type: "withdrawal" }
      })
      return response.data.filter((n) => n.active_for_with)
    },
    enabled: !!selectedPlatform,
  })

  const selectedNetworkKey =
    selectedNetwork?.uid || (selectedNetwork?.id ? String(selectedNetwork.id) : undefined)

  // Fetch phones filtered by selected network
  const { data: phones, isLoading: loadingPhones } = useQuery({
    queryKey: ["phones", "withdrawal", selectedNetworkKey],
    queryFn: async () => {
      if (!selectedNetworkKey) return []
      const response = await api.get<UserPhone[]>("/mobcash/user-phone/", {
        params: { network: selectedNetwork?.uid || selectedNetwork?.id, type: "withdrawal" },
      })
      return response.data
    },
    enabled: !!selectedNetworkKey,
  })

  // Fetch last pending transaction
  const { data: pendingTransaction, isLoading: loadingLastTransaction } = useQuery({
    queryKey: ["last-transaction", "withdrawal"],
    queryFn: async () => {
      try {
        const response = await api.get<any>("/mobcash/last-transaction")
        console.log("Last transaction response:", response.data)
        
        // Handle both single object and array responses
        const data = Array.isArray(response.data) ? response.data[0] : response.data
        
        if (data && (data.status === "pending" || data.status === "init_payment")) {
          console.log("Found pending/init_payment transaction:", data)
          return data as Transaction
        }
        return null
      } catch (error) {
        console.error("Error fetching last transaction:", error)
        return null
      }
    },
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (pendingTransaction) {
      setLastTransaction(pendingTransaction)
    } else {
      setLastTransaction(null)
    }
  }, [pendingTransaction])

  // Format phone number: remove +, spaces, and all non-digit characters, keep only digits
  const formatPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '')
  }

  const getCountryOption = (code: string) =>
    COUNTRY_OPTIONS.find((country) => country.code === code) ?? COUNTRY_OPTIONS[0]

  const detectCountryFromPhone = (phoneValue: string) => {
    const digits = formatPhoneNumber(phoneValue)
    return (
      COUNTRY_OPTIONS.find((country) => digits.startsWith(country.indication))?.code ||
      DEFAULT_COUNTRY_CODE
    )
  }

  const stripCountryPrefix = (phoneValue: string, countryCode: string) => {
    const digits = formatPhoneNumber(phoneValue)
    const country = getCountryOption(countryCode)
    if (digits.startsWith(country.indication)) {
      return digits.slice(country.indication.length)
    }
    return digits
  }

  const resetBetEditDialog = () => {
    setBetEditDialogOpen(false)
    setBetToEdit(null)
    setBetEditValue("")
    setBetEditError(null)
  }

  const resetPhoneEditDialog = () => {
    setPhoneEditDialogOpen(false)
    setPhoneToEdit(null)
    setPhoneEditValue("")
    setPhoneEditError(null)
    setPhoneEditCountry(DEFAULT_COUNTRY_CODE)
  }

  const resetBetDeleteDialog = () => {
    setBetDeleteDialogOpen(false)
    setBetToDelete(null)
  }

  const resetPhoneDeleteDialog = () => {
    setPhoneDeleteDialogOpen(false)
    setPhoneToDelete(null)
  }


  const betEditMutation = useMutation({
    mutationFn: async ({ bet, value }: { bet: UserAppId; value: string }) => {
      const trimmedValue = value.trim()
      if (!trimmedValue) {
        throw new Error("Veuillez saisir un identifiant valide")
      }

      const platformId = selectedPlatform?.id || bet.app
      if (!platformId) {
        throw new Error("Plateforme introuvable")
      }

      const searchResponse = await api.post<SearchUserResponse>("/mobcash/search-user", {
        app_id: platformId,
        userid: trimmedValue,
      })
      const searchResult = searchResponse.data

      if (searchResult.UserId === 0) {
        throw new Error("Utilisateur non trouvé. Vérifiez l'identifiant.")
      }

      if (searchResult.CurrencyId !== 27) {
        throw new Error("La devise de cet utilisateur n'est pas XOF (27).")
      }

      await api.patch(`/mobcash/user-app-id/${bet.id}/`, {
        user_app_id: trimmedValue,
        app_name: platformId,
      })
    },
    onSuccess: () => {
      toast.success("Identifiant mis à jour")
      queryClient.invalidateQueries({ queryKey: ["bet-ids", "withdrawal"] })
      resetBetEditDialog()
    },
    onError: (error: any) => {
      const apiError =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Erreur lors de la mise à jour de l'identifiant"
      setBetEditError(apiError)
    },
  })

  const deleteBetMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/mobcash/user-app-id/${id}/`)
    },
    onSuccess: () => {
      toast.success("Identifiant supprimé")
      queryClient.invalidateQueries({ queryKey: ["bet-ids", "withdrawal"] })
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erreur lors de la suppression de l'identifiant")
    },
  })

  const updatePhoneMutation = useMutation({
    mutationFn: async ({
      id,
      value,
      networkId,
    }: {
      id: number
      value: string
      networkId: number
    }) => {
      await api.patch(`/mobcash/user-phone/${id}/`, {
        phone: value,
        network: networkId,
      })
    },
    onSuccess: () => {
      toast.success("Numéro mis à jour")
      queryClient.invalidateQueries({ queryKey: ["phones", "withdrawal"] })
      resetPhoneEditDialog()
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Erreur lors de la mise à jour du numéro"
      setPhoneEditError(message)
      toast.error(message)
    },
  })

  const deletePhoneMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/mobcash/user-phone/${id}/`)
    },
    onSuccess: () => {
      toast.success("Numéro supprimé")
      queryClient.invalidateQueries({ queryKey: ["phones", "withdrawal"] })
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erreur lors de la suppression du numéro")
    },
  })

  const cancelLastTransactionMutation = useMutation({
    mutationFn: async (reference: string) => {
      setLastTransactionActionType("cancel")
      await api.post("/mobcash/cancel-transaction", { reference })
    },
    onSuccess: () => {
      toast.success("Transaction annulée")
      setLastTransaction(null)
      queryClient.invalidateQueries({ queryKey: ["last-transaction"] })
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erreur lors de l'annulation")
    },
    onSettled: () => {
      setLastTransactionActionType(null)
    },
  })

  const finalizeLastTransactionMutation = useMutation({
    mutationFn: async (reference: string) => {
      setLastTransactionActionType("finalize")
      const response = await api.post<Transaction>("/mobcash/finalize-transaction-user", { reference })
      return response.data
    },
    onSuccess: (data) => {
      handleTransactionSuccess(data, true)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erreur lors de la finalisation")
    },
    onSettled: () => {
      setLastTransactionActionType(null)
    },
  })

  // Helper function to handle transaction success (redirection, USSD, etc.)
  const handleTransactionSuccess = (data: Transaction, isFinalize: boolean = false) => {
    if (!isFinalize) {
      toast.success("Retrait créé avec succès! En attente de traitement.")
    } else {
      toast.success("Transaction finalisée")
    }

    setLastTransaction(null)
    sessionStorage.setItem('cached_transaction', JSON.stringify(data))
    queryClient.invalidateQueries({ queryKey: ["last-transaction"] })

    // 1. Direct USSD code from response
    if (data.ussd_code) {
      const ussdCode = data.ussd_code
      const encodedUssd = ussdCode.replace(/#/g, "%23")
      
      // Withdrawals usually don't have USSD modals, but we can call the tel link
      window.location.href = `tel:${encodedUssd}`
      return
    }

    // 2. Direct WhatsApp link from response
    if (data.whatsapp_link) {
      window.open(data.whatsapp_link, "_blank", "noopener,noreferrer")
      return
    }

    // 3. Direct Transaction link from response
    if (data.transaction_link) {
        setTransactionLink(data.transaction_link)
        setShowTransactionLinkDialog(true)
        return
    }

    // 4. Default: Redirect to Detail or Dashboard
    if (data.id) {
        router.push(`/transactions/detail?id=${data.id}`)
    } else {
        router.push("/dashboard")
    }
  }

  useEffect(() => {
    if (!returnData) return
    if (!platforms) return

    const platform = platforms.find((p) => p.id === returnData.platformId)
    if (!platform) {
      setReturnData(null)
      return
    }

    if (!selectedPlatform || selectedPlatform.id !== platform.id) {
      setSelectedPlatform(platform)
      return
    }

    if (returnData.action === "addBet") {
      if (!betIds) return
      const bet = betIds.find((betId) => betId.user_app_id === returnData.user_app_id)
      if (!bet) return
      setSelectedBetId(bet)
      setStep(returnData.targetStep || 3)
      setReturnData(null)
      return
    }

    if (returnData.action === "addPhone") {
      if (!betIds) return
      const bet = betIds.find((betId) => betId.user_app_id === returnData.betUserAppId)
      if (!bet) return
      if (!selectedBetId || selectedBetId.id !== bet.id) {
        setSelectedBetId(bet)
        return
      }

      if (!networks) return
      const network = networks.find((n) => n.id === returnData.networkId)
      if (!network) return
      if (!selectedNetwork || selectedNetwork.id !== network.id) {
        setSelectedNetwork(network)
        return
      }

      if (!phones) return
      const phone = phones.find(
        (phoneItem) => formatPhoneNumber(phoneItem.phone) === returnData.phone,
      )
      if (!phone) return

      setSelectedPhone(phone)
      setStep(returnData.targetStep || 5)
      setReturnData(null)
    }
  }, [
    returnData,
    platforms,
    selectedPlatform,
    betIds,
    selectedBetId,
    networks,
    selectedNetwork,
    phones,
  ])

  const handleEditBetId = (
    event: MouseEvent<HTMLButtonElement>,
    betId: UserAppId,
  ) => {
    event.stopPropagation()
    setBetToEdit(betId)
    setBetEditValue(betId.user_app_id)
    setBetEditError(null)
    setBetEditDialogOpen(true)
  }

  const handleBetEditConfirm = () => {
    if (!betToEdit) return
    const value = betEditValue.trim()
    if (!value) {
      setBetEditError("Veuillez saisir un identifiant valide")
      return
    }
    setBetEditError(null)
    betEditMutation.mutate({ bet: betToEdit, value })
  }

  const handleDeleteBetId = (
    event: MouseEvent<HTMLButtonElement>,
    betId: UserAppId,
  ) => {
    event.stopPropagation()
    setBetToDelete(betId)
    setBetDeleteDialogOpen(true)
  }

  const handleEditPhone = (
    event: MouseEvent<HTMLButtonElement>,
    phone: UserPhone,
  ) => {
    event.stopPropagation()
    setPhoneToEdit(phone)
    const detectedCountry = detectCountryFromPhone(phone.phone)
    setPhoneEditCountry(detectedCountry)
    setPhoneEditValue(stripCountryPrefix(phone.phone, detectedCountry))
    setPhoneEditError(null)
    setPhoneEditDialogOpen(true)
  }

  const handlePhoneEditConfirm = () => {
    if (!phoneToEdit) return
    const value = phoneEditValue.trim()
    if (!value) {
      setPhoneEditError("Veuillez saisir un numéro de téléphone")
      return
    }
    const formatted = formatPhoneNumber(value)
    if (!formatted) {
      setPhoneEditError("Numéro invalide")
      return
    }
    setPhoneEditError(null)
    updatePhoneMutation.mutate({
      id: phoneToEdit.id,
      value: `${getCountryOption(phoneEditCountry).indication}${formatted}`,
      networkId: phoneToEdit.network,
    })
  }

  const handleBetDeleteConfirm = () => {
    if (!betToDelete) return
    deleteBetMutation.mutate(betToDelete.id, {
      onSuccess: () => {
        resetBetDeleteDialog()
      },
      onError: () => {
        resetBetDeleteDialog()
      },
    })
  }

  const handlePhoneDeleteConfirm = () => {
    if (!phoneToDelete) return
    deletePhoneMutation.mutate(phoneToDelete.id, {
      onSuccess: () => {
        resetPhoneDeleteDialog()
      },
      onError: () => {
        resetPhoneDeleteDialog()
      },
    })
  }

  const handleDeletePhone = (
    event: MouseEvent<HTMLButtonElement>,
    phone: UserPhone,
  ) => {
    event.stopPropagation()
    setPhoneToDelete(phone)
    setPhoneDeleteDialogOpen(true)
  }

  // Submit withdrawal mutation
  const withdrawalMutation = useMutation({
    mutationFn: async () => {
      const formattedPhone = formatPhoneNumber(selectedPhone!.phone)
      const payload: any = {
        amount: Number(amount),
        phone_number: formattedPhone,
        app: selectedPlatform!.id,
        user_app_id: selectedBetId!.user_app_id,
        network: selectedNetwork!.id,
        withdriwal_code: withdrawalCode,
        source: "mobile",
      }

      // Add city and street if available from platform
      if (selectedPlatform!.city) {
        payload.city = selectedPlatform!.city
      }
      if (selectedPlatform!.street) {
        payload.street = selectedPlatform!.street
      }

      const response = await api.post("/mobcash/transaction-withdrawal", payload)
      return response.data
    },
    onSuccess: (data) => {
      handleTransactionSuccess(data, false)
    },
    onError: (error: any) => {
      // Check for rate limit error (error_time_message) in multiple possible locations
      const errorData =
        error?.originalError?.response?.data ||
        error?.response?.data ||
        error?.data

      const timeMessage =
        errorData?.error_time_message ||
        error?.originalError?.response?.data?.error_time_message ||
        error?.response?.data?.error_time_message

      if (timeMessage) {
        const message = Array.isArray(timeMessage)
          ? timeMessage[0]
          : timeMessage
        toast.error(`Trop de tentatives. Veuillez réessayer dans ${message}`)
      } else {
        toast.error(error.message || "Erreur lors de la création du retrait")
      }
    },
  })

  const handleNext = () => {
    // Prevent starting a new transaction if there is a pending one of any type
    if (lastTransaction) {
      toast.error(`Vous avez déjà une transaction de ${lastTransaction.type_trans === 'deposit' ? 'dépôt' : 'retrait'} en cours. Veuillez la finaliser ou l'annuler avant d'en créer une nouvelle.`)
      return
    }

    if (step === 1 && !selectedPlatform) {
      toast.error("Veuillez sélectionner une plateforme")
      return
    }
    if (step === 2 && !selectedBetId) {
      toast.error("Veuillez sélectionner un identifiant de pari")
      return
    }
    if (step === 3 && !selectedNetwork) {
      toast.error("Veuillez sélectionner un réseau")
      return
    }
    if (step === 4) {
      if (!selectedPhone) {
        toast.error("Veuillez sélectionner un numéro de téléphone")
        return
      }
      if (hasHelpStep) {
        setStep(5)
      } else {
        setStep(6)
      }
      return
    }

    if (step === 5 && hasHelpStep) {
      setStep(6)
      return
    }

    if ((step === 6) || (step === 5 && !hasHelpStep)) {
      const amountNum = Number(amount)
      if (!amount || amountNum <= 0) {
        toast.error("Veuillez saisir un montant valide")
        return
      }
      if (!withdrawalCode || withdrawalCode.length < 4) {
        toast.error("Veuillez saisir un code de retrait valide")
        return
      }
      if (selectedPlatform && amountNum < selectedPlatform.minimun_with) {
        toast.error(`Le montant minimum est ${selectedPlatform.minimun_with} FCFA`)
        return
      }
      if (selectedPlatform && amountNum > selectedPlatform.max_win) {
        toast.error(`Le montant maximum est ${selectedPlatform.max_win} FCFA`)
        return
      }
      if (!acceptTerms) {
        toast.error("Veuillez accepter les conditions d'utilisation")
        return
      }
      setShowConfirmDialog(true)
      return
    }

    setStep(step + 1)
  }

  const handleConfirm = () => {
    setShowConfirmDialog(false)
    withdrawalMutation.mutate()
  }

  const handleContinueTransaction = () => {
    if (transactionLink) {
      window.open(transactionLink, "_blank", "noopener,noreferrer")
      setShowTransactionLinkDialog(false)
      router.push("/dashboard")
    }
  }

  return (
    <>
      <AppBar />
      <div className="flex flex-col min-h-screen pb-24 pt-16 sm:pt-20">
        <div className="flex-1 overflow-y-auto w-full">
          <div className="mx-auto w-full max-w-md p-4 sm:p-6 md:p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (step > 1 ? setStep(step - 1) : router.push("/dashboard"))}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-full"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{t("withdraw")}</h1>
              </div>
              
              <TransactionProgressBar currentStep={step > 5 && !hasHelpStep ? 5 : step} totalSteps={totalSteps} type="withdrawal" />
            </div>

        {/* Last Transaction Summary Section - Only show if it matches the current page type */}
        {lastTransaction && lastTransaction.type_trans === 'withdrawal' && (
          <Card className="border-2 border-primary/20 bg-primary/5 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 rounded-2xl sm:rounded-3xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    Transaction en cours
                  </CardTitle>
                  <CardDescription>Vous avez une transaction en attente</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Référence</p>
                  <p className="text-sm font-mono font-bold text-primary">#{lastTransaction.reference}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-semibold text-sm capitalize">{lastTransaction.type_trans === 'withdrawal' ? 'Retrait' : 'Dépôt'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Montant</p>
                  <p className="font-bold text-base text-primary">
                    {lastTransaction.amount.toLocaleString()} <span className="text-xs">FCFA</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Plateforme</p>
                  <div className="flex items-center gap-2">
                    {lastTransaction.app_details?.image && (
                      <img src={lastTransaction.app_details.image} alt="" className="w-5 h-5 object-contain" />
                    )}
                    <p className="font-semibold text-sm">{lastTransaction.app_details?.name || lastTransaction.app}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="font-semibold text-sm">{lastTransaction.phone_number}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10"
                    onClick={() => cancelLastTransactionMutation.mutate(lastTransaction.reference)}
                    disabled={lastTransactionActionType !== null}
                  >
                    {lastTransactionActionType === "cancel" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Annuler"
                    )}
                  </Button>
                  <Button
                    className="flex-1 h-12 rounded-xl bg-primary shadow-lg shadow-primary/20"
                    onClick={() => finalizeLastTransactionMutation.mutate(lastTransaction.reference)}
                    disabled={lastTransactionActionType !== null}
                  >
                    {lastTransactionActionType === "finalize" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Finaliser"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step Container */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg mb-6">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5 opacity-50" />
          
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-emerald-500" />
          
          <div className="relative">
            {/* Step 1: Select Platform */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t("selectPlatform")}</h2>
                  <p className="text-xs text-slate-500">Choisissez votre plateforme de paris</p>
                </div>
                {loadingPlatforms ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mb-2"></div>
                    <p className="text-sm">{t("loading")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {platforms?.map((platform) => (
                      <div
                        key={platform.id}
                        onClick={() => {
                          setSelectedPlatform(platform)
                          setTimeout(() => setStep(2), 100)
                        }}
                        className={`group relative p-3 sm:p-4 rounded-xl border cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95 ${selectedPlatform?.id === platform.id
                          ? "border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                          : "border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                          }`}
                      >
                        {selectedPlatform?.id === platform.id && (
                          <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1 shadow-sm shadow-emerald-500/40">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <img
                          src={platform.image || "/placeholder.svg"}
                          alt={platform.name}
                          className="w-full h-12 object-contain mb-2 transition-transform duration-200 group-hover:scale-105"
                        />
                        <p className="text-center text-sm font-bold truncate">
                          {platform.name}
                        </p>
                        <p className="text-center text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-medium">
                          {platform.minimun_with.toLocaleString()} - {platform.max_win.toLocaleString()} FCFA
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Bet ID */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t("selectBetId")}</h2>
                  <p className="text-xs text-slate-500">Choisissez votre identifiant de pari</p>
                </div>
                {loadingBetIds ? (
                  <div className="text-center py-8">{t("loading")}</div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-2.5">
                      {betIds?.map((betId) => (
                        <div
                          key={betId.id}
                          onClick={() => {
                            setSelectedBetId(betId)
                            setTimeout(() => setStep(3), 100)
                          }}
                          className={`group p-4 rounded-xl border cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 ${selectedBetId?.id === betId.id
                            ? "border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                            : "border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{betId.user_app_id}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Identifiant de pari</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {selectedBetId?.id === betId.id && (
                                <div className="bg-emerald-500 rounded-full p-1 shadow-sm shadow-emerald-500/40">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                onClick={(event) => handleEditBetId(event, betId)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-500"
                                onClick={(event) => handleDeleteBetId(event, betId)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      className="w-full bg-white/50 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-700 rounded-xl h-12"
                      onClick={() => {
                        if (!selectedPlatform) {
                          toast.error("Veuillez sélectionner une plateforme")
                          return
                        }
                        const params = new URLSearchParams({
                          platform: selectedPlatform.id,
                          flow: "withdraw",
                          return: "/withdraw",
                          targetStep: "3",
                        })
                        router.push(`/add-bet-id?${params.toString()}`)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("addBetId")}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Select Network */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t("selectNetwork")}</h2>
                  <p className="text-xs text-slate-500">Choisissez votre réseau de paiement</p>
                </div>
                {loadingNetworks ? (
                  <div className="text-center py-8">{t("loading")}</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {networks?.map((network) => (
                      <div
                        key={network.id}
                        onClick={() => {
                          setSelectedNetwork(network)
                          setTimeout(() => setStep(4), 100)
                        }}
                        className={`group relative p-3 sm:p-4 rounded-xl border cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 ${selectedNetwork?.id === network.id
                          ? "border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                          : "border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                          }`}
                      >
                        {selectedNetwork?.id === network.id && (
                          <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1 shadow-sm shadow-emerald-500/40">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <img
                          src={network.image || "/placeholder.svg"}
                          alt={network.name}
                          className="w-full h-12 object-contain mb-2 transition-transform duration-200 group-hover:scale-105"
                        />
                        <p className="text-center font-bold text-sm text-slate-900 dark:text-white">{network.public_name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Select Phone */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t("selectPhone")}</h2>
                  <p className="text-xs text-slate-500">Choisissez votre numéro de téléphone</p>
                </div>
                {loadingPhones ? (
                  <div className="text-center py-8">{t("loading")}</div>
                ) : (
                  <div className="space-y-4">
                    {phones && phones.length > 0 ? (
                      <div className="grid gap-2.5">
                        {phones.map((phone) => (
                          <div
                            key={phone.id}
                            onClick={() => {
                              setSelectedPhone(phone)
                              setTimeout(() => setStep(5), 100)
                            }}
                            className={`group p-4 rounded-xl border cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 ${selectedPhone?.id === phone.id
                              ? "border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                              : "border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{phone.phone}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Numéro de téléphone</p>
                              </div>
                              <div className="flex items-center gap-1">
                                {selectedPhone?.id === phone.id && (
                                  <div className="bg-emerald-500 rounded-full p-1 shadow-sm shadow-emerald-500/40">
                                    <Check className="h-4 w-4 text-white" />
                                  </div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                  onClick={(event) => handleEditPhone(event, phone)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-red-500"
                                  onClick={(event) => handleDeletePhone(event, phone)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <p className="text-sm font-medium">Aucun numéro disponible pour {selectedNetwork?.public_name}</p>
                        <p className="text-xs mt-1">Ajoutez un nouveau numéro ci-dessous</p>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full bg-white/50 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-700 rounded-xl h-12"
                      onClick={() => {
                        if (!selectedPlatform || !selectedBetId || !selectedNetwork) {
                          toast.error("Veuillez sélectionner une plateforme, un identifiant et un réseau")
                          return
                        }
                        const params = new URLSearchParams({
                          network: selectedNetwork.id.toString(),
                          platform: selectedPlatform.id,
                          betUserAppId: selectedBetId.user_app_id,
                          flow: "withdraw",
                          return: "/withdraw",
                          targetStep: "5",
                        })
                        router.push(`/add-phone?${params.toString()}`)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("addPhone")} ({selectedNetwork?.public_name})
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Help Screen (Conditional) */}
            {step === 5 && hasHelpStep && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="text-center space-y-2 py-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Besoin d'aide ?</h2>
                  <p className="text-slate-500 text-xs max-w-[280px] mx-auto">
                    Consultez nos tutoriels vidéo pour faciliter votre retrait.
                  </p>
                </div>

                <div className="space-y-4">
                  {selectedPlatform?.withdrawal_tuto_link && (
                    <div 
                      onClick={() => window.open(selectedPlatform.withdrawal_tuto_link!, "_blank")}
                      className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-emerald-500/20 shadow-sm flex items-center gap-4 cursor-pointer active:scale-95 transition-all hover:bg-emerald-500/5"
                    >
                      <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Youtube className="h-6 w-6 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold">Tutoriel vidéo</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          Comment obtenir un code {selectedPlatform?.name || "1XBET"} ?
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedPlatform?.why_withdrawal_fail && (
                    <div 
                      onClick={() => window.open(selectedPlatform.why_withdrawal_fail!, "_blank")}
                      className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-emerald-500/20 shadow-sm flex items-center gap-4 cursor-pointer active:scale-95 transition-all hover:bg-emerald-500/5"
                    >
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Info className="h-6 w-6 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold">Aide retrait</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          Pourquoi mon retrait a échoué ?
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={() => setStep(6)}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 mt-4"
                >
                  J'ai déjà mon code, continuer
                </Button>
              </div>
            )}

            {/* Step 6: Enter Amount and Code */}
            {((step === 6) || (step === 5 && !hasHelpStep)) && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t("enterAmount")}</h2>
                  <p className="text-xs text-slate-500">
                    Montant de {selectedPlatform?.minimun_with.toLocaleString()} à {selectedPlatform?.max_win.toLocaleString()} FCFA
                  </p>
                </div>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("amount")} (FCFA)</Label>
                    <div className="relative">
                      <Input
                        id="amount"
                        type="number"
                        placeholder="1000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-14 text-xl font-bold bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl pl-4 pr-16 focus:ring-emerald-500"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">FCFA</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="withdrawalCode" className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("withdrawalCode")}</Label>
                    <Input
                      id="withdrawalCode"
                      type="text"
                      placeholder="Ex: 12345678"
                      value={withdrawalCode}
                      onChange={(e) => setWithdrawalCode(e.target.value)}
                      className="h-14 text-xl font-bold bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl pl-4 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500">Entrez le code de retrait fourni par votre plateforme de paris</p>
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl space-y-2.5 border border-slate-100 dark:border-slate-800 mt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">{t("platform")}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{selectedPlatform?.name}</span>
                    </div>
                    {selectedPlatform?.city && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Ville</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedPlatform.city}</span>
                      </div>
                    )}
                    {selectedPlatform?.street && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Rue</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedPlatform.street}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">ID de pari</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{selectedBetId?.user_app_id}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Réseau</span>
                      <span className="font-bold text-slate-900 dark:text-white">{selectedNetwork?.public_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Téléphone</span>
                      <span className="font-bold text-slate-900 dark:text-white">{selectedPhone?.phone}</span>
                    </div>
                  </div>

                  {/* Network Withdrawal Message */}
                  {selectedNetwork?.withdrawal_message && selectedNetwork.withdrawal_message.trim() !== "" && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <div className="flex gap-2">
                        <Info className="h-4 w-4 text-emerald-500 shrink-0" />
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed whitespace-pre-line">
                          {selectedNetwork.withdrawal_message}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3 pt-2">
                    <Checkbox
                      id="terms-withdraw"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      className="mt-1 border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                    <Label htmlFor="terms-withdraw" className="text-[11px] leading-relaxed text-slate-500 font-normal">
                      En continuant, vous acceptez nos <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-600 hover:underline">conditions d'utilisation</a> et confirmez avoir plus de 18 ans.
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => {
                if (step === 6 && hasHelpStep) {
                  setStep(5)
                } else if (step === 6 && !hasHelpStep) {
                  setStep(4)
                } else {
                  setStep(step - 1)
                }
              }} 
              className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Précédent
            </Button>
          )}
          {step !== 5 || !hasHelpStep ? (
            <Button 
              onClick={handleNext} 
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all active:scale-[0.98]"
            >
              {withdrawalMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Traitement...
                </>
              ) : ((step === 6) || (step === 5 && !hasHelpStep)) ? "Confirmer" : "Suivant"}
            </Button>
          ) : null}
        </div>

      </div>
    </div>
  </div>

      {/* Bet ID Edit Dialog */}
      <Dialog open={betEditDialogOpen} onOpenChange={(open) => (!open ? resetBetEditDialog() : setBetEditDialogOpen(true))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'identifiant</DialogTitle>
            <DialogDescription>
              Recherchez et validez l'identifiant avant de l'enregistrer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="withdrawBetEditValue">Identifiant de pari</Label>
            <Input
              id="withdrawBetEditValue"
              value={betEditValue}
              onChange={(event) => setBetEditValue(event.target.value)}
            />
            {betEditError && <p className="text-sm text-destructive">{betEditError}</p>}
          </div>
          <div className="flex gap-4 pt-4">
            <Button variant="outline" onClick={resetBetEditDialog} className="flex-1">
              {t("cancel")}
            </Button>
            <Button
              onClick={handleBetEditConfirm}
              disabled={betEditMutation.isPending}
              className="flex-1"
            >
              {betEditMutation.isPending ? t("loading") : "Mettre à jour"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phone Edit Dialog */}
      <Dialog open={phoneEditDialogOpen} onOpenChange={(open) => (!open ? resetPhoneEditDialog() : setPhoneEditDialogOpen(true))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le numéro</DialogTitle>
            <DialogDescription>
              Actualisez votre numéro pour ce réseau.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="withdrawPhoneEditValue">{t("phone")}</Label>
            <div className="flex gap-2">
              <Select value={phoneEditCountry} onValueChange={setPhoneEditCountry}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name} (+{country.indication})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="withdrawPhoneEditValue"
                value={phoneEditValue}
                onChange={(event) => setPhoneEditValue(event.target.value)}
                placeholder="0700000000"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Indicatif sélectionné : +{getCountryOption(phoneEditCountry).indication}
            </p>
            {phoneEditError && <p className="text-sm text-destructive">{phoneEditError}</p>}
          </div>
          <div className="flex gap-4 pt-4">
            <Button variant="outline" onClick={resetPhoneEditDialog} className="flex-1">
              {t("cancel")}
            </Button>
            <Button
              onClick={handlePhoneEditConfirm}
              disabled={updatePhoneMutation.isPending}
              className="flex-1"
            >
              {updatePhoneMutation.isPending ? t("loading") : "Mettre à jour"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bet Delete Dialog */}
      <Dialog open={betDeleteDialogOpen} onOpenChange={(open) => (!open ? resetBetDeleteDialog() : setBetDeleteDialogOpen(true))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'identifiant</DialogTitle>
            <DialogDescription>
              Cette action est définitive. Confirmez-vous la suppression ?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{betToDelete?.user_app_id}</p>
          <div className="flex gap-4 pt-4">
            <Button variant="outline" onClick={resetBetDeleteDialog} className="flex-1">
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBetDeleteConfirm}
              disabled={deleteBetMutation.isPending}
              className="flex-1"
            >
              {deleteBetMutation.isPending ? t("loading") : "Supprimer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phone Delete Dialog */}
      <Dialog open={phoneDeleteDialogOpen} onOpenChange={(open) => (!open ? resetPhoneDeleteDialog() : setPhoneDeleteDialogOpen(true))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le numéro</DialogTitle>
            <DialogDescription>
              Cette action est définitive. Confirmez-vous la suppression ?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{phoneToDelete?.phone}</p>
          <div className="flex gap-4 pt-4">
            <Button variant="outline" onClick={resetPhoneDeleteDialog} className="flex-1">
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handlePhoneDeleteConfirm}
              disabled={deletePhoneMutation.isPending}
              className="flex-1"
            >
              {deletePhoneMutation.isPending ? t("loading") : "Supprimer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le retrait</DialogTitle>
            <DialogDescription>Veuillez vérifier les informations avant de confirmer</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("platform")}</span>
              <span className="font-medium">{selectedPlatform?.name}</span>
            </div>
            {selectedPlatform?.city && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ville</span>
                <span className="font-medium">{selectedPlatform.city}</span>
              </div>
            )}
            {selectedPlatform?.street && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rue</span>
                <span className="font-medium">{selectedPlatform.street}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID de pari</span>
              <span className="font-medium">{selectedBetId?.user_app_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("network")}</span>
              <span className="font-medium">{selectedNetwork?.public_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("phone")}</span>
              <span className="font-medium">{selectedPhone?.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("withdrawalCode")}</span>
              <span className="font-medium">{withdrawalCode}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>{t("amount")}</span>
              <span className="text-primary">{amount} FCFA</span>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="flex-1">
              {t("cancel")}
            </Button>
            <Button onClick={handleConfirm} disabled={withdrawalMutation.isPending} className="flex-1">
              {withdrawalMutation.isPending ? t("loading") : t("confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Link Dialog */}
      <Dialog open={showTransactionLinkDialog} onOpenChange={setShowTransactionLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Continuer la transaction</DialogTitle>
            <DialogDescription>
              Cliquez sur continuer pour finaliser votre retrait
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 pt-4">
            <Button variant="outline" onClick={() => {
              setShowTransactionLinkDialog(false)
              router.push("/dashboard")
            }} className="flex-1">
              {t("cancel")}
            </Button>
            <Button onClick={handleContinueTransaction} className="flex-1">
              Continuer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function WithdrawPage() {
  return (
    <AuthGuard>
      <WithdrawContent />
    </AuthGuard>
  )
}
