"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { ArrowLeft, Copy, Check, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthGuard } from "@/components/auth-guard"
import api from "@/lib/api"
import type { Coupon, PaginatedResponse } from "@/lib/types"
import { formatDate, cn } from "@/lib/utils"
import { AppBar } from "@/components/ui/app-bar"
import { useState } from "react"
import toast from "react-hot-toast"

function CouponContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const { data: couponData, isLoading: couponLoading } = useQuery<PaginatedResponse<Coupon>>({
    queryKey: ["coupons"],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Coupon>>("/mobcash/coupon")
      return response.data
    },
  })

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success("Code copié!")
    setTimeout(() => setCopiedCode(null), 2000)
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
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Mes Coupons</h1>
          </div>
        </div>

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
          <div className="relative flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg">
              <Ticket className="h-10 w-10" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">Promotions actives</h2>
              <p className="text-xs text-slate-500 truncate">
                {couponData?.count || 0} coupon{(couponData?.count || 0) > 1 ? "s" : ""} disponible{(couponData?.count || 0) > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="px-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Liste des coupons</p>
          </div>

          {couponLoading ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed text-slate-400">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-2"></div>
              <p className="text-sm font-medium">{t("loading")}...</p>
            </div>
          ) : !couponData?.results || couponData.results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <Ticket className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">Aucun coupon disponible</p>
            </div>
          ) : (
            <div className="space-y-3">
              {couponData.results.map((coupon) => (
                <div
                  key={coupon.id}
                  className="group relative overflow-hidden rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {coupon.bet_app_details?.image ? (
                        <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800 p-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <img
                            src={coupon.bet_app_details.image}
                            alt={coupon.bet_app_details.name || "Platform"}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                          <Ticket className="h-6 w-6 text-slate-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">
                          {coupon.bet_app_details?.name || "Code Promo"}
                        </p>
                        <p className="text-lg font-mono font-black text-primary tracking-wider truncate">
                          {coupon.code}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyCode(coupon.code)}
                      className={cn(
                        "h-10 w-10 shrink-0 rounded-xl transition-all",
                        copiedCode === coupon.code ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary"
                      )}
                    >
                      {copiedCode === coupon.code ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-medium">
                      Généré le {formatDate(coupon.created_at)}
                    </p>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
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
