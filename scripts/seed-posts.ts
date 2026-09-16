import "./load-env";
import { createDb, schema } from "../src/db/client";
import { eq } from "drizzle-orm";

const { db, close } = createDb(process.env.DATABASE_URL!);
const { posts } = schema;

async function seedPosts() {
  console.log("Seeding mock announcements, events, and news...");

  const mockPosts = [
    // -------------------------------------------------------------------------
    // ANNOUNCEMENTS
    // -------------------------------------------------------------------------
    {
      kind: "announcement" as const,
      slug: "new-semester-architecture-packs-2026",
      titleEn: "New Semester Studio Packs Now Available for Delivery",
      titleFr: "Nouveaux packs d'atelier disponibles pour la rentrée",
      titleAr: "حزم ورشة العمل الجديدة للفصل الدراسي متوفرة الآن للتوصيل",
      bodyEn:
        "The new studio supply packs including drafting boards, technical pens, and printed course cards are now in stock. Delivery is available across all 69 wilayas with cash on delivery.",
      bodyFr:
        "Les nouveaux packs de fournitures d'atelier comprenant planches à dessin, stylos techniques et cartes de cours imprimées sont désormais en stock. Livraison disponible dans les 69 wilayas.",
      bodyAr:
        "حزم أدوات الورشة المعمارية الجديدة، بما في ذلك طاولات الرسم والأقلام التقنية وبطاقات الدروس المطبوعة، متوفرة الآن. التوصيل متوفر إلى جميع الـ 69 ولاية مع الدفع عند الاستلام.",
      audience: "all" as const,
      isOnline: false,
      isActive: true,
      position: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      kind: "announcement" as const,
      slug: "lms-digital-card-activation-guide",
      titleEn: "How to Activate Your LMS Course Gift Card",
      titleFr: "Comment activer votre carte d'accès aux cours LMS",
      titleAr: "طريقة تفعيل بطاقة الوصول للدروس عبر المنصة",
      bodyEn:
        "Got a physical course pack? Scratch the code on the back of your card and redeem it in your student dashboard under 'Redeem Card' for instant course and library access.",
      bodyFr:
        "Vous avez reçu votre pack de cours physique ? Grattez le code au dos de votre carte et activez-le sur votre tableau de bord étudiant pour un accès immédiat.",
      bodyAr:
        "هل استلمت حزمة الدروس المطبوعة؟ قم بخدش الرمز الموجود خلف البطاقة وتفعيله مباشرة من لوحة تحكم الطالب للحصول على الوصول الفوري للدروس والمكتبة.",
      audience: "students" as const,
      isOnline: false,
      isActive: true,
      position: 2,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
    {
      kind: "announcement" as const,
      slug: "baridimob-receipt-processing-schedule",
      titleEn: "Baridimob Transfer Processing Window Update",
      titleFr: "Traitement des reçus de virement Baridimob",
      titleAr: "تحديث معالجة إيصالات التحويل عبر بريدي موب",
      bodyEn:
        "Manual receipt verifications are reviewed every evening between 18:00 and 21:00. Once approved, your enrolled university semesters will unlock automatically.",
      bodyFr:
        "Les vérifications manuelles des reçus sont traitées chaque soir entre 18h00 et 21h00. Dès validation, vos semestres universitaires se débloquent automatiquement.",
      bodyAr:
        "تتم مراجعة إيصالات الدفع اليدوية يومياً بين الساعة 18:00 و 21:00. بمجرد التأكيد، سيتم فتح الوصول للفصول الدراسية المسجلة تلقائياً.",
      audience: "on_hold" as const,
      isOnline: false,
      isActive: true,
      position: 3,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    },

    // -------------------------------------------------------------------------
    // EVENTS & WORKSHOPS
    // -------------------------------------------------------------------------
    {
      kind: "event" as const,
      slug: "rhino-grasshopper-parametric-masterclass-2026",
      titleEn: "Parametric Design & Grasshopper Masterclass 2026",
      titleFr: "Masterclass Design Paramétrique & Grasshopper 2026",
      titleAr: "ورشة التصميم البارامتري المتقدم ببرنامج جراسهوبر 2026",
      bodyEn:
        "An intensive 3-day computational design workshop exploring algorithmic facades, responsive envelopes, and generative spatial structures tailored for architecture students.",
      bodyFr:
        "Un atelier intensif de 3 jours explorant les façades algorithmiques, enveloppes réactives et structures spatiales génératives adapté aux étudiants en architecture.",
      bodyAr:
        "ورشة عمل تطبيقية مكثفة لمدة 3 أيام لاستكشاف الواجهات الخوارزمية والهياكل الفضائية التوليدية المخصصة لطلبة الهندسة المعمارية.",
      locationEn: "EPAU Algiers & Live Streaming",
      locationFr: "EPAU Alger & Diffusion en direct",
      locationAr: "المدرسة متعددة العلوم للهندسة المعمارية والعمران بالجزائر وبث مباشر",
      coverImagePath: "seed/parametric-masterclass.webp",
      isOnline: true,
      registrationUrl: "https://trendyplaza-architecture.dz/workshops/grasshopper",
      startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // 2 weeks from now
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 17),
      isActive: true,
      position: 1,
      createdAt: new Date(),
    },
    {
      kind: "event" as const,
      slug: "modern-algerian-vernacular-architecture-symposium",
      titleEn: "Symposium: Contemporary Algerian Vernacular Architecture",
      titleFr: "Symposium : L'Architecture Vernaculaire Algérienne Contemporaine",
      titleAr: "ندوة: العمارة التقليدية الجزائرية المعاصرة وتحديات الاستدامة",
      bodyEn:
        "Keynote talks and panel discussions with prominent Algerian architects on bioclimatic earth construction, Mzab valley urbanism, and passive desert cooling techniques.",
      bodyFr:
        "Conférences et panels avec d'éminents architectes algériens sur la construction bioclimatique en terre, l'urbanisme de la vallée du M'zab et les techniques de refroidissement passif.",
      bodyAr:
        "محاضرات ونقاشات مع نخبة من المعماريين الجزائريين حول البناء البيومناخي بالتراب، وعمران وادي مزاب، وتقنيات التبريد السلبي في المناطق الصحراوية.",
      locationEn: "University of Constantine 3 Auditorium",
      locationFr: "Auditorium de l'Université Constantine 3",
      locationAr: "قاعة المحاضرات بجامعة قسنطينة 3",
      coverImagePath: "seed/vernacular-symposium.webp",
      isOnline: false,
      registrationUrl: "https://trendyplaza-architecture.dz/symposium/vernacular",
      startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25), // 25 days from now
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 26),
      isActive: true,
      position: 2,
      createdAt: new Date(),
    },
    {
      kind: "event" as const,
      slug: "national-architecture-student-exhibition-2025",
      titleEn: "National Graduation Project Exhibition (PFE Retrospective)",
      titleFr: "Exposition Nationale des Projets de Fin d'Études (Rétrospective PFE)",
      titleAr: "المعرض الوطني لمشاريع التخرج المعمارية (أرشيف PFE)",
      bodyEn:
        "Retrospective exhibition showcasing top diploma projects across urban planning, heritage restoration, and innovative public infrastructure from Algerian universities.",
      bodyFr:
        "Exposition rétrospective présentant les meilleurs projets de diplôme en urbanisme, restauration du patrimoine et infrastructures publiques innovantes des universités algériennes.",
      bodyAr:
        "معرض استعادي يضم أفضل مشاريع التخرج في التخطيط العمراني، وترميم التراث، والمرافق العامة المبتكرة من مختلف كليات الهندسة المعمارية في الجزائر.",
      locationEn: "National Higher School of Architecture, Oran",
      locationFr: "École Nationale Supérieure d'Architecture, Oran",
      locationAr: "المدرسة الوطنية العليا للهندسة المعمارية - وهران",
      coverImagePath: "seed/graduation-exhibition.webp",
      isOnline: false,
      registrationUrl: null,
      startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60), // Past event
      endsAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 58),
      isActive: true,
      position: 3,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 65),
    },

    // -------------------------------------------------------------------------
    // NEWS & ARTICLES
    // -------------------------------------------------------------------------
    {
      kind: "news" as const,
      slug: "delivery-coverage-expanded-to-all-69-wilayas",
      titleEn: "Delivery Coverage Now Reaches All 69 Wilayas with Dedicated COD",
      titleFr: "Extension de la livraison aux 69 wilayas avec paiement à la livraison",
      titleAr: "توسيع شبكة التوصيل لتشمل كافة الـ 69 ولاية مع الدفع عند الاستلام",
      bodyEn:
        "We are proud to announce full nationwide delivery coverage across all 69 Algerian wilayas. Whether you need physical drafting kits in Adrar, Constantine, or Algiers, our courier network brings supplies directly to your doorstep with fixed-rate shipping.",
      bodyFr:
        "Nous sommes fiers d'annoncer une couverture complète de livraison dans les 69 wilayas algériennes. Que vous ayez besoin de fournitures à Adrar, Constantine ou Alger, notre réseau vous livre directement avec tarif unique.",
      bodyAr:
        "يسرنا الإعلان عن تغطية التوصيل لجميع الـ 69 ولاية جزائرية. سواء كنت بحاجة لأدوات الرسم الهندسي في أدرار أو قسنطينة أو الجزائر العاصمة، ستصلك طلبيتك مباشرة إلى باب منزلك مع سعر موحد للدفع عند الاستلام.",
      coverImagePath: "seed/delivery-coverage.webp",
      isOnline: false,
      isActive: true,
      position: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    {
      kind: "news" as const,
      slug: "new-digital-library-cad-blocks-and-books-added",
      titleEn: "Over 500+ Curated CAD Blocks and Standard Details Added to Library",
      titleFr: "Plus de 500 blocs CAO et détails normatifs ajoutés à la bibliothèque",
      titleAr: "إضافة أكثر من 500 بلوك أوتوكاد وتفاصيل معمارية معيارية إلى المكتبة",
      bodyEn:
        "Our digital library has been enriched with standardized architectural CAD blocks, joinery sections, furniture blocks, and bioclimatic details compliant with local Algerian building codes.",
      bodyFr:
        "Notre bibliothèque numérique s'enrichit de blocs CAO architecturaux normalisés, détails de menuiserie, mobilier et coupes bioclimatiques conformes aux normes locales.",
      bodyAr:
        "تم تحديث المكتبة الرقمية بإضافة بلوكات أوتوكاد معمارية معيارية، وتفاصيل النجارة، والأثاث، والقطاعات البيومناخية المتوافقة مع معايير البناء في الجزائر.",
      coverImagePath: "seed/library-cad-blocks.webp",
      isOnline: false,
      isActive: true,
      position: 2,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
    },
    {
      kind: "news" as const,
      slug: "partnership-with-algerian-architecture-student-clubs",
      titleEn: "Partnership with Student Architecture Associations Across Algeria",
      titleFr: "Partenariat avec les clubs étudiants en architecture à travers l'Algérie",
      titleAr: "شراكة مع نوادي وجمعيات طلبة الهندسة المعمارية في الجامعات الجزائرية",
      bodyEn:
        "TP Architecture is partnering with student scientific clubs across Blida, Tizi Ouzou, Batna, and Annaba to sponsor graduation project reviews, workshops, and supply kits.",
      bodyFr:
        "TP Architecture s'associe aux clubs scientifiques étudiants de Blida, Tizi Ouzou, Batna et Annaba pour soutenir les jurys de diplôme et ateliers pratiques.",
      bodyAr:
        "أبرمت منصة تريندي بلازا للهندسة المعمارية شراكات مع النوادي العلمية للطلبة في البليدة وتيزي وزو وباتنة وعنابة لدعم لجان تحكيم مشاريع التخرج وتقديم حزم الأدوات.",
      isOnline: false,
      isActive: true,
      position: 3,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    },
  ];

  for (const post of mockPosts) {
    // Check if slug already exists
    const [existing] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, post.slug))
      .limit(1);

    if (!existing) {
      await db.insert(posts).values(post);
      console.log(`✓ Inserted ${post.kind}: ${post.titleEn}`);
    } else {
      console.log(`- Already exists: ${post.titleEn}`);
    }
  }

  console.log("Finished seeding mock posts!");
  await close();
  process.exit(0);
}

seedPosts().catch(async (err) => {
  console.error("Seed error:", err);
  await close();
  process.exit(1);
});
