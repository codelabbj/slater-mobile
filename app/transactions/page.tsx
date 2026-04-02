"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, Search, Filter, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthGuard } from "@/components/auth-guard"
import { AppBar } from "@/components/ui/app-bar"
import api from "@/lib/api"
import type { Transaction } from "@/lib/types"
import { formatDate, cn } from "@/lib/utils"
import TransactionCard from "@/components/ui/transaction-card"
import { 
  TYPE_TRANS, 
  TRANS_STATUS, 
  getTransactionTypeLabel, 
  getTransactionStatusLabel 
} from "@/lib/constants"

function TransactionsContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showFilters, setShowFilters] = useState<boolean>(false)

  const { data, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await api.get<{
        count: number
        results: Transaction[]
      }>("/mobcash/transaction-history", {
        params: {
          page: 1,
          page_size: 100,
        }
      })
      return response.data
    },
    refetchInterval: 120000, // Refresh every 2 minutes
  })

  // Filter transactions based on search and filters
  const filteredTransactions = useMemo(() => {
    if (!data?.results) return []
    
    return data.results.filter((transaction) => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        transaction.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.phone_number.includes(searchQuery) ||
        transaction.amount.toString().includes(searchQuery) ||
        transaction.app_details?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Type filter
      const matchesType = typeFilter === "all" || transaction.type_trans === typeFilter
      
      // Status filter
      const matchesStatus = statusFilter === "all" || transaction.status === statusFilter
      
      return matchesSearch && matchesType && matchesStatus
    })
  }, [data?.results, searchQuery, typeFilter, statusFilter])

  const getStatusBadge = (status: string) => {
    const statusLabel = getTransactionStatusLabel(status as any)
    switch (status) {
      case "accept":
        return <Badge className="bg-primary">{statusLabel}</Badge>
      case "error":
      case "annuler":
        return <Badge variant="destructive">{statusLabel}</Badge>
      case "init_payment":
        return <Badge variant="secondary">{statusLabel}</Badge>
      default:
        return <Badge variant="secondary">{statusLabel}</Badge>
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
    <div className="min-h-screen pb-24 pt-16 sm:pt-20">
      <AppBar />
      <main className="mx-auto w-full max-w-md p-4 sm:p-6 md:p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{t("transactions")}</h1>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-9 w-9 rounded-xl transition-all",
                showFilters ? "bg-primary/10 text-primary" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              )}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Rechercher une transaction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus-visible:ring-primary/20 backdrop-blur-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4 text-slate-400" />
              </Button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">{t("type")}</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl">
                      <SelectItem value="all">Tous les types</SelectItem>
                      {TYPE_TRANS.map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">{t("status")}</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl">
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      {TRANS_STATUS.map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-9 rounded-xl border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => {
                  setTypeFilter("all")
                  setStatusFilter("all")
                  setSearchQuery("")
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? "s" : ""} trouvée{filteredTransactions.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm font-medium">{t("loading")}...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <Search className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">Aucun résultat</p>
              <p className="text-xs text-slate-500 mt-1">Modifiez vos critères de recherche</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))
          )}
        </div>
      </main>
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <AuthGuard>
      <TransactionsContent />
    </AuthGuard>
  )
}
