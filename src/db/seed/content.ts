/**
 * The template tree the client starts from. They create their own
 * universities on top of it; this one exists so every screen has something to
 * render on day one and so the shape is obvious to whoever loads content next.
 *
 * English is authored, Arabic and French follow. Module names keep their
 * Algerian academic form in French, because that is what appears on a
 * timetable and a student searching for "RDM" will not search for "Strength
 * of materials".
 */

export const TEMPLATE_UNIVERSITY = {
  slug: "epau-algiers",
  nameEn: "EPAU, Polytechnic School of Architecture and Urbanism",
  nameFr: "EPAU, École polytechnique d'architecture et d'urbanisme",
  nameAr: "المدرسة المتعددة التقنيات للهندسة المعمارية والتعمير",
};

export const RESOURCE_TYPES = [
  { key: "cours", labelEn: "Lectures", labelFr: "Cours", labelAr: "دروس", position: 1 },
  { key: "td", labelEn: "Tutorials", labelFr: "TD", labelAr: "أعمال موجهة", position: 2 },
  { key: "tp", labelEn: "Practicals", labelFr: "TP", labelAr: "أعمال تطبيقية", position: 3 },
  { key: "exam", labelEn: "Past papers", labelFr: "Examens", labelAr: "امتحانات", position: 4 },
  { key: "resume", labelEn: "Summaries", labelFr: "Résumés", labelAr: "ملخصات", position: 5 },
  { key: "video", labelEn: "Videos", labelFr: "Vidéos", labelAr: "فيديوهات", position: 6 },
];

export const TAGS = [
  { slug: "studio", labelEn: "Studio", labelFr: "Atelier", labelAr: "ورشة" },
  { slug: "structure", labelEn: "Structure", labelFr: "Structure", labelAr: "هياكل" },
  { slug: "history", labelEn: "History", labelFr: "Histoire", labelAr: "تاريخ" },
  { slug: "corrected", labelEn: "With corrections", labelFr: "Corrigé", labelAr: "تصحيح" },
  { slug: "resit", labelEn: "Resit", labelFr: "Rattrapage", labelAr: "استدراكية" },
];

type ModuleSeed = {
  nameEn: string;
  nameFr: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionFr?: string;
  descriptionAr?: string;
};

export const CURRICULUM: Record<
  "L1" | "L2" | "L3" | "M1" | "M2",
  { s1: ModuleSeed[]; s2: ModuleSeed[] }
> = {
  L1: {
    s1: [
      {
        nameEn: "Studio 1",
        nameFr: "Atelier 1",
        nameAr: "ورشة 1",
        descriptionEn: "First exercises in composition, scale and representation.",
        descriptionFr: "Premiers exercices de composition, échelle et représentation.",
        descriptionAr: "تمارين أولى في التركيب والمقياس والتمثيل.",
      },
      {
        nameEn: "Technical drawing",
        nameFr: "Dessin technique",
        nameAr: "الرسم التقني",
        descriptionEn: "Line conventions, projections, dimensioning.",
        descriptionFr: "Conventions du trait, projections, cotation.",
        descriptionAr: "اصطلاحات الخط، الإسقاطات، القياس.",
      },
      {
        nameEn: "History of architecture 1",
        nameFr: "Histoire de l'architecture 1",
        nameAr: "تاريخ العمارة 1",
        descriptionEn: "Antiquity to the Middle Ages, reading a building.",
        descriptionFr: "De l'Antiquité au Moyen Âge, lecture des édifices.",
        descriptionAr: "من العصور القديمة إلى الوسطى، قراءة المباني.",
      },
      { nameEn: "Mathematics", nameFr: "Mathématiques", nameAr: "الرياضيات" },
    ],
    s2: [
      { nameEn: "Studio 2", nameFr: "Atelier 2", nameAr: "ورشة 2" },
      { nameEn: "Design theory", nameFr: "Théorie du projet", nameAr: "نظرية المشروع" },
      {
        nameEn: "History of architecture 2",
        nameFr: "Histoire de l'architecture 2",
        nameAr: "تاريخ العمارة 2",
      },
      { nameEn: "Building physics", nameFr: "Physique du bâtiment", nameAr: "فيزياء البناء" },
    ],
  },
  L2: {
    s1: [
      { nameEn: "Studio 3", nameFr: "Atelier 3", nameAr: "ورشة 3" },
      {
        nameEn: "Strength of materials",
        nameFr: "Résistance des matériaux",
        nameAr: "مقاومة المواد",
      },
      { nameEn: "Construction 1", nameFr: "Construction 1", nameAr: "البناء 1" },
    ],
    s2: [
      { nameEn: "Studio 4", nameFr: "Atelier 4", nameAr: "ورشة 4" },
      { nameEn: "Construction 2", nameFr: "Construction 2", nameAr: "البناء 2" },
      {
        nameEn: "Applied computing",
        nameFr: "Informatique appliquée",
        nameAr: "الإعلام الآلي التطبيقي",
      },
    ],
  },
  L3: {
    s1: [
      { nameEn: "Studio 5", nameFr: "Atelier 5", nameAr: "ورشة 5" },
      { nameEn: "Structures", nameFr: "Structures", nameAr: "الهياكل" },
      { nameEn: "Urban planning 1", nameFr: "Urbanisme 1", nameAr: "التعمير 1" },
    ],
    s2: [
      { nameEn: "Studio 6", nameFr: "Atelier 6", nameAr: "ورشة 6" },
      { nameEn: "Urban planning 2", nameFr: "Urbanisme 2", nameAr: "التعمير 2" },
      {
        nameEn: "End of cycle project",
        nameFr: "Projet de fin de cycle",
        nameAr: "مشروع نهاية الطور",
      },
    ],
  },
  M1: {
    s1: [
      { nameEn: "Master studio 1", nameFr: "Atelier de master 1", nameAr: "ورشة الماستر 1" },
      {
        nameEn: "Bioclimatic architecture",
        nameFr: "Architecture bioclimatique",
        nameAr: "العمارة البيومناخية",
      },
      {
        nameEn: "Research methods",
        nameFr: "Méthodologie de recherche",
        nameAr: "منهجية البحث",
      },
    ],
    s2: [
      { nameEn: "Master studio 2", nameFr: "Atelier de master 2", nameAr: "ورشة الماستر 2" },
      {
        nameEn: "Heritage and restoration",
        nameFr: "Patrimoine et restauration",
        nameAr: "التراث والترميم",
      },
    ],
  },
  M2: {
    s1: [
      { nameEn: "Thesis studio", nameFr: "Atelier de mémoire", nameAr: "ورشة المذكرة" },
      { nameEn: "Thematic seminar", nameFr: "Séminaire thématique", nameAr: "ملتقى موضوعاتي" },
    ],
    s2: [
      { nameEn: "Final thesis", nameFr: "Mémoire de fin d'études", nameAr: "مذكرة التخرج" },
    ],
  },
};

export const SEMESTER_LABELS = [
  { number: 1, labelEn: "Semester 1", labelFr: "Semestre 1", labelAr: "السداسي 1" },
  { number: 2, labelEn: "Semester 2", labelFr: "Semestre 2", labelAr: "السداسي 2" },
];

/**
 * Sample resources on the first-year semester 1 modules only. `link` and
 * `youtube` need no file on disk, which keeps the seed runnable on a clean
 * machine. The `file` rows point at placeholder PDFs the seed writes into
 * STORAGE_ROOT so the streaming route has real bytes to serve.
 *
 * Keyed by the English module name.
 */
export const SAMPLE_RESOURCES: Record<
  string,
  {
    typeKey: string;
    titleEn: string;
    titleFr?: string;
    titleAr?: string;
    source: "file" | "youtube" | "link";
    externalUrl?: string;
    fileName?: string;
    allowDownload?: boolean;
    tags?: string[];
  }[]
> = {
  "Studio 1": [
    {
      typeKey: "cours",
      titleEn: "Introduction to the studio, lecture notes",
      titleFr: "Introduction à l'atelier, support de cours",
      titleAr: "مدخل إلى الورشة، سند الدرس",
      source: "file",
      fileName: "studio1-lecture.pdf",
      tags: ["studio"],
    },
    {
      typeKey: "td",
      // No Arabic and no French on purpose. A reader in either language must
      // fall back to English rather than land on an empty heading.
      titleEn: "Tutorial 1, composing a site plan",
      source: "file",
      fileName: "studio1-tutorial1.pdf",
      tags: ["studio", "corrected"],
    },
    {
      typeKey: "video",
      titleEn: "Hand rendering, walkthrough",
      titleFr: "Rendu à la main, démonstration",
      titleAr: "الرسم اليدوي، عرض تطبيقي",
      source: "youtube",
      // An architecture lecture, not a joke. A seed video the client may well
      // show someone should be the kind of thing that will actually sit here:
      // "How to Read a Building", Louisiana Channel.
      externalUrl: "https://www.youtube.com/watch?v=8yS-Q9Zr2CQ",
    },
  ],
  "Technical drawing": [
    {
      typeKey: "cours",
      titleEn: "Orthogonal projections",
      titleFr: "Projections orthogonales",
      titleAr: "الإسقاطات المتعامدة",
      source: "file",
      fileName: "drawing-projections.pdf",
      allowDownload: true,
      tags: ["structure"],
    },
    {
      typeKey: "exam",
      titleEn: "2025 paper, questions and corrections",
      titleFr: "Examen 2025, sujet et corrigé",
      titleAr: "امتحان 2025، الموضوع والتصحيح",
      source: "file",
      fileName: "drawing-exam-2025.pdf",
      tags: ["corrected"],
    },
  ],
  "History of architecture 1": [
    {
      typeKey: "resume",
      titleEn: "Summary, Roman architecture",
      titleFr: "Résumé, architecture romaine",
      titleAr: "ملخص، العمارة الرومانية",
      source: "file",
      fileName: "history1-rome-summary.pdf",
      tags: ["history"],
    },
    {
      typeKey: "cours",
      titleEn: "Photographic archive, the Casbah of Algiers",
      titleFr: "Fonds photographique, Casbah d'Alger",
      titleAr: "الرصيد الصوري، قصبة الجزائر",
      source: "link",
      externalUrl: "https://www.archnet.org/",
      tags: ["history"],
    },
  ],
};
