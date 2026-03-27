"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ArrowLeft, 
  Info, 
  Copy, 
  Phone, 
  DollarSign, 
  Receipt, 
  Calendar, 
  User,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AuthGuard } from "@/components/auth-guard"
import api from "@/lib/api"
import type { Transaction, Network } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { getTransactionStatusLabel } from "@/lib/constants"
import toast from "react-hot-toast"
import { Suspense } from "react"
import { useSettings } from "@/hooks/use-settings"

function TransactionDetailContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const { settings } = useSettings()

  // Fetch networks to get the names and images
  const { data: networks } = useQuery({
    queryKey: ["networks-all"],
    queryFn: async () => {
      const response = await api.get<Network[]>("/mobcash/network")
      return response.data
    },
  })

  // Fetch the specific transaction
  const { data: transaction, isLoading, error } = useQuery({
    queryKey: ["transaction", id],
    queryFn: async () => {
      if (!id) throw new Error("ID requis")
      
      // First try direct ID access if the backend supports it
      try {
        const response = await api.get<Transaction>(`/mobcash/transaction-history/${id}/`)
        return response.data
      } catch (err) {
        // Fallback: fetch history and find the transaction
        const response = await api.get<{ results: Transaction[] }>("/mobcash/transaction-history", {
          params: { page_size: 100 }
        })
        const found = response.data.results.find(t => t.id === Number(id))
        if (!found) throw new Error("Transaction not found")
        return found
      }
    },
    enabled: !!id
  })

  if (!id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">ID de transaction manquant</p>
        <Button onClick={() => router.back()}>Retour</Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">Erreur lors du chargement de la transaction</p>
        <Button onClick={() => router.back()}>Retour</Button>
      </div>
    )
  }

  const network = networks?.find(n => n.id === transaction.network)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copié dans le presse-papier")
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "accept":
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          bgColor: "bg-emerald-50",
          textColor: "text-emerald-700",
          message: "Transaction effectuée avec succès"
        }
      case "error":
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          bgColor: "bg-red-50",
          textColor: "text-red-700",
          message: "La transaction a échoué"
        }
      case "annuler":
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          bgColor: "bg-red-50",
          textColor: "text-red-700",
          message: "La transaction a été annulée"
        }
      case "init_payment":
      case "pending":
      default:
        return {
          icon: <Info className="h-5 w-5 text-blue-500" />,
          bgColor: "bg-blue-50",
          textColor: "text-blue-700",
          message: "Transaction en cours"
        }
    }
  }

  const statusInfo = getStatusInfo(transaction.status)

  return (
    <div className="min-h-screen gradient-background mobile-safe-touch">
      {/* Header */}
      <header className="px-4 py-4 flex items-center sticky top-0 z-10 safe-area-top">
        <Button variant="ghost" size="icon" className="h-10 w-10 glass-panel" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold flex-1 text-center pr-10 section-title">Détails de la transaction</h1>
      </header>

      <main className="px-4 py-2 space-y-6">
        {/* Amount Section */}
        <div className="text-center pt-2 pb-4">
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
            XOF {transaction.amount.toLocaleString()}
          </h2>
        </div>

        {/* Status Message Banner */}
        <div className={`rounded-3xl p-6 flex items-start gap-4 border ${statusInfo.bgColor} ${statusInfo.textColor} shadow-xl backdrop-blur-md mx-1 animate-scale-in`}>
          <div className="mt-1 flex-shrink-0">
            <div className="bg-white/40 rounded-full p-2">
              {statusInfo.icon}
            </div>
          </div>
          <div>
            <p className="font-bold text-lg mb-0.5">Statut</p>
            <p className="text-sm font-medium opacity-90 leading-relaxed">{statusInfo.message}</p>
          </div>
        </div>

        {/* Transaction Information Card */}
        <Card className="glass-panel floating-card border-primary/10 rounded-[32px] overflow-hidden mx-1 shadow-2xl animate-scale-in">
          <CardContent className="p-6 md:p-8 space-y-7">
            <h3 className="text-xl font-bold section-title mb-2">Détails du paiement</h3>

            <div className="space-y-6">
              {/* Application Row */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {transaction.app_details?.image ? (
                    <img src={transaction.app_details.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-blue-900 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">1xBet</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 border-b border-gray-50 pb-3">
                  <p className="text-sm font-medium text-gray-400 mb-1">Application</p>
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {transaction.app_details?.name || transaction.app}
                  </p>
                </div>
              </div>

              {/* Network Row */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                  {network?.image ? (
                    <img src={network.image} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Phone className="h-6 w-6 text-blue-400 fill-blue-50" />
                  )}
                </div>
                <div className="flex-1 min-w-0 border-b border-gray-50 pb-3">
                  <p className="text-sm font-medium text-gray-400 mb-1">Réseau</p>
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {network?.public_name || "N/A"}
                  </p>
                </div>
              </div>

              {/* Number Row */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0 border-b border-gray-50 pb-3">
                  <p className="text-sm font-medium text-gray-400 mb-1">Numéro</p>
                  <p className="text-lg font-bold text-gray-900">
                    {transaction.phone_number}
                  </p>
                </div>
              </div>

              {/* Amount Row */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-gray-300" />
                </div>
                <div className="flex-1 min-w-0 border-b border-gray-50 pb-3">
                  <p className="text-sm font-medium text-gray-400 mb-1">Montant</p>
                  <p className="text-lg font-bold text-gray-900 italic">
                    XOF {transaction.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Reference Row */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Receipt className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0 border-b border-gray-50 pb-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-400 mb-1">Référence</p>
                    <p className="text-base font-bold text-gray-900 break-all leading-tight">
                      {transaction.reference}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 flex-shrink-0 hover:bg-blue-50" 
                    onClick={() => handleCopy(transaction.reference)}
                  >
                    <Copy className="h-5 w-5 text-blue-500" />
                  </Button>
                </div>
              </div>

              {/* Date Row */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0 border-b border-white/10 pb-3">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Date</p>
                  <p className="text-lg font-bold">
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
              </div>

              {/* App ID Row */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-md border-2 border-primary/20 flex items-center justify-center">
                       <User className="h-4 w-4 text-primary" />
                    </div>
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {transaction.app_details?.name || "1xBet"} ID
                  </p>
                  <p className="text-lg font-bold">
                    {transaction.user_app_id}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support Button */}
        <div className="pt-4 px-1 pb-10">
          <Button 
            className="w-full h-16 rounded-[24px] bg-white text-primary border border-primary/10 text-xl font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 backdrop-blur-xl"
            onClick={() => {
              const phone = settings?.whatsapp_phone || "2250544360901"
              const message = `Hello, I need help with my transaction:
- Ref: ${transaction.reference}
- Amount: ${transaction.amount}
- Date: ${formatDate(transaction.created_at)}`
              
              const encodedMsg = encodeURIComponent(message)
              window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank')
            }}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="h-5 w-5" />
            </div>
            Contacter le support
          </Button>
        </div>
      </main>
    </div>
  )
}

export default function TransactionDetailPage() {
  return (
    <AuthGuard>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <TransactionDetailContent />
      </Suspense>
    </AuthGuard>
  )
}
