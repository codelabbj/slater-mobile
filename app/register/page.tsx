"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import Image from "next/image"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import { Loader2, Eye, EyeOff, User, Mail, Lock, Phone, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import api from "@/lib/api"
import { useSettings } from "@/hooks/use-settings"
import { GoogleButton } from "@/components/google-button"

const step1Schema = z.object({
  first_name: z.string().min(2, "Le prénom doit contenir au minimum 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au minimum 2 caractères"),
})

const step2Schema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
})

const step3Schema = z.object({
  password: z.string().min(6, "Le mot de passe doit contenir au minimum 6 caractères"),
  re_password: z.string().min(6, "Confirmation du mot de passe requise"),
  accept_terms: z.boolean().refine(val => val === true, "Vous devez accepter les conditions d'utilisation"),
  referral_code: z.string().optional(),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>
type Step3Data = z.infer<typeof step3Schema>

export default function RegisterPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { referralBonusEnabled, isLoading: settingsLoading } = useSettings()
  
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data & Step3Data>>({})

  const {
    register: register1,
    handleSubmit: handleSubmit1,
    formState: { errors: errors1 },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
  })

  const {
    register: register2,
    handleSubmit: handleSubmit2,
    formState: { errors: errors2 },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
  })

  const {
    register: register3,
    handleSubmit: handleSubmit3,
    formState: { errors: errors3 },
  } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      accept_terms: false
    }
  })

  const handleStep1Submit = handleSubmit1((data) => {
    setFormData(prev => ({ ...prev, ...data }))
    setCurrentStep(2)
  })

  const handleStep2Submit = handleSubmit2((data) => {
    setFormData(prev => ({ ...prev, ...data }))
    setCurrentStep(3)
  })

  const handleStep3Submit = handleSubmit3(async (data) => {
    if (data.password !== data.re_password) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }

    setIsLoading(true)
    try {
      const payload: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        password: data.password,
        re_password: data.re_password,
      }

      if (referralBonusEnabled && data.referral_code) {
        payload.referral_code = data.referral_code
      }

      await api.post("/auth/registration", payload)
      toast.success("Compte créé avec succès! Veuillez vous connecter.")
      router.push("/login")
    } catch (error: any) {
      console.error("Signup error:", error)
      toast.error(error.message || "Erreur lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  })

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    )
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-sm sm:text-base font-semibold transition-all duration-300 ${
              currentStep >= step
                ? "bg-slate-900 text-white"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            {currentStep > step ? (
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              step
            )}
          </div>
          {step < 3 && (
            <div
              className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 transition-all duration-300 ${
                currentStep > step ? "bg-slate-900" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <form onSubmit={handleStep1Submit} className="space-y-4 sm:space-y-5">
      <div className="text-center mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Informations personnelles</h3>
        <p className="text-sm sm:text-base text-slate-500">Dites-nous qui vous êtes</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name" className="text-sm font-medium text-slate-700">
            Prénom
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="first_name"
              type="text"
              placeholder="Jean-Marie"
              {...register1("first_name")}
              disabled={isLoading}
              className="h-10 sm:h-11 pl-10 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base"
            />
          </div>
          {errors1.first_name && (
            <p className="text-xs sm:text-sm text-red-500 font-medium">{errors1.first_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name" className="text-sm font-medium text-slate-700">
            Nom
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="last_name"
              type="text"
              placeholder="Kouassi"
              {...register1("last_name")}
              disabled={isLoading}
              className="h-10 sm:h-11 pl-10 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base"
            />
          </div>
          {errors1.last_name && (
            <p className="text-xs sm:text-sm text-red-500 font-medium">{errors1.last_name.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg transition-all duration-200 text-sm sm:text-base"
        disabled={isLoading}
      >
        Suivant
      </Button>
    </form>
  )

  const renderStep2 = () => (
    <form onSubmit={handleStep2Submit} className="space-y-4 sm:space-y-5">
      <div className="text-center mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Coordonnées</h3>
        <p className="text-sm sm:text-base text-slate-500">Comment vous contacter</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="email"
            type="email"
            placeholder="votre@email.com"
            {...register2("email")}
            disabled={isLoading}
            className="h-10 sm:h-11 pl-10 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base"
          />
        </div>
        {errors2.email && (
          <p className="text-xs sm:text-sm text-red-500 font-medium">{errors2.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
          Téléphone
        </Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="phone"
            type="tel"
            placeholder="+225 01 23 45 67"
            {...register2("phone")}
            disabled={isLoading}
            className="h-10 sm:h-11 pl-10 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base"
          />
        </div>
        {errors2.phone && (
          <p className="text-xs sm:text-sm text-red-500 font-medium">{errors2.phone.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          className="flex-1 h-10 sm:h-11 text-slate-600 hover:bg-slate-100 text-sm sm:text-base"
          disabled={isLoading}
        >
          Retour
        </Button>
        <Button
          type="submit"
          className="flex-1 h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg transition-all duration-200 text-sm sm:text-base"
          disabled={isLoading}
        >
          Suivant
        </Button>
      </div>
    </form>
  )

  const renderStep3 = () => (
    <form onSubmit={handleStep3Submit} className="space-y-4 sm:space-y-5">
      <div className="text-center mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Sécurité</h3>
        <p className="text-sm sm:text-base text-slate-500">Créez votre mot de passe</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-slate-700">
          Mot de passe
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Au moins 6 caractères"
            {...register3("password")}
            disabled={isLoading}
            className="h-10 sm:h-11 pl-10 pr-10 sm:pr-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-10 sm:h-11 w-10 sm:w-11 hover:bg-slate-100"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-slate-400" />
            ) : (
              <Eye className="h-4 w-4 text-slate-400" />
            )}
          </Button>
        </div>
        {errors3.password && (
          <p className="text-xs sm:text-sm text-red-500 font-medium">{errors3.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="re_password" className="text-sm font-medium text-slate-700">
          Confirmer le mot de passe
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="re_password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Répétez le mot de passe"
            {...register3("re_password")}
            disabled={isLoading}
            className="h-10 sm:h-11 pl-10 pr-10 sm:pr-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-10 sm:h-11 w-10 sm:w-11 hover:bg-slate-100"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-slate-400" />
            ) : (
              <Eye className="h-4 w-4 text-slate-400" />
            )}
          </Button>
        </div>
        {errors3.re_password && (
          <p className="text-xs sm:text-sm text-red-500 font-medium">{errors3.re_password.message}</p>
        )}
      </div>

      {referralBonusEnabled && (
        <div className="space-y-2">
          <Label htmlFor="referral_code" className="text-sm font-medium text-slate-700">
            Code de parrainage (optionnel)
          </Label>
          <Input
            id="referral_code"
            type="text"
            placeholder="Code fourni par votre parrain"
            {...register3("referral_code")}
            disabled={isLoading}
            className="h-10 sm:h-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base uppercase font-mono"
          />
          {errors3.referral_code && (
            <p className="text-xs sm:text-sm text-red-500 font-medium">{errors3.referral_code.message}</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <Checkbox
            id="accept_terms"
            {...register3("accept_terms")}
            onCheckedChange={(checked) => {
              const event = { target: { name: "accept_terms", value: checked === true } }
              register3("accept_terms").onChange(event as any)
            }}
            className="mt-1"
          />
          <label
            htmlFor="accept_terms"
            className="text-xs sm:text-sm leading-relaxed text-slate-600 cursor-pointer select-none"
          >
            En cliquant sur S'inscrire, vous acceptez nos{" "}
            <Link
              href="/privacy-policy"
              className="font-semibold text-slate-900 hover:underline"
              target="_blank"
            >
              conditions d'utilisation
            </Link>{" "}
            et confirmez que vous avez plus de 18 ans.
          </label>
        </div>
        {errors3.accept_terms && (
          <p className="text-xs sm:text-sm text-red-500 font-medium">{errors3.accept_terms.message as string}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          className="flex-1 h-10 sm:h-11 text-slate-600 hover:bg-slate-100 text-sm sm:text-base"
          disabled={isLoading}
        >
          Retour
        </Button>
        <Button
          type="submit"
          className="flex-1 h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg transition-all duration-200 text-sm sm:text-base"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création en cours...
            </>
          ) : (
            "Créer mon compte"
          )}
        </Button>
      </div>
    </form>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Image
              src="/Slater-logo.png"
              alt="Slater Logo"
              width={64}
              height={16}
              className="w-12 h-auto object-contain sm:w-16"
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Rejoignez Slater
          </h2>
          <p className="text-sm sm:text-base text-slate-500">
            Créez votre compte en 3 étapes
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Current Step Form */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* Footer */}
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200 text-center">
          <p className="text-xs sm:text-sm text-slate-500">
            Déjà membre ?{" "}
            <Link href="/login" className="text-slate-900 font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>

        {/* Bouton Google */}
        <div className="mt-4">
          <GoogleButton mode="register" />
        </div>
      </div>
    </div>
  )
}