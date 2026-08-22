/**
 * Permissions, not roles. The client asked to control what a moderator can
 * reach, one person at a time. A role enum cannot express that, so the presets
 * below are only starting points the admin adjusts per user.
 */
export const PERMISSIONS = [
  "orders.view",
  "orders.edit",
  "orders.confirm",
  "orders.delete",
  "products.manage",
  "promoCodes.manage",
  "content.manage",
  "content.publish",
  "packages.manage",
  "codes.generate",
  "codes.revoke",
  "students.view",
  "students.manage",
  "students.delete",
  "finance.view",
  "settings.manage",
  "users.manage",
  "messages.view",
  "messages.reply",
  "testimonials.manage",
  "roster.manage",
  "posts.manage",
  "software.manage",
  "library.manage",
  "courses.manage",
  "services.manage",
  "services.review",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PRESETS = {
  super_admin: PERMISSIONS,
  admin: PERMISSIONS.filter((p) => p !== "users.manage"),
  moderator: [
    "content.manage",
    "content.publish",
    "students.view",
    "orders.view",
    "posts.manage",
    "software.manage",
    "library.manage",
    "courses.manage",
  ],
  order_handler: ["orders.view", "orders.edit", "orders.confirm"],
} satisfies Record<string, readonly Permission[]>;

export type PresetName = keyof typeof PRESETS;

export const PRESET_META: Record<
  PresetName,
  {
    name: string;
    labelFr: string;
    labelAr: string;
    description: string;
    color: string;
    badgeClass: string;
    borderClass: string;
  }
> = {
  super_admin: {
    name: "Super Admin",
    labelFr: "Super Administrateur",
    labelAr: "مسؤول رئيسي",
    description: "Full access to everything including team management & settings",
    color: "purple",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    borderClass: "hover:border-purple-500/40",
  },
  admin: {
    name: "Admin",
    labelFr: "Administrateur",
    labelAr: "مسؤول",
    description: "Operational management without user access control",
    color: "blue",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    borderClass: "hover:border-blue-500/40",
  },
  moderator: {
    name: "Content Moderator",
    labelFr: "Modérateur de contenu",
    labelAr: "مشرف محتوى",
    description: "Manage content hub, courses, library, students & view orders",
    color: "emerald",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    borderClass: "hover:border-emerald-500/40",
  },
  order_handler: {
    name: "Order Handler",
    labelFr: "Gestionnaire de commandes",
    labelAr: "معالج الطلبات",
    description: "View, edit, and call/confirm incoming store orders",
    color: "amber",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    borderClass: "hover:border-amber-500/40",
  },
};

export const PERMISSION_DETAILS: Record<
  Permission,
  {
    labelEn: string;
    labelFr: string;
    labelAr: string;
    description: string;
  }
> = {
  "orders.view": {
    labelEn: "View orders",
    labelFr: "Voir les commandes",
    labelAr: "عرض الطلبات",
    description: "Access store order queue and details",
  },
  "orders.edit": {
    labelEn: "Edit orders",
    labelFr: "Modifier les commandes",
    labelAr: "تعديل الطلبات",
    description: "Change customer address, items, notes",
  },
  "orders.confirm": {
    labelEn: "Confirm orders",
    labelFr: "Confirmer les commandes",
    labelAr: "تأكيد الطلبات",
    description: "Mark orders as called/confirmed and change shipping status",
  },
  "orders.delete": {
    labelEn: "Delete / Cancel orders",
    labelFr: "Supprimer / Annuler les commandes",
    labelAr: "إلغاء أو حذف الطلبات",
    description: "Cancel orders and restock items",
  },
  "products.manage": {
    labelEn: "Manage catalogue & products",
    labelFr: "Gérer le catalogue et produits",
    labelAr: "إدارة المنتجات والكتالوج",
    description: "Create, edit, price, and adjust inventory",
  },
  "promoCodes.manage": {
    labelEn: "Manage promo codes",
    labelFr: "Gérer les codes promo",
    labelAr: "إدارة رموز التخفيض",
    description: "Create, edit, and deactivate discount codes",
  },
  "content.manage": {
    labelEn: "Manage LMS content & modules",
    labelFr: "Gérer le contenu LMS et modules",
    labelAr: "إدارة محتوى المنصة والمقاييس",
    description: "Upload resources, syllabus, module chapters",
  },
  "content.publish": {
    labelEn: "Publish content live",
    labelFr: "Publier le contenu",
    labelAr: "نشر المحتوى مباشرة",
    description: "Make draft lessons and files visible to students",
  },
  "packages.manage": {
    labelEn: "Manage access packages",
    labelFr: "Gérer les forfaits d'accès",
    labelAr: "إدارة باقات الدخول",
    description: "Create and configure student access tiers",
  },
  "codes.generate": {
    labelEn: "Generate access codes",
    labelFr: "Générer des codes d'accès",
    labelAr: "توليد رموز الدخول",
    description: "Generate scratch card batches and look up codes",
  },
  "codes.revoke": {
    labelEn: "Revoke access codes",
    labelFr: "Révoquer des codes d'accès",
    labelAr: "إلغاء رموز الدخول",
    description: "Deactivate or unbind student access codes",
  },
  "students.view": {
    labelEn: "View student directory & receipts",
    labelFr: "Voir les étudiants et reçus",
    labelAr: "عرض الطلبة ووصولات الدفع",
    description: "Check active students and pending access requests",
  },
  "students.manage": {
    labelEn: "Manage student accounts",
    labelFr: "Gérer les comptes étudiants",
    labelAr: "إدارة حسابات الطلبة",
    description: "Grant direct entitlements and change levels",
  },
  "students.delete": {
    labelEn: "Suspend / Revoke students",
    labelFr: "Suspendre / Révoquer des étudiants",
    labelAr: "تعليق أو إلغاء حسابات الطلبة",
    description: "Suspend student access to LMS",
  },
  "finance.view": {
    labelEn: "View financial reports",
    labelFr: "Voir les rapports financiers",
    labelAr: "عرض التقارير المالية",
    description: "Revenue totals, delivered totals, sales trends",
  },
  "settings.manage": {
    labelEn: "Manage platform settings",
    labelFr: "Gérer les réglages",
    labelAr: "إدارة إعدادات المنصة",
    description: "Update announcements, shipping rates, maintenance mode",
  },
  "users.manage": {
    labelEn: "Manage team & staff permissions",
    labelFr: "Gérer l'équipe et les permissions",
    labelAr: "إدارة فريق العمل والصلاحيات",
    description: "Create staff accounts, assign permissions, view audit log",
  },
  "messages.view": {
    labelEn: "View contact messages",
    labelFr: "Voir les messages de contact",
    labelAr: "عرض رسائل التواصل",
    description: "Read incoming customer inquiries",
  },
  "messages.reply": {
    labelEn: "Reply to contact messages",
    labelFr: "Répondre aux messages",
    labelAr: "الرد على الرسائل",
    description: "Mark as answered and manage communication",
  },
  "testimonials.manage": {
    labelEn: "Manage reviews & testimonials",
    labelFr: "Gérer les témoignages",
    labelAr: "إدارة الآراء والتقييمات",
    description: "Upload customer screenshots and moderate feedback",
  },
  "roster.manage": {
    labelEn: "Manage team roster (Meet the team)",
    labelFr: "Gérer la présentation de l'équipe",
    labelAr: "إدارة بطاقات فريق العمل في الموقع",
    description: "Add, edit, or reorder public team members on the site",
  },
  "posts.manage": {
    labelEn: "Manage posts, news & events",
    labelFr: "Gérer les annonces et événements",
    labelAr: "إدارة الأخبار والفعاليات والإعلانات",
    description: "Publish news, events and broadcast announcements",
  },
  "software.manage": {
    labelEn: "Manage software hub",
    labelFr: "Gérer le hub de logiciels",
    labelAr: "إدارة برامج وأدوات الهندسة",
    description: "Add architecture tools, download links, installation guides",
  },
  "library.manage": {
    labelEn: "Manage digital library",
    labelFr: "Gérer la bibliothèque",
    labelAr: "إدارة المكتبة الرقمية",
    description: "Add PDF books, architecture guides, and articles",
  },
  "courses.manage": {
    labelEn: "Manage courses & video lectures",
    labelFr: "Gérer les cours et vidéos",
    labelAr: "إدارة الدورات والدروس المرئية",
    description: "Organize masterclasses, video playlists and lessons",
  },
  "services.manage": {
    labelEn: "Manage services catalog",
    labelFr: "Gérer les services",
    labelAr: "إدارة دليل الخدمات",
    description: "Add architectural services, project reviews, pricing tiers",
  },
  "services.review": {
    labelEn: "Review submitted client briefs",
    labelFr: "Examiner les demandes de service",
    labelAr: "مراجعة طلبات الخدمات",
    description: "Review and accept customer project review submissions",
  },
};

/** Grouping for the permission editor in the admin. */
export const PERMISSION_GROUPS: {
  key: string;
  labelEn: string;
  labelFr: string;
  labelAr: string;
  permissions: readonly Permission[];
}[] = [
  {
    key: "orders",
    labelEn: "Orders & Delivery",
    labelFr: "Commandes",
    labelAr: "الطلبات",
    permissions: ["orders.view", "orders.edit", "orders.confirm", "orders.delete"],
  },
  {
    key: "catalogue",
    labelEn: "Store Catalogue",
    labelFr: "Catalogue",
    labelAr: "الكتالوج",
    permissions: ["products.manage", "promoCodes.manage"],
  },
  {
    key: "content",
    labelEn: "Core Learning (LMS)",
    labelFr: "Contenu",
    labelAr: "المحتوى",
    permissions: ["content.manage", "content.publish"],
  },
  {
    key: "content-sections",
    labelEn: "Content Hub Sections",
    labelFr: "Sections de contenu",
    labelAr: "أقسام المحتوى",
    permissions: ["posts.manage", "software.manage", "library.manage", "courses.manage"],
  },
  {
    key: "services",
    labelEn: "Services & Reviews",
    labelFr: "Services",
    labelAr: "الخدمات",
    permissions: ["services.manage", "services.review"],
  },
  {
    key: "packages",
    labelEn: "Access Packages",
    labelFr: "Forfaits d'accès",
    labelAr: "باقات الدخول",
    permissions: ["packages.manage"],
  },
  {
    key: "marketing",
    labelEn: "Marketing & Public Site",
    labelFr: "Marketing",
    labelAr: "التسويق",
    permissions: ["testimonials.manage", "roster.manage"],
  },
  {
    key: "codes",
    labelEn: "Access Codes",
    labelFr: "Codes d'accès",
    labelAr: "رموز الدخول",
    permissions: ["codes.generate", "codes.revoke"],
  },
  {
    key: "students",
    labelEn: "Students & Entitlements",
    labelFr: "Étudiants",
    labelAr: "الطلبة",
    permissions: ["students.view", "students.manage", "students.delete"],
  },
  {
    key: "messages",
    labelEn: "Messages & Inquiries",
    labelFr: "Messages",
    labelAr: "الرسائل",
    permissions: ["messages.view", "messages.reply"],
  },
  {
    key: "settings",
    labelEn: "Settings & Administration",
    labelFr: "Réglages",
    labelAr: "الإعدادات",
    permissions: ["finance.view", "settings.manage", "users.manage"],
  },
];
