// Full ruxsatlar (permissions) catalog — mirrors the LC-UP-style module list.
// `tier` marks how far each module's *enforcement* has gotten in this codebase:
//   "ready"   — the module already exists and its APIs check this permission today.
//   "partial" — the module exists but only some of its actions/screens are wired up.
//   "planned" — the feature doesn't exist yet; the row exists so admins can see it's coming.
// This file is the single source of truth: the migrate endpoint seeds the Permission
// table from it, and the admin "Rollar va ruxsatlar" page renders straight from it.

export type PermissionTier = "ready" | "partial" | "planned";

export interface PermissionDef {
  module: string;
  moduleLabel: string;
  action: string;
  label: string;
  tier: PermissionTier;
}

function mod(module: string, moduleLabel: string, tier: PermissionTier, actions: [string, string][]): PermissionDef[] {
  return actions.map(([action, label]) => ({ module, moduleLabel, action, label, tier }));
}

export const PERMISSION_CATALOG: PermissionDef[] = [
  ...mod("positions", "Lavozim / Rollar", "partial", [
    ["create", "Lavozim qo'shish"],
    ["edit", "Lavozim o'zgartirish"],
    ["delete", "Lavozim o'chirish"],
    ["view", "Lavozim ko'rish"],
    ["access", "Bo'limga kirish"],
  ]),

  ...mod("courses", "Kurslar", "ready", [
    ["create", "Kurs yaratish"],
    ["edit", "Kurs o'zgartirish"],
    ["delete", "Kurs o'chirish"],
    ["view", "Kurs ko'rish"],
    ["access", "Bo'limga kirish"],
  ]),

  ...mod("groups", "Guruhlar", "ready", [
    ["add", "Guruh qo'shish"],
    ["edit", "Guruh ma'lumotini o'zgartirish"],
    ["view_detail", "Guruh ichiga kirish"],
    ["delete", "Guruh o'chirish"],
    ["access", "Bo'limga kirish"],
  ]),
  ...mod("groups", "Guruhlar", "partial", [
    ["reserve_create", "Zahira guruh yaratish"],
  ]),

  // No dedicated Room entity exists yet — Group.room is a free-text field, not a
  // manageable catalog — so this whole module is "planned" until Rooms become a real model.
  ...mod("rooms", "Xonalar", "planned", [
    ["add", "Xona qo'shish"],
    ["edit", "Xona o'zgartirish"],
    ["view_schedule", "Jadvalini ko'rish"],
    ["delete", "Xona o'chirish"],
    ["access", "Bo'limga kirish"],
    ["performance", "Xonalar samaradorligini ko'rish"],
  ]),

  ...mod("staff", "Hodimlar", "ready", [
    ["add", "Hodim qo'shish"],
    ["edit", "Ma'lumotini o'zgartirish"],
    ["view_schedule", "Jadvalini ko'rish"],
    ["delete", "Hodim o'chirish"],
    ["access", "Sahifaga kirish"],
  ]),
  ...mod("staff", "Hodimlar", "partial", [
    ["activity", "Faoliyatini ko'rish/kirish"],
  ]),
  ...mod("staff", "Hodimlar", "planned", [
    ["work_hours_settings", "Ish vaqtini sozlash"],
    ["mark_attendance", "Davomatini belgilash"],
    ["attendance_report", "Davomat hisobotini ko'rish"],
  ]),

  ...mod("students", "O'quvchilar", "ready", [
    ["add", "O'quvchi qo'shish"],
    ["edit", "Ma'lumotini o'zgartirish"],
    ["view_schedule", "Jadvalini ko'rish"],
    ["access", "Sahifaga kirish"],
  ]),
  ...mod("students", "O'quvchilar", "partial", [
    ["balance_edit", "Balansini o'zgartirish"],
  ]),
  ...mod("students", "O'quvchilar", "planned", [
    ["debt_writeoff", "Yechib olingan qarzdorlik summasini o'zgartirish"],
  ]),

  ...mod("teachers", "O'qituvchilar", "ready", [
    ["access", "Sahifaga kirish"],
    ["add", "Qo'shish"],
    ["edit", "O'zgartirish"],
    ["view", "Ko'rish"],
    ["delete", "O'chirish"],
  ]),
  ...mod("teachers", "O'qituvchilar", "partial", [
    ["balance_edit", "Balansini o'zgartirish"],
    ["salary_agreement_view", "Kelishuv (oylik)ni ko'rish"],
  ]),

  ...mod("finance", "To'lovlar / Moliya", "partial", [
    ["access", "To'lovlar bo'limiga kirish"],
    ["withdraw_cash", "Hisobdagi pulni olish"],
    ["accounting_access", "Hisob-kitob bo'limiga kirish"],
    ["cashbox", "Kassa"],
    ["extra_income_add", "Qo'shimcha daromad kiritish"],
    ["extra_income_access", "Qo'shimcha daromad bo'limiga kirish"],
  ]),
  ...mod("finance", "To'lovlar / Moliya", "planned", [
    ["receipt_settings", "To'lov chekini sozlash"],
  ]),

  ...mod("expenses", "Xarajatlar", "ready", [
    ["add", "Xarajat qo'shish"],
    ["edit", "O'zgartirish"],
    ["view", "Ko'rish"],
    ["delete", "O'chirish"],
    ["access", "Bo'limga kirish"],
  ]),

  ...mod("salaries", "Maoshlar", "partial", [
    ["view", "Hodimlar maoshini ko'rish"],
    ["edit", "Hodimlar maoshini o'zgartirish"],
    ["access", "Bo'limga kirish"],
    ["payroll_report", "Ish haqi hisobotini ko'rish"],
  ]),

  ...mod("attendance", "Davomat", "ready", [
    ["mark", "O'quvchilar davomatini belgilash"],
    ["edit", "O'zgartirish"],
    ["view", "Ko'rish"],
    ["delete", "O'chirish"],
    ["access", "Bo'limga kirish"],
  ]),

  ...mod("grades", "Ball / Baholar", "ready", [
    ["access", "Bo'limga kirish"],
    ["add", "O'quvchiga ball qo'shish"],
  ]),

  ...mod("exams", "Imtihonlar", "ready", [
    ["access", "Bo'limga kirish"],
    ["add", "Qo'shish"],
    ["edit", "O'zgartirish"],
    ["delete", "O'chirish"],
    ["view", "Ko'rish"],
    ["organize_group_exam", "Guruhda imtihon tashkil qilish"],
  ]),
  ...mod("level_test", "Daraja testi", "planned", [
    ["add", "Qo'shish"],
    ["edit", "O'zgartirish"],
    ["delete", "O'chirish"],
    ["access", "Kirish"],
  ]),

  ...mod("exercises", "Mashqlar (Student app)", "ready", [
    ["add", "Mashq qo'shish"],
    ["access", "Bo'limga kirish"],
    ["view", "Ko'rish"],
    ["delete", "O'chirish"],
    ["edit", "O'zgartirish"],
  ]),

  ...mod("leads", "Lidlar", "ready", [
    ["add", "Lid qo'shish"],
    ["edit", "O'zgartirish"],
    ["view", "Ko'rish"],
    ["delete", "O'chirish"],
    ["access", "Bo'limga kirish"],
  ]),

  ...mod("discounts", "Chegirmalar", "partial", [
    ["add", "Qo'shish"],
    ["edit", "O'zgartirish"],
    ["view", "Ko'rish"],
    ["delete", "O'chirish"],
    ["access", "Bo'limga kirish"],
  ]),

  ...mod("debtors_archive", "Qarzdorlar / Arxiv", "ready", [
    ["debtors_access", "Qarzdorlar bo'limiga kirish"],
    ["archive_access", "Arxivga kirish"],
    ["archive_delete", "Arxivdan o'chirish"],
    ["archive_restore", "Arxivdan qaytarish"],
  ]),

  ...mod("reports", "Hisobotlar", "partial", [
    ["financial", "Moliyaviy hisobot"],
    ["leads", "Lidlar hisoboti"],
    ["removed_students", "Guruhdan o'chirilgan o'quvchilar"],
    ["attendance", "Yo'qlama (davomat) hisoboti"],
    ["sms", "SMS hisoboti"],
    ["calls", "Qo'ng'iroqlar hisoboti"],
    ["dashboard_financial", "Asosiy sahifadagi moliyaviy ko'rsatkichlar"],
    ["dashboard_reports", "Dashboard hisobotlari"],
  ]),

  ...mod("tasks", "Vazifalar", "ready", [
    ["add", "Vazifa qo'shish"],
    ["edit", "O'zgartirish"],
    ["delete", "O'chirish"],
    ["access", "Bo'limga kirish"],
    ["comment", "Izoh qo'shish"],
  ]),

  // The /schedule page today is a read-only weekly heatmap — there's no reschedule or
  // replace-teacher action in the backend yet, so these stay "planned" until that exists.
  ...mod("schedule", "Dars jadvali", "planned", [
    ["reschedule_day", "Ma'lum dars kunini boshqa kunga o'zgartirish"],
    ["replace_teacher", "O'qituvchini almashtirish"],
  ]),

  ...mod("holidays", "Bayram kunlari", "partial", [
    ["create", "Bayram kunlarini yaratish"],
  ]),

  ...mod("settings_profile", "Sozlamalar / Profil", "ready", [
    ["access", "Sozlamalar bo'limiga kirish"],
    ["edit_profile", "Profil ma'lumotini o'zgartirish"],
  ]),

  // send_sms is enforced today (qarzdorlar reminder SMS, /api/leads/[id]/sms) — the other two
  // describe a dedicated SMS/Messages admin section that doesn't exist yet.
  ...mod("sms_messages", "SMS / Xabarlar", "ready", [
    ["send_sms", "SMS yuborish"],
  ]),
  ...mod("sms_messages", "SMS / Xabarlar", "planned", [
    ["sms_access", "SMS bo'limiga kirish"],
    ["messages_access", "Xabarlar bo'limiga kirish"],
  ]),

  ...mod("forms_tags_logs", "Formalar / Teglar / Jurnal", "partial", [
    ["form_add", "Forma qo'shish"],
    ["form_edit", "Forma o'zgartirish"],
    ["form_delete", "Forma o'chirish"],
    ["form_access", "Formalar bo'limiga kirish"],
    ["tags_access", "Teglar bo'limiga kirish"],
    ["logs_access", "Jurnal bo'limiga kirish"],
  ]),

  ...mod("products_orders", "Mahsulot / Buyurtma", "planned", [
    ["product_create", "Mahsulot yaratish"],
    ["product_edit", "Mahsulot o'zgartirish"],
    ["product_delete", "Mahsulot o'chirish"],
    ["order_access", "Buyurtma bo'limiga kirish"],
    ["order_edit", "Buyurtma o'zgartirish"],
    ["order_delete", "Buyurtma o'chirish"],
  ]),

  ...mod("branches", "Filiallar", "planned", [
    ["create", "Filial yaratish"],
    ["edit", "Filial o'zgartirish"],
    ["list", "Ro'yxatini ko'rish"],
    ["access", "Kirish"],
  ]),
];

export const TIER_LABELS: Record<PermissionTier, string> = {
  ready: "Faol",
  partial: "Qisman",
  planned: "Tez kunda",
};
