"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  Ticket,
  ChevronRight,
  Zap,
  LayoutGrid
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import api from "@/lib/api"
import type { Platform } from "@/lib/types"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"
import { AppBar } from "@/components/ui/app-bar"
import { AuthGuard } from "@/components/auth-guard"

function CreateCouponContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  // Form State
  const [couponCode, setCouponCode] = useState("")
  const [matchCount, setMatchCount] = useState("1")
  const [odds, setOdds] = useState("")
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null)
  const [couponType, setCouponType] = useState<"single" | "combine">("single")

  // Fetch platforms
  const { data: platforms, isLoading: platformsLoading } = useQuery<Platform[]>({
    queryKey: ["platforms"],
    queryFn: async () => {
      const response = await api.get<Platform[]>("/mobcash/plateform")
      return response.data
    },
  })

  useEffect(() => {
    const count = parseInt(matchCount) || 0
    setCouponType(count > 1 ? "combine" : "single")
  }, [matchCount])

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/mobcash/v2/coupons", {
        ...data,
        bet_app: data.bet_app_id
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] })
      toast.success("Coupon publié!")
      router.push("/coupon")
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || error.response?.data?.detail || "Erreur de publication"
      toast.error(msg)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlatformId) return toast.error("Sélectionnez un bookmaker")
    if (!odds) return toast.error("Entrez la cote")
    if (!couponCode) return toast.error("Entrez le code")
    
    createMutation.mutate({
      bet_app_id: selectedPlatformId,
      code: couponCode,
      odds: odds,
      coupon_type: couponType,
      match_count: parseInt(matchCount) || 1
    })
  }

  return (
    <div className="min-h-screen pb-24 pt-20 bg-slate-50/50 dark:bg-slate-950">
      <AppBar title="Nouveau Coupon" />

      <main className="mx-auto w-full max-w-md px-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header Back */}
        <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-10 w-10 p-0 hover:bg-white dark:hover:bg-slate-800 text-slate-500 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
                 <h1 className="text-xl font-black">Partager un <span className="text-primary">Coupon</span></h1>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Étape unique • Infos de base</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="rounded-[2.5rem] border-0 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden bg-white dark:bg-slate-900 border-b-8 border-slate-50 dark:border-slate-800">
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Code du coupon</Label>
                        <Input 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="EX: CODE123"
                            className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 font-mono font-black text-lg tracking-[0.2em] focus-visible:ring-primary"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Matchs</Label>
                            <Input 
                                type="number"
                                value={matchCount}
                                onChange={(e) => setMatchCount(e.target.value)}
                                className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 font-black text-center text-lg focus-visible:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cote Totale</Label>
                            <Input 
                                value={odds}
                                onChange={(e) => setOdds(e.target.value)}
                                placeholder="2.50"
                                className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 font-black text-center text-lg focus-visible:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
                            <Zap className="h-5 w-5 fill-current" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-tighter text-primary">Type Détecté</p>
                            <p className="text-sm font-bold">
                                {couponType === 'combine' ? 'Coupon Combiné' : 'Coupon Simple'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sélectionner Bookmaker</Label>
                <ScrollArea className="w-full whitespace-nowrap pb-2">
                    <div className="flex gap-3">
                        {platformsLoading ? (
                            [1,2,3].map(i => <div key={i} className="h-20 w-32 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)
                        ) : (
                            platforms?.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setSelectedPlatformId(p.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 h-28 w-24 rounded-3xl border-2 transition-all active:scale-95 shrink-0",
                                        selectedPlatformId === p.id 
                                            ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 ring-4 ring-primary/5" 
                                            : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                                    )}
                                >
                                    <div className="h-11 w-11 rounded-xl bg-slate-50 dark:bg-slate-800 p-2 border border-slate-100 dark:border-slate-700 shadow-sm mb-2">
                                        <img src={p.image} className="w-full h-full object-contain" />
                                    </div>
                                    <p className={cn("text-[10px] font-black uppercase truncate w-full text-center", selectedPlatformId === p.id ? "text-primary" : "text-slate-400")}>
                                        {p.name}
                                    </p>
                                    {selectedPlatformId === p.id && (
                                        <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center text-white">
                                            <CheckCircle2 size={10} strokeWidth={4} />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                    <ScrollBar orientation="horizontal" className="hidden" />
                </ScrollArea>
            </div>

            <Button 
                type="submit"
                disabled={createMutation.isPending || !selectedPlatformId || !odds || !couponCode}
                className="w-full h-16 rounded-[2rem] text-lg font-black shadow-2xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                {createMutation.isPending ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <>
                        Publier le Coupon
                        <ChevronRight className="h-5 w-5" />
                    </>
                )}
            </Button>
        </form>
      </main>
    </div>
  )
}

export default function CreateCouponPage() {
  return (
    <AuthGuard>
      <CreateCouponContent />
    </AuthGuard>
  )
}
