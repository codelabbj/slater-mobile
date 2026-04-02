"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import Link from "next/link"
import Image from "next/image"
import { Capacitor } from "@capacitor/core"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/lib/api"
import { saveAuthData, type AuthResponse } from "@/lib/auth"
import { unifiedFcmService } from "@/lib/firebase"
import { notificationService } from "@/lib/firebase-notifications"

const loginSchema = z.object({
  email_or_phone: z.string().min(1, "Ce champ est requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1)
  
  // Forgot password form states
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState("")
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] = useState("")
  const [forgotPasswordConfirmPassword, setForgotPasswordConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const response = await api.post<AuthResponse>("/auth/login", data)
      await saveAuthData(response.data)

      // Save remember me preference
      const { PersistentStorage } = await import('@/lib/storage')
      if (rememberMe && typeof window !== "undefined") {
        await PersistentStorage.set("remember_me", "true")
        await PersistentStorage.set("remembered_email", data.email_or_phone)
      } else if (typeof window !== "undefined") {
        await PersistentStorage.remove("remember_me")
        await PersistentStorage.remove("remembered_email")
      }
      
      toast.success("Connexion réussie!")
      
      // Send FCM token to backend after successful login
        try {
        await unifiedFcmService.sendTokenAfterLogin()
        } catch (error) {
        console.error('Error sending FCM token after login:', error)
        // Continue to dashboard even if token sending fails
      }

      // Initialize and request native notification permissions after login
      try {
        await notificationService.initialize()
        await notificationService.requestMobileNotificationPermissions()
      } catch (error) {
        console.error('Error requesting notification permissions:', error)
        // Continue to dashboard even if permission request fails
      }

      // Add delay on mobile to ensure tokens are persisted before navigation
      if (Capacitor.isNativePlatform()) {
        console.log('Mobile platform detected, adding delay before navigation...')
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Erreur de connexion")
    } finally {
      setIsLoading(false)
    }
  }

  // Load remembered email on mount
  useEffect(() => {
    const loadRememberedCredentials = async () => {
      if (typeof window !== "undefined") {
        try {
          const { PersistentStorage } = await import('@/lib/storage')
          const remembered = await PersistentStorage.get("remember_me")
          const rememberedEmail = await PersistentStorage.get("remembered_email")
          if (remembered === "true" && rememberedEmail) {
            setRememberMe(true)
            // You can set the form value here if needed
          }
        } catch (error) {
          console.error('Error loading remembered credentials:', error)
        }
      }
    }

    loadRememberedCredentials()
  }, [])

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (!forgotPasswordEmail.trim()) {
      toast.error("Veuillez entrer votre email")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(forgotPasswordEmail)) {
      toast.error("Veuillez entrer une adresse email valide")
      return
    }

    setIsForgotPasswordLoading(true)
    try {
      await api.post("/auth/send_otp", { email: forgotPasswordEmail })
      toast.success("OTP a été envoyé à votre email")
      setForgotPasswordStep(2)
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi de l'OTP")
    } finally {
      setIsForgotPasswordLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!forgotPasswordOtp.trim() || forgotPasswordOtp.length < 4) {
      toast.error("Veuillez entrer un code OTP valide (minimum 4 caractères)")
      return
    }

    toast.success("OTP vérifié avec succès")
    setForgotPasswordStep(3)
  }

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!forgotPasswordNewPassword.trim() || forgotPasswordNewPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(forgotPasswordNewPassword)
    const hasLowerCase = /[a-z]/.test(forgotPasswordNewPassword)
    const hasDigit = /\d/.test(forgotPasswordNewPassword)

    if (!hasUpperCase || !hasLowerCase || !hasDigit) {
      toast.error("Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre")
      return
    }

    if (forgotPasswordNewPassword !== forgotPasswordConfirmPassword) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }

    setIsForgotPasswordLoading(true)
    try {
      await api.post("/auth/reset_password", {
        otp: forgotPasswordOtp,
        new_password: forgotPasswordNewPassword,
        confirm_new_password: forgotPasswordConfirmPassword,
      })
      toast.success("Mot de passe réinitialisé avec succès")
      
      // Reset all forgot password states
      setIsForgotPassword(false)
      setForgotPasswordStep(1)
      setForgotPasswordEmail("")
      setForgotPasswordOtp("")
      setForgotPasswordNewPassword("")
      setForgotPasswordConfirmPassword("")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la réinitialisation du mot de passe")
    } finally {
      setIsForgotPasswordLoading(false)
    }
  }

  const renderForgotPasswordForm = () => {
    if (forgotPasswordStep === 1) {
      return (
        <div className="space-y-4 sm:space-y-5">
          <div className="space-y-2">
            <Label htmlFor="forgot_email" className="text-sm font-medium text-slate-600">Adresse e-mail de récupération</Label>
            <Input
              id="forgot_email"
              type="email"
              placeholder="votre.email@exemple.com"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              disabled={isForgotPasswordLoading}
              className="h-10 sm:h-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base"
            />
          </div>
          
          <Button 
            type="button"
            onClick={handleSendOtp}
            className="w-full h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm sm:text-base"
            disabled={isForgotPasswordLoading}
          >
            {isForgotPasswordLoading ? t("loading") : "Envoyer OTP"}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsForgotPassword(false)}
            className="w-full h-10 sm:h-11 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm sm:text-base"
            disabled={isForgotPasswordLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la connexion
          </Button>
        </div>
      )
    } else if (forgotPasswordStep === 2) {
      return (
        <div className="space-y-4 sm:space-y-5">
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-sm font-medium text-slate-600">Code de vérification</Label>
            <Input
              id="otp"
              type="text"
              placeholder="123456"
              value={forgotPasswordOtp}
              onChange={(e) => setForgotPasswordOtp(e.target.value)}
              disabled={isForgotPasswordLoading}
              className="h-10 sm:h-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-center font-mono tracking-widest text-sm sm:text-base"
              maxLength={6}
            />
            <p className="text-xs text-slate-500">
              Code envoyé à : {forgotPasswordEmail}
            </p>
          </div>
          
          <Button 
            type="button"
            onClick={handleVerifyOtp}
            className="w-full h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm sm:text-base"
            disabled={isForgotPasswordLoading}
          >
            {isForgotPasswordLoading ? t("loading") : "Vérifier OTP"}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={() => setForgotPasswordStep(1)}
            className="w-full h-10 sm:h-11 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm sm:text-base"
            disabled={isForgotPasswordLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      )
    } else if (forgotPasswordStep === 3) {
      return (
        <div className="space-y-4 sm:space-y-5">
          <div className="space-y-2">
            <Label htmlFor="new_password" className="text-sm font-medium text-slate-600">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Minimum 6 caractères"
                value={forgotPasswordNewPassword}
                onChange={(e) => setForgotPasswordNewPassword(e.target.value)}
                disabled={isForgotPasswordLoading}
                className="h-10 sm:h-11 pr-10 sm:pr-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 sm:h-11 w-10 sm:w-11 hover:bg-slate-100"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isForgotPasswordLoading}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_new_password" className="text-sm font-medium text-slate-600">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                id="confirm_new_password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Répétez le mot de passe"
                value={forgotPasswordConfirmPassword}
                onChange={(e) => setForgotPasswordConfirmPassword(e.target.value)}
                disabled={isForgotPasswordLoading}
                className="h-10 sm:h-11 pr-10 sm:pr-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 sm:h-11 w-10 sm:w-11 hover:bg-slate-100"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isForgotPasswordLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
          </div>
          
          <Button 
            type="button"
            onClick={handleResetPassword}
            className="w-full h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm sm:text-base"
            disabled={isForgotPasswordLoading}
          >
            {isForgotPasswordLoading ? t("loading") : "Réinitialiser le mot de passe"}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={() => setForgotPasswordStep(2)}
            className="w-full h-10 sm:h-11 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm sm:text-base"
            disabled={isForgotPasswordLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      )
    }
  }

  return (
    <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 flex-1 py-12">
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
            {isForgotPassword ? "Récupération" : "Bon retour"}
          </h2>
          <p className="text-sm sm:text-base text-slate-500">
            {isForgotPassword
              ? forgotPasswordStep === 1
                ? "Entrez votre email pour recevoir un code"
                : forgotPasswordStep === 2
                ? "Vérifiez votre boîte de réception"
                : "Créez un nouveau mot de passe"
              : "Connectez-vous pour accéder à votre compte"
            }
          </p>
        </div>

        {/* Form */}
        {isForgotPassword ? (
          renderForgotPasswordForm()
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email_or_phone" className="text-sm font-medium text-slate-700">
                Email ou téléphone
              </Label>
              <Input
                id="email_or_phone"
                type="text"
                placeholder="votre@email.com ou +225 01 23 45 67"
                {...register("email_or_phone")}
                disabled={isLoading}
                className="h-10 sm:h-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base"
              />
              {errors.email_or_phone && (
                <p className="text-xs sm:text-sm text-red-500 font-medium">{errors.email_or_phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isLoading}
                  className="h-10 sm:h-11 pr-10 sm:pr-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-sm sm:text-base"
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
              {errors.password && (
                <p className="text-xs sm:text-sm text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Checkbox
                  id="remember_me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="remember_me"
                  className="text-xs sm:text-sm cursor-pointer text-slate-600"
                >
                  Se souvenir de moi
                </Label>
              </div>
              <Button
                type="button"
                variant="link"
                className="px-0 text-xs sm:text-sm h-auto text-slate-600 hover:text-slate-900 font-medium"
                onClick={() => {
                  setIsForgotPassword(true)
                  setForgotPasswordStep(1)
                }}
                disabled={isLoading}
              >
                Mot de passe oublié ?
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg transition-all duration-200 text-sm sm:text-base"
              disabled={isLoading}
            >
              {isLoading ? t("loading") : "Se connecter"}
            </Button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200 text-center">
          <p className="text-xs sm:text-sm text-slate-500">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-slate-900 font-semibold hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}