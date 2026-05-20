import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState, LoadingState, PageHeader, StatusMessage } from "@/components/ui/feedback";
import { Select } from "@/components/ui/form";
import { apiErrorMessage, listNotifications, markAllNotificationsRead, markNotificationRead, type Notification } from "@/lib/api";

type FilterType = "all" | "general" | "alert:medication" | "alert:vitals" | "alert:symptom" | "alert:ai" | "alert:emergency" | "alert:appointment";

export function NotificationCenterPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await listNotifications();
    setNotifications(data.results);
  }

  useEffect(() => {
    load()
      .catch((error) => setMessage(apiErrorMessage(error, "Could not load notifications.")))
      .finally(() => setLoading(false));
  }, []);

  async function handleMarkRead(id: number) {
    setMessage("");
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not mark as read."));
    }
  }

  async function handleMarkAllRead() {
    setMessage("");
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setMessage("All notifications marked as read.");
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not mark all as read."));
    }
  }

  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.notification_type === filter);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const typeLabels: Record<string, string> = {
    general: "General",
    "alert:medication": "Medication",
    "alert:vitals": "Vitals",
    "alert:symptom": "Symptom",
    "alert:ai": "AI Risk",
    "alert:emergency": "Emergency",
    "alert:appointment": "Appointment",
  };

  if (loading) return <LoadingState label="Loading notifications..." />;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Notification center"
        subtitle={`${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}. Stay updated on care alerts and reminders.`}
        action={unreadCount ? <Button variant="secondary" onClick={handleMarkAllRead}><CheckCheck aria-hidden /> Mark all read</Button> : null}
      />
      {message ? <StatusMessage message={message} tone={message.includes("Could not") ? "error" : "success"} /> : null}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle>Notifications</CardTitle>
          <Select value={filter} onChange={(e) => setFilter(e.target.value as FilterType)}>
            <option value="all">All types</option>
            <option value="general">General</option>
            <option value="alert:medication">Medication alerts</option>
            <option value="alert:vitals">Vitals alerts</option>
            <option value="alert:symptom">Symptom alerts</option>
            <option value="alert:ai">AI risk alerts</option>
            <option value="alert:emergency">Emergency alerts</option>
            <option value="alert:appointment">Appointment alerts</option>
          </Select>
        </div>

        <div className="mt-5 grid gap-3">
          {filtered.length ? filtered.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 rounded-3xl border p-5 transition ${notification.is_read ? "border-[#d8cebd] bg-[#faf8f3]" : "border-[#21473e] bg-white"}`}
            >
              <span className={`mt-1 grid size-10 place-items-center rounded-xl ${notification.is_read ? "bg-[#e6f0ea] text-[#5b665f]" : "bg-[#21473e] text-white"}`}>
                <Bell size={18} aria-hidden />
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black">{notification.title}</h3>
                  {!notification.is_read ? <Badge>New</Badge> : null}
                  <Badge>{typeLabels[notification.notification_type] || notification.notification_type}</Badge>
                </div>
                <p className="mt-1 font-semibold text-[#5b665f]">{notification.message}</p>
                <p className="mt-1 text-sm font-semibold text-[#5b665f]">{new Date(notification.created_at).toLocaleString()}</p>
              </div>
              {!notification.is_read ? (
                <Button variant="ghost" onClick={() => handleMarkRead(notification.id)}>Mark read</Button>
              ) : null}
            </div>
          )) : <EmptyState title="No notifications" message={filter === "all" ? "No messages yet. Notifications appear when alerts are created for your care." : "No notifications match this filter."} />}
        </div>
      </Card>
    </div>
  );
}

export function NotificationBell({ unreadCount, onClick }: { unreadCount: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative grid size-12 place-items-center rounded-2xl bg-[#e9dfcf] text-[#21473e] transition hover:bg-[#d8cebd]" aria-label={`Notifications, ${unreadCount} unread`}>
      <Bell size={20} />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-[#b65f3a] text-xs font-black text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>
      ) : null}
    </button>
  );
}
