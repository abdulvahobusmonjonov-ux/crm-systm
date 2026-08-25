"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { User as UserIcon, KeyRound, Save, Camera, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS } from "@/lib/permissions";
import { getInitials } from "@/lib/utils";

const ROLE_BADGE_CLS: Record<string, string> = {
  SUPER_ADMIN: "bg-[#5E2CA5]/10 text-[#5E2CA5] dark:bg-[#5E2CA5]/20",
  ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  OPERATOR: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  MANAGER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
};

interface SessionUser {
  id: string;
  fullName?: string;
  name?: string;
  username?: string;
  role?: string;
  avatarUrl?: string | null;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  // Seed local editable state from the session once it first loads. Only
  // once — the session can refetch/update in the background (e.g. our own
  // update() calls, window refocus), and re-syncing on every change would
  // clobber a name the user is actively typing.
  useEffect(() => {
    if (!user?.id || initializedRef.current) return;
    setFullName(user.fullName ?? user.name ?? "");
    setAvatarUrl(user.avatarUrl ?? null);
    initializedRef.current = true;
  }, [user]);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const saveName = async () => {
    if (!user?.id) return;
    const trimmed = fullName.trim();
    if (trimmed.length < 2) { toast.error("Ism kamida 2 harf bo'lsin"); return; }

    setSavingName(true);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: trimmed }),
    });
    setSavingName(false);

    if (res.ok) {
      toast.success("Ism yangilandi");
      await update({ fullName: trimmed });
    } else {
      toast.error("Ismni yangilab bo'lmadi");
    }
  };

  const uploadAvatar = async (dataUrl: string) => {
    if (!user?.id) return;
    setSavingAvatar(true);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl: dataUrl }),
    });
    setSavingAvatar(false);

    if (res.ok) {
      setAvatarUrl(dataUrl);
      toast.success("Rasm yangilandi");
      await update({ avatarUrl: dataUrl });
    } else {
      toast.error("Rasmni saqlab bo'lmadi");
    }
  };

  const onAvatarFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Rasm fayli tanlang"); return; }
    if (file.size > 1024 * 1024) { toast.error("Rasm 1MB dan kichik bo'lsin"); return; }
    const reader = new FileReader();
    reader.onload = () => uploadAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeAvatar = async () => {
    if (!user?.id) return;
    setSavingAvatar(true);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl: "" }),
    });
    setSavingAvatar(false);

    if (res.ok) {
      setAvatarUrl(null);
      toast.success("Rasm o'chirildi");
      await update({ avatarUrl: null });
    } else {
      toast.error("Xatolik");
    }
  };

  const changePassword = async () => {
    if (!user?.id) return;
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Yangi parol kamida 8 ta belgi bo'lsin");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Parollar mos kelmadi");
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword, oldPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (res.ok) {
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(data.error || "Parolni o'zgartirib bo'lmadi");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-6">
      <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Shaxsiy ma&apos;lumotlar va xavfsizlik sozlamalari</p>
      </div>

      {/* User info */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#5E2CA5]" />
            Foydalanuvchi ma&apos;lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0 group">
              <div className="w-16 h-16 rounded-2xl bg-[#5E2CA5]/10 dark:bg-[#5E2CA5]/20 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-semibold text-[#5E2CA5] dark:text-purple-400">
                    {user ? getInitials(user.fullName ?? user.name ?? "U") : "U"}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={savingAvatar}
                title={avatarUrl ? "Rasmni almashtirish" : "Rasm qo'yish"}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#5E2CA5] hover:bg-[#4e2488] text-white flex items-center justify-center shadow-sm transition disabled:opacity-60"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onAvatarFile}
                className="hidden"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {user?.fullName ?? user?.name ?? "—"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{user?.username ?? "—"}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {user?.role && (
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                      ROLE_BADGE_CLS[user.role] || "bg-gray-100 text-gray-600 dark:bg-white/8 dark:text-gray-400"
                    }`}
                  >
                    {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                  </span>
                )}
                {avatarUrl && (
                  <button
                    onClick={removeAvatar}
                    disabled={savingAvatar}
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-red-600 transition disabled:opacity-60"
                  >
                    <Trash2 className="w-3 h-3" /> Rasmni o&apos;chirish
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-1 border-t border-gray-100 dark:border-white/10 space-y-3">
            <Input
              label="To'liq ism"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ism Familiya"
              className="focus:ring-[#5E2CA5] focus:border-transparent"
            />
            <Button
              onClick={saveName}
              loading={savingName}
              disabled={fullName.trim() === ((user?.fullName ?? user?.name ?? "").trim())}
              className="bg-[#5E2CA5] hover:bg-[#4e2488] text-white shadow-sm"
            >
              <Save className="w-4 h-4" /> Ismni saqlash
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#5E2CA5]" />
            Parolni o&apos;zgartirish
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Eski parol"
            type="password"
            autoComplete="current-password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Joriy parolingiz"
            className="focus:ring-[#5E2CA5] focus:border-transparent"
          />
          <Input
            label="Yangi parol"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Kamida 8 ta belgi"
            className="focus:ring-[#5E2CA5] focus:border-transparent"
          />
          <Input
            label="Yangi parolni tasdiqlang"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Yangi parolni qayta kiriting"
            className="focus:ring-[#5E2CA5] focus:border-transparent"
          />
          <Button
            onClick={changePassword}
            loading={saving}
            className="bg-[#5E2CA5] hover:bg-[#4e2488] text-white shadow-sm"
          >
            <Save className="w-4 h-4" /> Saqlash
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
  );
}
