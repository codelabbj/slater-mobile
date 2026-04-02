"use client"

import type { Transaction } from "@/lib/types";
import { cn, formatPhoneNumberForDisplay, formatDate } from "@/lib/utils";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface TransactionCardProps {
    transaction: Transaction
    network?: any
}

export default function TransactionCard({ transaction, network }: TransactionCardProps) {
    const [isOpen, setIsOpen] = useState(false)
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
        <>
        <div
            key={transaction.id}
            onClick={() => setIsOpen(true)}
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

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md m-2 rounded-3xl border-2">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-xl">Détails de la transaction</DialogTitle>
                    <DialogDescription className="text-sm">
                        Informations complètes
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    <div className="text-center space-y-3">
                        <div className={cn(
                            "inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-2 shadow-lg ring-4 ring-offset-2",
                            isDeposit 
                                ? "bg-gradient-to-br from-green-500 to-emerald-600 ring-green-200/50 dark:ring-green-800/30" 
                                : "bg-gradient-to-br from-blue-500 to-sky-600 ring-blue-200/50 dark:ring-blue-800/30"
                        )}>
                            {isDeposit ? (
                                <ArrowDownToLine className="h-10 w-10 text-white" />
                            ) : (
                                <ArrowUpFromLine className="h-10 w-10 text-white" />
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-2 font-medium">{isDeposit ? "Dépôt" : "Retrait"}</p>
                            <p className={cn(
                                "text-4xl font-bold tracking-tight",
                                isDeposit ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"
                            )}>
                                {isDeposit ? "+" : "-"}{transaction.amount.toLocaleString("fr-FR", {
                                    minimumFractionDigits: 0,
                                })}
                            </p>
                            <p className="text-sm text-muted-foreground font-semibold mt-1">XOF</p>
                        </div>
                        <div>
                            <Badge 
                                className={cn("shadow-sm ring-1 ring-inset", getStatusColor(transaction.status))}
                                variant={transaction.status === "accept" ? "default" : transaction.status === "reject" || transaction.status === "error" ? "destructive" : "secondary"}
                            >
                                {getStatusLabel(transaction.status)}
                            </Badge>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border shadow-sm">
                        {transaction.app_details?.image && (
                            <img
                                src={transaction.app_details.image}
                                alt={transaction.app_details.name}
                                className="w-14 h-14 rounded-xl object-cover shadow-md ring-2 ring-background"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground font-medium mb-0.5">Application</p>
                            <p className="text-base font-bold truncate">{transaction.app_details?.name || transaction.app}</p>
                        </div>
                    </div>

                    {network?.image && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border shadow-sm">
                            <img
                                src={network.image}
                                alt={network.name}
                                className="w-14 h-14 rounded-xl object-cover shadow-md ring-2 ring-background"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground font-medium mb-0.5">Réseau</p>
                                <p className="text-base font-bold truncate">{network?.name}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-muted/40 border">
                            <p className="text-[10px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wide">Référence</p>
                            <p className="text-xs font-bold font-mono truncate">#{transaction.reference}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-muted/40 border">
                            <p className="text-[10px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wide">Téléphone</p>
                            <p className="text-xs font-bold truncate">{formatPhoneNumberForDisplay(transaction.phone_number)}</p>
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/40 border">
                        <p className="text-[10px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wide">Date et heure</p>
                        <p className="text-sm font-bold">
                            {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(transaction.created_at))}
                        </p>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/40 border">
                        <p className="text-[10px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wide">ID Application</p>
                        <p className="text-xs font-mono break-all text-muted-foreground">{transaction.user_app_id}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        </>
    )
}
