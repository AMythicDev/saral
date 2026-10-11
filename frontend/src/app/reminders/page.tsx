"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getReminders, dismissReminder, deleteReminder } from "@/lib/api";
import { Reminder } from "@/lib/types";
import {
  Calendar,
  Trash2,
  EyeOff,
  ArrowLeft,
  Bell,
  Building2,
  IndianRupee,
  Clock,
  CheckCircle2,
} from "lucide-react";

function getDaysRemaining(dueDateParsed: string | null): number | null {
  if (!dueDateParsed) return null;
  const due = new Date(dueDateParsed);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgencyColor(days: number | null): {
  border: string;
  badge: string;
  badgeText: string;
  label: string;
} {
  if (days === null)
    return {
      border: "border-l-gray-400",
      badge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      badgeText: "No date",
      label: "unknown",
    };
  if (days < 0)
    return {
      border: "border-l-red-500",
      badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
      badgeText: `${Math.abs(days)}d overdue`,
      label: "overdue",
    };
  if (days <= 3)
    return {
      border: "border-l-amber-500",
      badge:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      badgeText: days === 0 ? "Due today" : `${days}d left`,
      label: "urgent",
    };
  if (days <= 7)
    return {
      border: "border-l-blue-500",
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
      badgeText: `${days}d left`,
      label: "soon",
    };
  return {
    border: "border-l-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    badgeText: `${days}d left`,
    label: "safe",
  };
}

export default function RemindersPage() {
  const [reminders, setReminders] = React.useState<Reminder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dismissingId, setDismissingId] = React.useState<number | null>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const fetchReminders = React.useCallback(async () => {
    try {
      const data = await getReminders(false);
      setReminders(data.reminders);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleDismiss = async (id: number) => {
    setDismissingId(id);
    try {
      await dismissReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to dismiss reminder:", err);
    } finally {
      setDismissingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete reminder:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
              स
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg sm:text-xl tracking-tight leading-none text-foreground">
                  Saral
                </h1>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  सरल
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bill Reminders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {reminders.length} Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Bill Reminders
          </h2>
          <p className="text-sm text-muted-foreground">
            Track upcoming bill due dates and never miss a payment.
          </p>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && reminders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Bell className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-semibold text-foreground">
                No reminders yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Analyze a bill to save reminders! When you analyze a legitimate
                bill, you can save its due date as a reminder here.
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" className="gap-2 mt-2">
                <ArrowLeft className="w-4 h-4" />
                Analyze a Bill
              </Button>
            </Link>
          </div>
        )}

        {/* Reminder Cards Grid */}
        {!loading && reminders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reminders.map((reminder) => {
              const days = getDaysRemaining(reminder.due_date_parsed);
              const urgency = getUrgencyColor(days);

              return (
                <Card
                  key={reminder.id}
                  className={`overflow-hidden border-l-4 ${urgency.border} transition-all hover:shadow-md`}
                >
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="secondary"
                        className="text-xs uppercase tracking-wider font-semibold"
                      >
                        {reminder.document_type.replace(/_/g, " ")}
                      </Badge>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${urgency.badge}`}
                      >
                        <Clock className="w-3 h-3 inline-block mr-1" />
                        {urgency.badgeText}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 space-y-3">
                    {/* Issuer */}
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      {reminder.issuer}
                    </div>

                    {/* Amount & Due Date */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-foreground font-medium">
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                        {reminder.amount_due}
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {reminder.due_date}
                      </span>
                    </div>

                    {/* Summary */}
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {reminder.summary}
                    </p>

                    <Separator />

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(reminder.id)}
                        disabled={
                          dismissingId === reminder.id ||
                          deletingId === reminder.id
                        }
                        className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        {dismissingId === reminder.id
                          ? "Dismissing..."
                          : "Dismiss"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(reminder.id)}
                        disabled={
                          deletingId === reminder.id ||
                          dismissingId === reminder.id
                        }
                        className="text-xs gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingId === reminder.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
