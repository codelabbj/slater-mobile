"use client"

import type { Transaction } from "@/lib/types";
import { cn, formatPhoneNumberForDisplay, formatDate } from "@/lib/utils";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useRouter } from "next/navigation";

interface TransactionCardProps {
    transaction: Transaction
    network?: any
}

export default function TransactionCard({ transaction, network }: TransactionCardProps) {
    const router = useRouter()
    const isDeposit = transaction.type_trans === "deposit"

    const getStatusColor = (status: Transaction["status"]) => {
        const colors: Record<string, string> = {
            pending: "text-amber-700 bg-amber-50 ring-amber-200/50 dark:text-amber-400 dark:bg-amber-950/30 dark:ring-amber-800/30",
            accept: "text-emerald-700 bg-emerald-50 ring-emerald-200/50 dark:text-emerald-400 dark:bg-emerald-950/30 dark:ring-emerald-800/30",
            init_payment: "text-amber-700 bg-amber-50 ring-amber-200/50 dark:text-amber-400 dark:bg-amber-950/30 dark:ring-amber-800/30",
            error: "text-rose-700 bg-rose-50 ring-rose-200/50 dark:text-rose-400 dark:bg-rose-950/30 dark:ring-rose-800/30",
            reject: "text-rose-700 bg-rose-50 ring-rose-200/50 dark:text-rose-400 dark:bg-rose-950/30 dark:ring-rose-800/30",
            timeout: "text-slate-700 bg-slate-50 ring-slate-200/50 dark:text-slate-400 dark:bg-slate-950/30 dark:ring-slate-800/30",
        }
        return colors[status] || "text-slate-700 bg-slate-50 ring-slate-200/50"
    }

    const getStatusLabel = (status: Transaction["status"]) => {
        const labels: Record<string, string> = {
            pending: "En attente",
            accept: "Validé",
            init_payment: "En cours",
            error: "Erreur",
            reject: "Refusé",
            timeout: "Expiré",
        }
        return labels[status] || status
    }

    return (
        <div
            key={transaction.id}
            onClick={() => {
                sessionStorage.setItem('cached_transaction', JSON.stringify(transaction))
                router.push(`/transactions/detail?id=${transaction.id}`)
            }}
            className={cn(
                "group relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-all duration-300",
                "bg-gradient-to-br border backdrop-blur-sm",
                isDeposit 
                    ? "from-green-50/80 via-emerald-50/50 to-background dark:from-green-950/20 dark:via-emerald-950/10 dark:to-background border-green-200/50 dark:border-green-800/30 hover:shadow-green-200/50 dark:hover:shadow-green-900/30" 
                    : "from-blue-50/80 via-sky-50/50 to-background dark:from-blue-950/20 dark:via-sky-950/10 dark:to-background border-blue-200/50 dark:border-blue-800/30 hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30",
                "hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5"
            )}
        >
            {/* Decorative gradient overlay */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                isDeposit 
                    ? "bg-gradient-to-br from-green-400/10 to-emerald-400/5 dark:from-green-400/5 dark:to-emerald-400/5"
                    : "bg-gradient-to-br from-blue-400/10 to-sky-400/5 dark:from-blue-400/5 dark:to-sky-400/5"
            )} />
            
            {/* Decorative corner accent */}
            <div className={cn(
                "absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity",
                isDeposit ? "bg-green-400" : "bg-blue-400"
            )} />
            
            <div className="relative flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "relative rounded-xl p-2 shadow-sm ring-1 ring-inset transition-all duration-300",
                            isDeposit 
                                ? "bg-gradient-to-br from-green-500 to-emerald-600 ring-green-400/20 group-hover:shadow-green-500/50" 
                                : "bg-gradient-to-br from-blue-500 to-sky-600 ring-blue-400/20 group-hover:shadow-blue-500/50"
                        )}>
                            {isDeposit ? (
                                <ArrowDownToLine className="h-4 w-4 text-white" />
                            ) : (
                                <ArrowUpFromLine className="h-4 w-4 text-white" />
                            )}
                            <div className={cn(
                                "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-md",
                                isDeposit ? "bg-green-400" : "bg-blue-400"
                            )} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                                {transaction.app_details?.name || transaction.app}
                            </p>
                            <p className="text-[11px] text-muted-foreground/80 font-mono tracking-tight">
                                #{transaction.reference}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                            "inline-flex items-center text-[11px] px-2.5 py-1 rounded-full font-medium shadow-sm ring-1 ring-inset",
                            getStatusColor(transaction.status)
                        )}>
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full mr-1.5",
                                transaction.status === "accept" ? "bg-green-500 animate-pulse" :
                                transaction.status === "pending" || transaction.status === "init_payment" ? "bg-yellow-500 animate-pulse" :
                                "bg-gray-400"
                            )} />
                            {getStatusLabel(transaction.status)}
                        </span>
                        <span className="text-[11px] text-muted-foreground/70 font-medium">
                            {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(transaction.created_at)).replace(' à ', ', ')}
                        </span>
                    </div>
                </div>
                
                <div className="text-right space-y-1">
                    <p className={cn(
                        "text-xl font-bold tracking-tight transition-all duration-300",
                        isDeposit 
                            ? "text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300" 
                            : "text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                    )}>
                        {isDeposit ? "+" : "-"}{transaction.amount.toLocaleString("fr-FR", {
                            minimumFractionDigits: 0,
                        })}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 font-semibold tracking-wide">XOF</p>
                </div>
            </div>
        </div>
    )
}
