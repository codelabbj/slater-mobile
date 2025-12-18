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
import { formatDate } from "@/lib/utils"
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
            <h1 className="text-lg font-semibold">Mes coupons</h1>
            <p className="text-xs text-muted-foreground">
              Gérez vos codes promo et avantages
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto space-y-4">
        {/* Summary / Hero */}
        <Card className="floating-card border-0 shadow-lg animate-scale-in">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Ticket className="h-5 w-5" />
              </span>
              <span className="text-base font-semibold">Vos coupons</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {couponData?.count || 0} coupon
              {(couponData?.count || 0) > 1 ? "s" : ""} disponible
              {(couponData?.count || 0) > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Coupons List */}
        <Card className="floating-card border-0 shadow-lg">
          <CardContent className="pt-4">
            {couponLoading ? (
              <div className="text-center py-10 text-muted-foreground">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mb-2" />
                <p className="text-sm">{t("loading")}</p>
              </div>
            ) : !couponData?.results || couponData.results.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 mb-3">
                  <Ticket className="h-6 w-6 text-muted-foreground/70" />
                </div>
                <p className="font-semibold text-foreground">Aucun coupon pour le moment</p>
                <p className="text-xs mt-1">
                  Vos coupons apparaîtront ici dès qu&apos;ils seront disponibles.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {couponData.results.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="group p-4 rounded-2xl border border-primary/15 bg-background/80 hover:bg-primary/5 hover:border-primary/40 hover:shadow-md transition-all duration-200 ease-out"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {coupon.bet_app_details?.image && (
                            <div className="h-9 w-9 rounded-xl bg-muted/70 flex items-center justify-center overflow-hidden">
                              <img
                                src={coupon.bet_app_details.image}
                                alt={coupon.bet_app_details.name || "Platform"}
                                className="w-7 h-7 object-contain transition-transform duration-200 group-hover:scale-105"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {coupon.bet_app_details?.name && (
                              <p className="font-medium text-sm text-foreground truncate">
                                {coupon.bet_app_details.name}
                              </p>
                            )}
                            <p className="font-mono font-semibold text-lg text-primary tracking-wide">
                              {coupon.code}
                            </p>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Créé le {formatDate(coupon.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyCode(coupon.code)}
                        className="flex-shrink-0 rounded-xl text-xs"
                      >
                        {copiedCode === coupon.code ? (
                          <>
                            <Check className="h-4 w-4 mr-1.5" />
                            Copié
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1.5" />
                            Copier
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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

