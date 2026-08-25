import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/session";
import { toast } from "sonner";
import { User as UserIcon, KeyRound, Save, Camera, Trash2, Bell, Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { getInitials } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
const emptyProfile = {
    phone: "", language: "", gender: "", birthDate: "", region: "", district: "", instagram: "", telegram: "",
};
export default function TeacherProfilePage() {
    const { data: session, update } = useSession();
    const user = session?.user;
    const [fullName, setFullName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [profile, setProfile] = useState(emptyProfile);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingName, setSavingName] = useState(false);
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const fileInputRef = useRef(null);
    const initializedRef = useRef(false);
    useEffect(() => {
        if (!user?.id || initializedRef.current)
            return;
        setFullName(user.fullName ?? user.name ?? "");
        setAvatarUrl(user.avatarUrl ?? null);
        initializedRef.current = true;
    }, [user]);
    useEffect(() => {
        apiFetch("/api/teacher/profile")
            .then((r) => r.json())
            .then((d) => setProfile({
            phone: d.phone ?? "",
            language: d.language ?? "",
            gender: d.gender ?? "",
            birthDate: d.birthDate ? d.birthDate.slice(0, 10) : "",
            region: d.region ?? "",
            district: d.district ?? "",
            instagram: d.instagram ?? "",
            telegram: d.telegram ?? "",
        }))
            .finally(() => setLoadingProfile(false));
    }, []);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const saveName = async () => {
        if (!user?.id)
            return;
        const trimmed = fullName.trim();
        if (trimmed.length < 2) {
            toast.error("Ism kamida 2 harf bo'lsin");
            return;
        }
        setSavingName(true);
        const res = await apiFetch(`/api/users/${user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName: trimmed }),
        });
        setSavingName(false);
        if (res.ok) {
            toast.success("Ism yangilandi");
            await update({ fullName: trimmed });
        }
        else {
            toast.error("Ismni yangilab bo'lmadi");
        }
    };
    const uploadAvatar = async (dataUrl) => {
        if (!user?.id)
            return;
        setSavingAvatar(true);
        const res = await apiFetch(`/api/users/${user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatarUrl: dataUrl }),
        });
        setSavingAvatar(false);
        if (res.ok) {
            setAvatarUrl(dataUrl);
            toast.success("Rasm yangilandi");
            await update({ avatarUrl: dataUrl });
        }
        else {
            toast.error("Rasmni saqlab bo'lmadi");
        }
    };
    const onAvatarFile = (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file)
            return;
        if (!file.type.startsWith("image/")) {
            toast.error("Rasm fayli tanlang");
            return;
        }
        if (file.size > 1024 * 1024) {
            toast.error("Rasm 1MB dan kichik bo'lsin");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => uploadAvatar(reader.result);
        reader.readAsDataURL(file);
    };
    const removeAvatar = async () => {
        if (!user?.id)
            return;
        setSavingAvatar(true);
        const res = await apiFetch(`/api/users/${user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatarUrl: "" }),
        });
        setSavingAvatar(false);
        if (res.ok) {
            setAvatarUrl(null);
            toast.success("Rasm o'chirildi");
            await update({ avatarUrl: null });
        }
        else {
            toast.error("Xatolik");
        }
    };
    const saveProfile = async () => {
        if (!user?.id)
            return;
        setSavingProfile(true);
        const res = await apiFetch(`/api/users/${user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                phone: profile.phone || "",
                language: profile.language || null,
                gender: profile.gender || null,
                birthDate: profile.birthDate || null,
                region: profile.region || null,
                district: profile.district || null,
                instagram: profile.instagram || null,
                telegram: profile.telegram || null,
            }),
        });
        setSavingProfile(false);
        if (res.ok)
            toast.success("Ma'lumotlar saqlandi");
        else
            toast.error("Saqlanmadi");
    };
    const changePassword = async () => {
        if (!user?.id)
            return;
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
        const res = await apiFetch(`/api/users/${user.id}`, {
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
        }
        else {
            toast.error(data.error || "Parolni o'zgartirib bo'lmadi");
        }
    };
    return (<div className="min-h-screen bg-[#F5F6FA] dark:bg-gray-950 p-3 sm:p-4 lg:p-6 space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profil</h1>
          <p className="text-sm text-gray-500 mt-0.5">Shaxsiy ma&apos;lumotlar va xavfsizlik sozlamalari</p>
        </div>

        {/* Shaxsiyat */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-[#5E2CA5]"/>
              Shaxsiyat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0 group">
                <div className="w-16 h-16 rounded-2xl bg-[#5E2CA5]/10 dark:bg-[#5E2CA5]/20 flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover"/>) : (<span className="text-lg font-semibold text-[#5E2CA5] dark:text-purple-400">
                      {user ? getInitials(user.fullName ?? user.name ?? "U") : "U"}
                    </span>)}
                </div>
                <button onClick={() => fileInputRef.current?.click()} disabled={savingAvatar} title={avatarUrl ? "Rasmni almashtirish" : "Rasm qo'yish"} className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#5E2CA5] hover:bg-[#4e2488] text-white flex items-center justify-center shadow-sm transition disabled:opacity-60">
                  <Camera className="w-3.5 h-3.5"/>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={onAvatarFile} className="hidden"/>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {user?.fullName ?? user?.name ?? "—"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{user?.username ?? "—"}</p>
                {avatarUrl && (<button onClick={removeAvatar} disabled={savingAvatar} className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-red-600 transition disabled:opacity-60">
                    <Trash2 className="w-3 h-3"/> Rasmni o&apos;chirish
                  </button>)}
              </div>
            </div>

            <div className="pt-1 border-t border-gray-100 dark:border-white/10 space-y-3">
              <Input label="To'liq ism" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ism Familiya" className="focus:ring-[#5E2CA5] focus:border-transparent"/>
              <Button onClick={saveName} loading={savingName} disabled={fullName.trim() === ((user?.fullName ?? user?.name ?? "").trim())} className="bg-[#5E2CA5] hover:bg-[#4e2488] text-white shadow-sm">
                <Save className="w-4 h-4"/> Ismni saqlash
              </Button>
            </div>

            {!loadingProfile && (<div className="pt-1 border-t border-gray-100 dark:border-white/10 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Telefon" value={profile.phone ?? ""} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+998 90 123 45 67" className="focus:ring-[#5E2CA5] focus:border-transparent"/>
                  <Select label="Til" value={profile.language ?? ""} onChange={(e) => setProfile((p) => ({ ...p, language: e.target.value }))} placeholder="Tanlang" options={[{ value: "uz", label: "O'zbekcha" }, { value: "ru", label: "Ruscha" }, { value: "en", label: "Inglizcha" }]}/>
                  <Select label="Jins" value={profile.gender ?? ""} onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))} placeholder="Tanlang" options={[{ value: "male", label: "Erkak" }, { value: "female", label: "Ayol" }]}/>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tug&apos;ilgan sana</label>
                    <DatePicker value={profile.birthDate ?? ""} onChange={(e) => setProfile((p) => ({ ...p, birthDate: e.target.value }))} className="w-full"/>
                  </div>
                  <Input label="Viloyat" value={profile.region ?? ""} onChange={(e) => setProfile((p) => ({ ...p, region: e.target.value }))} placeholder="Toshkent" className="focus:ring-[#5E2CA5] focus:border-transparent"/>
                  <Input label="Tuman" value={profile.district ?? ""} onChange={(e) => setProfile((p) => ({ ...p, district: e.target.value }))} placeholder="Yunusobod" className="focus:ring-[#5E2CA5] focus:border-transparent"/>
                  <Input label="Instagram" value={profile.instagram ?? ""} onChange={(e) => setProfile((p) => ({ ...p, instagram: e.target.value }))} placeholder="@username" className="focus:ring-[#5E2CA5] focus:border-transparent"/>
                  <Input label="Telegram" value={profile.telegram ?? ""} onChange={(e) => setProfile((p) => ({ ...p, telegram: e.target.value }))} placeholder="@username" className="focus:ring-[#5E2CA5] focus:border-transparent"/>
                </div>
                <Button onClick={saveProfile} loading={savingProfile} className="bg-[#5E2CA5] hover:bg-[#4e2488] text-white shadow-sm">
                  <Save className="w-4 h-4"/> Ma&apos;lumotlarni saqlash
                </Button>
              </div>)}
          </CardContent>
        </Card>

        {/* Kirish va xavfsizlik */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#5E2CA5]"/>
              Kirish va xavfsizlik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Eski parol" type="password" autoComplete="current-password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Joriy parolingiz" className="focus:ring-[#5E2CA5] focus:border-transparent"/>
            <Input label="Yangi parol" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Kamida 8 ta belgi" className="focus:ring-[#5E2CA5] focus:border-transparent"/>
            <Input label="Yangi parolni tasdiqlang" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Yangi parolni qayta kiriting" className="focus:ring-[#5E2CA5] focus:border-transparent"/>
            <Button onClick={changePassword} loading={saving} className="bg-[#5E2CA5] hover:bg-[#4e2488] text-white shadow-sm">
              <Save className="w-4 h-4"/> Saqlash
            </Button>
          </CardContent>
        </Card>

        {/* Bildirishnomalar */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#5E2CA5]"/>
              Bildirishnomalar
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500">
                Tez kunda
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* To'lovlar tarixi */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#5E2CA5]"/>
              To&apos;lovlar tarixi
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500">
                Tez kunda
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>);
}
