export const LEAD_STATUS_LABELS = {
    NEW: "Yangi",
    CONTACTED: "Bog'lanildi",
    INTERESTED: "Qiziqyapti",
    TRIAL_BOOKED: "Sinov darsiga yozildi",
    TRIAL_COMPLETED: "Sinov darsi o'tdi",
    ENROLLED: "Yozildi",
    POSTPONED: "Keyinroqqa qoldirildi",
    LOST: "Yo'qotildi",
};
export const LEAD_STATUS_COLORS = {
    NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    CONTACTED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    INTERESTED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    TRIAL_BOOKED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    TRIAL_COMPLETED: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    ENROLLED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    POSTPONED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    LOST: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};
export const LEAD_SOURCE_LABELS = {
    INSTAGRAM: "Instagram",
    TELEGRAM: "Telegram",
    FACEBOOK: "Facebook",
    TIKTOK: "TikTok",
    REFERRAL: "Tanish tavsiyasi",
    WEBSITE: "Vebsayt",
    WALK_IN: "O'zi kelgan",
    PHONE_CALL: "Telefon qo'ng'irog'i",
    OTHER: "Boshqa",
};
export const TIME_PREFERENCE_LABELS = {
    MORNING: "Ertalab (08:00–12:00)",
    AFTERNOON: "Tushdan keyin (12:00–17:00)",
    EVENING: "Kechqurun (17:00–20:00)",
    FLEXIBLE: "Farqi yo'q",
};
export const WEEKDAYS = [
    { value: "Mon", label: "Du" },
    { value: "Tue", label: "Se" },
    { value: "Wed", label: "Ch" },
    { value: "Thu", label: "Pa" },
    { value: "Fri", label: "Ju" },
    { value: "Sat", label: "Sh" },
    { value: "Sun", label: "Yak" },
];
export const DEFAULT_TIME_SLOTS = [
    { startTime: "08:00", endTime: "09:30", label: "08:00 - 09:30" },
    { startTime: "09:30", endTime: "11:00", label: "09:30 - 11:00" },
    { startTime: "11:00", endTime: "12:30", label: "11:00 - 12:30" },
    { startTime: "12:30", endTime: "14:00", label: "12:30 - 14:00" },
    { startTime: "14:00", endTime: "15:30", label: "14:00 - 15:30" },
    { startTime: "15:30", endTime: "17:00", label: "15:30 - 17:00" },
    { startTime: "17:00", endTime: "18:30", label: "17:00 - 18:30" },
    { startTime: "18:30", endTime: "20:00", label: "18:30 - 20:00" },
];
// Staff attendance: check-in after this time (+ grace) is marked "late"
export const STAFF_WORK_START = "09:00";
export const STAFF_LATE_GRACE_MINUTES = 15;
export const TASK_TYPE_LABELS = {
    call: "Qo'ng'iroq",
    meeting: "Uchrashuv",
    admin: "Ma'muriy",
    other: "Boshqa",
};
export const TASK_STATUS_LABELS = {
    TODO: "Bajarilmagan",
    IN_PROGRESS: "Jarayonda",
    DONE: "Bajarilgan",
};
export const KANBAN_COLUMNS = [
    "NEW",
    "CONTACTED",
    "INTERESTED",
    "TRIAL_BOOKED",
    "TRIAL_COMPLETED",
    "ENROLLED",
];
export const SIDE_COLUMNS = ["POSTPONED", "LOST"];
