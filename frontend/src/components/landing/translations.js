export const LANGS = ["uz", "ru", "en"];
export const NAV_ITEMS = {
    uz: [
        { label: "Biz haqimizda", href: "#about" },
        { label: "Kurslar", href: "#courses" },
        { label: "Startup Studio", href: "#startup-studio" },
        { label: "Jamoa", href: "#team" },
        { label: "Aloqa", href: "#contact" },
    ],
    ru: [
        { label: "О нас", href: "#about" },
        { label: "Курсы", href: "#courses" },
        { label: "Startup Studio", href: "#startup-studio" },
        { label: "Команда", href: "#team" },
        { label: "Контакты", href: "#contact" },
    ],
    en: [
        { label: "About us", href: "#about" },
        { label: "Courses", href: "#courses" },
        { label: "Startup Studio", href: "#startup-studio" },
        { label: "Team", href: "#team" },
        { label: "Contact", href: "#contact" },
    ],
};
export const T = {
    uz: {
        navLogin: "Kirish",
        navCta: "Kursga yozilish",
        heroPrefix: "ROBOCODE — ",
        heroHighlight: "ANDIJONDAGI",
        heroSuffix: " BIRINCHI IT AKADEMIYA",
        heroSub: "Biz bilan doim birinchi bo’ling!",
        heroBtn1: "Kursga yozilish",
        heroBtn2: "Kurslarni ko’rish",
        aboutLabel: "Biz haqimizda",
        featuresTitle: "Sizni nimalar kutyapti",
        whyUsLabel: "Nega biz",
        whyUsTitle: "Bizni tanlash uchun sabablar",
        coursesLabel: "Kurslar",
        coursesTitle: "Sizga mos yo’nalishni tanlang",
        pricingLabel: "Tariflar",
        pricingTitle: "Narxlar",
        pricingIncludedTitle: "Narxga nimalar kiradi:",
        testimonialsLabel: "Fikrlar",
        testimonialsTitle: "Bitiruvchilarimiz nima deydi",
        studioLead: "Startapingiz uchun",
        studioDesc: "Startup — innovatsion g’oya asosida yaratilgan loyiha bo’lib, muammoni hal qilish va tez rivojlanishga qaratilgan.",
        studioHelp: "Maxsus jamoamiz g’oyani shakllantirishdan MVP va xalqaro akselerator (UZCombinator) darajasigacha yordam beradi.",
        teamLabel: "Jamoa",
        teamTitle: "Tajribali jamoa bilan tanishing",
        faqLabel: "Savol-javob",
        faqTitle: "Ko’p beriladigan savollar",
        contactLabel: "Aloqa",
        contactTitle: "Biz bilan bog’laning",
        contactMapTitle: "Bizning manzil",
        formLabel: "Kursga yozilish",
        formTitle: "Bugun birinchi qadamni tashlang",
        formSub: "Formani to’ldiring — mutaxassislarimiz tez orada siz bilan bog’lanib, kurs bo’yicha barcha ma’lumotlarni beradi.",
        formName: "Ism familiya",
        formNamePlaceholder: "Aziza Karimova",
        formPhone: "Telefon raqam",
        formCourse: "Kurs tanlash",
        formCourseOptional: "Tanlang (ixtiyoriy)",
        formComment: "Izoh",
        formCommentOptional: "(ixtiyoriy)",
        formCommentPlaceholder: "Qo’shimcha ma’lumot...",
        formSubmit: "Ariza yuborish",
        formSubmitting: "Yuborilmoqda...",
        formSuccessTitle: "Rahmat!",
        formSuccess: "Arizangiz qabul qilindi.",
        formSuccessSub: "Tez orada siz bilan bog’lanamiz.",
        formAgain: "Yana ariza qoldirish",
        formErrName: "Ism familiyangizni kiriting",
        formErrPhone: "To’liq telefon raqam kiriting",
        formErrGeneric: "Xatolik. Qayta urinib ko’ring.",
        footerDesc: "Andijondagi birinchi IT akademiya — dasturlash va robototexnika bo’yicha amaliy ta’lim.",
        footerContact: "Aloqa",
        footerAddressLabel: "Manzil",
        footerPhoneLabel: "Telefon",
        footerHoursLabel: "Ish vaqti",
        footerHoursDaily: "Har kuni",
        footerSocial: "Ijtimoiy tarmoqlar",
        footerLinks: "Havolalar",
        footerLoginLink: "CRM’ga kirish",
        footerRights: "Barcha huquqlar himoyalangan.",
    },
    ru: {
        navLogin: "Войти",
        navCta: "Записаться на курс",
        heroPrefix: "ROBOCODE — ",
        heroHighlight: "ПЕРВАЯ",
        heroSuffix: " IT-АКАДЕМИЯ В АНДИЖАНЕ",
        heroSub: "Будьте первыми вместе с нами!",
        heroBtn1: "Записаться на курс",
        heroBtn2: "Смотреть курсы",
        aboutLabel: "О нас",
        featuresTitle: "Что вас ждёт",
        whyUsLabel: "Почему мы",
        whyUsTitle: "Причины выбрать нас",
        coursesLabel: "Курсы",
        coursesTitle: "Выберите подходящее направление",
        pricingLabel: "Тарифы",
        pricingTitle: "Цены",
        pricingIncludedTitle: "Что входит в стоимость:",
        testimonialsLabel: "Отзывы",
        testimonialsTitle: "Что говорят наши выпускники",
        studioLead: "Инвестиции в ваш стартап —",
        studioDesc: "Стартап — это проект, основанный на инновационной идее, направленный на решение проблемы и быстрый рост.",
        studioHelp: "Наша команда поможет пройти путь от идеи до MVP и международного акселератора (UZCombinator).",
        teamLabel: "Команда",
        teamTitle: "Познакомьтесь с опытной командой",
        faqLabel: "Вопрос-ответ",
        faqTitle: "Часто задаваемые вопросы",
        contactLabel: "Контакты",
        contactTitle: "Свяжитесь с нами",
        contactMapTitle: "Наш адрес",
        formLabel: "Записаться на курс",
        formTitle: "Сделайте первый шаг сегодня",
        formSub: "Заполните форму — наши специалисты свяжутся с вами и расскажут всё о курсе.",
        formName: "Имя и фамилия",
        formNamePlaceholder: "Азиза Каримова",
        formPhone: "Номер телефона",
        formCourse: "Выбор курса",
        formCourseOptional: "Выберите (необязательно)",
        formComment: "Комментарий",
        formCommentOptional: "(необязательно)",
        formCommentPlaceholder: "Дополнительная информация...",
        formSubmit: "Отправить заявку",
        formSubmitting: "Отправка...",
        formSuccessTitle: "Спасибо!",
        formSuccess: "Ваша заявка принята.",
        formSuccessSub: "Мы скоро свяжемся с вами.",
        formAgain: "Оставить ещё одну заявку",
        formErrName: "Введите имя и фамилию",
        formErrPhone: "Введите номер телефона полностью",
        formErrGeneric: "Ошибка. Попробуйте ещё раз.",
        footerDesc: "Первая IT-академия в Андижане — практическое обучение программированию и робототехнике.",
        footerContact: "Контакты",
        footerAddressLabel: "Адрес",
        footerPhoneLabel: "Телефон",
        footerHoursLabel: "Часы работы",
        footerHoursDaily: "Ежедневно",
        footerSocial: "Соцсети",
        footerLinks: "Ссылки",
        footerLoginLink: "Вход в CRM",
        footerRights: "Все права защищены.",
    },
    en: {
        navLogin: "Log in",
        navCta: "Enroll now",
        heroPrefix: "ROBOCODE — ",
        heroHighlight: "ANDIJAN’S FIRST",
        heroSuffix: " IT ACADEMY",
        heroSub: "Always be first with us!",
        heroBtn1: "Enroll now",
        heroBtn2: "View courses",
        aboutLabel: "About us",
        featuresTitle: "What’s waiting for you",
        whyUsLabel: "Why us",
        whyUsTitle: "Reasons to choose us",
        coursesLabel: "Courses",
        coursesTitle: "Choose the track that fits you",
        pricingLabel: "Plans",
        pricingTitle: "Pricing",
        pricingIncludedTitle: "What’s included:",
        testimonialsLabel: "Testimonials",
        testimonialsTitle: "What our graduates say",
        studioLead: "Investment for your startup —",
        studioDesc: "A startup is a project built on an innovative idea, aimed at solving a problem and growing fast.",
        studioHelp: "Our dedicated team helps you go from idea to MVP and an international accelerator (UZCombinator).",
        teamLabel: "Team",
        teamTitle: "Meet our experienced team",
        faqLabel: "FAQ",
        faqTitle: "Frequently asked questions",
        contactLabel: "Contact",
        contactTitle: "Get in touch with us",
        contactMapTitle: "Our location",
        formLabel: "Enroll now",
        formTitle: "Take the first step today",
        formSub: "Fill out the form — our specialists will contact you shortly with all the course details.",
        formName: "Full name",
        formNamePlaceholder: "Aziza Karimova",
        formPhone: "Phone number",
        formCourse: "Choose a course",
        formCourseOptional: "Select (optional)",
        formComment: "Comment",
        formCommentOptional: "(optional)",
        formCommentPlaceholder: "Additional information...",
        formSubmit: "Submit application",
        formSubmitting: "Sending...",
        formSuccessTitle: "Thank you!",
        formSuccess: "Your application has been received.",
        formSuccessSub: "We’ll contact you shortly.",
        formAgain: "Submit another application",
        formErrName: "Please enter your full name",
        formErrPhone: "Please enter the complete phone number",
        formErrGeneric: "Something went wrong. Please try again.",
        footerDesc: "Andijan’s first IT academy — hands-on programming and robotics education.",
        footerContact: "Contact",
        footerAddressLabel: "Address",
        footerPhoneLabel: "Phone",
        footerHoursLabel: "Working hours",
        footerHoursDaily: "Daily",
        footerSocial: "Social",
        footerLinks: "Links",
        footerLoginLink: "CRM login",
        footerRights: "All rights reserved.",
    },
};
export const STATS = {
    uz: [
        { value: "+3000", label: "Bitiruvchi" },
        { value: "70%", label: "Kursni tamomlaganlar daromad topib kelmoqda" },
        { value: "$300 – $3000", label: "Bitiruvchilarning o’rtacha daromadi" },
    ],
    ru: [
        { value: "+3000", label: "Выпускников" },
        { value: "70%", label: "Выпускников уже зарабатывают" },
        { value: "$300 – $3000", label: "Средний доход выпускников" },
    ],
    en: [
        { value: "+3000", label: "Graduates" },
        { value: "70%", label: "Of graduates already earning" },
        { value: "$300 – $3000", label: "Average graduate income" },
    ],
};
export const FEATURES = {
    uz: [
        { icon: "handshake", text: "Real startup loyihalarda amaliy tajriba va jamoaga taklif" },
        { icon: "chart", text: "Tajribali Team Lead rahbarligida doimiy rivojlanish" },
        { icon: "gift", text: "Bepul ishtirok imkoniyati (talab: bilim bazasi va ingliz tili)" },
        { icon: "target", text: "Faqat bilim emas — haqiqiy tajriba, real loyihalar va kuchli karyera" },
    ],
    ru: [
        { icon: "handshake", text: "Практический опыт в реальных стартап-проектах и приглашение в команду" },
        { icon: "chart", text: "Постоянное развитие под руководством опытного Team Lead" },
        { icon: "gift", text: "Возможность бесплатного участия (при базовых знаниях и английском)" },
        { icon: "target", text: "Не только знания — реальный опыт, проекты и сильная карьера" },
    ],
    en: [
        { icon: "handshake", text: "Hands-on experience in real startup projects, with a team invitation" },
        { icon: "chart", text: "Continuous growth guided by an experienced Team Lead" },
        { icon: "gift", text: "Free participation available (requires base knowledge & English)" },
        { icon: "target", text: "Not just knowledge — real experience, real projects, a strong career" },
    ],
};
export const WHY_US = {
    uz: [
        { icon: "hammer", title: "Amaliy loyihalar", desc: "Har bir mavzu real loyihalar orqali mustahkamlanadi." },
        { icon: "gradCap", title: "Tajribali ustozlar", desc: "Sohada faoliyat yurituvchi mutaxassislardan ta'lim." },
        { icon: "cpu", title: "Zamonaviy jihozlar", desc: "Yangi kompyuterlar va robototexnika uskunalari." },
        { icon: "users", title: "Kichik guruhlar", desc: "Har bir o'quvchiga individual e'tibor." },
        { icon: "award", title: "Sertifikat", desc: "Kursni tugatgan har bir o'quvchiga sertifikat." },
        { icon: "briefcase", title: "Ish bilan ta'minlash", desc: "Eng yaxshi bitiruvchilarga ish topishda ko'maklashamiz." },
    ],
    ru: [
        { icon: "hammer", title: "Практические проекты", desc: "Каждая тема закрепляется через реальные проекты." },
        { icon: "gradCap", title: "Опытные преподаватели", desc: "Обучение от практикующих специалистов отрасли." },
        { icon: "cpu", title: "Современное оборудование", desc: "Новые компьютеры и оборудование для робототехники." },
        { icon: "users", title: "Малые группы", desc: "Индивидуальное внимание каждому ученику." },
        { icon: "award", title: "Сертификат", desc: "Сертификат каждому, кто завершил курс." },
        { icon: "briefcase", title: "Помощь с трудоустройством", desc: "Помогаем лучшим выпускникам найти работу." },
    ],
    en: [
        { icon: "hammer", title: "Hands-on projects", desc: "Every topic is reinforced through real projects." },
        { icon: "gradCap", title: "Experienced mentors", desc: "Taught by working professionals in the field." },
        { icon: "cpu", title: "Modern equipment", desc: "New computers and robotics hardware." },
        { icon: "users", title: "Small groups", desc: "Individual attention for every student." },
        { icon: "award", title: "Certificate", desc: "A certificate for every graduate of the course." },
        { icon: "briefcase", title: "Job placement support", desc: "We help our top graduates find jobs." },
    ],
};
export const COURSES = {
    uz: [
        {
            name: "Robototexnika",
            duration: "12 oy",
            modules: [
                "Elektronika va fizika — real amaliyot, tranzistorlar, mikrosxemalar",
                "Dasturlash asoslari — Scratch, mBlock, multfilm va o’yinlar",
                "Aqlli robotlar — kod yozish, datchiklar, Wi-Fi/Bluetooth boshqaruvi",
            ],
        },
        {
            name: "Front-end",
            duration: "6 oy",
            modules: ["1-oy: HTML", "2–3-oy: CSS — Flexbox, Grid, adaptiv", "4–5-oy: JavaScript — DOM, funksiyalar", "6-oy: React + real loyihalar"],
        },
        {
            name: "Back-end",
            duration: "6 oy",
            modules: ["REST API, ma’lumotlar bazasi, autentifikatsiya", "Real loyihalar — Blog API, Todo App", "Natija: GitHub portfolio, serverga joylash, login tizimi"],
        },
        {
            name: "Grafik va Web dizayn",
            duration: "12 oy",
            modules: ["Photoshop — 3 oy", "Illustrator — 3 oy", "UI/UX & Web dizayn — Figma, 6 oy", "Natija: grafik dizaynerdan UI/UX mutaxassisiga"],
        },
        {
            name: "Startup",
            duration: "2 oy",
            modules: ["Blog platforma", "Online do’kon", "Auth + Dashboard", "API + AI integratsiya", "Final startup — deploy"],
        },
        {
            name: "Foundation",
            duration: "14 kun",
            modules: ["Computer asoslari, OT + Google", "Word/Docs, Excel/Sheets, PowerPoint/Canva", "AI tools, Figma + UI tools, Cloud tools", "Imtihon va mentor session"],
        },
        {
            name: "Web (UI/UX) dizayn",
            duration: null,
            modules: ["Figma", "Responsive saytlar", "Mobil ilovalar", "Branding"],
        },
        {
            name: "Vibe Coding",
            duration: null,
            modules: ["Zamonaviy front-end texnologiyalari va AI yordamida tez ishlab chiqish", "Responsive web interfeyslar", "Real mijoz loyihalari"],
        },
    ],
    ru: [
        {
            name: "Робототехника",
            duration: "12 мес",
            modules: [
                "Электроника и физика — практика, транзисторы, микросхемы",
                "Основы программирования — Scratch, mBlock, мультфильмы и игры",
                "Умные роботы — код, датчики, управление по Wi-Fi/Bluetooth",
            ],
        },
        {
            name: "Front-end",
            duration: "6 мес",
            modules: ["1 мес: HTML", "2–3 мес: CSS — Flexbox, Grid, адаптив", "4–5 мес: JavaScript — DOM, функции", "6 мес: React + реальные проекты"],
        },
        {
            name: "Back-end",
            duration: "6 мес",
            modules: ["REST API, базы данных, аутентификация", "Реальные проекты — Blog API, Todo App", "Результат: портфолио на GitHub, деплой, система входа"],
        },
        {
            name: "Графика и веб-дизайн",
            duration: "12 мес",
            modules: ["Photoshop — 3 мес", "Illustrator — 3 мес", "UI/UX и веб-дизайн — Figma, 6 мес", "Результат: от графического дизайнера до UI/UX специалиста"],
        },
        {
            name: "Startup",
            duration: "2 мес",
            modules: ["Блог-платформа", "Интернет-магазин", "Auth + Dashboard", "API + AI интеграция", "Финальный стартап — деплой"],
        },
        {
            name: "Foundation",
            duration: "14 дней",
            modules: ["Основы компьютера, ОС + Google", "Word/Docs, Excel/Sheets, PowerPoint/Canva", "AI-инструменты, Figma, Cloud", "Экзамен и сессия с ментором"],
        },
        {
            name: "Веб (UI/UX) дизайн",
            duration: null,
            modules: ["Figma", "Адаптивные сайты", "Мобильные приложения", "Брендинг"],
        },
        {
            name: "Vibe Coding",
            duration: null,
            modules: ["Современные front-end технологии и быстрая разработка с AI", "Адаптивные веб-интерфейсы", "Реальные проекты клиентов"],
        },
    ],
    en: [
        {
            name: "Robotics",
            duration: "12 mo",
            modules: [
                "Electronics & physics — hands-on practice, transistors, chips",
                "Programming basics — Scratch, mBlock, animations and games",
                "Smart robots — coding, sensors, Wi-Fi/Bluetooth control",
            ],
        },
        {
            name: "Front-end",
            duration: "6 mo",
            modules: ["Month 1: HTML", "Months 2–3: CSS — Flexbox, Grid, responsive", "Months 4–5: JavaScript — DOM, functions", "Month 6: React + real projects"],
        },
        {
            name: "Back-end",
            duration: "6 mo",
            modules: ["REST API, databases, authentication", "Real projects — Blog API, Todo App", "Result: GitHub portfolio, deployment, login system"],
        },
        {
            name: "Graphic & Web Design",
            duration: "12 mo",
            modules: ["Photoshop — 3 mo", "Illustrator — 3 mo", "UI/UX & Web Design — Figma, 6 mo", "Result: from graphic designer to UI/UX specialist"],
        },
        {
            name: "Startup",
            duration: "2 mo",
            modules: ["Blog platform", "Online store", "Auth + Dashboard", "API + AI integration", "Final startup — deploy"],
        },
        {
            name: "Foundation",
            duration: "14 days",
            modules: ["Computer basics, OS + Google", "Word/Docs, Excel/Sheets, PowerPoint/Canva", "AI tools, Figma + UI tools, Cloud tools", "Exam and mentor session"],
        },
        {
            name: "Web (UI/UX) Design",
            duration: null,
            modules: ["Figma", "Responsive websites", "Mobile apps", "Branding"],
        },
        {
            name: "Vibe Coding",
            duration: null,
            modules: ["Modern front-end technologies and fast AI-assisted development", "Responsive web interfaces", "Real client projects"],
        },
    ],
};
// TODO: replace the placeholder "price on request" strings with real monthly
// prices once they're finalized. `monthly` is index-aligned with COURSES[lang]
// (same order, one entry per course) so cards stay matched to the right course.
export const PRICES = {
    uz: {
        monthly: Array(8).fill("So’rov bo’yicha"),
        included: [
            "Tajribali mentor yordami",
            "Amaliy loyihalar va portfolio",
            "Kurs tugagach sertifikat",
            "Ish topishga ko’maklashish",
        ],
    },
    ru: {
        monthly: Array(8).fill("По запросу"),
        included: [
            "Поддержка опытного ментора",
            "Практические проекты и портфолио",
            "Сертификат по окончании курса",
            "Помощь в трудоустройстве",
        ],
    },
    en: {
        monthly: Array(8).fill("Price on request"),
        included: [
            "Support from an experienced mentor",
            "Hands-on projects and a portfolio",
            "Certificate on completion",
            "Job placement support",
        ],
    },
};
export const STUDIO_CARDS = {
    uz: [
        { title: "Innovatsiya", desc: "Yangi yechimlar va texnologiyalar orqali muammolarni hal qilish" },
        { title: "Tez rivojlanish", desc: "Qisqa vaqt ichida katta miqyosda o’sish imkoniyati" },
    ],
    ru: [
        { title: "Инновации", desc: "Решение проблем через новые решения и технологии" },
        { title: "Быстрый рост", desc: "Возможность значительного роста за короткое время" },
    ],
    en: [
        { title: "Innovation", desc: "Solving problems through new solutions and technologies" },
        { title: "Fast growth", desc: "The chance to grow significantly in a short time" },
    ],
};
export const TIMELINE = {
    uz: ["G’oya shakllantirish", "MVP yaratish", "Texnik rivojlanish", "Bozorga chiqish"],
    ru: ["Формирование идеи", "Создание MVP", "Техническое развитие", "Выход на рынок"],
    en: ["Idea formation", "Building MVP", "Technical development", "Market launch"],
};
const MENTORS_BASE = [
    {
        name: "Abdulaziz Yakubov",
        role: { uz: "Asoschisi", ru: "Основатель", en: "Founder" },
        bio: {
            uz: "Yoshlar Ventures direktori (2025-fevral). Dasturchi, Team Leader, CEO — IT sohasida +10 yil tajriba, startapper.",
            ru: "Директор Yoshlar Ventures (февраль 2025). Разработчик, Team Leader, CEO — более 10 лет в IT, стартапер.",
            en: "Director of Yoshlar Ventures (Feb 2025). Developer, Team Leader, CEO — 10+ years in IT, startupper.",
        },
        instagram: "aka.yakubov",
    },
    {
        name: "Akhmadullo Nurmakhamatov",
        role: { uz: "Team Lead", ru: "Team Lead", en: "Team Lead" },
        bio: {
            uz: "6+ yil xalqaro IT tajribasi. Politecnico di Torino (Italiya) bitiruvchisi. React, TypeScript, Agile (Scrum). Senior Software Engineer, Mentor.",
            ru: "6+ лет международного опыта в IT. Выпускник Politecnico di Torino (Италия). React, TypeScript, Agile (Scrum). Senior Software Engineer, ментор.",
            en: "6+ years of international IT experience. Politecnico di Torino (Italy) graduate. React, TypeScript, Agile (Scrum). Senior Software Engineer, mentor.",
        },
    },
    {
        name: "Shuxratbek Aliyev",
        role: { uz: "Grafik va UX/UI ustoz", ru: "Преподаватель графики и UX/UI", en: "Graphic & UX/UI mentor" },
        bio: {
            uz: "5 yil tajriba, Robocode yetakchi mentori. Vodiy Brend Startup asoschisi — 30+ brend, 150+ bitiruvchi.",
            ru: "5 лет опыта, ведущий ментор Robocode. Основатель Vodiy Brend Startup — 30+ брендов, 150+ выпускников.",
            en: "5 years of experience, Robocode’s lead mentor. Founder of Vodiy Brend Startup — 30+ brands, 150+ graduates.",
        },
    },
    {
        name: "Ziyodullo Shuxratbekov",
        role: { uz: "Startup mentor", ru: "Startup-ментор", en: "Startup mentor" },
        bio: {
            uz: "EduCompass asoschisi. 250 000$ qiymatdagi loyiha muallifi, 20+ startap, 700 000$+ investitsiya jalb qilgan.",
            ru: "Основатель EduCompass. Автор проекта стоимостью $250 000, 20+ стартапов, привлечено $700 000+ инвестиций.",
            en: "Founder of EduCompass. Author of a $250,000 project, 20+ startups, $700,000+ raised in investment.",
        },
    },
    {
        name: "Nazrullo Raxmatov",
        role: { uz: "Back-end ustoz", ru: "Преподаватель Back-end", en: "Back-end mentor" },
        bio: {
            uz: "3+ yil IT tajribasi. Robocode bitiruvchisi va ustozi. EduCompass backend jamoasida, 20+ backend loyiha.",
            ru: "3+ года опыта в IT. Выпускник и преподаватель Robocode. В команде backend EduCompass, 20+ проектов.",
            en: "3+ years of IT experience. Robocode graduate and mentor. EduCompass backend team, 20+ backend projects.",
        },
    },
    {
        name: "Abduvahob Qahhorov",
        role: { uz: "Back-end ustoz", ru: "Преподаватель Back-end", en: "Back-end mentor" },
        bio: {
            uz: "5+ yil tajriba. UIC Group va Prolab loyihalarida ishlagan — tizim arxitekturasi va server logikasi bo’yicha mutaxassis.",
            ru: "5+ лет опыта. Работал над проектами UIC Group и Prolab — специалист по архитектуре систем и серверной логике.",
            en: "5+ years of experience. Worked on UIC Group and Prolab projects — specialist in system architecture and server logic.",
        },
    },
    {
        name: "Saidislom To’lqinov",
        role: { uz: "Front-end / 3D ustoz", ru: "Преподаватель Front-end / 3D", en: "Front-end / 3D mentor" },
        bio: {
            uz: "5 yil tajriba, Fransiyadagi \"NFINITE\"da ishlaydi. CANFORAMA, CASTORAMA, LECLERC, WALLMART bilan hamkorlik. 25+ shogird.",
            ru: "5 лет опыта, работает в \"NFINITE\" (Франция). Сотрудничество с CANFORAMA, CASTORAMA, LECLERC, WALLMART. 25+ учеников.",
            en: "5 years of experience, works at \"NFINITE\" in France. Collaborations with CANFORAMA, CASTORAMA, LECLERC, WALLMART. 25+ mentees.",
        },
    },
    {
        name: "Husanboy Zafarov",
        role: { uz: "Front-end ustoz", ru: "Преподаватель Front-end", en: "Front-end mentor" },
        bio: {
            uz: "3+ yil tajriba, Robocode bitiruvchisi. EduCompass va Bozorly loyihalarida ishlagan, Figma’da UI dizayn.",
            ru: "3+ года опыта, выпускник Robocode. Работал над проектами EduCompass и Bozorly, UI-дизайн в Figma.",
            en: "3+ years of experience, Robocode graduate. Worked on EduCompass and Bozorly projects, UI design in Figma.",
        },
    },
    {
        name: "Hasanboy Zafarov",
        role: { uz: "Vibe Coding ustoz", ru: "Преподаватель Vibe Coding", en: "Vibe Coding mentor" },
        bio: {
            uz: "Robocode front-end mentori. Responsive web interfeyslar va zamonaviy front-end texnologiyalari bo’yicha ustoz.",
            ru: "Front-end ментор Robocode. Преподаёт адаптивные веб-интерфейсы и современные front-end технологии.",
            en: "Robocode front-end mentor. Teaches responsive web interfaces and modern front-end technologies.",
        },
    },
    {
        name: "Alimjanov Saidmurod",
        role: { uz: "Front-end / Foundation ustoz", ru: "Преподаватель Front-end / Foundation", en: "Front-end / Foundation mentor" },
        bio: {
            uz: "2+ yil tajriba. Darslarni rus va o’zbek tillarida olib boradi. Bozorly loyihasida ishtirok etgan.",
            ru: "2+ года опыта. Ведёт занятия на русском и узбекском языках. Участвовал в проекте Bozorly.",
            en: "2+ years of experience. Teaches classes in Russian and Uzbek. Contributed to the Bozorly project.",
        },
    },
];
export const MENTORS = {
    uz: MENTORS_BASE.map((m) => ({ name: m.name, role: m.role.uz, bio: m.bio.uz, instagram: m.instagram })),
    ru: MENTORS_BASE.map((m) => ({ name: m.name, role: m.role.ru, bio: m.bio.ru, instagram: m.instagram })),
    en: MENTORS_BASE.map((m) => ({ name: m.name, role: m.role.en, bio: m.bio.en, instagram: m.instagram })),
};
// TODO(testimonials): the 3 entries below are illustrative sample copy (fitting
// each course/workplace), not real graduate quotes. Replace `workplace` and
// `review` per language with real feedback — and add `photo`/`videoUrl` — as
// they come in. Search "TESTIMONIALS_BASE" to find this block again.
const TESTIMONIALS_BASE = [
    {
        name: "Aziza Karimova",
        course: { uz: "Front-end", ru: "Front-end", en: "Front-end" },
        workplace: {
            uz: "IT kompaniyada Frontend dasturchi",
            ru: "Frontend-разработчик в IT-компании",
            en: "Frontend developer at an IT company",
        },
        review: {
            uz: "Robocode’dagi 6 oy davomida noldan React’da real loyihalar qura oladigan darajaga yetdim. Mentorlar har doim yordamga tayyor edi.",
            ru: "За 6 месяцев в Robocode я прошла путь с нуля до реальных проектов на React. Менторы всегда были готовы помочь.",
            en: "In 6 months at Robocode I went from zero to building real projects in React. The mentors were always ready to help.",
        },
    },
    {
        name: "Bekzod Toshpulatov",
        course: { uz: "Robototexnika", ru: "Робототехника", en: "Robotics" },
        workplace: {
            uz: "STEM markazida robototexnika o’qituvchisi",
            ru: "Преподаватель робототехники в STEM-центре",
            en: "Robotics instructor at a STEM center",
        },
        review: {
            uz: "Robototexnika kursi menga nafaqat texnik bilim, balki o’quvchilarga ta’lim berish tajribasini ham berdi. Hozir o’zim STEM markazida dars beraman.",
            ru: "Курс робототехники дал мне не только технические знания, но и опыт преподавания. Сейчас я сам веду занятия в STEM-центре.",
            en: "The robotics course gave me both technical skills and teaching experience. Now I teach at a STEM center myself.",
        },
    },
    {
        name: "Madina Yusupova",
        course: { uz: "Grafik va Web dizayn", ru: "Графика и веб-дизайн", en: "Graphic & Web Design" },
        workplace: {
            uz: "Frilanser UI/UX dizayner",
            ru: "Фрилансер UI/UX-дизайнер",
            en: "Freelance UI/UX designer",
        },
        review: {
            uz: "Figma va UI/UX asoslarini Robocode’da o’rgandim. Kursdan keyin darhol frilans loyihalar bilan ishlay boshladim.",
            ru: "Основы Figma и UI/UX я освоила в Robocode. После курса сразу начала брать фриланс-проекты.",
            en: "I learned Figma and UI/UX fundamentals at Robocode. Right after the course I started taking on freelance projects.",
        },
    },
];
export const TESTIMONIALS = {
    uz: TESTIMONIALS_BASE.map((m) => ({ name: m.name, photo: m.photo, videoUrl: m.videoUrl, course: m.course.uz, workplace: m.workplace.uz, review: m.review.uz })),
    ru: TESTIMONIALS_BASE.map((m) => ({ name: m.name, photo: m.photo, videoUrl: m.videoUrl, course: m.course.ru, workplace: m.workplace.ru, review: m.review.ru })),
    en: TESTIMONIALS_BASE.map((m) => ({ name: m.name, photo: m.photo, videoUrl: m.videoUrl, course: m.course.en, workplace: m.workplace.en, review: m.review.en })),
};
export const FAQ_ITEMS = {
    uz: [
        {
            q: "Kursni boshlash uchun oldindan bilim kerakmi?",
            a: "Yo’q, ko’pchilik kurslarimiz noldan boshlaydiganlar uchun mo’ljallangan. Mentorlarimiz asoslardan boshlab, bosqichma-bosqich amaliyot orqali o’rgatadi.",
        },
        {
            q: "Darslar qaysi tilda olib boriladi?",
            a: "Darslar asosan o’zbek va rus tillarida olib boriladi. Ba’zi mentorlar ingliz tilida ham dars berishlari mumkin — bu haqda ariza berishda so’rashingiz mumkin.",
        },
        {
            q: "Kursni tugatgach sertifikat beriladimi?",
            a: "Ha, kursni muvaffaqiyatli yakunlagan har bir o’quvchiga Robocode IT Academy sertifikati topshiriladi.",
        },
        {
            q: "To’lov qanday amalga oshiriladi?",
            a: "To’lovni oylik yoki bosqichma-bosqich amalga oshirishingiz mumkin. Aniq narx va to’lov shartlari kursni tanlaganingizdan so’ng mutaxassisimiz bilan suhbatda aniqlanadi.",
        },
        {
            q: "Bitta guruhda necha kishi o’qiydi?",
            a: "Har bir o’quvchiga individual e’tibor berish uchun guruhlarimiz kichik tarkibda shakllantiriladi.",
        },
        {
            q: "Haftasiga necha marta dars bo’ladi?",
            a: "Kursga qarab, haftasiga 2–3 marta, belgilangan jadval asosida amaliy darslar o’tkaziladi.",
        },
        {
            q: "Kursdan keyin ish topishga yordam berasizlarmi?",
            a: "Ha, eng yaxshi bitiruvchilarimizga hamkor kompaniyalar va Startup Studio loyihalari orqali ish topishda ko’maklashamiz.",
        },
        {
            q: "Bepul ishtirok etish imkoniyati bormi?",
            a: "Ha, ba’zi yo’nalishlarda bilim bazasi va ingliz tili darajasiga qarab bepul ishtirok etish imkoniyati mavjud.",
        },
    ],
    ru: [
        {
            q: "Нужны ли предварительные знания для начала курса?",
            a: "Нет, большинство наших курсов рассчитаны на начинающих с нуля. Менторы обучают поэтапно, начиная с основ, через практику.",
        },
        {
            q: "На каком языке проводятся занятия?",
            a: "Занятия проводятся в основном на узбекском и русском языках. Некоторые менторы могут вести и на английском — уточните это при подаче заявки.",
        },
        {
            q: "Выдаётся ли сертификат после окончания курса?",
            a: "Да, каждый успешно завершивший курс получает сертификат Robocode IT Academy.",
        },
        {
            q: "Как происходит оплата?",
            a: "Оплату можно вносить помесячно или поэтапно. Точная стоимость и условия оплаты уточняются со специалистом после выбора курса.",
        },
        {
            q: "Сколько человек в одной группе?",
            a: "Наши группы формируются небольшими, чтобы каждому ученику уделялось индивидуальное внимание.",
        },
        {
            q: "Сколько раз в неделю проходят занятия?",
            a: "В зависимости от курса занятия проходят 2–3 раза в неделю по установленному расписанию.",
        },
        {
            q: "Помогаете ли вы с трудоустройством после курса?",
            a: "Да, лучшим выпускникам мы помогаем найти работу через партнёрские компании и проекты Startup Studio.",
        },
        {
            q: "Есть ли возможность бесплатного участия?",
            a: "Да, по некоторым направлениям есть возможность бесплатного участия — в зависимости от базовых знаний и уровня английского.",
        },
    ],
    en: [
        {
            q: "Do I need prior knowledge to start a course?",
            a: "No, most of our courses are designed for complete beginners. Mentors teach step by step from the basics through hands-on practice.",
        },
        {
            q: "What language are the classes taught in?",
            a: "Classes are mainly taught in Uzbek and Russian. Some mentors can also teach in English — you can ask about this when applying.",
        },
        {
            q: "Do you get a certificate after finishing the course?",
            a: "Yes, every student who successfully completes a course receives a Robocode IT Academy certificate.",
        },
        {
            q: "How does payment work?",
            a: "You can pay monthly or in stages. Exact pricing and payment terms are confirmed with a specialist after you choose your course.",
        },
        {
            q: "How many students are in one group?",
            a: "Our groups are kept small so every student gets individual attention.",
        },
        {
            q: "How many times a week are the classes?",
            a: "Depending on the course, practical classes are held 2–3 times a week on a fixed schedule.",
        },
        {
            q: "Do you help graduates find a job?",
            a: "Yes, we help our top graduates find jobs through partner companies and Startup Studio projects.",
        },
        {
            q: "Is free participation available?",
            a: "Yes, some tracks offer free participation depending on your base knowledge and English level.",
        },
    ],
};
