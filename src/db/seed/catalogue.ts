/**
 * Demo catalogue. Once the client loads their own products this is only a
 * fixture, but it is the fixture every screen is built against.
 *
 * English is authored first, then Arabic, then French, matching the locale
 * order the client asked for.
 *
 * There is no sellable gift card. Cards are printed and placed inside the
 * packages that include LMS access; a student never buys a bare code. That is
 * why `containsAccessCode` sits on a printed pack and why the store has no
 * `lms_access` product.
 */
export const PRODUCTS = [
  {
    slug: "kit-rulers-set-squares",
    isFeatured: true,
    category: "supplies" as const,
    titleEn: "Rulers and set squares kit",
    titleFr: "Kit règles et équerres",
    titleAr: "طقم مساطر وزوايا",
    descriptionEn:
      "The three tools every studio session starts with: a 50 cm graduated rule and two clear acrylic set squares, edges ground smooth so the line stays clean.",
    descriptionFr:
      "Le trio de base pour l'atelier: une règle graduée 50 cm et deux équerres en acrylique clair, bords rodés pour un trait net.",
    descriptionAr:
      "الثلاثي الأساسي للورشة: مسطرة مدرجة 50 سم وزاويتان من الأكريليك الشفاف، بحواف مصقولة لخط نظيف.",
    priceDzd: 240000,
    compareAtDzd: 300000,
    stockCount: 40,
    image: "p1.jpg",
    altEn: "A graduated rule and two set squares laid flat",
    altFr: "Règle graduée et deux équerres posées à plat",
    altAr: "مسطرة مدرجة وزاويتان موضوعتان بشكل مسطح",
  },
  {
    slug: "drawing-tube-70",
    isFeatured: true,
    category: "supplies" as const,
    titleEn: "Drawing tube, 70 cm",
    titleFr: "Tube à plans, 70 cm",
    titleAr: "أنبوب حمل المخططات، 70 سم",
    descriptionEn:
      "A rigid telescopic tube with a shoulder strap, so the boards reach the jury without a crease in them.",
    descriptionFr:
      "Tube rigide télescopique avec bandoulière, pour transporter les rendus sans plis jusqu'au jury.",
    descriptionAr:
      "أنبوب صلب قابل للتمديد مع حمالة كتف، لنقل المشاريع دون طيّ إلى لجنة المناقشة.",
    priceDzd: 180000,
    stockCount: 25,
    image: "p2.jpg",
    altEn: "A black tube for carrying drawings",
    altFr: "Tube noir pour transporter les plans",
    altAr: "أنبوب أسود لنقل المخططات",
  },
  {
    slug: "sustainable-architecture-guide",
    category: "books" as const,
    titleEn: "Guide to sustainable architecture",
    titleFr: "Guide de l'architecture durable",
    titleAr: "دليل العمارة المستدامة",
    descriptionEn:
      "A reference on bioclimatic design, with case studies and construction details redrawn at a readable scale.",
    descriptionFr:
      "Un ouvrage de référence sur la conception bioclimatique, avec études de cas et détails constructifs redessinés.",
    descriptionAr:
      "مرجع في التصميم البيومناخي، مع دراسات حالة وتفاصيل إنشائية معاد رسمها.",
    priceDzd: 390000,
    compareAtDzd: 520000,
    stockCount: 12,
    image: "p3.jpg",
    altEn: "An architecture book open on a double page",
    altFr: "Livre d'architecture ouvert sur une double page",
    altAr: "كتاب عمارة مفتوح على صفحتين",
  },
  {
    slug: "printed-course-pack-s1",
    isFeatured: true,
    category: "packs" as const,
    titleEn: "Printed course pack, semester 1",
    titleFr: "Pack de cours imprimé, S1",
    titleAr: "حزمة الدروس المطبوعة، السداسي 1",
    descriptionEn:
      "Every first-semester module, printed and bound, with the access card inside that opens the same courses online.",
    descriptionFr:
      "Tous les modules du premier semestre, imprimés et reliés, avec la carte d'accès qui ouvre les mêmes cours en ligne.",
    descriptionAr:
      "كل مقاييس السداسي الأول، مطبوعة ومجلدة، مع بطاقة الدخول التي تفتح نفس الدروس على الإنترنت.",
    priceDzd: 450000,
    stockCount: 30,
    containsAccessCode: true,
    accessPackage: "s1-l1",
    image: "p4.jpg",
    altEn: "A stack of spiral-bound course booklets",
    altFr: "Pile de fascicules de cours à reliure spirale",
    altAr: "كومة كراسات دروس بتجليد حلزوني",
  },
  {
    slug: "technical-pencil-set",
    isFeatured: true,
    category: "supplies" as const,
    titleEn: "Technical pencil and lead set",
    titleFr: "Set crayons et mines techniques",
    titleAr: "طقم أقلام وأسنّة تقنية",
    descriptionEn:
      "Six grades from 2H to 4B, enough to go from the first sketch to the final drawing without changing tool.",
    descriptionFr:
      "Six duretés de mines, du 2H au 4B, pour passer de l'esquisse au rendu sans changer d'outil.",
    descriptionAr:
      "ست درجات صلابة، من 2H إلى 4B، للانتقال من التخطيط إلى الإخراج دون تغيير الأداة.",
    priceDzd: 120000,
    stockCount: 60,
    image: "p5.jpg",
    altEn: "Technical pencils lined up on a light background",
    altFr: "Crayons techniques alignés sur fond clair",
    altAr: "أقلام تقنية مصفوفة على خلفية فاتحة",
  },
  {
    slug: "full-year-course-pack-l1",
    isFeatured: true,
    category: "packs" as const,
    titleEn: "Printed course pack, first year",
    titleFr: "Pack de cours imprimé, première année",
    titleAr: "حزمة الدروس المطبوعة، السنة الأولى",
    descriptionEn:
      "Both semesters of first year in one box, with the access card for the full year online.",
    descriptionFr:
      "Les deux semestres de première année dans un seul carton, avec la carte d'accès à l'année complète en ligne.",
    descriptionAr:
      "سداسيا السنة الأولى في صندوق واحد، مع بطاقة الدخول إلى السنة كاملة على الإنترنت.",
    priceDzd: 780000,
    compareAtDzd: 900000,
    stockCount: 18,
    containsAccessCode: true,
    accessPackage: "annee-l1",
    image: "p6.jpg",
    altEn: "A year's course packs stacked beside the access card",
    altFr: "Les packs de l'année empilés à côté de la carte d'accès",
    altAr: "حزم السنة مكدسة بجانب بطاقة الدخول",
  },
  {
    /**
     * The reference product. Everything a product page can hold is filled in
     * here: a four-shot gallery, a spec table, quantity offers, and a place on
     * the landing page. When a screen needs checking against a fully populated
     * product, this is the one to open.
     */
    slug: "test-pack",
    category: "packs" as const,
    titleEn: "Studio pack, first year",
    titleFr: "Pack atelier, première année",
    titleAr: "حزمة الورشة، السنة الأولى",
    descriptionEn:
      "The full first-year kit in one box: the printed course pack, the rules and set squares, the pencil set, and the tube to carry it all in. Ordered separately these come to more.",
    descriptionFr:
      "Tout le matériel de première année dans un carton: le pack de cours imprimé, les règles et équerres, les crayons, et le tube pour tout transporter. Achetés séparément, ils coûtent plus cher.",
    descriptionAr:
      "كل لوازم السنة الأولى في صندوق واحد: حزمة الدروس المطبوعة، المساطر والزوايا، الأقلام، والأنبوب لحمل كل شيء. شراؤها منفصلة يكلف أكثر.",
    priceDzd: 250000,
    compareAtDzd: 320000,
    stockCount: 25,
    sku: "TP-PACK-L1",
    isFeatured: true,
    images: [
      { file: "test-pack/1.webp", altEn: "The studio pack, open, with everything laid out", altFr: "Le pack atelier ouvert, tout étalé", altAr: "حزمة الورشة مفتوحة وكل شيء مبسوط" },
      { file: "test-pack/2.webp", altEn: "The printed course pack and the drawing tube", altFr: "Le pack de cours imprimé et le tube à plans", altAr: "حزمة الدروس المطبوعة وأنبوب المخططات" },
      { file: "test-pack/3.webp", altEn: "Rules, set squares and the pencil set", altFr: "Règles, équerres et jeu de crayons", altAr: "المساطر والزوايا وطقم الأقلام" },
      { file: "test-pack/4.webp", altEn: "The box closed, ready to ship", altFr: "Le carton fermé, prêt à expédier", altAr: "الصندوق مغلق وجاهز للشحن" },
    ],
    specs: [
      { labelEn: "In the box", labelFr: "Dans le carton", labelAr: "في الصندوق", valueEn: "Course pack, rules, set squares, 6 pencils, drawing tube", valueFr: "Pack de cours, règles, équerres, 6 crayons, tube à plans", valueAr: "حزمة دروس، مساطر، زوايا، 6 أقلام، أنبوب مخططات" },
      { labelEn: "Year", labelFr: "Année", labelAr: "السنة", valueEn: "Licence 1", valueFr: "Licence 1", valueAr: "ليسانس 1" },
      { labelEn: "Tube length", labelFr: "Longueur du tube", labelAr: "طول الأنبوب", valueEn: "70 cm, adjustable strap", valueFr: "70 cm, sangle réglable", valueAr: "70 سم، حزام قابل للتعديل" },
      { labelEn: "Paper", labelFr: "Papier", labelAr: "الورق", valueEn: "80 g, printed one side", valueFr: "80 g, imprimé au recto", valueAr: "80 غ، مطبوع على وجه واحد" },
      { labelEn: "Weight", labelFr: "Poids", labelAr: "الوزن", valueEn: "1.4 kg", valueFr: "1,4 kg", valueAr: "1.4 كغ" },
    ],
    /**
     * Two, three, five. Priced so each step is visibly better than the last,
     * which is the whole reason a student messages the group chat and orders
     * together.
     */
    offers: [
      { minQuantity: 2, kind: "percent" as const, value: 10, labelEn: "Two packs", labelFr: "Deux packs", labelAr: "حزمتان" },
      { minQuantity: 3, kind: "unit_price" as const, value: 200000, labelEn: "Three packs", labelFr: "Trois packs", labelAr: "ثلاث حزم" },
      { minQuantity: 5, kind: "unit_price" as const, value: 180000, labelEn: "Class set", labelFr: "Lot de classe", labelAr: "مجموعة القسم" },
    ],
  },
];

/**
 * A package is what an access card opens. It is not a shop item: the student
 * either finds a card in a box, or pays by Baridimob and an admin approves.
 * `priceDzd` is the reference figure the admin checks a receipt against.
 */
export const LMS_PACKAGES = [
  {
    key: "s1-l1",
    titleEn: "First year, semester 1",
    titleFr: "Licence 1, semestre 1",
    titleAr: "ليسانس 1، السداسي 1",
    descriptionEn:
      "Every first-semester module of first year: lectures, tutorials, past papers with corrections.",
    descriptionFr:
      "Tous les modules du premier semestre de licence 1: cours, TD, examens corrigés.",
    descriptionAr:
      "كل مقاييس السداسي الأول من ليسانس 1: دروس، أعمال موجهة، امتحانات مصححة.",
    priceDzd: 500000,
    defaultDurationDays: 180,
    scope: { type: "semester" as const, level: "L1" as const, semester: 1 },
  },
  {
    key: "annee-l1",
    titleEn: "First year, full year",
    titleFr: "Licence 1, année complète",
    titleAr: "ليسانس 1، السنة كاملة",
    descriptionEn: "Both semesters of first year, every module.",
    descriptionFr: "Les deux semestres de licence 1, tous modules confondus.",
    descriptionAr: "سداسيا ليسانس 1، بكل المقاييس.",
    priceDzd: 850000,
    defaultDurationDays: 365,
    scope: { type: "year" as const, level: "L1" as const },
  },
];

/**
 * Home delivery and stop desk, in DZD centimes (e.g. 500 DA = 50000 centimes).
 * Sourced from ZR Express tariffs (tarifs.txt).
 */
export const SHIPPING_DEFAULT = { homeDzd: 90000, deskDzd: 52000 };

export const SHIPPING_EXCEPTIONS: Record<number, { homeDzd: number; deskDzd: number }> = {
  1: { homeDzd: 140000, deskDzd: 97000 }, // Adrar
  2: { homeDzd: 85000, deskDzd: 52000 },  // Chlef
  3: { homeDzd: 95000, deskDzd: 62000 },  // Laghouat
  4: { homeDzd: 85000, deskDzd: 52000 },  // Oum El Bouaghi
  5: { homeDzd: 90000, deskDzd: 52000 },  // Batna
  6: { homeDzd: 80000, deskDzd: 52000 },  // Bejaia
  7: { homeDzd: 95000, deskDzd: 62000 },  // Biskra
  8: { homeDzd: 120000, deskDzd: 97000 }, // Bechar
  9: { homeDzd: 60000, deskDzd: 47000 },  // Blida
  10: { homeDzd: 70000, deskDzd: 52000 }, // Bouira
  11: { homeDzd: 160000, deskDzd: 112000 }, // Tamanrasset
  12: { homeDzd: 90000, deskDzd: 52000 }, // Tebessa
  13: { homeDzd: 90000, deskDzd: 57000 }, // Tlemcen
  14: { homeDzd: 85000, deskDzd: 52000 }, // Tiaret
  15: { homeDzd: 75000, deskDzd: 52000 }, // Tizi Ouzou
  16: { homeDzd: 50000, deskDzd: 37000 }, // Alger
  17: { homeDzd: 95000, deskDzd: 57000 }, // Djelfa
  18: { homeDzd: 90000, deskDzd: 52000 }, // Jijel
  19: { homeDzd: 80000, deskDzd: 52000 }, // Setif
  20: { homeDzd: 90000, deskDzd: 57000 }, // Saida
  21: { homeDzd: 90000, deskDzd: 52000 }, // Skikda
  22: { homeDzd: 90000, deskDzd: 52000 }, // Sidi Bel Abbes
  23: { homeDzd: 85000, deskDzd: 52000 }, // Annaba
  24: { homeDzd: 90000, deskDzd: 52000 }, // Guelma
  25: { homeDzd: 80000, deskDzd: 52000 }, // Constantine
  26: { homeDzd: 80000, deskDzd: 52000 }, // Medea
  27: { homeDzd: 90000, deskDzd: 52000 }, // Mostaganem
  28: { homeDzd: 85000, deskDzd: 57000 }, // M'Sila
  29: { homeDzd: 90000, deskDzd: 52000 }, // Mascara
  30: { homeDzd: 95000, deskDzd: 67000 }, // Ouargla
  31: { homeDzd: 80000, deskDzd: 52000 }, // Oran
  32: { homeDzd: 110000, deskDzd: 67000 }, // El Bayadh
  33: { homeDzd: 160000, deskDzd: 112000 }, // Illizi
  34: { homeDzd: 80000, deskDzd: 52000 }, // Bordj Bou Arreridj
  35: { homeDzd: 70000, deskDzd: 52000 }, // Boumerdes
  36: { homeDzd: 85000, deskDzd: 52000 }, // El Tarf
  37: { homeDzd: 140000, deskDzd: 97000 }, // Tindouf
  38: { homeDzd: 90000, deskDzd: 52000 }, // Tissemsilt
  39: { homeDzd: 95000, deskDzd: 67000 }, // El Oued
  40: { homeDzd: 90000, deskDzd: 52000 }, // Khenchela
  41: { homeDzd: 90000, deskDzd: 52000 }, // Souk Ahras
  42: { homeDzd: 70000, deskDzd: 52000 }, // Tipaza
  43: { homeDzd: 90000, deskDzd: 52000 }, // Mila
  44: { homeDzd: 90000, deskDzd: 52000 }, // Ain Defla
  45: { homeDzd: 110000, deskDzd: 67000 }, // Naama
  46: { homeDzd: 90000, deskDzd: 52000 }, // Ain Temouchent
  47: { homeDzd: 95000, deskDzd: 62000 }, // Ghardaia
  48: { homeDzd: 90000, deskDzd: 52000 }, // Relizane
  49: { homeDzd: 140000, deskDzd: 97000 }, // Timimoun
  50: { homeDzd: 160000, deskDzd: 112000 }, // Bordj Badji Mokhtar
  51: { homeDzd: 95000, deskDzd: 62000 }, // Ouled Djellal
  52: { homeDzd: 120000, deskDzd: 97000 }, // Beni Abbes
  53: { homeDzd: 160000, deskDzd: 112000 }, // In Salah
  54: { homeDzd: 160000, deskDzd: 0 },     // In Guezzam (no desk)
  55: { homeDzd: 95000, deskDzd: 67000 }, // Touggourt
  56: { homeDzd: 160000, deskDzd: 112000 }, // Djanet
  57: { homeDzd: 95000, deskDzd: 0 },     // El M'Ghair (no desk)
  58: { homeDzd: 100000, deskDzd: 67000 }, // El Meniaa
  59: { homeDzd: 95000, deskDzd: 62000 }, // Aflou
  60: { homeDzd: 110000, deskDzd: 67000 }, // El Abiodh Sidi Cheikh
  61: { homeDzd: 90000, deskDzd: 57000 }, // El Aricha
  62: { homeDzd: 95000, deskDzd: 62000 }, // El Kantara
  63: { homeDzd: 90000, deskDzd: 52000 }, // Barika
  64: { homeDzd: 85000, deskDzd: 57000 }, // Bou Saada
  65: { homeDzd: 90000, deskDzd: 52000 }, // Bir El Ater
  66: { homeDzd: 80000, deskDzd: 52000 }, // Ksar El Boukhari
  67: { homeDzd: 85000, deskDzd: 52000 }, // Ksar Chellala
  68: { homeDzd: 95000, deskDzd: 57000 }, // Ain Oussara
  69: { homeDzd: 95000, deskDzd: 57000 }, // Messaad
};
