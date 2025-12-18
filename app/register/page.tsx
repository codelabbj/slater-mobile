"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/lib/api"
import { useSettings } from "@/hooks/use-settings"

const registerSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  re_password: z.string().min(6, "Veuillez confirmer votre mot de passe"),
  referral_code: z.string().optional(),
})


export default function RegisterPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { referralBonusEnabled, isLoading: settingsLoading } = useSettings()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const payload: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        re_password: data.re_password,
      }

      // Only include referral_code if referral_bonus is enabled
      if (referralBonusEnabled && data.referral_code) {
        payload.referral_code = data.referral_code
      }

      await api.post("/auth/registration", payload)
      toast.success("Inscription réussie! Veuillez vous connecter.")
      router.push("/login")
    } catch (error: any) {
      toast.error(error.message || "Erreur d'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 gradient-background mobile-safe-touch">
      <Card className="floating-card w-full max-w-md animate-scale-in">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <Image
              src="/Slater-logo.png"
              alt="Slater Logo"
              width={120}
              height={120}
              className="object-contain animate-float"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Slater</CardTitle>
          <CardDescription className="text-center">{t("register")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">{t("firstName")}</Label>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="Entrez votre prénom"
                  className="mobile-form-input"
                  {...register("first_name")}
                  disabled={isLoading}
                />
                {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">{t("lastName")}</Label>
                <Input
                  id="last_name"
                  type="text"
                  placeholder="Entrez votre nom"
                  className="mobile-form-input"
                  {...register("last_name")}
                  disabled={isLoading}
                />
                {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="Entrez votre adresse e-mail"
                className="mobile-form-input"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Entrez votre numéro de téléphone"
                className="mobile-form-input"
                {...register("phone")}
                disabled={isLoading}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Créez un mot de passe"
                  className="mobile-form-input pr-10"
                  {...register("password")}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="re_password">{t("confirmPassword")}</Label>
              <div className="relative">
                <Input
                  id="re_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmez votre mot de passe"
                  className="mobile-form-input pr-10"
                  {...register("re_password")}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.re_password && <p className="text-sm text-destructive">{errors.re_password.message}</p>}
            </div>

            {referralBonusEnabled && (
              <div className="space-y-2">
                <Label htmlFor="referral_code">Code de parrainage (optionnel)</Label>
                <Input
                  id="referral_code"
                  type="text"
                  placeholder="Entrez un code de parrainage"
                  className="mobile-form-input"
                  {...register("referral_code")}
                  disabled={isLoading || settingsLoading}
                />
                {errors.referral_code && <p className="text-sm text-destructive">{errors.referral_code?.message}</p>}
              </div>
            )}

            <Button type="submit" variant="glow" className="w-full mobile-btn-enhanced" disabled={isLoading || settingsLoading}>
              {isLoading ? t("loading") : t("registerButton")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            {t("alreadyHaveAccount")}{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {t("login")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
