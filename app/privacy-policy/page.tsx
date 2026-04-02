"use client"

import { ArrowLeft, ShieldCheck, CheckCircle2, Info, Scale, Users, CreditCard, Zap, BookOpen, AlertCircle, Headphones, ScrollText, Edit3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AppBar } from "@/components/ui/app-bar"
import { cn } from "@/lib/utils"

export default function PrivacyPolicyPage() {
    const router = useRouter()

    const sections = [
        {
            id: "presentation",
            title: "1. Présentation de SLATER",
            icon: <Info className="w-5 h-5" />,
            content: "SLATER est une plateforme de services financiers permettant d'effectuer des dépôts et retraits vers des plateformes de paris sportifs partenaires. SLATER n'est pas un site de paris sportifs et ne garantit aucun gain."
        },
        {
            id: "acces",
            title: "2. Conditions d'accès",
            icon: <Users className="w-5 h-5" />,
            content: "Vous devez être âgé d'au moins 18 ans, utiliser un numéro valide et fournir des informations exactes. SLATER peut refuser ou suspendre l'accès en cas de non-respect."
        },
        {
            id: "responsabilite",
            title: "3. Responsabilité de l'utilisateur",
            icon: <Scale className="w-5 h-5" />,
            content: "L'utilisateur est seul responsable de son compte, de ses dépôts, retraits, gains et pertes. SLATER n'est pas responsable des décisions des plateformes de paris sportifs."
        },
        {
            id: "transactions",
            title: "4. Dépôts et retraits",
            icon: <CreditCard className="w-5 h-5" />,
            content: "Les opérations suivent les procédures indiquées. Vérifiez toujours les informations de paiement. Un code de validation peut être exigé pour les retraits."
        },
        {
            id: "equitable",
            title: "5. Utilisation équitable",
            icon: <CheckCircle2 className="w-5 h-5" />,
            content: "L'utilisation uniquement pour des retraits sans dépôts peut entraîner des limitations ou un refus de service."
        },
        {
            id: "coupons",
            title: "6. Coupons et pronostics",
            icon: <Zap className="w-5 h-5" />,
            content: "Les coupons publiés par les utilisateurs ne sont pas forcément rentables. Téléchargez et analysez chaque coupon avant de jouer. Vous jouez à vos propres risques."
        },
        {
            id: "frais",
            title: "7. Frais et commissions",
            icon: <CreditCard className="w-5 h-5" />,
            content: "Certains services peuvent être sans frais. SLATER peut modifier ses frais si nécessaire."
        },
        {
            id: "fraude",
            title: "8. Lutte contre la fraude",
            icon: <AlertCircle className="w-5 h-5" />,
            content: "SLATER met en place des mesures pour prévenir la fraude, le blanchiment et l'utilisation abusive."
        },
        {
            id: "limitation",
            title: "9. Limitation de responsabilité",
            icon: <Scale className="w-5 h-5" />,
            content: "SLATER n'est pas responsable des pertes liées aux paris, des pannes partenaires ou des retards opérateurs."
        },
        {
            id: "service",
            title: "10. Service client",
            icon: <Headphones className="w-5 h-5" />,
            content: "En cas de souci, contactez rapidement le service client via WhatsApp ou Telegram uniquement."
        },
        {
            id: "conformite",
            title: "11. Conformité et réglementation",
            icon: <ShieldCheck className="w-5 h-5" />,
            content: "SLATER applique des règles de conformité, peut demander des documents (KYC), bloquer des transactions suspectes et coopérer avec les autorités si la loi l'exige."
        },
        {
            id: "modification",
            title: "12. Modification des conditions",
            icon: <Edit3 className="w-5 h-5" />,
            content: "SLATER peut modifier les présentes conditions à tout moment."
        },
        {
            id: "acceptation",
            title: "13. Acceptation",
            icon: <ScrollText className="w-5 h-5" />,
            content: "L'utilisation de SLATER vaut acceptation complète des présents Termes et Conditions.",
            bold: true
        }
    ]

    return (
    <div className="min-h-screen pb-24 pt-16 sm:pt-20">
      <AppBar />

      <main className="mx-auto w-full max-w-lg p-4 sm:p-6 md:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Termes & Conditions</h1>
          </div>
          
          <div className="relative overflow-hidden rounded-3xl p-8 bg-slate-900 shadow-2xl text-center">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-primary/20 rounded-full blur-2xl opacity-50" />
            <div className="relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 mx-auto border border-white/10 shadow-inner">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">CONTRAT D'UTILISATION</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mise à jour : 30 Janvier 2026</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300",
                section.bold ? "border-primary/20 ring-1 ring-primary/5" : ""
              )}
            >
              <div className="flex gap-4">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform",
                  section.bold ? "bg-primary/10 text-primary" : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-primary"
                )}>
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "text-sm font-bold mb-2",
                    section.bold ? "text-primary" : "text-slate-900 dark:text-white"
                  )}>
                    {section.title}
                  </h3>
                  <p className={cn(
                    "text-xs leading-relaxed",
                    section.bold ? "text-slate-900 dark:text-white font-bold" : "text-slate-500 dark:text-slate-400"
                  )}>
                    {section.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-12 text-center text-[11px] text-slate-400 font-medium px-8 leading-relaxed">
          <p className="italic">
            Ceci constitue l'intégralité des termes et conditions régissant votre utilisation du service SLATER. En accédant à nos services, vous confirmez avoir pris connaissance de ces règles.
          </p>
        </footer>
      </main>
    </div>
    )
}
