"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  type?: "default" | "success" | "warning" | "error"
  loading?: boolean
  className?: string
}

const icons = {
  default: null,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
}

const styles = {
  default: "border-primary/20",
  success: "border-green-500/20 bg-green-500/5",
  warning: "border-yellow-500/20 bg-yellow-500/5",
  error: "border-red-500/20 bg-red-500/5",
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  onConfirm,
  onCancel,
  type = "default",
  loading = false,
  className,
}: ConfirmationDialogProps) {
  const Icon = icons[type]

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          "mobile-modal glass-panel border-2 animate-scale-in",
          styles[type],
          className
        )}
      >
        <AlertDialogHeader className="text-center">
          {Icon && (
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className={cn(
                "w-6 h-6",
                {
                  "text-green-500": type === "success",
                  "text-yellow-500": type === "warning",
                  "text-red-500": type === "error",
                  "text-primary": type === "default",
                }
              )} />
            </div>
          )}
          <AlertDialogTitle className="text-xl font-bold">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-muted-foreground mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex gap-3 sm:gap-4 mt-6">
          <AlertDialogCancel
            asChild
            disabled={loading}
            onClick={onCancel}
          >
            <Button
              variant="outline-glow"
              className="flex-1 mobile-btn-enhanced"
              disabled={loading}
            >
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction
            asChild
            onClick={onConfirm}
            disabled={loading}
          >
            <Button
              variant={type === "error" ? "destructive" : "glow"}
              className="flex-1 mobile-btn-enhanced"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Traitement...
                </div>
              ) : (
                confirmText
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}







