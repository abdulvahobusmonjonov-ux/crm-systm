"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Modal, ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";
import { isPhoneComplete } from "@/lib/utils";

const schema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 harf"),
  username: z.string().min(3).regex(/^[a-z0-9_]+$/, "Kichik harf, raqam va _ faqat"),
  email: z.string().email("Email noto'g'ri").optional().or(z.literal("")),
  phone: z.string().optional().refine((v) => !v || isPhoneComplete(v), "To'liq telefon raqam kiriting"),
  password: z.string().min(8, "Kamida 8 belgi").optional().or(z.literal("")),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "OPERATOR", "MENTOR", "RECEPTION", "ACCOUNTANT"]),
  canManageLeads: z.boolean(),
  canManageCourses: z.boolean(),
  canManageUsers: z.boolean(),
  canViewReports: z.boolean(),
  canExportData: z.boolean(),
  canSeePayments: z.boolean(),
  canManagePayments: z.boolean(),
  canSeeStudentContacts: z.boolean(),
  canManageAttendance: z.boolean(),
  canManageGrades: z.boolean(),
  canSeeReports: z.boolean(),
  canManageExpenses: z.boolean(),
});

// Sensible starting point per role when creating a brand-new user — admin can still
// flip any of these individually before saving.
const ROLE_DEFAULT_PERMISSIONS: Record<FormData["role"], Partial<FormData>> = {
  SUPER_ADMIN: {},
  ADMIN: {},
  MANAGER: { canViewReports: true, canSeeReports: true },
  OPERATOR: { canManageAttendance: true, canManageGrades: true },
  MENTOR: { canManageAttendance: true, canManageGrades: true },
  RECEPTION: { canManageLeads: true, canSeeStudentContacts: true },
  ACCOUNTANT: { canSeePayments: true, canManagePayments: true, canSeeReports: true, canManageExpenses: true },
};

type FormData = z.infer<typeof schema>;

interface EditableUser {
  id: string;
  fullName: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: FormData["role"];
  canManageLeads: boolean;
  canManageCourses: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canExportData: boolean;
  canSeePayments: boolean;
  canManagePayments: boolean;
  canSeeStudentContacts: boolean;
  canManageAttendance: boolean;
  canManageGrades: boolean;
  canSeeReports: boolean;
  canManageExpenses: boolean;
}

const PERMISSION_KEYS = [
  "canManageLeads", "canManageCourses", "canManageUsers", "canViewReports", "canExportData",
  "canSeePayments", "canManagePayments", "canSeeStudentContacts", "canManageAttendance",
  "canManageGrades", "canSeeReports", "canManageExpenses",
] as const satisfies readonly (keyof FormData)[];

interface Props {
  user: EditableUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function UserFormModal({ user, onClose, onSuccess }: Props) {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedPass, setGeneratedPass] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.fullName || "",
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
      password: "",
      role: user?.role || "OPERATOR",
      canManageLeads: user?.canManageLeads ?? true,
      canManageCourses: user?.canManageCourses ?? false,
      canManageUsers: user?.canManageUsers ?? false,
      canViewReports: user?.canViewReports ?? false,
      canExportData: user?.canExportData ?? false,
      canSeePayments: user?.canSeePayments ?? false,
      canManagePayments: user?.canManagePayments ?? false,
      canSeeStudentContacts: user?.canSeeStudentContacts ?? true,
      canManageAttendance: user?.canManageAttendance ?? false,
      canManageGrades: user?.canManageGrades ?? false,
      canSeeReports: user?.canSeeReports ?? false,
      canManageExpenses: user?.canManageExpenses ?? false,
    },
  });

  const handleGenerate = () => {
    const p = generatePassword();
    setGeneratedPass(p);
    setValue("password", p);
  };

  // New users get sensible permission defaults for the picked role; editing an existing
  // user never auto-overwrites permissions an admin already customized.
  const applyRoleDefaults = (role: FormData["role"]) => {
    setValue("role", role);
    if (user) return;
    const defaults = ROLE_DEFAULT_PERMISSIONS[role];
    for (const key of PERMISSION_KEYS) {
      setValue(key, defaults[key] ?? false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const url = user ? `/api/users/${user.id}` : "/api/users";
      const method = user ? "PATCH" : "POST";
      const body: Partial<FormData> = { ...data };
      if (user && !body.password) delete body.password;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(user ? "Hodim yangilandi" : "Hodim qo'shildi");
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Xatolik yuz berdi");
      }
    } finally {
      setLoading(false);
    }
  };

  const permissions = [
    { key: "canManageLeads", label: "Lidlarni boshqarish" },
    { key: "canManageCourses", label: "Kurslarni tahrirlash" },
    { key: "canManageUsers", label: "Foydalanuvchilar boshqarish" },
    { key: "canViewReports", label: "Hisobotlarni ko'rish" },
    { key: "canExportData", label: "Ma'lumotlarni eksport" },
    { key: "canSeePayments", label: "To'lov holatini ko'rish" },
    { key: "canManagePayments", label: "To'lov qabul qilish" },
    { key: "canSeeStudentContacts", label: "O'quvchi telefon/manzilini ko'rish" },
    { key: "canManageAttendance", label: "Davomat belgilash" },
    { key: "canManageGrades", label: "Ball/baho qo'yish" },
    { key: "canSeeReports", label: "Hisobotlarni ko'rish (portal)" },
    { key: "canManageExpenses", label: "Xarajatlarni boshqarish" },
  ] as const satisfies readonly { key: keyof FormData; label: string }[];

  return (
    <Modal
      title={user ? "Hodimni tahrirlash" : "Yangi hodim"}
      maxWidth="max-w-lg"
      onClose={onClose}
    >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="To'liq ism *" {...register("fullName")} error={errors.fullName?.message} placeholder="Aziz Karimov" />
            <Input label="Username *" {...register("username")} error={errors.username?.message} placeholder="aziz_k" disabled={!!user} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" {...register("email")} error={errors.email?.message} placeholder="aziz@example.com" />
            <PhoneInput label="Telefon" value={watch("phone") || ""} onChange={e => setValue("phone", e.target.value)} error={errors.phone?.message} />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {user ? "Yangi parol (o'zgartirmasangiz bo'sh qoldiring)" : "Parol *"}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  {...register("password")}
                  type={showPass ? "text" : "password"}
                  placeholder="Kamida 8 belgi"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleGenerate} title="Avtomatik yaratish">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            {generatedPass && (
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                Parol: {generatedPass} <button type="button" onClick={() => navigator.clipboard.writeText(generatedPass)} className="underline ml-1">Nusxa</button>
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rol *</label>
            <select
              value={watch("role")}
              onChange={(e) => applyRoleDefaults(e.target.value as FormData["role"])}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5E2CA5]/30 focus:border-[#5E2CA5]/50 transition"
            >
              <option value="OPERATOR">Operator</option>
              <option value="MENTOR">Mentor (o&apos;qituvchi)</option>
              <option value="RECEPTION">Reception</option>
              <option value="ACCOUNTANT">Buxgalter</option>
              <option value="MANAGER">Menejjer</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
            {watch("role") === "MENTOR" && (
              <p className="mt-1.5 text-[12px] text-gray-400">
                Bu hodim guruh(lar)ga o&apos;qituvchi sifatida biriktirilgach (Guruhlar sahifasida), o&apos;z o&apos;quvchilarini,
                davomat va reyting ma&apos;lumotlarini o&apos;z panelida ko&apos;radi.
              </p>
            )}
          </div>

          {/* Permissions */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ruxsatlar</p>
            <div className="space-y-2">
              {permissions.map((p) => (
                <label key={p.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register(p.key)}
                    className="h-4 w-4 accent-[#5E2CA5] border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <ModalPrimaryButton type="submit" loading={loading}>{user ? "Saqlash" : "Qo'shish"}</ModalPrimaryButton>
            <ModalSecondaryButton type="button" onClick={onClose}>Bekor qilish</ModalSecondaryButton>
          </div>
        </form>
    </Modal>
  );
}