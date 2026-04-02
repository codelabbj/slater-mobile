"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, UserCircle, Lock, Mail, Phone } from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthGuard } from "@/components/auth-guard"
import { AppBar } from "@/components/ui/app-bar"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"

interface UserProfile {
  id: string
  bonus_available: number
  is_superuser: boolean
  username: string
  first_name: string
  last_name: string
  email: string
  is_delete: boolean
  phone: string
  otp: string | null
  otp_created_at: string | null
  is_block: boolean
  referrer_code: string | null
  referral_code: string | null
  is_active: boolean
  is_staff: boolean
  is_supperuser: boolean
  date_joined: string
  last_login: string
}

function ProfileContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form states for profile edit
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  })

  // Form states for password change
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_new_password: "",
  })

  // Fetch user profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const response = await api.get<UserProfile>("/auth/me")
      return response.data
    },
  })

  // Update form when profile data is loaded
  useEffect(() => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      })
    }
  }, [profile])

  // Edit profile mutation
  const editProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const response = await api.post("/auth/edit", data)
      return response.data
    },
    onSuccess: (data) => {
      toast.success("Profil mis à jour avec succès!")
      // Update local storage user data
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}")
      const updatedUser = {
        ...currentUser,
        first_name: data.first_name || currentUser.first_name,
        last_name: data.last_name || currentUser.last_name,
        email: data.email || currentUser.email,
        phone: data.phone || currentUser.phone,
      }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })
    },
    onError: (error: any) => {
      const errorData = 
        error?.originalError?.response?.data || 
        error?.response?.data || 
        error?.data
      
      if (error?.originalError?.response?.status === 400) {
        const errorMsg = errorData?.details || errorData?.detail || errorData?.error || errorData?.message || error.message
        toast.error(errorMsg || "Erreur lors de la mise à jour du profil")
      } else {
        toast.error(error.message || "Erreur lors de la mise à jour du profil")
      }
    },
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordForm) => {
      const response = await api.post("/auth/change_password", {
        old_password: data.old_password,
        new_password: data.new_password,
        confirm_new_password: data.confirm_new_password,
      })
      return response.data
    },
    onSuccess: () => {
      toast.success("Mot de passe modifié avec succès!")
      setPasswordForm({
        old_password: "",
        new_password: "",
        confirm_new_password: "",
      })
    },
    onError: (error: any) => {
      const errorData = 
        error?.originalError?.response?.data || 
        error?.response?.data || 
        error?.data
      
      if (error?.originalError?.response?.status === 400) {
        const errorMsg = errorData?.details || errorData?.detail || errorData?.error || errorData?.message || error.message
        toast.error(errorMsg || "Erreur lors du changement de mot de passe")
      } else {
        toast.error(error.message || "Erreur lors du changement de mot de passe")
      }
    },
  })

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    editProfileMutation.mutate(profileForm)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      toast.error("Les nouveaux mots de passe ne correspondent pas")
      return
    }

    if (passwordForm.new_password.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères")
      return
    }

    changePasswordMutation.mutate(passwordForm)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-background flex items-center justify-center mobile-safe-touch">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-2"></div>
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 pt-16 sm:pt-20">
      {/* Header */}
      <AppBar />

      <main className="mx-auto w-full max-w-lg p-4 sm:p-6 md:p-8">
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
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Mon Profil</h1>
          </div>
        </div>

        {/* Profile Summary Card */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
          <div className="relative flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg">
              <UserCircle className="h-10 w-10" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {profile?.first_name} {profile?.last_name}
              </h2>
              <p className="text-xs text-slate-500 truncate">{profile?.email || "Email indisponible"}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] h-5 px-2">
                  Client Slater
                </Badge>
                {profile?.referral_code && (
                  <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 text-[10px] h-5 px-2">
                    {profile.referral_code}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information Form */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg mb-6">
          <div className="relative space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-primary" />
                Informations personnelles
              </h2>
              <p className="text-xs text-slate-500">Mettez à jour vos coordonnées personnelles</p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Prénom</Label>
                  <Input
                    id="first_name"
                    type="text"
                    className="h-11 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                    disabled={editProfileMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Nom</Label>
                  <Input
                    id="last_name"
                    type="text"
                    className="h-11 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                    disabled={editProfileMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="h-11 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  disabled={editProfileMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  Téléphone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  className="h-11 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  disabled={editProfileMutation.isPending}
                />
              </div>

              <Button type="submit" className="w-full h-11 rounded-xl bg-primary text-white font-bold hover:shadow-lg transition-all" disabled={editProfileMutation.isPending}>
                {editProfileMutation.isPending ? t("loading") : "Enregistrer"}
              </Button>
            </form>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-background via-muted/20 to-background border backdrop-blur-sm shadow-lg">
          <div className="relative space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Sécurité
              </h2>
              <p className="text-xs text-slate-500">Changer votre mot de passe</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old_password" className="text-xs font-bold uppercase tracking-wider text-slate-500">Ancien mot de passe</Label>
                <div className="relative">
                  <Input
                    id="old_password"
                    type={showOldPassword ? "text" : "password"}
                    className="h-11 pr-10 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary"
                    value={passwordForm.old_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                    disabled={changePasswordMutation.isPending}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  >
                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password" className="text-xs font-bold uppercase tracking-wider text-slate-500">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showNewPassword ? "text" : "password"}
                    className="h-11 pr-10 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    disabled={changePasswordMutation.isPending}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_new_password" className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirmer</Label>
                <div className="relative">
                  <Input
                    id="confirm_new_password"
                    type={showConfirmPassword ? "text" : "password"}
                    className="h-11 pr-10 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary"
                    value={passwordForm.confirm_new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_new_password: e.target.value })}
                    disabled={changePasswordMutation.isPending}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold hover:shadow-lg transition-all" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? t("loading") : "Mettre à jour"}
              </Button>
            </form>
          </div>
        </div>

        {/* Account Metadata */}
        <div className="mt-8 px-6 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Inscrit le {profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString("fr-FR") : "N/A"}
            </p>
        </div>
      </main>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  )
}
