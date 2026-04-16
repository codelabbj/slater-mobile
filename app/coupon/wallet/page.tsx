"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { couponApi } from "@/lib/api-client"
import { Wallet, Loader2, TrendingUp, History, Coins } from "lucide-react"
import { toast } from "react-hot-toast"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AppBar } from "@/components/ui/app-bar"
import { AuthGuard } from "@/components/auth-guard"

function CouponWalletContent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [walletData, setWalletData] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [wallet, userStats] = await Promise.all([
        couponApi.getWallet(),
        couponApi.getUserStats(),
      ])
      setWalletData(wallet)
      setStats(userStats)
    } catch (error) {
      console.error("Error fetching wallet data:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount < 100) {
      toast.error("Minimum 100 XOF")
      return
    }
    if (amount > (walletData?.balance || 0)) {
      toast.error("Solde insuffisant")
      return
    }

    setIsSubmitting(true)
    try {
      await couponApi.withdraw(amount)
      toast.success("Demande de retrait envoyée!")
      setIsWithdrawModalOpen(false)
      setWithdrawAmount("")
      fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Erreur lors du retrait")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-10">
      <AppBar title="Mes Gains Coupon" />

      <main className="mx-auto w-full max-w-md px-4 pt-20 space-y-5">
        {/* Wallet Card */}
        <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-slate-900 text-white p-2">
          <CardContent className="p-6">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 opacity-80">
              Solde disponible
            </p>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-4xl font-black italic tracking-tighter">
                {(walletData?.balance || 0).toLocaleString("fr-FR")}{" "}
                <span className="text-primary tracking-tighter">XOF</span>
              </h2>
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </div>

            <Button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="w-full bg-primary hover:bg-primary/90 text-white font-black h-14 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 text-lg"
            >
              Retirer mes gains
            </Button>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-3xl border-none shadow-lg bg-white dark:bg-slate-900 p-2">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Articles</p>
              <p className="text-xl font-black">{stats?.total_coupons || 0}</p>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-none shadow-lg bg-white dark:bg-slate-900 p-2">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-3">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Moyenne</p>
              <p className="text-xl font-black text-amber-500">
                {stats?.average_rating?.toFixed(1) || "0.0"} <span className="text-xs">★</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payout History */}
        <h3 className="text-lg font-black italic flex items-center gap-2">
          <History className="h-5 w-5 text-slate-400" />
          HISTORIQUE
        </h3>

        <div className="space-y-3">
          {walletData?.payouts?.length > 0 ? (
            walletData.payouts.map((payout: any) => (
              <div
                key={payout.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm flex items-center justify-between border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-2xl flex items-center justify-center ${
                      payout.payout_type === "withdrawal"
                        ? "bg-red-50 text-red-500"
                        : "bg-emerald-50 text-emerald-500"
                    }`}
                  >
                    {payout.payout_type === "withdrawal" ? <History size={18} /> : <Coins size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold">
                      {payout.payout_type === "per_vote"
                        ? "Vote reçu"
                        : payout.payout_type === "withdrawal"
                        ? "Retrait"
                        : "Gains coupon"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {new Date(payout.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <p
                  className={`font-black ${
                    payout.payout_type === "withdrawal" ? "text-red-500" : "text-emerald-500"
                  }`}
                >
                  {payout.payout_type === "withdrawal" ? "-" : "+"}
                  {payout.amount}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-10 opacity-50">
              <History className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-bold text-slate-400 italic">Aucune transaction encore</p>
            </div>
          )}
        </div>
      </main>

      {/* Withdraw Modal */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="rounded-3xl border-none w-[90vw] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic">Retirer mes pépites</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Virez vos gains vers votre solde de base Slater.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="relative">
              <Input
                type="number"
                placeholder="0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="h-16 rounded-2xl border-slate-100 bg-slate-50 dark:bg-slate-800 text-2xl font-black px-4"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">XOF</span>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2">
            <Button
              onClick={handleWithdraw}
              disabled={isSubmitting || !withdrawAmount}
              className="w-full bg-slate-900 text-white font-black h-14 rounded-2xl"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Transférer"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsWithdrawModalOpen(false)}
              className="w-full font-bold text-slate-400 h-10 rounded-2xl"
            >
              Plus tard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function MobileCouponWalletPage() {
  return (
    <AuthGuard>
      <CouponWalletContent />
    </AuthGuard>
  )
}
