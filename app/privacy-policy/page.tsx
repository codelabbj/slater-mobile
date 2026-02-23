"use client"

import { ArrowLeft, ShieldCheck, CheckCircle2, Info, Scale, Users, CreditCard, Zap, BookOpen, AlertCircle, Headphones, ScrollText, Edit3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            <div className="absolute top-20 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-40 -right-20 w-80 h-80 bg-primary/15 rounded-full blur-[100px] pointer-events-none" />

            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b safe-area-top">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
                    <Button variant="ghost" size="icon" className="touch-target rounded-full" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-base font-bold">Termes & Conditions</h1>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Slater Official</span>
                    </div>
                    <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
                {/* Hero Section */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
                        <BookOpen className="w-3 h-3" />
                        CONTRAT D'UTILISATION
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        TERMES ET CONDITIONS D'UTILISATION – SLATER
                    </h1>
                    <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
                        Mise à jour : <span className="font-bold text-foreground">30 Janvier 2026</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Summary Desktop Navigation */}
                    <nav className="hidden lg:block lg:col-span-3 sticky top-24" aria-label="Table des matières">
                        <Card className="border-0 shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-md overflow-hidden rounded-3xl">
                            <div className="p-6">
                                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <ScrollText className="w-4 h-4 text-primary" />
                                    Sommaire
                                </h2>
                                <ul className="space-y-1">
                                    {sections.map((section) => (
                                        <li key={section.id}>
                                            <a
                                                href={`#${section.id}`}
                                                className="block py-2 px-3 rounded-xl text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                            >
                                                {section.title.split('. ')[1]}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Card>
                    </nav>

                    {/* Content Sections */}
                    <div className="lg:col-span-9 space-y-6">
                        {sections.map((section, index) => (
                            <section
                                key={section.id}
                                id={section.id}
                                className="scroll-mt-24 group animate-scale-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <Card className="border-0 shadow-xl shadow-primary/5 hover:shadow-primary/10 bg-card/40 backdrop-blur-sm rounded-3xl transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary">
                                    <CardContent className="p-6 md:p-8">
                                        <div className="flex gap-4">
                                            <div className="hidden sm:flex flex-col items-center gap-2">
                                                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                                    {section.icon}
                                                </div>
                                                <div className="w-0.5 h-full bg-border/50 group-last:bg-transparent" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex sm:hidden items-center gap-3 mb-3">
                                                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                        {section.icon}
                                                    </div>
                                                </div>
                                                <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                                                    {section.title}
                                                </h2>
                                                <p className={`text-muted-foreground leading-relaxed ${section.bold ? 'font-bold text-foreground' : ''}`}>
                                                    {section.content}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>
                        ))}

                        <footer className="pt-12 pb-8 text-center sm:text-left">
                            <p className="text-sm text-muted-foreground italic max-w-2xl">
                                Ceci constitue l'intégralité des termes et conditions régissant votre utilisation du service SLATER. En accédant à nos services, vous confirmez avoir pris connaissance de ces règles.
                            </p>

                            <div className="mt-8">
                                <Button
                                    onClick={() => router.back()}
                                    variant="outline"
                                    className="rounded-full px-8 h-12 shadow-md hover:shadow-lg transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Retour à l'application
                                </Button>
                            </div>
                        </footer>
                    </div>
                </div>
            </main>
        </div>
    )
}
