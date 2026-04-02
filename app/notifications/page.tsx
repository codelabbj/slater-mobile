"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowLeft, Bell, CheckCheck } from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/auth-guard"
import { AppBar } from "@/components/ui/app-bar"
import api from "@/lib/api"
import type { Notification, PaginatedResponse } from "@/lib/types"
import { formatDate, cn } from "@/lib/utils"

function NotificationsContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [localNotifications, setLocalNotifications] = useState<any[]>([])
  const [showLocalNotifications, setShowLocalNotifications] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Notification>>("/mobcash/notification")
      return response.data
    },
    refetchInterval: showLocalNotifications ? false : 120000, // Refresh every 2 minutes only when not showing local notifications
  })


  // Use local notifications if showing them, otherwise use API data
  const displayNotifications = showLocalNotifications
    ? localNotifications
    : (data?.results || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Sort latest first

  const unreadCount = data?.results.filter((n) => !n.is_read).length || 0

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // Save current notifications locally before clearing
      if (data?.results) {
        setLocalNotifications(data.results)
        setShowLocalNotifications(true)
      }
      // Call API to clear notifications from backend
      const response = await api.post('/mobcash/read-notification')
      return response.data
    },
    onSuccess: () => {
      // Invalidate the notifications query to refetch data (should be empty now)
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      // Also invalidate the notification count query on dashboard
      queryClient.invalidateQueries({ queryKey: ["notification-count"] })
      toast.success("Toutes les notifications ont été marquées comme lues")
    },
    onError: (error: any) => {
      // If API call fails, don't show local notifications
      setShowLocalNotifications(false)
      setLocalNotifications([])
      toast.error(error.message || "Erreur lors de la mise à jour")
    },
  })

  // Clear all local notifications
  const clearAllLocalNotifications = () => {
    setLocalNotifications([])
    setShowLocalNotifications(false)
    toast.success("Toutes les notifications locales ont été supprimées")
  }

  return (
    <div className="min-h-screen pb-24 pt-16 sm:pt-20">
      <AppBar />
      
      <main className="mx-auto w-full max-w-lg p-4 sm:p-6 md:p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{t("notifications")}</h1>
            </div>
            
            <div className="flex gap-2">
              {unreadCount > 0 && !showLocalNotifications && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className="h-8 text-[10px] uppercase tracking-wider font-bold rounded-lg border-primary/20 text-primary hover:bg-primary/5"
                >
                  <CheckCheck className="h-3 w-3 mr-1.5" />
                  {markAllAsReadMutation.isPending ? "..." : "Tout lire"}
                </Button>
              )}
              {showLocalNotifications && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllLocalNotifications}
                  className="h-8 text-[10px] uppercase tracking-wider font-bold rounded-lg border-rose-200 text-rose-500 hover:bg-rose-50"
                >
                  Supprimer
                </Button>
              )}
            </div>
          </div>
          
          <div className="px-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              {showLocalNotifications ? displayNotifications.length : (data?.count || 0)} notification{(showLocalNotifications ? displayNotifications.length : (data?.count || 0)) > 1 ? "s" : ""}
              {showLocalNotifications && " (locales)"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading && !showLocalNotifications ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed text-slate-400">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-2"></div>
              <p className="text-sm font-medium">{t("loading")}...</p>
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <Bell className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">{t("noData")}</p>
            </div>
          ) : (
            displayNotifications.map((notification, index) => {
              const isLatest = index === 0 && !showLocalNotifications;
              const isNew = !notification.is_read;

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 border backdrop-blur-sm",
                    isNew 
                      ? "bg-white dark:bg-slate-900 border-primary/20 shadow-lg shadow-primary/5" 
                      : "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800",
                    isLatest && !isNew ? "ring-1 ring-blue-500/20" : ""
                  )}
                >
                  {isNew && (
                    <div className="absolute top-0 right-0 p-1.5">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "mt-1 p-2 rounded-xl shrink-0",
                      isNew ? "bg-primary/10 text-primary" : "bg-slate-200/50 dark:bg-slate-800 text-slate-400"
                    )}>
                      <Bell className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={cn(
                          "text-sm font-bold truncate",
                          isNew ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                        )}>
                          {notification.title}
                        </h3>
                        {isLatest && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-blue-200 text-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                            RÉCENT
                          </Badge>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs leading-relaxed",
                        isNew ? "text-slate-600 dark:text-slate-300" : "text-slate-500/80 dark:text-slate-500"
                      )}>
                        {notification.content}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 pt-1">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  )
}
