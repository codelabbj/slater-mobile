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
import api from "@/lib/api"
import type { Notification, PaginatedResponse } from "@/lib/types"
import { formatDate } from "@/lib/utils"

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
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{t("notifications")}</h1>
            {showLocalNotifications ? (
              <p className="text-sm text-muted-foreground">Notifications locales ({displayNotifications.length})</p>
            ) : unreadCount > 0 ? (
              <p className="text-sm text-muted-foreground">{unreadCount} non lues</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && !showLocalNotifications && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs"
              >
                {markAllAsReadMutation.isPending ? "Marquage..." : "Tout marquer comme lu"}
              </Button>
            )}
            {showLocalNotifications && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllLocalNotifications}
                className="text-xs"
              >
                Supprimer tout
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("notifications")}</CardTitle>
                <CardDescription>
                  {showLocalNotifications ? displayNotifications.length : (data?.count || 0)} notification{(showLocalNotifications ? displayNotifications.length : (data?.count || 0)) > 1 ? "s" : ""}
                  {showLocalNotifications && " (locales)"}
                </CardDescription>
              </div>
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && !showLocalNotifications ? (
              <div className="text-center py-8 text-muted-foreground">{t("loading")}</div>
            ) : displayNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {showLocalNotifications ? "Aucune notification locale" : t("noData")}
              </div>
            ) : (
              <div className="space-y-3">
                {displayNotifications.map((notification, index) => {
                  const isLatest = index === 0 && !showLocalNotifications; // First item is latest from API
                  const isNew = !notification.is_read;

                  return (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-colors relative ${
                        isNew ? "bg-primary/5 border-primary/20" : "bg-background"
                      } ${isLatest ? "ring-2 ring-blue-500/50" : ""}`}
                    >
                      {isLatest && (
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          DERNIÈRE
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${isNew ? "bg-primary" : "bg-gray-300"}`} />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{notification.title}</h3>
                            {isNew && <Badge variant="default" className="text-xs">NOUVEAU</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.content}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(notification.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
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
