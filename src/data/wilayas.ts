/**
 * Algeria: 69 wilayas and 1,541 communes, post Loi 26-06 of April 2026.
 *
 * Generated from https://github.com/S450R1/algeria-cities-2025
 * by scripts/build-geo.mjs. Do not hand-edit: rerun the script.
 *
 * Latin names carry no em dashes, en dashes or horizontal bars. The copy rules
 * ban them, and a dataset becomes copy the moment it reaches a dropdown.
 *
 * Shipping prices do NOT live here. They are per wilaya, editable by the
 * client, and read from the shipping_rates table.
 *
 * 160 KB. Seed input, not a runtime import: a client component that imports
 * this ships all of it to a phone on mobile data.
 */

export type Wilaya = { id: number; name: string; nameAr: string };
export type Commune = { id: number; wilayaId: number; name: string; nameAr: string };

export const wilayas: Wilaya[] = [
  {
    "id": 1,
    "name": "Adrar",
    "nameAr": "أدرار"
  },
  {
    "id": 2,
    "name": "Chlef",
    "nameAr": "الشلف"
  },
  {
    "id": 3,
    "name": "Laghouat",
    "nameAr": "الأغواط"
  },
  {
    "id": 4,
    "name": "Oum El Bouaghi",
    "nameAr": "أم البواقي"
  },
  {
    "id": 5,
    "name": "Batna",
    "nameAr": "باتنة"
  },
  {
    "id": 6,
    "name": "Bejaia",
    "nameAr": "بجاية"
  },
  {
    "id": 7,
    "name": "Biskra",
    "nameAr": "بسكرة"
  },
  {
    "id": 8,
    "name": "Bechar",
    "nameAr": "بشار"
  },
  {
    "id": 9,
    "name": "Blida",
    "nameAr": "البليدة"
  },
  {
    "id": 10,
    "name": "Bouira",
    "nameAr": "البويرة"
  },
  {
    "id": 11,
    "name": "Tamanrasset",
    "nameAr": "تمنراست"
  },
  {
    "id": 12,
    "name": "Tebessa",
    "nameAr": "تبسة"
  },
  {
    "id": 13,
    "name": "Tlemcen",
    "nameAr": "تلمسان"
  },
  {
    "id": 14,
    "name": "Tiaret",
    "nameAr": "تيارت"
  },
  {
    "id": 15,
    "name": "Tizi Ouzou",
    "nameAr": "تيزي وزو"
  },
  {
    "id": 16,
    "name": "Alger",
    "nameAr": "الجزائر"
  },
  {
    "id": 17,
    "name": "Djelfa",
    "nameAr": "الجلفة"
  },
  {
    "id": 18,
    "name": "Jijel",
    "nameAr": "جيجل"
  },
  {
    "id": 19,
    "name": "Setif",
    "nameAr": "سطيف"
  },
  {
    "id": 20,
    "name": "Saida",
    "nameAr": "سعيدة"
  },
  {
    "id": 21,
    "name": "Skikda",
    "nameAr": "سكيكدة"
  },
  {
    "id": 22,
    "name": "Sidi Bel Abbes",
    "nameAr": "سيدي بلعباس"
  },
  {
    "id": 23,
    "name": "Annaba",
    "nameAr": "عنابة"
  },
  {
    "id": 24,
    "name": "Guelma",
    "nameAr": "قالمة"
  },
  {
    "id": 25,
    "name": "Constantine",
    "nameAr": "قسنطينة"
  },
  {
    "id": 26,
    "name": "Medea",
    "nameAr": "المدية"
  },
  {
    "id": 27,
    "name": "Mostaganem",
    "nameAr": "مستغانم"
  },
  {
    "id": 28,
    "name": "M'Sila",
    "nameAr": "المسيلة"
  },
  {
    "id": 29,
    "name": "Mascara",
    "nameAr": "معسكر"
  },
  {
    "id": 30,
    "name": "Ouargla",
    "nameAr": "ورقلة"
  },
  {
    "id": 31,
    "name": "Oran",
    "nameAr": "وهران"
  },
  {
    "id": 32,
    "name": "El Bayadh",
    "nameAr": "البيض"
  },
  {
    "id": 33,
    "name": "Illizi",
    "nameAr": "إليزي"
  },
  {
    "id": 34,
    "name": "Bordj Bou Arreridj",
    "nameAr": "برج بوعريريج"
  },
  {
    "id": 35,
    "name": "Boumerdes",
    "nameAr": "بومرداس"
  },
  {
    "id": 36,
    "name": "El Tarf",
    "nameAr": "الطارف"
  },
  {
    "id": 37,
    "name": "Tindouf",
    "nameAr": "تندوف"
  },
  {
    "id": 38,
    "name": "Tissemsilt",
    "nameAr": "تيسمسيلت"
  },
  {
    "id": 39,
    "name": "El Oued",
    "nameAr": "الوادي"
  },
  {
    "id": 40,
    "name": "Khenchela",
    "nameAr": "خنشلة"
  },
  {
    "id": 41,
    "name": "Souk Ahras",
    "nameAr": "سوق أهراس"
  },
  {
    "id": 42,
    "name": "Tipaza",
    "nameAr": "تيبازة"
  },
  {
    "id": 43,
    "name": "Mila",
    "nameAr": "ميلة"
  },
  {
    "id": 44,
    "name": "Ain Defla",
    "nameAr": "عين الدفلى"
  },
  {
    "id": 45,
    "name": "Naama",
    "nameAr": "النعامة"
  },
  {
    "id": 46,
    "name": "Ain Temouchent",
    "nameAr": "عين تموشنت"
  },
  {
    "id": 47,
    "name": "Ghardaia",
    "nameAr": "غرداية"
  },
  {
    "id": 48,
    "name": "Relizane",
    "nameAr": "غليزان"
  },
  {
    "id": 49,
    "name": "Timimoun",
    "nameAr": "تيميمون"
  },
  {
    "id": 50,
    "name": "Bordj Badji Mokhtar",
    "nameAr": "برج باجي مختار"
  },
  {
    "id": 51,
    "name": "Ouled Djellal",
    "nameAr": "أولاد جلال"
  },
  {
    "id": 52,
    "name": "Beni Abbes",
    "nameAr": "بني عباس"
  },
  {
    "id": 53,
    "name": "In Salah",
    "nameAr": "عين صالح"
  },
  {
    "id": 54,
    "name": "In Guezzam",
    "nameAr": "عين قزام"
  },
  {
    "id": 55,
    "name": "Touggourt",
    "nameAr": "تقرت"
  },
  {
    "id": 56,
    "name": "Djanet",
    "nameAr": "جانت"
  },
  {
    "id": 57,
    "name": "El M'Ghair",
    "nameAr": "المغير"
  },
  {
    "id": 58,
    "name": "El Meniaa",
    "nameAr": "المنيعة"
  },
  {
    "id": 59,
    "name": "Aflou",
    "nameAr": "أفلو"
  },
  {
    "id": 60,
    "name": "El Abiodh Sidi Cheikh",
    "nameAr": "الأبيض سيدي الشيخ"
  },
  {
    "id": 61,
    "name": "El Aricha",
    "nameAr": "العريشة"
  },
  {
    "id": 62,
    "name": "El Kantara",
    "nameAr": "القنطرة"
  },
  {
    "id": 63,
    "name": "Barika",
    "nameAr": "بريكة"
  },
  {
    "id": 64,
    "name": "Bou Saada",
    "nameAr": "بوسعادة"
  },
  {
    "id": 65,
    "name": "Bir El Ater",
    "nameAr": "بير العاتر"
  },
  {
    "id": 66,
    "name": "Ksar El Boukhari",
    "nameAr": "قصر البخاري"
  },
  {
    "id": 67,
    "name": "Ksar Chellala",
    "nameAr": "قصر الشلالة"
  },
  {
    "id": 68,
    "name": "Ain Oussara",
    "nameAr": "عين وسارة"
  },
  {
    "id": 69,
    "name": "Messaad",
    "nameAr": "مسعد"
  }
];

export const communes: Commune[] = [
  {
    "id": 1,
    "wilayaId": 1,
    "name": "Timekten",
    "nameAr": "تيمقتن"
  },
  {
    "id": 2,
    "wilayaId": 1,
    "name": "Bouda",
    "nameAr": "بودة"
  },
  {
    "id": 3,
    "wilayaId": 1,
    "name": "Ouled Ahmed Timmi",
    "nameAr": "أولاد أحمد تيمي"
  },
  {
    "id": 4,
    "wilayaId": 1,
    "name": "Adrar",
    "nameAr": "أدرار"
  },
  {
    "id": 5,
    "wilayaId": 1,
    "name": "Fenoughil",
    "nameAr": "فنوغيل"
  },
  {
    "id": 6,
    "wilayaId": 1,
    "name": "In Zghmir",
    "nameAr": "إن زغمير"
  },
  {
    "id": 7,
    "wilayaId": 1,
    "name": "Reggane",
    "nameAr": "رقان"
  },
  {
    "id": 8,
    "wilayaId": 1,
    "name": "Sali",
    "nameAr": "سالي"
  },
  {
    "id": 9,
    "wilayaId": 1,
    "name": "Sebaa",
    "nameAr": "السبع"
  },
  {
    "id": 10,
    "wilayaId": 1,
    "name": "Tsabit",
    "nameAr": "تسابيت"
  },
  {
    "id": 11,
    "wilayaId": 1,
    "name": "Tamest",
    "nameAr": "تامست"
  },
  {
    "id": 12,
    "wilayaId": 1,
    "name": "Tamantit",
    "nameAr": "تامنطيط"
  },
  {
    "id": 13,
    "wilayaId": 1,
    "name": "Tit",
    "nameAr": "تيت"
  },
  {
    "id": 14,
    "wilayaId": 1,
    "name": "Zaouiet Kounta",
    "nameAr": "زاوية كنتة"
  },
  {
    "id": 15,
    "wilayaId": 1,
    "name": "Akabli",
    "nameAr": "اقبلي"
  },
  {
    "id": 16,
    "wilayaId": 1,
    "name": "Aoulef",
    "nameAr": "أولف"
  },
  {
    "id": 17,
    "wilayaId": 2,
    "name": "Talassa",
    "nameAr": "تلعصة"
  },
  {
    "id": 18,
    "wilayaId": 2,
    "name": "Zeboudja",
    "nameAr": "الزبوجة"
  },
  {
    "id": 19,
    "wilayaId": 2,
    "name": "El Hadjadj",
    "nameAr": "الحجاج"
  },
  {
    "id": 20,
    "wilayaId": 2,
    "name": "Ouled Ben Abdelkader",
    "nameAr": "أولاد بن عبد القادر"
  },
  {
    "id": 21,
    "wilayaId": 2,
    "name": "Ain Merane",
    "nameAr": "عين مران"
  },
  {
    "id": 22,
    "wilayaId": 2,
    "name": "Breira",
    "nameAr": "بريرة"
  },
  {
    "id": 23,
    "wilayaId": 2,
    "name": "Ouled Abbes",
    "nameAr": "أولاد عباس"
  },
  {
    "id": 24,
    "wilayaId": 2,
    "name": "Oued Fodda",
    "nameAr": "وادي الفضة"
  },
  {
    "id": 25,
    "wilayaId": 2,
    "name": "Beni Rached",
    "nameAr": "بني راشد"
  },
  {
    "id": 26,
    "wilayaId": 2,
    "name": "Herenfa",
    "nameAr": "الهرانفة"
  },
  {
    "id": 27,
    "wilayaId": 2,
    "name": "Tadjena",
    "nameAr": "تاجنة"
  },
  {
    "id": 28,
    "wilayaId": 2,
    "name": "El Marsa",
    "nameAr": "المرسى"
  },
  {
    "id": 29,
    "wilayaId": 2,
    "name": "Chlef",
    "nameAr": "الشلف"
  },
  {
    "id": 30,
    "wilayaId": 2,
    "name": "Oum Drou",
    "nameAr": "أم الدروع"
  },
  {
    "id": 31,
    "wilayaId": 2,
    "name": "Sendjas",
    "nameAr": "سنجاس"
  },
  {
    "id": 32,
    "wilayaId": 2,
    "name": "Sidi Abderrahmane",
    "nameAr": "سيدي عبد الرحمن"
  },
  {
    "id": 33,
    "wilayaId": 2,
    "name": "Sidi Akkacha",
    "nameAr": "سيدي عكاشة"
  },
  {
    "id": 34,
    "wilayaId": 2,
    "name": "Tenes",
    "nameAr": "تنس"
  },
  {
    "id": 35,
    "wilayaId": 2,
    "name": "Beni Bouattab",
    "nameAr": "بني بوعتاب"
  },
  {
    "id": 36,
    "wilayaId": 2,
    "name": "El Karimia",
    "nameAr": "الكريمية"
  },
  {
    "id": 37,
    "wilayaId": 2,
    "name": "Harchoun",
    "nameAr": "حرشون"
  },
  {
    "id": 38,
    "wilayaId": 2,
    "name": "Bouzeghaia",
    "nameAr": "بوزغاية"
  },
  {
    "id": 39,
    "wilayaId": 2,
    "name": "Taougrit",
    "nameAr": "تاوقريت"
  },
  {
    "id": 40,
    "wilayaId": 2,
    "name": "Beni Haoua",
    "nameAr": "بني حواء"
  },
  {
    "id": 41,
    "wilayaId": 2,
    "name": "Abou El Hassane",
    "nameAr": "أبو الحسن"
  },
  {
    "id": 42,
    "wilayaId": 2,
    "name": "Oued Goussine",
    "nameAr": "وادي قوسين"
  },
  {
    "id": 43,
    "wilayaId": 2,
    "name": "Chettia",
    "nameAr": "الشطية"
  },
  {
    "id": 44,
    "wilayaId": 2,
    "name": "Moussadek",
    "nameAr": "مصدق"
  },
  {
    "id": 45,
    "wilayaId": 2,
    "name": "Ouled Fares",
    "nameAr": "أولاد فارس"
  },
  {
    "id": 46,
    "wilayaId": 2,
    "name": "Boukadir",
    "nameAr": "بوقادير"
  },
  {
    "id": 47,
    "wilayaId": 2,
    "name": "Oued Sly",
    "nameAr": "وادي سلي"
  },
  {
    "id": 48,
    "wilayaId": 2,
    "name": "Sobha",
    "nameAr": "الصبحة"
  },
  {
    "id": 49,
    "wilayaId": 2,
    "name": "Benairia",
    "nameAr": "بنايرية"
  },
  {
    "id": 50,
    "wilayaId": 2,
    "name": "Labiod Medjadja",
    "nameAr": "الأبيض مجاجة"
  },
  {
    "id": 51,
    "wilayaId": 2,
    "name": "Dahra",
    "nameAr": "الظهرة"
  },
  {
    "id": 52,
    "wilayaId": 59,
    "name": "El Beidha",
    "nameAr": "البيضاء"
  },
  {
    "id": 53,
    "wilayaId": 59,
    "name": "Gueltat Sidi Saad",
    "nameAr": "قلتة سيدي سعد"
  },
  {
    "id": 54,
    "wilayaId": 59,
    "name": "Brida",
    "nameAr": "بريدة"
  },
  {
    "id": 55,
    "wilayaId": 59,
    "name": "Ain Sidi Ali",
    "nameAr": "عين سيدي علي"
  },
  {
    "id": 56,
    "wilayaId": 3,
    "name": "Tadjemout",
    "nameAr": "تاجموت"
  },
  {
    "id": 57,
    "wilayaId": 59,
    "name": "Hadj Mechri",
    "nameAr": "الحاج مشري"
  },
  {
    "id": 58,
    "wilayaId": 59,
    "name": "Taouiala",
    "nameAr": "تاويالة"
  },
  {
    "id": 59,
    "wilayaId": 59,
    "name": "El Ghicha",
    "nameAr": "الغيشة"
  },
  {
    "id": 60,
    "wilayaId": 3,
    "name": "Tadjrouna",
    "nameAr": "تاجرونة"
  },
  {
    "id": 61,
    "wilayaId": 59,
    "name": "Sebgag",
    "nameAr": "سبقاق"
  },
  {
    "id": 62,
    "wilayaId": 59,
    "name": "Sidi Bouzid",
    "nameAr": "سيدي بوزيد"
  },
  {
    "id": 63,
    "wilayaId": 59,
    "name": "Oued Morra",
    "nameAr": "وادي مرة"
  },
  {
    "id": 64,
    "wilayaId": 3,
    "name": "Laghouat",
    "nameAr": "الأغواط"
  },
  {
    "id": 65,
    "wilayaId": 59,
    "name": "Oued M'zi",
    "nameAr": "وادي مزي"
  },
  {
    "id": 66,
    "wilayaId": 3,
    "name": "Ksar El Hirane",
    "nameAr": "قصر الحيران"
  },
  {
    "id": 67,
    "wilayaId": 3,
    "name": "El Assafia",
    "nameAr": "العسافية"
  },
  {
    "id": 68,
    "wilayaId": 3,
    "name": "Sidi Makhlouf",
    "nameAr": "سيدي مخلوف"
  },
  {
    "id": 69,
    "wilayaId": 3,
    "name": "Hassi Delaa",
    "nameAr": "حاسي الدلاعة"
  },
  {
    "id": 70,
    "wilayaId": 3,
    "name": "Hassi R'mel",
    "nameAr": "حاسي الرمل"
  },
  {
    "id": 71,
    "wilayaId": 3,
    "name": "Ain Madhi",
    "nameAr": "عين ماضي"
  },
  {
    "id": 72,
    "wilayaId": 3,
    "name": "El Haouaita",
    "nameAr": "الحويطة"
  },
  {
    "id": 73,
    "wilayaId": 3,
    "name": "Kheneg",
    "nameAr": "الخنق"
  },
  {
    "id": 74,
    "wilayaId": 3,
    "name": "Benacer Benchohra",
    "nameAr": "بن ناصر بن شهرة"
  },
  {
    "id": 75,
    "wilayaId": 59,
    "name": "Aflou",
    "nameAr": "أفلو"
  },
  {
    "id": 76,
    "wilayaId": 4,
    "name": "Fkirina",
    "nameAr": "فكيرينة"
  },
  {
    "id": 77,
    "wilayaId": 4,
    "name": "El Fedjoudj Boughrara Sa",
    "nameAr": "الفجوج بوغرارة سعودي"
  },
  {
    "id": 78,
    "wilayaId": 4,
    "name": "Ain Fekroun",
    "nameAr": "عين فكرون"
  },
  {
    "id": 79,
    "wilayaId": 4,
    "name": "Rahia",
    "nameAr": "الرحية"
  },
  {
    "id": 80,
    "wilayaId": 4,
    "name": "Meskiana",
    "nameAr": "مسكيانة"
  },
  {
    "id": 81,
    "wilayaId": 4,
    "name": "El Belala",
    "nameAr": "البلالة"
  },
  {
    "id": 82,
    "wilayaId": 4,
    "name": "Behir Chergui",
    "nameAr": "بحير الشرقي"
  },
  {
    "id": 83,
    "wilayaId": 4,
    "name": "Ksar Sbahi",
    "nameAr": "قصر الصباحي"
  },
  {
    "id": 84,
    "wilayaId": 4,
    "name": "Souk Naamane",
    "nameAr": "سوق نعمان"
  },
  {
    "id": 85,
    "wilayaId": 4,
    "name": "Ouled Zouai",
    "nameAr": "أولاد زواي"
  },
  {
    "id": 86,
    "wilayaId": 4,
    "name": "Oum El Bouaghi",
    "nameAr": "أم البواقي"
  },
  {
    "id": 87,
    "wilayaId": 4,
    "name": "Ain Babouche",
    "nameAr": "عين ببوش"
  },
  {
    "id": 88,
    "wilayaId": 4,
    "name": "Ain Zitoun",
    "nameAr": "عين الزيتون"
  },
  {
    "id": 89,
    "wilayaId": 4,
    "name": "Bir Chouhada",
    "nameAr": "بئر الشهداء"
  },
  {
    "id": 90,
    "wilayaId": 4,
    "name": "Ain Beida",
    "nameAr": "عين البيضاء"
  },
  {
    "id": 91,
    "wilayaId": 4,
    "name": "Berriche",
    "nameAr": "بريش"
  },
  {
    "id": 92,
    "wilayaId": 4,
    "name": "Zorg",
    "nameAr": "الزرق"
  },
  {
    "id": 93,
    "wilayaId": 4,
    "name": "Ain M'lila",
    "nameAr": "عين مليلة"
  },
  {
    "id": 94,
    "wilayaId": 4,
    "name": "Ouled Gacem",
    "nameAr": "أولاد قاسم"
  },
  {
    "id": 95,
    "wilayaId": 4,
    "name": "Ouled Hamla",
    "nameAr": "أولاد حملة"
  },
  {
    "id": 96,
    "wilayaId": 4,
    "name": "El Amiria",
    "nameAr": "العامرية"
  },
  {
    "id": 97,
    "wilayaId": 4,
    "name": "Sigus",
    "nameAr": "سيقوس"
  },
  {
    "id": 98,
    "wilayaId": 4,
    "name": "Oued Nini",
    "nameAr": "وادي نيني"
  },
  {
    "id": 99,
    "wilayaId": 4,
    "name": "Ain Diss",
    "nameAr": "عين الديس"
  },
  {
    "id": 100,
    "wilayaId": 4,
    "name": "Dhalaa",
    "nameAr": "الضلعة"
  },
  {
    "id": 101,
    "wilayaId": 4,
    "name": "El Djazia",
    "nameAr": "الجازية"
  },
  {
    "id": 102,
    "wilayaId": 4,
    "name": "Ain Kercha",
    "nameAr": "عين كرشة"
  },
  {
    "id": 103,
    "wilayaId": 4,
    "name": "El Harmilia",
    "nameAr": "الحرملية"
  },
  {
    "id": 104,
    "wilayaId": 4,
    "name": "Hanchir Toumghani",
    "nameAr": "هنشير تومغني"
  },
  {
    "id": 105,
    "wilayaId": 5,
    "name": "Maafa",
    "nameAr": "معافة"
  },
  {
    "id": 106,
    "wilayaId": 5,
    "name": "Gosbat",
    "nameAr": "القصبات"
  },
  {
    "id": 107,
    "wilayaId": 5,
    "name": "Timgad",
    "nameAr": "تيمقاد"
  },
  {
    "id": 108,
    "wilayaId": 5,
    "name": "Taxlent",
    "nameAr": "تاكسلانت"
  },
  {
    "id": 109,
    "wilayaId": 5,
    "name": "Ouled Si Slimane",
    "nameAr": "أولاد سي سليمان"
  },
  {
    "id": 110,
    "wilayaId": 5,
    "name": "Lemcene",
    "nameAr": "لمسان"
  },
  {
    "id": 111,
    "wilayaId": 5,
    "name": "Talkhamt",
    "nameAr": "تالخمت"
  },
  {
    "id": 112,
    "wilayaId": 5,
    "name": "Ras El Aioun",
    "nameAr": "رأس العيون"
  },
  {
    "id": 113,
    "wilayaId": 5,
    "name": "Rahbat",
    "nameAr": "الرحبات"
  },
  {
    "id": 114,
    "wilayaId": 5,
    "name": "Ouled Sellem",
    "nameAr": "أولاد سلام"
  },
  {
    "id": 115,
    "wilayaId": 5,
    "name": "Guigba",
    "nameAr": "القيقبة"
  },
  {
    "id": 116,
    "wilayaId": 5,
    "name": "Teniet El Abed",
    "nameAr": "ثنية العابد"
  },
  {
    "id": 117,
    "wilayaId": 5,
    "name": "Batna",
    "nameAr": "باتنة"
  },
  {
    "id": 118,
    "wilayaId": 5,
    "name": "Fesdis",
    "nameAr": "فسديس"
  },
  {
    "id": 119,
    "wilayaId": 5,
    "name": "Oued Chaaba",
    "nameAr": "وادي الشعبة"
  },
  {
    "id": 120,
    "wilayaId": 5,
    "name": "Hidoussa",
    "nameAr": "حيدوسة"
  },
  {
    "id": 121,
    "wilayaId": 5,
    "name": "Ksar Bellezma",
    "nameAr": "قصر بلزمة"
  },
  {
    "id": 122,
    "wilayaId": 5,
    "name": "Merouana",
    "nameAr": "مروانة"
  },
  {
    "id": 123,
    "wilayaId": 5,
    "name": "Oued El Ma",
    "nameAr": "وادي الماء"
  },
  {
    "id": 124,
    "wilayaId": 5,
    "name": "Lazrou",
    "nameAr": "لازرو"
  },
  {
    "id": 125,
    "wilayaId": 5,
    "name": "Seriana",
    "nameAr": "سريانة"
  },
  {
    "id": 126,
    "wilayaId": 5,
    "name": "Zanet El Beida",
    "nameAr": "زانة البيضاء"
  },
  {
    "id": 127,
    "wilayaId": 5,
    "name": "Menaa",
    "nameAr": "منعة"
  },
  {
    "id": 128,
    "wilayaId": 5,
    "name": "Tigharghar",
    "nameAr": "تغرغار"
  },
  {
    "id": 129,
    "wilayaId": 5,
    "name": "Ain Yagout",
    "nameAr": "عين ياقوت"
  },
  {
    "id": 130,
    "wilayaId": 5,
    "name": "Boumia",
    "nameAr": "بومية"
  },
  {
    "id": 131,
    "wilayaId": 5,
    "name": "Djerma",
    "nameAr": "جرمة"
  },
  {
    "id": 132,
    "wilayaId": 5,
    "name": "El Madher",
    "nameAr": "المعذر"
  },
  {
    "id": 133,
    "wilayaId": 5,
    "name": "Ouyoun El Assafir",
    "nameAr": "عيون العصافير"
  },
  {
    "id": 134,
    "wilayaId": 5,
    "name": "Tazoult",
    "nameAr": "تازولت"
  },
  {
    "id": 135,
    "wilayaId": 5,
    "name": "Boumagueur",
    "nameAr": "بومقر"
  },
  {
    "id": 136,
    "wilayaId": 5,
    "name": "N Gaous",
    "nameAr": "نقاوس"
  },
  {
    "id": 137,
    "wilayaId": 5,
    "name": "Sefiane",
    "nameAr": "سفيان"
  },
  {
    "id": 138,
    "wilayaId": 5,
    "name": "Arris",
    "nameAr": "أريس"
  },
  {
    "id": 139,
    "wilayaId": 5,
    "name": "Tighanimine",
    "nameAr": "تيغانمين"
  },
  {
    "id": 140,
    "wilayaId": 5,
    "name": "Ain Djasser",
    "nameAr": "عين جاسر"
  },
  {
    "id": 141,
    "wilayaId": 5,
    "name": "El Hassi",
    "nameAr": "الحاسي"
  },
  {
    "id": 142,
    "wilayaId": 63,
    "name": "Seggana",
    "nameAr": "سقانة"
  },
  {
    "id": 143,
    "wilayaId": 63,
    "name": "Tilatou",
    "nameAr": "تيلاطو"
  },
  {
    "id": 144,
    "wilayaId": 5,
    "name": "Foum Toub",
    "nameAr": "فم الطوب"
  },
  {
    "id": 145,
    "wilayaId": 5,
    "name": "Ichemoul",
    "nameAr": "إشمول"
  },
  {
    "id": 146,
    "wilayaId": 5,
    "name": "Inoughissen",
    "nameAr": "إينوغيسن"
  },
  {
    "id": 147,
    "wilayaId": 5,
    "name": "Bouzina",
    "nameAr": "بوزينة"
  },
  {
    "id": 148,
    "wilayaId": 5,
    "name": "Larbaa",
    "nameAr": "لارباع"
  },
  {
    "id": 149,
    "wilayaId": 5,
    "name": "Boulhilat",
    "nameAr": "بولهيلات"
  },
  {
    "id": 150,
    "wilayaId": 5,
    "name": "Chemora",
    "nameAr": "الشمرة"
  },
  {
    "id": 151,
    "wilayaId": 63,
    "name": "Barika",
    "nameAr": "بريكة"
  },
  {
    "id": 152,
    "wilayaId": 63,
    "name": "Bitam",
    "nameAr": "بيطام"
  },
  {
    "id": 153,
    "wilayaId": 63,
    "name": "M Doukal",
    "nameAr": "إمدوكل"
  },
  {
    "id": 154,
    "wilayaId": 63,
    "name": "Azil Abedelkader",
    "nameAr": "عزيل عبد القادر"
  },
  {
    "id": 155,
    "wilayaId": 63,
    "name": "Djezzar",
    "nameAr": "الجزار"
  },
  {
    "id": 156,
    "wilayaId": 63,
    "name": "Ouled Ammar",
    "nameAr": "أولاد عمار"
  },
  {
    "id": 157,
    "wilayaId": 5,
    "name": "Ghassira",
    "nameAr": "غسيرة"
  },
  {
    "id": 158,
    "wilayaId": 5,
    "name": "Kimmel",
    "nameAr": "كيمل"
  },
  {
    "id": 159,
    "wilayaId": 5,
    "name": "T Kout",
    "nameAr": "تكوت"
  },
  {
    "id": 160,
    "wilayaId": 5,
    "name": "Ain Touta",
    "nameAr": "عين التوتة"
  },
  {
    "id": 161,
    "wilayaId": 5,
    "name": "Beni Foudhala El Hakania",
    "nameAr": "بني فضالة الحقانية"
  },
  {
    "id": 162,
    "wilayaId": 5,
    "name": "Ouled Fadel",
    "nameAr": "أولاد فاضل"
  },
  {
    "id": 163,
    "wilayaId": 5,
    "name": "Ouled Aouf",
    "nameAr": "أولاد عوف"
  },
  {
    "id": 164,
    "wilayaId": 5,
    "name": "Chir",
    "nameAr": "شير"
  },
  {
    "id": 165,
    "wilayaId": 5,
    "name": "Oued Taga",
    "nameAr": "وادي الطاقة"
  },
  {
    "id": 166,
    "wilayaId": 6,
    "name": "Sidi Ayad",
    "nameAr": "سيدي عياد"
  },
  {
    "id": 167,
    "wilayaId": 6,
    "name": "Barbacha",
    "nameAr": "برباشة"
  },
  {
    "id": 168,
    "wilayaId": 6,
    "name": "Leflaye",
    "nameAr": "الفلاي"
  },
  {
    "id": 169,
    "wilayaId": 6,
    "name": "Kendira",
    "nameAr": "كنديرة"
  },
  {
    "id": 170,
    "wilayaId": 6,
    "name": "Sidi-Aich",
    "nameAr": "سيدي عيش"
  },
  {
    "id": 171,
    "wilayaId": 6,
    "name": "Tifra",
    "nameAr": "تيفرة"
  },
  {
    "id": 172,
    "wilayaId": 6,
    "name": "Tinebdar",
    "nameAr": "تينبدار"
  },
  {
    "id": 173,
    "wilayaId": 6,
    "name": "El Kseur",
    "nameAr": "القصر"
  },
  {
    "id": 174,
    "wilayaId": 6,
    "name": "Fenaia Il Maten",
    "nameAr": "فناية الماثن"
  },
  {
    "id": 175,
    "wilayaId": 6,
    "name": "Toudja",
    "nameAr": "توجة"
  },
  {
    "id": 176,
    "wilayaId": 6,
    "name": "Dra El Caid",
    "nameAr": "ذراع القايد"
  },
  {
    "id": 177,
    "wilayaId": 6,
    "name": "Kherrata",
    "nameAr": "خراطة"
  },
  {
    "id": 178,
    "wilayaId": 6,
    "name": "Bejaia",
    "nameAr": "بجاية"
  },
  {
    "id": 179,
    "wilayaId": 6,
    "name": "Oued Ghir",
    "nameAr": "وادي غير"
  },
  {
    "id": 180,
    "wilayaId": 6,
    "name": "Benimaouche",
    "nameAr": "بني معوش"
  },
  {
    "id": 181,
    "wilayaId": 6,
    "name": "Beni Djellil",
    "nameAr": "بني جليل"
  },
  {
    "id": 182,
    "wilayaId": 6,
    "name": "Feraoun",
    "nameAr": "فرعون"
  },
  {
    "id": 183,
    "wilayaId": 6,
    "name": "Smaoun",
    "nameAr": "سمعون"
  },
  {
    "id": 184,
    "wilayaId": 6,
    "name": "Timezrit",
    "nameAr": "تيمزريت"
  },
  {
    "id": 185,
    "wilayaId": 6,
    "name": "Melbou",
    "nameAr": "مالبو"
  },
  {
    "id": 186,
    "wilayaId": 6,
    "name": "Souk El Tenine",
    "nameAr": "سوق لإثنين"
  },
  {
    "id": 187,
    "wilayaId": 6,
    "name": "Tamridjet",
    "nameAr": "تامريجت"
  },
  {
    "id": 188,
    "wilayaId": 6,
    "name": "Boukhelifa",
    "nameAr": "بوخليفة"
  },
  {
    "id": 189,
    "wilayaId": 6,
    "name": "Tala Hamza",
    "nameAr": "تالة حمزة"
  },
  {
    "id": 190,
    "wilayaId": 6,
    "name": "Tichy",
    "nameAr": "تيشي"
  },
  {
    "id": 191,
    "wilayaId": 6,
    "name": "Ait R'zine",
    "nameAr": "أيت رزين"
  },
  {
    "id": 192,
    "wilayaId": 6,
    "name": "Ighil-Ali",
    "nameAr": "إغيل علي"
  },
  {
    "id": 193,
    "wilayaId": 6,
    "name": "Ait-Smail",
    "nameAr": "أيت إسماعيل"
  },
  {
    "id": 194,
    "wilayaId": 6,
    "name": "Darguina",
    "nameAr": "درقينة"
  },
  {
    "id": 195,
    "wilayaId": 6,
    "name": "Taskriout",
    "nameAr": "تاسكريوت"
  },
  {
    "id": 196,
    "wilayaId": 6,
    "name": "Aokas",
    "nameAr": "أوقاس"
  },
  {
    "id": 197,
    "wilayaId": 6,
    "name": "Tizi-N'berber",
    "nameAr": "تيزي نبربر"
  },
  {
    "id": 198,
    "wilayaId": 6,
    "name": "Adekar",
    "nameAr": "أدكار"
  },
  {
    "id": 199,
    "wilayaId": 6,
    "name": "Beni K'sila",
    "nameAr": "بني كسيلة"
  },
  {
    "id": 200,
    "wilayaId": 6,
    "name": "Taourit Ighil",
    "nameAr": "تاوريرت إغيل"
  },
  {
    "id": 201,
    "wilayaId": 6,
    "name": "Akbou",
    "nameAr": "أقبو"
  },
  {
    "id": 202,
    "wilayaId": 6,
    "name": "Chellata",
    "nameAr": "شلاطة"
  },
  {
    "id": 203,
    "wilayaId": 6,
    "name": "Ighram",
    "nameAr": "اغرم"
  },
  {
    "id": 204,
    "wilayaId": 6,
    "name": "Tamokra",
    "nameAr": "تامقرة"
  },
  {
    "id": 205,
    "wilayaId": 6,
    "name": "Amalou",
    "nameAr": "أمالو"
  },
  {
    "id": 206,
    "wilayaId": 6,
    "name": "Bouhamza",
    "nameAr": "بوحمزة"
  },
  {
    "id": 207,
    "wilayaId": 6,
    "name": "M'cisna",
    "nameAr": "مسيسنة"
  },
  {
    "id": 208,
    "wilayaId": 6,
    "name": "Seddouk",
    "nameAr": "صدوق"
  },
  {
    "id": 209,
    "wilayaId": 6,
    "name": "Beni-Mallikeche",
    "nameAr": "بني مليكش"
  },
  {
    "id": 210,
    "wilayaId": 6,
    "name": "Boudjellil",
    "nameAr": "بو جليل"
  },
  {
    "id": 211,
    "wilayaId": 6,
    "name": "Tazmalt",
    "nameAr": "تازمالت"
  },
  {
    "id": 212,
    "wilayaId": 6,
    "name": "Akfadou",
    "nameAr": "أكفادو"
  },
  {
    "id": 213,
    "wilayaId": 6,
    "name": "Chemini",
    "nameAr": "شميني"
  },
  {
    "id": 214,
    "wilayaId": 6,
    "name": "Souk Oufella",
    "nameAr": "سوق اوفلا"
  },
  {
    "id": 215,
    "wilayaId": 6,
    "name": "Tibane",
    "nameAr": "طيبان"
  },
  {
    "id": 216,
    "wilayaId": 6,
    "name": "Ouzellaguen",
    "nameAr": "أوزلاقن"
  },
  {
    "id": 217,
    "wilayaId": 6,
    "name": "Amizour",
    "nameAr": "أميزور"
  },
  {
    "id": 218,
    "wilayaId": 7,
    "name": "El Feidh",
    "nameAr": "الفيض"
  },
  {
    "id": 219,
    "wilayaId": 7,
    "name": "Lichana",
    "nameAr": "ليشانة"
  },
  {
    "id": 220,
    "wilayaId": 7,
    "name": "Bouchakroun",
    "nameAr": "بوشقرون"
  },
  {
    "id": 221,
    "wilayaId": 7,
    "name": "Mekhadma",
    "nameAr": "مخادمة"
  },
  {
    "id": 222,
    "wilayaId": 62,
    "name": "Djemorah",
    "nameAr": "جمورة"
  },
  {
    "id": 223,
    "wilayaId": 62,
    "name": "Branis",
    "nameAr": "برانيس"
  },
  {
    "id": 224,
    "wilayaId": 62,
    "name": "El Outaya",
    "nameAr": "الوطاية"
  },
  {
    "id": 225,
    "wilayaId": 62,
    "name": "El Kantara",
    "nameAr": "القنطرة"
  },
  {
    "id": 226,
    "wilayaId": 7,
    "name": "Khenguet Sidi Nadji",
    "nameAr": "خنقة سيدي ناجي"
  },
  {
    "id": 227,
    "wilayaId": 62,
    "name": "Ain Zaatout",
    "nameAr": "عين زعطوط"
  },
  {
    "id": 228,
    "wilayaId": 7,
    "name": "Zeribet El Oued",
    "nameAr": "زريبة الوادي"
  },
  {
    "id": 229,
    "wilayaId": 7,
    "name": "Meziraa",
    "nameAr": "المزيرعة"
  },
  {
    "id": 230,
    "wilayaId": 7,
    "name": "Biskra",
    "nameAr": "بسكرة"
  },
  {
    "id": 231,
    "wilayaId": 7,
    "name": "El Hadjab",
    "nameAr": "الحاجب"
  },
  {
    "id": 232,
    "wilayaId": 7,
    "name": "M'lili",
    "nameAr": "مليلي"
  },
  {
    "id": 233,
    "wilayaId": 7,
    "name": "Foughala",
    "nameAr": "فوغالة"
  },
  {
    "id": 234,
    "wilayaId": 7,
    "name": "El Ghrous",
    "nameAr": "الغروس"
  },
  {
    "id": 235,
    "wilayaId": 7,
    "name": "Bordj Ben Azzouz",
    "nameAr": "برج بن عزوز"
  },
  {
    "id": 236,
    "wilayaId": 7,
    "name": "Ourlal",
    "nameAr": "أورلال"
  },
  {
    "id": 237,
    "wilayaId": 7,
    "name": "Oumache",
    "nameAr": "أوماش"
  },
  {
    "id": 238,
    "wilayaId": 7,
    "name": "Ain Naga",
    "nameAr": "عين الناقة"
  },
  {
    "id": 239,
    "wilayaId": 7,
    "name": "Chetma",
    "nameAr": "شتمة"
  },
  {
    "id": 240,
    "wilayaId": 7,
    "name": "El Haouch",
    "nameAr": "الحوش"
  },
  {
    "id": 241,
    "wilayaId": 7,
    "name": "Sidi Okba",
    "nameAr": "سيدي عقبة"
  },
  {
    "id": 242,
    "wilayaId": 7,
    "name": "M'chouneche",
    "nameAr": "مشونش"
  },
  {
    "id": 243,
    "wilayaId": 7,
    "name": "Lioua",
    "nameAr": "ليوة"
  },
  {
    "id": 244,
    "wilayaId": 7,
    "name": "Tolga",
    "nameAr": "طولقة"
  },
  {
    "id": 245,
    "wilayaId": 8,
    "name": "Bechar",
    "nameAr": "بشار"
  },
  {
    "id": 246,
    "wilayaId": 8,
    "name": "Boukais",
    "nameAr": "بوكايس"
  },
  {
    "id": 247,
    "wilayaId": 8,
    "name": "Lahmar",
    "nameAr": "لحمر"
  },
  {
    "id": 248,
    "wilayaId": 8,
    "name": "Mogheul",
    "nameAr": "موغل"
  },
  {
    "id": 249,
    "wilayaId": 8,
    "name": "Meridja",
    "nameAr": "المريجة"
  },
  {
    "id": 250,
    "wilayaId": 8,
    "name": "Taghit",
    "nameAr": "تاغيت"
  },
  {
    "id": 251,
    "wilayaId": 8,
    "name": "Abadla",
    "nameAr": "العبادلة"
  },
  {
    "id": 252,
    "wilayaId": 8,
    "name": "Erg-Ferradj",
    "nameAr": "عرق فراج"
  },
  {
    "id": 253,
    "wilayaId": 8,
    "name": "Machraa-Houari-Boumediene",
    "nameAr": "مشرع هواري بومدين"
  },
  {
    "id": 254,
    "wilayaId": 8,
    "name": "Beni-Ounif",
    "nameAr": "بني ونيف"
  },
  {
    "id": 255,
    "wilayaId": 8,
    "name": "Tabelbala",
    "nameAr": "تبلبالة"
  },
  {
    "id": 256,
    "wilayaId": 8,
    "name": "Kenadsa",
    "nameAr": "القنادسة"
  },
  {
    "id": 257,
    "wilayaId": 9,
    "name": "Beni Mered",
    "nameAr": "بني مراد"
  },
  {
    "id": 258,
    "wilayaId": 9,
    "name": "Ouled Slama",
    "nameAr": "اولاد سلامة"
  },
  {
    "id": 259,
    "wilayaId": 9,
    "name": "Mouzaia",
    "nameAr": "موزاية"
  },
  {
    "id": 260,
    "wilayaId": 9,
    "name": "Hammam Elouane",
    "nameAr": "حمام ملوان"
  },
  {
    "id": 261,
    "wilayaId": 9,
    "name": "Bougara",
    "nameAr": "بوقرة"
  },
  {
    "id": 262,
    "wilayaId": 9,
    "name": "Souhane",
    "nameAr": "صوحان"
  },
  {
    "id": 263,
    "wilayaId": 9,
    "name": "Larbaa",
    "nameAr": "الأربعاء"
  },
  {
    "id": 264,
    "wilayaId": 9,
    "name": "Soumaa",
    "nameAr": "الصومعة"
  },
  {
    "id": 265,
    "wilayaId": 9,
    "name": "Guerrouaou",
    "nameAr": "قرواو"
  },
  {
    "id": 266,
    "wilayaId": 9,
    "name": "Boufarik",
    "nameAr": "بوفاريك"
  },
  {
    "id": 267,
    "wilayaId": 9,
    "name": "Meftah",
    "nameAr": "مفتاح"
  },
  {
    "id": 268,
    "wilayaId": 9,
    "name": "Chiffa",
    "nameAr": "الشفة"
  },
  {
    "id": 269,
    "wilayaId": 9,
    "name": "Ain Romana",
    "nameAr": "عين الرمانة"
  },
  {
    "id": 270,
    "wilayaId": 9,
    "name": "Oued Djer",
    "nameAr": "وادي جر"
  },
  {
    "id": 271,
    "wilayaId": 9,
    "name": "El-Affroun",
    "nameAr": "العفرون"
  },
  {
    "id": 272,
    "wilayaId": 9,
    "name": "Ouled Yaich",
    "nameAr": "أولاد يعيش"
  },
  {
    "id": 273,
    "wilayaId": 9,
    "name": "Chrea",
    "nameAr": "الشريعة"
  },
  {
    "id": 274,
    "wilayaId": 9,
    "name": "Djebabra",
    "nameAr": "جبابرة"
  },
  {
    "id": 275,
    "wilayaId": 9,
    "name": "Oued El Alleug",
    "nameAr": "وادي العلايق"
  },
  {
    "id": 276,
    "wilayaId": 9,
    "name": "Benkhelil",
    "nameAr": "بن خليل"
  },
  {
    "id": 277,
    "wilayaId": 9,
    "name": "Beni-Tamou",
    "nameAr": "بني تامو"
  },
  {
    "id": 278,
    "wilayaId": 9,
    "name": "Chebli",
    "nameAr": "الشبلي"
  },
  {
    "id": 279,
    "wilayaId": 9,
    "name": "Bouinan",
    "nameAr": "بوعينان"
  },
  {
    "id": 280,
    "wilayaId": 9,
    "name": "Bouarfa",
    "nameAr": "بوعرفة"
  },
  {
    "id": 281,
    "wilayaId": 9,
    "name": "Blida",
    "nameAr": "البليدة"
  },
  {
    "id": 282,
    "wilayaId": 10,
    "name": "Ain Laloui",
    "nameAr": "عين العلوي"
  },
  {
    "id": 283,
    "wilayaId": 10,
    "name": "Hadjera Zerga",
    "nameAr": "الحجرة الزرقاء"
  },
  {
    "id": 284,
    "wilayaId": 10,
    "name": "Mezdour",
    "nameAr": "مزدور"
  },
  {
    "id": 285,
    "wilayaId": 10,
    "name": "Taguedite",
    "nameAr": "تاقديت"
  },
  {
    "id": 286,
    "wilayaId": 10,
    "name": "Ridane",
    "nameAr": "ريدان"
  },
  {
    "id": 287,
    "wilayaId": 10,
    "name": "Maamora",
    "nameAr": "المعمورة"
  },
  {
    "id": 288,
    "wilayaId": 10,
    "name": "El-Hakimia",
    "nameAr": "الحاكمية"
  },
  {
    "id": 289,
    "wilayaId": 10,
    "name": "Ahl El Ksar",
    "nameAr": "أهل القصر"
  },
  {
    "id": 290,
    "wilayaId": 10,
    "name": "Dirah",
    "nameAr": "ديرة"
  },
  {
    "id": 291,
    "wilayaId": 10,
    "name": "Dechmia",
    "nameAr": "الدشمية"
  },
  {
    "id": 292,
    "wilayaId": 10,
    "name": "Bechloul",
    "nameAr": "بشلول"
  },
  {
    "id": 293,
    "wilayaId": 10,
    "name": "Ath Mansour",
    "nameAr": "آث منصور"
  },
  {
    "id": 294,
    "wilayaId": 10,
    "name": "Saharidj",
    "nameAr": "سحاريج"
  },
  {
    "id": 295,
    "wilayaId": 10,
    "name": "El Adjiba",
    "nameAr": "العجيبة"
  },
  {
    "id": 296,
    "wilayaId": 10,
    "name": "El Asnam",
    "nameAr": "الأسنام"
  },
  {
    "id": 297,
    "wilayaId": 10,
    "name": "M Chedallah",
    "nameAr": "أمشدالة"
  },
  {
    "id": 298,
    "wilayaId": 10,
    "name": "Bordj Okhriss",
    "nameAr": "برج أوخريص"
  },
  {
    "id": 299,
    "wilayaId": 10,
    "name": "Sour El Ghozlane",
    "nameAr": "سور الغزلان"
  },
  {
    "id": 300,
    "wilayaId": 10,
    "name": "Hanif",
    "nameAr": "حنيف"
  },
  {
    "id": 301,
    "wilayaId": 10,
    "name": "Chorfa",
    "nameAr": "شرفة"
  },
  {
    "id": 302,
    "wilayaId": 10,
    "name": "Ouled Rached",
    "nameAr": "أولاد راشد"
  },
  {
    "id": 303,
    "wilayaId": 10,
    "name": "Ain El Hadjar",
    "nameAr": "عين الحجر"
  },
  {
    "id": 304,
    "wilayaId": 10,
    "name": "Aghbalou",
    "nameAr": "أغبالو"
  },
  {
    "id": 305,
    "wilayaId": 10,
    "name": "Raouraoua",
    "nameAr": "روراوة"
  },
  {
    "id": 306,
    "wilayaId": 10,
    "name": "El Khabouzia",
    "nameAr": "الخبوزية"
  },
  {
    "id": 307,
    "wilayaId": 10,
    "name": "Bir Ghbalou",
    "nameAr": "بئر غبالو"
  },
  {
    "id": 308,
    "wilayaId": 10,
    "name": "Bouira",
    "nameAr": "البويرة"
  },
  {
    "id": 309,
    "wilayaId": 10,
    "name": "Ain Turk",
    "nameAr": "عين الترك"
  },
  {
    "id": 310,
    "wilayaId": 10,
    "name": "Ait Laaziz",
    "nameAr": "أيت لعزيز"
  },
  {
    "id": 311,
    "wilayaId": 10,
    "name": "Ain-Bessem",
    "nameAr": "عين بسام"
  },
  {
    "id": 312,
    "wilayaId": 10,
    "name": "El-Mokrani",
    "nameAr": "المقراني"
  },
  {
    "id": 313,
    "wilayaId": 10,
    "name": "Souk El Khemis",
    "nameAr": "سوق الخميس"
  },
  {
    "id": 314,
    "wilayaId": 10,
    "name": "Aomar",
    "nameAr": "أعمر"
  },
  {
    "id": 315,
    "wilayaId": 10,
    "name": "Djebahia",
    "nameAr": "جباحية"
  },
  {
    "id": 316,
    "wilayaId": 10,
    "name": "El Hachimia",
    "nameAr": "الهاشمية"
  },
  {
    "id": 317,
    "wilayaId": 10,
    "name": "Haizer",
    "nameAr": "حيزر"
  },
  {
    "id": 318,
    "wilayaId": 10,
    "name": "Taghzout",
    "nameAr": "تاغزوت"
  },
  {
    "id": 319,
    "wilayaId": 10,
    "name": "Bouderbala",
    "nameAr": "بودربالة"
  },
  {
    "id": 320,
    "wilayaId": 10,
    "name": "Boukram",
    "nameAr": "بوكرم"
  },
  {
    "id": 321,
    "wilayaId": 10,
    "name": "Guerrouma",
    "nameAr": "قرومة"
  },
  {
    "id": 322,
    "wilayaId": 10,
    "name": "Lakhdaria",
    "nameAr": "الأخضرية"
  },
  {
    "id": 323,
    "wilayaId": 10,
    "name": "Maala",
    "nameAr": "معلة"
  },
  {
    "id": 324,
    "wilayaId": 10,
    "name": "Kadiria",
    "nameAr": "قادرية"
  },
  {
    "id": 325,
    "wilayaId": 10,
    "name": "Z'barbar (El Isseri )",
    "nameAr": "زبربر"
  },
  {
    "id": 326,
    "wilayaId": 10,
    "name": "Oued El Berdi",
    "nameAr": "وادي البردي"
  },
  {
    "id": 327,
    "wilayaId": 11,
    "name": "Tazrouk",
    "nameAr": "تاظروك"
  },
  {
    "id": 328,
    "wilayaId": 11,
    "name": "Abelsa",
    "nameAr": "ابلسة"
  },
  {
    "id": 329,
    "wilayaId": 11,
    "name": "Tamanrasset",
    "nameAr": "تمنراست"
  },
  {
    "id": 330,
    "wilayaId": 11,
    "name": "Ain Amguel",
    "nameAr": "عين امقل"
  },
  {
    "id": 331,
    "wilayaId": 11,
    "name": "Idles",
    "nameAr": "أدلس"
  },
  {
    "id": 332,
    "wilayaId": 12,
    "name": "El-Houidjbet",
    "nameAr": "الحويجبات"
  },
  {
    "id": 333,
    "wilayaId": 12,
    "name": "El-Aouinet",
    "nameAr": "العوينات"
  },
  {
    "id": 334,
    "wilayaId": 65,
    "name": "Ferkane",
    "nameAr": "فركان"
  },
  {
    "id": 335,
    "wilayaId": 65,
    "name": "Negrine",
    "nameAr": "نقرين"
  },
  {
    "id": 336,
    "wilayaId": 12,
    "name": "Bir Mokkadem",
    "nameAr": "بئر مقدم"
  },
  {
    "id": 337,
    "wilayaId": 12,
    "name": "Bir Dheheb",
    "nameAr": "بئر الذهب"
  },
  {
    "id": 338,
    "wilayaId": 12,
    "name": "Saf Saf El Ouesra",
    "nameAr": "صفصاف الوسرى"
  },
  {
    "id": 339,
    "wilayaId": 12,
    "name": "Guorriguer",
    "nameAr": "قريقر"
  },
  {
    "id": 340,
    "wilayaId": 12,
    "name": "Bekkaria",
    "nameAr": "بكارية"
  },
  {
    "id": 341,
    "wilayaId": 12,
    "name": "Boulhaf Dyr",
    "nameAr": "بولحاف الدير"
  },
  {
    "id": 342,
    "wilayaId": 12,
    "name": "Oum Ali",
    "nameAr": "أم علي"
  },
  {
    "id": 343,
    "wilayaId": 12,
    "name": "Boukhadra",
    "nameAr": "بوخضرة"
  },
  {
    "id": 344,
    "wilayaId": 12,
    "name": "El Malabiod",
    "nameAr": "الماء الابيض"
  },
  {
    "id": 345,
    "wilayaId": 12,
    "name": "Ouenza",
    "nameAr": "الونزة"
  },
  {
    "id": 346,
    "wilayaId": 12,
    "name": "El Meridj",
    "nameAr": "المريج"
  },
  {
    "id": 347,
    "wilayaId": 12,
    "name": "Ain Zerga",
    "nameAr": "عين الزرقاء"
  },
  {
    "id": 348,
    "wilayaId": 12,
    "name": "Stah Guentis",
    "nameAr": "سطح قنطيس"
  },
  {
    "id": 349,
    "wilayaId": 12,
    "name": "El Ogla",
    "nameAr": "العقلة"
  },
  {
    "id": 350,
    "wilayaId": 12,
    "name": "El Mezeraa",
    "nameAr": "المزرعة"
  },
  {
    "id": 351,
    "wilayaId": 12,
    "name": "Bedjene",
    "nameAr": "بجن"
  },
  {
    "id": 352,
    "wilayaId": 12,
    "name": "Morsott",
    "nameAr": "مرسط"
  },
  {
    "id": 353,
    "wilayaId": 12,
    "name": "Telidjen",
    "nameAr": "ثليجان"
  },
  {
    "id": 354,
    "wilayaId": 12,
    "name": "Cheria",
    "nameAr": "الشريعة"
  },
  {
    "id": 355,
    "wilayaId": 65,
    "name": "El Ogla El Malha",
    "nameAr": "العقلة المالحة"
  },
  {
    "id": 356,
    "wilayaId": 65,
    "name": "Bir-El-Ater",
    "nameAr": "بئر العاتر"
  },
  {
    "id": 357,
    "wilayaId": 12,
    "name": "Tebessa",
    "nameAr": "تبسة"
  },
  {
    "id": 358,
    "wilayaId": 12,
    "name": "Hammamet",
    "nameAr": "الحمامات"
  },
  {
    "id": 359,
    "wilayaId": 12,
    "name": "El Kouif",
    "nameAr": "الكويف"
  },
  {
    "id": 360,
    "wilayaId": 13,
    "name": "Bab El Assa",
    "nameAr": "باب العسة"
  },
  {
    "id": 361,
    "wilayaId": 13,
    "name": "Terny Beni Hediel",
    "nameAr": "تيرني بني هديل"
  },
  {
    "id": 362,
    "wilayaId": 13,
    "name": "Mansourah",
    "nameAr": "منصورة"
  },
  {
    "id": 363,
    "wilayaId": 13,
    "name": "Beni Mester",
    "nameAr": "بني مستر"
  },
  {
    "id": 364,
    "wilayaId": 13,
    "name": "Ain Ghoraba",
    "nameAr": "عين غرابة"
  },
  {
    "id": 365,
    "wilayaId": 13,
    "name": "Chetouane",
    "nameAr": "شتوان"
  },
  {
    "id": 366,
    "wilayaId": 13,
    "name": "Amieur",
    "nameAr": "عمير"
  },
  {
    "id": 367,
    "wilayaId": 13,
    "name": "Ain Fezza",
    "nameAr": "عين فزة"
  },
  {
    "id": 368,
    "wilayaId": 13,
    "name": "Honnaine",
    "nameAr": "هنين"
  },
  {
    "id": 369,
    "wilayaId": 13,
    "name": "Beni Khellad",
    "nameAr": "بني خلاد"
  },
  {
    "id": 370,
    "wilayaId": 61,
    "name": "Sidi Djillali",
    "nameAr": "سيدي الجيلالي"
  },
  {
    "id": 371,
    "wilayaId": 61,
    "name": "Bouihi",
    "nameAr": "البويهي"
  },
  {
    "id": 372,
    "wilayaId": 13,
    "name": "Nedroma",
    "nameAr": "ندرومة"
  },
  {
    "id": 373,
    "wilayaId": 13,
    "name": "M'sirda Fouaga",
    "nameAr": "مسيردة الفواقة"
  },
  {
    "id": 374,
    "wilayaId": 13,
    "name": "Marsa Ben M'hidi",
    "nameAr": "مرسى بن مهيدي"
  },
  {
    "id": 375,
    "wilayaId": 13,
    "name": "Sidi Medjahed",
    "nameAr": "سيدي مجاهد"
  },
  {
    "id": 376,
    "wilayaId": 13,
    "name": "Beni Boussaid",
    "nameAr": "بني بوسعيد"
  },
  {
    "id": 377,
    "wilayaId": 13,
    "name": "Sebdou",
    "nameAr": "سبدو"
  },
  {
    "id": 378,
    "wilayaId": 61,
    "name": "El Gor",
    "nameAr": "القور"
  },
  {
    "id": 379,
    "wilayaId": 61,
    "name": "El Aricha",
    "nameAr": "العريشة"
  },
  {
    "id": 380,
    "wilayaId": 13,
    "name": "Bouhlou",
    "nameAr": "بوحلو"
  },
  {
    "id": 381,
    "wilayaId": 13,
    "name": "Maghnia",
    "nameAr": "مغنية"
  },
  {
    "id": 382,
    "wilayaId": 13,
    "name": "Hammam Boughrara",
    "nameAr": "حمام بوغرارة"
  },
  {
    "id": 383,
    "wilayaId": 13,
    "name": "Zenata",
    "nameAr": "زناتة"
  },
  {
    "id": 384,
    "wilayaId": 13,
    "name": "Ouled Riyah",
    "nameAr": "أولاد رياح"
  },
  {
    "id": 385,
    "wilayaId": 13,
    "name": "Hennaya",
    "nameAr": "الحناية"
  },
  {
    "id": 386,
    "wilayaId": 13,
    "name": "Sidi Abdelli",
    "nameAr": "سيدي العبدلي"
  },
  {
    "id": 387,
    "wilayaId": 13,
    "name": "Souk Tleta",
    "nameAr": "سوق الثلاثاء"
  },
  {
    "id": 388,
    "wilayaId": 13,
    "name": "Bensekrane",
    "nameAr": "بن سكران"
  },
  {
    "id": 389,
    "wilayaId": 13,
    "name": "Fellaoucene",
    "nameAr": "فلاوسن"
  },
  {
    "id": 390,
    "wilayaId": 13,
    "name": "Ain Kebira",
    "nameAr": "عين الكبيرة"
  },
  {
    "id": 391,
    "wilayaId": 13,
    "name": "Ain Fetah",
    "nameAr": "عين فتاح"
  },
  {
    "id": 392,
    "wilayaId": 13,
    "name": "Tlemcen",
    "nameAr": "تلمسان"
  },
  {
    "id": 393,
    "wilayaId": 13,
    "name": "Ain Nehala",
    "nameAr": "عين النحالة"
  },
  {
    "id": 394,
    "wilayaId": 13,
    "name": "Ain Tellout",
    "nameAr": "عين تالوت"
  },
  {
    "id": 395,
    "wilayaId": 13,
    "name": "Ain Youcef",
    "nameAr": "عين يوسف"
  },
  {
    "id": 396,
    "wilayaId": 13,
    "name": "Beni Ouarsous",
    "nameAr": "بني وارسوس"
  },
  {
    "id": 397,
    "wilayaId": 13,
    "name": "El Fehoul",
    "nameAr": "الفحول"
  },
  {
    "id": 398,
    "wilayaId": 13,
    "name": "Remchi",
    "nameAr": "الرمشي"
  },
  {
    "id": 399,
    "wilayaId": 13,
    "name": "Sebbaa Chioukh",
    "nameAr": "سبعة شيوخ"
  },
  {
    "id": 400,
    "wilayaId": 13,
    "name": "Souani",
    "nameAr": "السواني"
  },
  {
    "id": 401,
    "wilayaId": 13,
    "name": "Sabra",
    "nameAr": "صبرة"
  },
  {
    "id": 402,
    "wilayaId": 13,
    "name": "Dar Yaghmoracen",
    "nameAr": "دار يغمراسن"
  },
  {
    "id": 403,
    "wilayaId": 13,
    "name": "Ghazaouet",
    "nameAr": "الغزوات"
  },
  {
    "id": 404,
    "wilayaId": 13,
    "name": "Souahlia",
    "nameAr": "السواحلية"
  },
  {
    "id": 405,
    "wilayaId": 13,
    "name": "Tianet",
    "nameAr": "تيانت"
  },
  {
    "id": 406,
    "wilayaId": 13,
    "name": "Beni Smiel",
    "nameAr": "بني صميل"
  },
  {
    "id": 407,
    "wilayaId": 13,
    "name": "Oued Lakhdar",
    "nameAr": "وادي الخضر"
  },
  {
    "id": 408,
    "wilayaId": 13,
    "name": "Ouled Mimoun",
    "nameAr": "أولاد ميمون"
  },
  {
    "id": 409,
    "wilayaId": 13,
    "name": "Beni Bahdel",
    "nameAr": "بني بهدل"
  },
  {
    "id": 410,
    "wilayaId": 13,
    "name": "Beni Snous",
    "nameAr": "بني سنوس"
  },
  {
    "id": 411,
    "wilayaId": 13,
    "name": "Azail",
    "nameAr": "العزايل"
  },
  {
    "id": 412,
    "wilayaId": 13,
    "name": "Djebala",
    "nameAr": "جبالة"
  },
  {
    "id": 413,
    "wilayaId": 14,
    "name": "Mahdia",
    "nameAr": "مهدية"
  },
  {
    "id": 414,
    "wilayaId": 14,
    "name": "Ain Dzarit",
    "nameAr": "عين دزاريت"
  },
  {
    "id": 415,
    "wilayaId": 14,
    "name": "Sebaine",
    "nameAr": "السبعين"
  },
  {
    "id": 416,
    "wilayaId": 14,
    "name": "Faidja",
    "nameAr": "الفايجة"
  },
  {
    "id": 417,
    "wilayaId": 14,
    "name": "Si Abdelghani",
    "nameAr": "سي عبد الغني"
  },
  {
    "id": 418,
    "wilayaId": 14,
    "name": "Sougueur",
    "nameAr": "السوقر"
  },
  {
    "id": 419,
    "wilayaId": 14,
    "name": "Tousnina",
    "nameAr": "توسنينة"
  },
  {
    "id": 420,
    "wilayaId": 14,
    "name": "Meghila",
    "nameAr": "مغيلة"
  },
  {
    "id": 421,
    "wilayaId": 14,
    "name": "Sebt",
    "nameAr": "السبت"
  },
  {
    "id": 422,
    "wilayaId": 14,
    "name": "Sidi Hosni",
    "nameAr": "سيدي حسني"
  },
  {
    "id": 423,
    "wilayaId": 14,
    "name": "Ain El Hadid",
    "nameAr": "عين الحديد"
  },
  {
    "id": 424,
    "wilayaId": 14,
    "name": "Frenda",
    "nameAr": "فرندة"
  },
  {
    "id": 425,
    "wilayaId": 14,
    "name": "Takhemaret",
    "nameAr": "تخمرت"
  },
  {
    "id": 426,
    "wilayaId": 14,
    "name": "Ain Kermes",
    "nameAr": "عين كرمس"
  },
  {
    "id": 427,
    "wilayaId": 14,
    "name": "Djebilet Rosfa",
    "nameAr": "جبيلات الرصفاء"
  },
  {
    "id": 428,
    "wilayaId": 14,
    "name": "Madna",
    "nameAr": "مادنة"
  },
  {
    "id": 429,
    "wilayaId": 14,
    "name": "Medrissa",
    "nameAr": "مدريسة"
  },
  {
    "id": 430,
    "wilayaId": 14,
    "name": "Sidi Abderrahmane",
    "nameAr": "سيدي عبد الرحمن"
  },
  {
    "id": 431,
    "wilayaId": 67,
    "name": "Ksar Chellala",
    "nameAr": "قصر الشلالة"
  },
  {
    "id": 432,
    "wilayaId": 14,
    "name": "Guertoufa",
    "nameAr": "قرطوفة"
  },
  {
    "id": 433,
    "wilayaId": 67,
    "name": "Serghine",
    "nameAr": "سرغين"
  },
  {
    "id": 434,
    "wilayaId": 67,
    "name": "Zmalet El Emir Abdelkade",
    "nameAr": "زمالة الأمير عبد القادر"
  },
  {
    "id": 435,
    "wilayaId": 14,
    "name": "Oued Lilli",
    "nameAr": "وادي ليلي"
  },
  {
    "id": 436,
    "wilayaId": 14,
    "name": "Sidi Ali Mellal",
    "nameAr": "سيدي علي ملال"
  },
  {
    "id": 437,
    "wilayaId": 14,
    "name": "Djillali Ben Amar",
    "nameAr": "جيلالي بن عمار"
  },
  {
    "id": 438,
    "wilayaId": 14,
    "name": "Mechraa Safa",
    "nameAr": "مشرع الصفا"
  },
  {
    "id": 439,
    "wilayaId": 14,
    "name": "Tagdempt",
    "nameAr": "تاقدمت"
  },
  {
    "id": 440,
    "wilayaId": 67,
    "name": "Bougara",
    "nameAr": "بوقرة"
  },
  {
    "id": 441,
    "wilayaId": 67,
    "name": "Hamadia",
    "nameAr": "حمادية"
  },
  {
    "id": 442,
    "wilayaId": 67,
    "name": "Rechaiga",
    "nameAr": "الرشايقة"
  },
  {
    "id": 443,
    "wilayaId": 14,
    "name": "Tidda",
    "nameAr": "تيدة"
  },
  {
    "id": 444,
    "wilayaId": 14,
    "name": "Nadorah",
    "nameAr": "الناظورة"
  },
  {
    "id": 445,
    "wilayaId": 14,
    "name": "Tiaret",
    "nameAr": "تيارت"
  },
  {
    "id": 446,
    "wilayaId": 14,
    "name": "Medroussa",
    "nameAr": "مدروسة"
  },
  {
    "id": 447,
    "wilayaId": 14,
    "name": "Mellakou",
    "nameAr": "ملاكو"
  },
  {
    "id": 448,
    "wilayaId": 14,
    "name": "Sidi Bakhti",
    "nameAr": "سيدي بختي"
  },
  {
    "id": 449,
    "wilayaId": 14,
    "name": "Ain Deheb",
    "nameAr": "عين الذهب"
  },
  {
    "id": 450,
    "wilayaId": 14,
    "name": "Chehaima",
    "nameAr": "شحيمة"
  },
  {
    "id": 451,
    "wilayaId": 14,
    "name": "Naima",
    "nameAr": "النعيمة"
  },
  {
    "id": 452,
    "wilayaId": 14,
    "name": "Ain Bouchekif",
    "nameAr": "عين بوشقيف"
  },
  {
    "id": 453,
    "wilayaId": 14,
    "name": "Dahmouni",
    "nameAr": "دحموني"
  },
  {
    "id": 454,
    "wilayaId": 14,
    "name": "Rahouia",
    "nameAr": "الرحوية"
  },
  {
    "id": 455,
    "wilayaId": 15,
    "name": "Mizrana",
    "nameAr": "ميزرانـــة"
  },
  {
    "id": 456,
    "wilayaId": 15,
    "name": "Idjeur",
    "nameAr": "إيجــار"
  },
  {
    "id": 457,
    "wilayaId": 15,
    "name": "Beni-Douala",
    "nameAr": "بني دوالة"
  },
  {
    "id": 458,
    "wilayaId": 15,
    "name": "Beni-Zikki",
    "nameAr": "بني زيكــي"
  },
  {
    "id": 459,
    "wilayaId": 15,
    "name": "Illoula Oumalou",
    "nameAr": "إيلولة أومـــالو"
  },
  {
    "id": 460,
    "wilayaId": 15,
    "name": "Agouni-Gueghrane",
    "nameAr": "أقني قغران"
  },
  {
    "id": 461,
    "wilayaId": 15,
    "name": "Ait Bouaddou",
    "nameAr": "أيت بــوادو"
  },
  {
    "id": 462,
    "wilayaId": 15,
    "name": "Ouadhias",
    "nameAr": "واضية"
  },
  {
    "id": 463,
    "wilayaId": 15,
    "name": "Tizi N'tleta",
    "nameAr": "تيزي نثلاثة"
  },
  {
    "id": 464,
    "wilayaId": 15,
    "name": "Aghribs",
    "nameAr": "أغريب"
  },
  {
    "id": 465,
    "wilayaId": 15,
    "name": "Ait-Chafaa",
    "nameAr": "أيت شافع"
  },
  {
    "id": 466,
    "wilayaId": 15,
    "name": "Akerrou",
    "nameAr": "أقرو"
  },
  {
    "id": 467,
    "wilayaId": 15,
    "name": "Azeffoun",
    "nameAr": "أزفون"
  },
  {
    "id": 468,
    "wilayaId": 15,
    "name": "Iflissen",
    "nameAr": "إفليـــسن"
  },
  {
    "id": 469,
    "wilayaId": 15,
    "name": "Tigzirt",
    "nameAr": "تيقـزيرت"
  },
  {
    "id": 470,
    "wilayaId": 15,
    "name": "Assi-Youcef",
    "nameAr": "أسي يوسف"
  },
  {
    "id": 471,
    "wilayaId": 15,
    "name": "Boghni",
    "nameAr": "بوغني"
  },
  {
    "id": 472,
    "wilayaId": 15,
    "name": "Bounouh",
    "nameAr": "بونوح"
  },
  {
    "id": 473,
    "wilayaId": 15,
    "name": "Mechtras",
    "nameAr": "مشطراس"
  },
  {
    "id": 474,
    "wilayaId": 15,
    "name": "Draa-Ben-Khedda",
    "nameAr": "ذراع بن خدة"
  },
  {
    "id": 475,
    "wilayaId": 15,
    "name": "Sidi Namane",
    "nameAr": "سيدي نعمان"
  },
  {
    "id": 476,
    "wilayaId": 15,
    "name": "Tadmait",
    "nameAr": "تادمايت"
  },
  {
    "id": 477,
    "wilayaId": 15,
    "name": "Tirmitine",
    "nameAr": "تيرمتين"
  },
  {
    "id": 478,
    "wilayaId": 15,
    "name": "Ait Boumahdi",
    "nameAr": "أيت بومهدي"
  },
  {
    "id": 479,
    "wilayaId": 15,
    "name": "Ait-Toudert",
    "nameAr": "أيت تودرت"
  },
  {
    "id": 480,
    "wilayaId": 15,
    "name": "Beni-Aissi",
    "nameAr": "بني عيسي"
  },
  {
    "id": 481,
    "wilayaId": 15,
    "name": "Ouacif",
    "nameAr": "واسيف"
  },
  {
    "id": 482,
    "wilayaId": 15,
    "name": "Ait Khellili",
    "nameAr": "أيت خليلي"
  },
  {
    "id": 483,
    "wilayaId": 15,
    "name": "Mekla",
    "nameAr": "مقــلع"
  },
  {
    "id": 484,
    "wilayaId": 15,
    "name": "Souama",
    "nameAr": "صوامـــع"
  },
  {
    "id": 485,
    "wilayaId": 15,
    "name": "Beni-Yenni",
    "nameAr": "بني يني"
  },
  {
    "id": 486,
    "wilayaId": 15,
    "name": "Iboudrarene",
    "nameAr": "إبودرارن"
  },
  {
    "id": 487,
    "wilayaId": 15,
    "name": "Tizi-Ouzou",
    "nameAr": "تيزي وزو"
  },
  {
    "id": 488,
    "wilayaId": 15,
    "name": "Abi-Youcef",
    "nameAr": "أبي يوسف"
  },
  {
    "id": 489,
    "wilayaId": 15,
    "name": "Ain-El-Hammam",
    "nameAr": "عين الحمام"
  },
  {
    "id": 490,
    "wilayaId": 15,
    "name": "Ait-Yahia",
    "nameAr": "أيت يحيى"
  },
  {
    "id": 491,
    "wilayaId": 15,
    "name": "Akbil",
    "nameAr": "اقبيل"
  },
  {
    "id": 492,
    "wilayaId": 15,
    "name": "Boudjima",
    "nameAr": "بوجيمة"
  },
  {
    "id": 493,
    "wilayaId": 15,
    "name": "Makouda",
    "nameAr": "ماكودة"
  },
  {
    "id": 494,
    "wilayaId": 15,
    "name": "Ain-Zaouia",
    "nameAr": "عين الزاوية"
  },
  {
    "id": 495,
    "wilayaId": 15,
    "name": "Ait Yahia Moussa",
    "nameAr": "أيت يحي موسى"
  },
  {
    "id": 496,
    "wilayaId": 15,
    "name": "Draa-El-Mizan",
    "nameAr": "ذراع الميزان"
  },
  {
    "id": 497,
    "wilayaId": 15,
    "name": "Frikat",
    "nameAr": "فريقات"
  },
  {
    "id": 498,
    "wilayaId": 15,
    "name": "M'kira",
    "nameAr": "مكيرة"
  },
  {
    "id": 499,
    "wilayaId": 15,
    "name": "Tizi-Gheniff",
    "nameAr": "تيزي غنيف"
  },
  {
    "id": 500,
    "wilayaId": 15,
    "name": "Yatafene",
    "nameAr": "يطــافن"
  },
  {
    "id": 501,
    "wilayaId": 15,
    "name": "Illilten",
    "nameAr": "إيلـيــلتـن"
  },
  {
    "id": 502,
    "wilayaId": 15,
    "name": "Imsouhal",
    "nameAr": "إمســوحال"
  },
  {
    "id": 503,
    "wilayaId": 15,
    "name": "Azazga",
    "nameAr": "عزازقة"
  },
  {
    "id": 504,
    "wilayaId": 15,
    "name": "Freha",
    "nameAr": "فريحة"
  },
  {
    "id": 505,
    "wilayaId": 15,
    "name": "Ifigha",
    "nameAr": "إيفيغاء"
  },
  {
    "id": 506,
    "wilayaId": 15,
    "name": "Yakourene",
    "nameAr": "إعــكورن"
  },
  {
    "id": 507,
    "wilayaId": 15,
    "name": "Zekri",
    "nameAr": "زكري"
  },
  {
    "id": 508,
    "wilayaId": 15,
    "name": "Ait Aggouacha",
    "nameAr": "أيت عقـواشة"
  },
  {
    "id": 509,
    "wilayaId": 15,
    "name": "Irdjen",
    "nameAr": "إيرجـــن"
  },
  {
    "id": 510,
    "wilayaId": 15,
    "name": "Larbaa Nath Irathen",
    "nameAr": "الأربعــاء ناث إيراثن"
  },
  {
    "id": 511,
    "wilayaId": 15,
    "name": "Ait-Oumalou",
    "nameAr": "أيت أومالو"
  },
  {
    "id": 512,
    "wilayaId": 15,
    "name": "Tizi-Rached",
    "nameAr": "تيزي راشد"
  },
  {
    "id": 513,
    "wilayaId": 15,
    "name": "Ait-Aissa-Mimoun",
    "nameAr": "أيت عيسى ميمون"
  },
  {
    "id": 514,
    "wilayaId": 15,
    "name": "Ouaguenoun",
    "nameAr": "واقنون"
  },
  {
    "id": 515,
    "wilayaId": 15,
    "name": "Timizart",
    "nameAr": "تيمـيزار"
  },
  {
    "id": 516,
    "wilayaId": 15,
    "name": "Maatkas",
    "nameAr": "معـــاتقة"
  },
  {
    "id": 517,
    "wilayaId": 15,
    "name": "Souk-El-Tenine",
    "nameAr": "سوق الإثنين"
  },
  {
    "id": 518,
    "wilayaId": 15,
    "name": "Ait-Mahmoud",
    "nameAr": "أيت محمود"
  },
  {
    "id": 519,
    "wilayaId": 15,
    "name": "Beni Zmenzer",
    "nameAr": "بنــــي زمنزار"
  },
  {
    "id": 520,
    "wilayaId": 15,
    "name": "Iferhounene",
    "nameAr": "إفــرحــونان"
  },
  {
    "id": 521,
    "wilayaId": 15,
    "name": "Bouzeguene",
    "nameAr": "بوزقــن"
  },
  {
    "id": 522,
    "wilayaId": 16,
    "name": "Hussein Dey",
    "nameAr": "حسين داي"
  },
  {
    "id": 523,
    "wilayaId": 16,
    "name": "Les Eucalyptus",
    "nameAr": "الكاليتوس"
  },
  {
    "id": 524,
    "wilayaId": 16,
    "name": "Sidi Moussa",
    "nameAr": "سيدي موسى"
  },
  {
    "id": 525,
    "wilayaId": 16,
    "name": "Kouba",
    "nameAr": "القبة"
  },
  {
    "id": 526,
    "wilayaId": 16,
    "name": "Mohamed Belouzdad",
    "nameAr": "محمد بلوزداد"
  },
  {
    "id": 527,
    "wilayaId": 16,
    "name": "Ain Taya",
    "nameAr": "عين طاية"
  },
  {
    "id": 528,
    "wilayaId": 16,
    "name": "Bab Ezzouar",
    "nameAr": "باب الزوار"
  },
  {
    "id": 529,
    "wilayaId": 16,
    "name": "Bordj El Kiffan",
    "nameAr": "برج الكيفان"
  },
  {
    "id": 530,
    "wilayaId": 16,
    "name": "Dar El Beida",
    "nameAr": "الدار البيضاء"
  },
  {
    "id": 531,
    "wilayaId": 16,
    "name": "El Marsa",
    "nameAr": "المرسى"
  },
  {
    "id": 532,
    "wilayaId": 16,
    "name": "Mohammadia",
    "nameAr": "المحمدية"
  },
  {
    "id": 533,
    "wilayaId": 16,
    "name": "Bir Touta",
    "nameAr": "بئر توتة"
  },
  {
    "id": 534,
    "wilayaId": 16,
    "name": "Ouled Chebel",
    "nameAr": "اولاد شبل"
  },
  {
    "id": 535,
    "wilayaId": 16,
    "name": "Tessala El Merdja",
    "nameAr": "تسالة المرجة"
  },
  {
    "id": 536,
    "wilayaId": 16,
    "name": "Herraoua",
    "nameAr": "هراوة"
  },
  {
    "id": 537,
    "wilayaId": 16,
    "name": "Reghaia",
    "nameAr": "رغاية"
  },
  {
    "id": 538,
    "wilayaId": 16,
    "name": "Rouiba",
    "nameAr": "الرويبة"
  },
  {
    "id": 539,
    "wilayaId": 16,
    "name": "Maalma",
    "nameAr": "المعالمة"
  },
  {
    "id": 540,
    "wilayaId": 16,
    "name": "Rahmania",
    "nameAr": "الرحمانية"
  },
  {
    "id": 541,
    "wilayaId": 16,
    "name": "Souidania",
    "nameAr": "سويدانية"
  },
  {
    "id": 542,
    "wilayaId": 16,
    "name": "Staoueli",
    "nameAr": "سطاوالي"
  },
  {
    "id": 543,
    "wilayaId": 16,
    "name": "Zeralda",
    "nameAr": "زرالدة"
  },
  {
    "id": 544,
    "wilayaId": 16,
    "name": "Baba Hassen",
    "nameAr": "بابا حسن"
  },
  {
    "id": 545,
    "wilayaId": 16,
    "name": "Douira",
    "nameAr": "الدويرة"
  },
  {
    "id": 546,
    "wilayaId": 16,
    "name": "Draria",
    "nameAr": "الدرارية"
  },
  {
    "id": 547,
    "wilayaId": 16,
    "name": "El Achour",
    "nameAr": "العاشور"
  },
  {
    "id": 548,
    "wilayaId": 16,
    "name": "Khraissia",
    "nameAr": "الخرايسية"
  },
  {
    "id": 549,
    "wilayaId": 16,
    "name": "Ain Benian",
    "nameAr": "عين بنيان"
  },
  {
    "id": 550,
    "wilayaId": 16,
    "name": "Cheraga",
    "nameAr": "الشراقة"
  },
  {
    "id": 551,
    "wilayaId": 16,
    "name": "Dely Ibrahim",
    "nameAr": "دالي ابراهيم"
  },
  {
    "id": 552,
    "wilayaId": 16,
    "name": "Hammamet",
    "nameAr": "الحمامات"
  },
  {
    "id": 553,
    "wilayaId": 16,
    "name": "Ouled Fayet",
    "nameAr": "اولاد فايت"
  },
  {
    "id": 554,
    "wilayaId": 16,
    "name": "Alger Centre",
    "nameAr": "الجزائر الوسطى"
  },
  {
    "id": 555,
    "wilayaId": 16,
    "name": "El Madania",
    "nameAr": "المدنية"
  },
  {
    "id": 556,
    "wilayaId": 16,
    "name": "El Mouradia",
    "nameAr": "المرادية"
  },
  {
    "id": 557,
    "wilayaId": 16,
    "name": "Sidi M'hamed",
    "nameAr": "سيدي امحمد"
  },
  {
    "id": 558,
    "wilayaId": 16,
    "name": "Sehaoula",
    "nameAr": "السحاولة"
  },
  {
    "id": 559,
    "wilayaId": 16,
    "name": "Bologhine Ibnou Ziri",
    "nameAr": "بولوغين بن زيري"
  },
  {
    "id": 560,
    "wilayaId": 16,
    "name": "Casbah",
    "nameAr": "القصبة"
  },
  {
    "id": 561,
    "wilayaId": 16,
    "name": "Oued Koriche",
    "nameAr": "وادي قريش"
  },
  {
    "id": 562,
    "wilayaId": 16,
    "name": "Rais Hamidou",
    "nameAr": "الرايس حميدو"
  },
  {
    "id": 563,
    "wilayaId": 16,
    "name": "Bir Mourad Rais",
    "nameAr": "بئر مراد رايس"
  },
  {
    "id": 564,
    "wilayaId": 16,
    "name": "Birkhadem",
    "nameAr": "بئر خادم"
  },
  {
    "id": 565,
    "wilayaId": 16,
    "name": "Djasr Kasentina",
    "nameAr": "جسر قسنطينة"
  },
  {
    "id": 566,
    "wilayaId": 16,
    "name": "Hydra",
    "nameAr": "حيدرة"
  },
  {
    "id": 567,
    "wilayaId": 16,
    "name": "El Magharia",
    "nameAr": "المغارية"
  },
  {
    "id": 568,
    "wilayaId": 16,
    "name": "Ben Aknoun",
    "nameAr": "ابن عكنون"
  },
  {
    "id": 569,
    "wilayaId": 16,
    "name": "Beni Messous",
    "nameAr": "بني مسوس"
  },
  {
    "id": 570,
    "wilayaId": 16,
    "name": "Bouzareah",
    "nameAr": "بوزريعة"
  },
  {
    "id": 571,
    "wilayaId": 16,
    "name": "El Biar",
    "nameAr": "الابيار"
  },
  {
    "id": 572,
    "wilayaId": 16,
    "name": "Bachedjerah",
    "nameAr": "باش جراح"
  },
  {
    "id": 573,
    "wilayaId": 16,
    "name": "Bourouba",
    "nameAr": "بوروبة"
  },
  {
    "id": 574,
    "wilayaId": 16,
    "name": "El Harrach",
    "nameAr": "الحراش"
  },
  {
    "id": 575,
    "wilayaId": 16,
    "name": "Oued Smar",
    "nameAr": "وادي السمار"
  },
  {
    "id": 576,
    "wilayaId": 16,
    "name": "Baraki",
    "nameAr": "براقي"
  },
  {
    "id": 577,
    "wilayaId": 16,
    "name": "Bordj El Bahri",
    "nameAr": "برج البحري"
  },
  {
    "id": 578,
    "wilayaId": 16,
    "name": "Bab El Oued",
    "nameAr": "باب الوادي"
  },
  {
    "id": 579,
    "wilayaId": 17,
    "name": "Hassi El Euch",
    "nameAr": "حاسي العش"
  },
  {
    "id": 580,
    "wilayaId": 17,
    "name": "Ain El Ibel",
    "nameAr": "عين الإبل"
  },
  {
    "id": 581,
    "wilayaId": 17,
    "name": "El Guedid",
    "nameAr": "القديد"
  },
  {
    "id": 582,
    "wilayaId": 17,
    "name": "Charef",
    "nameAr": "الشارف"
  },
  {
    "id": 583,
    "wilayaId": 17,
    "name": "Benyagoub",
    "nameAr": "بن يعقوب"
  },
  {
    "id": 584,
    "wilayaId": 17,
    "name": "Sidi Baizid",
    "nameAr": "سيدي بايزيد"
  },
  {
    "id": 585,
    "wilayaId": 17,
    "name": "M'liliha",
    "nameAr": "مليليحة"
  },
  {
    "id": 586,
    "wilayaId": 17,
    "name": "Dar Chioukh",
    "nameAr": "دار الشيوخ"
  },
  {
    "id": 587,
    "wilayaId": 17,
    "name": "Taadmit",
    "nameAr": "تعظميت"
  },
  {
    "id": 588,
    "wilayaId": 68,
    "name": "Had Sahary",
    "nameAr": "حد الصحاري"
  },
  {
    "id": 589,
    "wilayaId": 68,
    "name": "Bouira Lahdab",
    "nameAr": "بويرة الأحداب"
  },
  {
    "id": 590,
    "wilayaId": 68,
    "name": "Ain Fekka",
    "nameAr": "عين فقه"
  },
  {
    "id": 591,
    "wilayaId": 68,
    "name": "Sidi Laadjel",
    "nameAr": "سيدي لعجال"
  },
  {
    "id": 592,
    "wilayaId": 68,
    "name": "Hassi Fedoul",
    "nameAr": "حاسي فدول"
  },
  {
    "id": 593,
    "wilayaId": 68,
    "name": "El Khemis",
    "nameAr": "الخميس"
  },
  {
    "id": 594,
    "wilayaId": 69,
    "name": "Selmana",
    "nameAr": "سلمانة"
  },
  {
    "id": 595,
    "wilayaId": 69,
    "name": "Sed Rahal",
    "nameAr": "سد الرحال"
  },
  {
    "id": 596,
    "wilayaId": 69,
    "name": "Messaad",
    "nameAr": "مسعد"
  },
  {
    "id": 597,
    "wilayaId": 69,
    "name": "Guettara",
    "nameAr": "قطارة"
  },
  {
    "id": 598,
    "wilayaId": 69,
    "name": "Deldoul",
    "nameAr": "دلدول"
  },
  {
    "id": 599,
    "wilayaId": 17,
    "name": "Zaccar",
    "nameAr": "زكار"
  },
  {
    "id": 600,
    "wilayaId": 17,
    "name": "Douis",
    "nameAr": "دويس"
  },
  {
    "id": 601,
    "wilayaId": 17,
    "name": "El Idrissia",
    "nameAr": "الادريسية"
  },
  {
    "id": 602,
    "wilayaId": 17,
    "name": "Ain Chouhada",
    "nameAr": "عين الشهداء"
  },
  {
    "id": 603,
    "wilayaId": 17,
    "name": "Djelfa",
    "nameAr": "الجلفة"
  },
  {
    "id": 604,
    "wilayaId": 68,
    "name": "Birine",
    "nameAr": "بيرين"
  },
  {
    "id": 605,
    "wilayaId": 69,
    "name": "Oum Laadham",
    "nameAr": "أم العظام"
  },
  {
    "id": 606,
    "wilayaId": 69,
    "name": "Faidh El Botma",
    "nameAr": "فيض البطمة"
  },
  {
    "id": 607,
    "wilayaId": 69,
    "name": "Amourah",
    "nameAr": "عمورة"
  },
  {
    "id": 608,
    "wilayaId": 17,
    "name": "Zaafrane",
    "nameAr": "زعفران"
  },
  {
    "id": 609,
    "wilayaId": 68,
    "name": "Guernini",
    "nameAr": "قرنيني"
  },
  {
    "id": 610,
    "wilayaId": 68,
    "name": "Ain Oussera",
    "nameAr": "عين وسارة"
  },
  {
    "id": 611,
    "wilayaId": 68,
    "name": "Benhar",
    "nameAr": "بنهار"
  },
  {
    "id": 612,
    "wilayaId": 17,
    "name": "Ain Maabed",
    "nameAr": "عين معبد"
  },
  {
    "id": 613,
    "wilayaId": 17,
    "name": "Hassi Bahbah",
    "nameAr": "حاسي بحبح"
  },
  {
    "id": 614,
    "wilayaId": 17,
    "name": "Moudjebara",
    "nameAr": "مجبارة"
  },
  {
    "id": 615,
    "wilayaId": 18,
    "name": "Jijel",
    "nameAr": "جيجل"
  },
  {
    "id": 616,
    "wilayaId": 18,
    "name": "El Aouana",
    "nameAr": "العوانة"
  },
  {
    "id": 617,
    "wilayaId": 18,
    "name": "Selma Benziada",
    "nameAr": "سلمى بن زيادة"
  },
  {
    "id": 618,
    "wilayaId": 18,
    "name": "Erraguene Souissi",
    "nameAr": "أراقن سويسي"
  },
  {
    "id": 619,
    "wilayaId": 18,
    "name": "Boussif Ouled Askeur",
    "nameAr": "بوسيف أولاد عسكر"
  },
  {
    "id": 620,
    "wilayaId": 18,
    "name": "Ziama Mansouriah",
    "nameAr": "زيامة منصورية"
  },
  {
    "id": 621,
    "wilayaId": 18,
    "name": "Chahna",
    "nameAr": "الشحنة"
  },
  {
    "id": 622,
    "wilayaId": 18,
    "name": "Emir Abdelkader",
    "nameAr": "الامير عبد القادر"
  },
  {
    "id": 623,
    "wilayaId": 18,
    "name": "Oudjana",
    "nameAr": "وجانة"
  },
  {
    "id": 624,
    "wilayaId": 18,
    "name": "Taher",
    "nameAr": "الطاهير"
  },
  {
    "id": 625,
    "wilayaId": 18,
    "name": "Chekfa",
    "nameAr": "الشقفة"
  },
  {
    "id": 626,
    "wilayaId": 18,
    "name": "El Kennar Nouchfi",
    "nameAr": "القنار نشفي"
  },
  {
    "id": 627,
    "wilayaId": 18,
    "name": "Sidi Abdelaziz",
    "nameAr": "سيدي عبد العزيز"
  },
  {
    "id": 628,
    "wilayaId": 18,
    "name": "El Milia",
    "nameAr": "الميلية"
  },
  {
    "id": 629,
    "wilayaId": 18,
    "name": "Ouled Yahia Khadrouch",
    "nameAr": "أولاد يحيى خدروش"
  },
  {
    "id": 630,
    "wilayaId": 18,
    "name": "Ouled Rabah",
    "nameAr": "أولاد رابح"
  },
  {
    "id": 631,
    "wilayaId": 18,
    "name": "Sidi Marouf",
    "nameAr": "سيدي معروف"
  },
  {
    "id": 632,
    "wilayaId": 18,
    "name": "Ghebala",
    "nameAr": "غبالة"
  },
  {
    "id": 633,
    "wilayaId": 18,
    "name": "Settara",
    "nameAr": "السطارة"
  },
  {
    "id": 634,
    "wilayaId": 18,
    "name": "Bouraoui Belhadef",
    "nameAr": "بوراوي بلهادف"
  },
  {
    "id": 635,
    "wilayaId": 18,
    "name": "El Ancer",
    "nameAr": "العنصر"
  },
  {
    "id": 636,
    "wilayaId": 18,
    "name": "Khiri Oued Adjoul",
    "nameAr": "خيري واد عجول"
  },
  {
    "id": 637,
    "wilayaId": 18,
    "name": "Djimla",
    "nameAr": "جيملة"
  },
  {
    "id": 638,
    "wilayaId": 18,
    "name": "Kaous",
    "nameAr": "قاوس"
  },
  {
    "id": 639,
    "wilayaId": 18,
    "name": "Texenna",
    "nameAr": "تاكسنة"
  },
  {
    "id": 640,
    "wilayaId": 18,
    "name": "Bordj T'har",
    "nameAr": "برج الطهر"
  },
  {
    "id": 641,
    "wilayaId": 18,
    "name": "Boudria Beniyadjis",
    "nameAr": "بودريعة بني ياجيس"
  },
  {
    "id": 642,
    "wilayaId": 18,
    "name": "Djemaa Beni Habibi",
    "nameAr": "الجمعة بني حبيبي"
  },
  {
    "id": 643,
    "wilayaId": 19,
    "name": "Rosfa",
    "nameAr": "الرصفة"
  },
  {
    "id": 644,
    "wilayaId": 19,
    "name": "Oued El Bared",
    "nameAr": "واد البارد"
  },
  {
    "id": 645,
    "wilayaId": 19,
    "name": "Tizi N'bechar",
    "nameAr": "تيزي نبشار"
  },
  {
    "id": 646,
    "wilayaId": 19,
    "name": "Mezloug",
    "nameAr": "مزلوق"
  },
  {
    "id": 647,
    "wilayaId": 19,
    "name": "Guellal",
    "nameAr": "قلال"
  },
  {
    "id": 648,
    "wilayaId": 19,
    "name": "Kasr El Abtal",
    "nameAr": "قصر الابطال"
  },
  {
    "id": 649,
    "wilayaId": 19,
    "name": "Ouled Si Ahmed",
    "nameAr": "أولاد سي أحمد"
  },
  {
    "id": 650,
    "wilayaId": 19,
    "name": "Ait Naoual Mezada",
    "nameAr": "أيت نوال مزادة"
  },
  {
    "id": 651,
    "wilayaId": 19,
    "name": "Ait-Tizi",
    "nameAr": "ايت تيزي"
  },
  {
    "id": 652,
    "wilayaId": 19,
    "name": "Bouandas",
    "nameAr": "بوعنداس"
  },
  {
    "id": 653,
    "wilayaId": 19,
    "name": "Bousselam",
    "nameAr": "بوسلام"
  },
  {
    "id": 654,
    "wilayaId": 19,
    "name": "Hamam Soukhna",
    "nameAr": "حمام السخنة"
  },
  {
    "id": 655,
    "wilayaId": 19,
    "name": "Taya",
    "nameAr": "الطاية"
  },
  {
    "id": 656,
    "wilayaId": 19,
    "name": "Tella",
    "nameAr": "التلة"
  },
  {
    "id": 657,
    "wilayaId": 19,
    "name": "Ain Oulmene",
    "nameAr": "عين ولمان"
  },
  {
    "id": 658,
    "wilayaId": 19,
    "name": "Boutaleb",
    "nameAr": "بوطالب"
  },
  {
    "id": 659,
    "wilayaId": 19,
    "name": "Hamma",
    "nameAr": "الحامة"
  },
  {
    "id": 660,
    "wilayaId": 19,
    "name": "Ouled Tebben",
    "nameAr": "أولاد تبان"
  },
  {
    "id": 661,
    "wilayaId": 19,
    "name": "Amoucha",
    "nameAr": "عموشة"
  },
  {
    "id": 662,
    "wilayaId": 19,
    "name": "Salah Bey",
    "nameAr": "صالح باي"
  },
  {
    "id": 663,
    "wilayaId": 19,
    "name": "Ain Azel",
    "nameAr": "عين أزال"
  },
  {
    "id": 664,
    "wilayaId": 19,
    "name": "Ain Lahdjar",
    "nameAr": "عين الحجر"
  },
  {
    "id": 665,
    "wilayaId": 19,
    "name": "Beidha Bordj",
    "nameAr": "بيضاء برج"
  },
  {
    "id": 666,
    "wilayaId": 19,
    "name": "Bir Haddada",
    "nameAr": "بئر حدادة"
  },
  {
    "id": 667,
    "wilayaId": 19,
    "name": "Guenzet",
    "nameAr": "قنزات"
  },
  {
    "id": 668,
    "wilayaId": 19,
    "name": "Harbil",
    "nameAr": "حربيل"
  },
  {
    "id": 669,
    "wilayaId": 19,
    "name": "Ain-Roua",
    "nameAr": "عين الروى"
  },
  {
    "id": 670,
    "wilayaId": 19,
    "name": "Beni Oussine",
    "nameAr": "بني وسين"
  },
  {
    "id": 671,
    "wilayaId": 19,
    "name": "El Ouricia",
    "nameAr": "أوريسيا"
  },
  {
    "id": 672,
    "wilayaId": 19,
    "name": "Bougaa",
    "nameAr": "بوقاعة"
  },
  {
    "id": 673,
    "wilayaId": 19,
    "name": "Draa-Kebila",
    "nameAr": "ذراع قبيلة"
  },
  {
    "id": 674,
    "wilayaId": 19,
    "name": "Hammam Guergour",
    "nameAr": "حمام قرقور"
  },
  {
    "id": 675,
    "wilayaId": 19,
    "name": "Setif",
    "nameAr": "سطيف"
  },
  {
    "id": 676,
    "wilayaId": 19,
    "name": "Ain El Kebira",
    "nameAr": "عين الكبيرة"
  },
  {
    "id": 677,
    "wilayaId": 19,
    "name": "Dehamcha",
    "nameAr": "الدهامشة"
  },
  {
    "id": 678,
    "wilayaId": 19,
    "name": "Ouled Addouane",
    "nameAr": "أولاد عدوان"
  },
  {
    "id": 679,
    "wilayaId": 19,
    "name": "Ain-Sebt",
    "nameAr": "عين السبت"
  },
  {
    "id": 680,
    "wilayaId": 19,
    "name": "Beni-Aziz",
    "nameAr": "بني عزيز"
  },
  {
    "id": 681,
    "wilayaId": 19,
    "name": "Maaouia",
    "nameAr": "معاوية"
  },
  {
    "id": 682,
    "wilayaId": 19,
    "name": "Bellaa",
    "nameAr": "بلاعة"
  },
  {
    "id": 683,
    "wilayaId": 19,
    "name": "Bir-El-Arch",
    "nameAr": "بئر العرش"
  },
  {
    "id": 684,
    "wilayaId": 19,
    "name": "El-Ouldja",
    "nameAr": "الولجة"
  },
  {
    "id": 685,
    "wilayaId": 19,
    "name": "Tachouda",
    "nameAr": "تاشودة"
  },
  {
    "id": 686,
    "wilayaId": 19,
    "name": "Tala-Ifacene",
    "nameAr": "تالة إيفاسن"
  },
  {
    "id": 687,
    "wilayaId": 19,
    "name": "Serdj-El-Ghoul",
    "nameAr": "سرج الغول"
  },
  {
    "id": 688,
    "wilayaId": 19,
    "name": "Guidjel",
    "nameAr": "قجال"
  },
  {
    "id": 689,
    "wilayaId": 19,
    "name": "Ouled Sabor",
    "nameAr": "أولاد صابر"
  },
  {
    "id": 690,
    "wilayaId": 19,
    "name": "Bazer-Sakra",
    "nameAr": "بازر سكرة"
  },
  {
    "id": 691,
    "wilayaId": 19,
    "name": "El Eulma",
    "nameAr": "العلمة"
  },
  {
    "id": 692,
    "wilayaId": 19,
    "name": "Guelta Zerka",
    "nameAr": "قلتة زرقاء"
  },
  {
    "id": 693,
    "wilayaId": 19,
    "name": "Beni Fouda",
    "nameAr": "بني فودة"
  },
  {
    "id": 694,
    "wilayaId": 19,
    "name": "Djemila",
    "nameAr": "جميلة"
  },
  {
    "id": 695,
    "wilayaId": 19,
    "name": "Ain-Legradj",
    "nameAr": "عين لقراج"
  },
  {
    "id": 696,
    "wilayaId": 19,
    "name": "Beni Chebana",
    "nameAr": "بني شبانة"
  },
  {
    "id": 697,
    "wilayaId": 19,
    "name": "Beni Ourtilane",
    "nameAr": "بني ورتيلان"
  },
  {
    "id": 698,
    "wilayaId": 19,
    "name": "Beni-Mouhli",
    "nameAr": "بني موحلي"
  },
  {
    "id": 699,
    "wilayaId": 19,
    "name": "Ain Abessa",
    "nameAr": "عين عباسة"
  },
  {
    "id": 700,
    "wilayaId": 19,
    "name": "Ain Arnat",
    "nameAr": "عين أرنات"
  },
  {
    "id": 701,
    "wilayaId": 19,
    "name": "Babor",
    "nameAr": "بابور"
  },
  {
    "id": 702,
    "wilayaId": 19,
    "name": "Maouaklane",
    "nameAr": "ماوكلان"
  },
  {
    "id": 703,
    "wilayaId": 20,
    "name": "Saida",
    "nameAr": "سعيدة"
  },
  {
    "id": 704,
    "wilayaId": 20,
    "name": "Tircine",
    "nameAr": "تيرسين"
  },
  {
    "id": 705,
    "wilayaId": 20,
    "name": "Ouled Brahim",
    "nameAr": "أولاد إبراهيم"
  },
  {
    "id": 706,
    "wilayaId": 20,
    "name": "Ain Soltane",
    "nameAr": "عين السلطان"
  },
  {
    "id": 707,
    "wilayaId": 20,
    "name": "Maamora",
    "nameAr": "المعمورة"
  },
  {
    "id": 708,
    "wilayaId": 20,
    "name": "El Hassasna",
    "nameAr": "الحساسنة"
  },
  {
    "id": 709,
    "wilayaId": 20,
    "name": "Ain Sekhouna",
    "nameAr": "عين السخونة"
  },
  {
    "id": 710,
    "wilayaId": 20,
    "name": "Sidi Boubekeur",
    "nameAr": "سيدي بوبكر"
  },
  {
    "id": 711,
    "wilayaId": 20,
    "name": "Ouled Khaled",
    "nameAr": "أولاد خالد"
  },
  {
    "id": 712,
    "wilayaId": 20,
    "name": "Hounet",
    "nameAr": "هونت"
  },
  {
    "id": 713,
    "wilayaId": 20,
    "name": "Youb",
    "nameAr": "يوب"
  },
  {
    "id": 714,
    "wilayaId": 20,
    "name": "Doui Thabet",
    "nameAr": "دوي ثابت"
  },
  {
    "id": 715,
    "wilayaId": 20,
    "name": "Sidi Ahmed",
    "nameAr": "سيدي احمد"
  },
  {
    "id": 716,
    "wilayaId": 20,
    "name": "Moulay Larbi",
    "nameAr": "مولاي العربي"
  },
  {
    "id": 717,
    "wilayaId": 20,
    "name": "Ain El Hadjar",
    "nameAr": "عين الحجر"
  },
  {
    "id": 718,
    "wilayaId": 20,
    "name": "Sidi Amar",
    "nameAr": "سيدي عمر"
  },
  {
    "id": 719,
    "wilayaId": 21,
    "name": "Ain Bouziane",
    "nameAr": "عين بوزيان"
  },
  {
    "id": 720,
    "wilayaId": 21,
    "name": "Salah Bouchaour",
    "nameAr": "صالح بو الشعور"
  },
  {
    "id": 721,
    "wilayaId": 21,
    "name": "El Hadaiek",
    "nameAr": "الحدائق"
  },
  {
    "id": 722,
    "wilayaId": 21,
    "name": "Zerdezas",
    "nameAr": "زردازة"
  },
  {
    "id": 723,
    "wilayaId": 21,
    "name": "Ouled Habbaba",
    "nameAr": "أولاد حبابة"
  },
  {
    "id": 724,
    "wilayaId": 21,
    "name": "Beni Oulbane",
    "nameAr": "بني ولبان"
  },
  {
    "id": 725,
    "wilayaId": 21,
    "name": "Sidi Mezghiche",
    "nameAr": "سيدي مزغيش"
  },
  {
    "id": 726,
    "wilayaId": 21,
    "name": "Beni Bechir",
    "nameAr": "بني بشير"
  },
  {
    "id": 727,
    "wilayaId": 21,
    "name": "Ramdane Djamel",
    "nameAr": "رمضان جمال"
  },
  {
    "id": 728,
    "wilayaId": 21,
    "name": "Bin El Ouiden",
    "nameAr": "بين الويدان"
  },
  {
    "id": 729,
    "wilayaId": 21,
    "name": "Emjez Edchich",
    "nameAr": "مجاز الدشيش"
  },
  {
    "id": 730,
    "wilayaId": 21,
    "name": "Tamalous",
    "nameAr": "تمالوس"
  },
  {
    "id": 731,
    "wilayaId": 21,
    "name": "Ain Kechra",
    "nameAr": "عين قشرة"
  },
  {
    "id": 732,
    "wilayaId": 21,
    "name": "Ouldja Boulbalout",
    "nameAr": "الولجة بولبلوط"
  },
  {
    "id": 733,
    "wilayaId": 21,
    "name": "Oum Toub",
    "nameAr": "أم الطوب"
  },
  {
    "id": 734,
    "wilayaId": 21,
    "name": "El Ghedir",
    "nameAr": "الغدير"
  },
  {
    "id": 735,
    "wilayaId": 21,
    "name": "Kerkara",
    "nameAr": "الكركرة"
  },
  {
    "id": 736,
    "wilayaId": 21,
    "name": "El Arrouch",
    "nameAr": "الحروش"
  },
  {
    "id": 737,
    "wilayaId": 21,
    "name": "Zitouna",
    "nameAr": "الزيتونة"
  },
  {
    "id": 738,
    "wilayaId": 21,
    "name": "Ouled Attia",
    "nameAr": "أولاد عطية"
  },
  {
    "id": 739,
    "wilayaId": 21,
    "name": "Oued Zhour",
    "nameAr": "وادي الزهور"
  },
  {
    "id": 740,
    "wilayaId": 21,
    "name": "Collo",
    "nameAr": "القل"
  },
  {
    "id": 741,
    "wilayaId": 21,
    "name": "Cheraia",
    "nameAr": "الشرايع"
  },
  {
    "id": 742,
    "wilayaId": 21,
    "name": "Beni Zid",
    "nameAr": "بني زيد"
  },
  {
    "id": 743,
    "wilayaId": 21,
    "name": "Khenag Maoune",
    "nameAr": "خناق مايو"
  },
  {
    "id": 744,
    "wilayaId": 21,
    "name": "El Marsa",
    "nameAr": "المرسى"
  },
  {
    "id": 745,
    "wilayaId": 21,
    "name": "Ben Azzouz",
    "nameAr": "بن عزوز"
  },
  {
    "id": 746,
    "wilayaId": 21,
    "name": "Bekkouche Lakhdar",
    "nameAr": "بكوش لخضر"
  },
  {
    "id": 747,
    "wilayaId": 21,
    "name": "Es Sebt",
    "nameAr": "السبت"
  },
  {
    "id": 748,
    "wilayaId": 21,
    "name": "Ain Charchar",
    "nameAr": "عين شرشار"
  },
  {
    "id": 749,
    "wilayaId": 21,
    "name": "Azzaba",
    "nameAr": "عزابة"
  },
  {
    "id": 750,
    "wilayaId": 21,
    "name": "Bouchetata",
    "nameAr": "بوشطاطة"
  },
  {
    "id": 751,
    "wilayaId": 21,
    "name": "Filfila",
    "nameAr": "فلفلة"
  },
  {
    "id": 752,
    "wilayaId": 21,
    "name": "Hammadi Krouma",
    "nameAr": "حمادي كرومة"
  },
  {
    "id": 753,
    "wilayaId": 21,
    "name": "Skikda",
    "nameAr": "سكيكدة"
  },
  {
    "id": 754,
    "wilayaId": 21,
    "name": "Ain Zouit",
    "nameAr": "عين زويت"
  },
  {
    "id": 755,
    "wilayaId": 21,
    "name": "Djendel Saadi Mohamed",
    "nameAr": "جندل سعدي محمد"
  },
  {
    "id": 756,
    "wilayaId": 21,
    "name": "Kanoua",
    "nameAr": "قنواع"
  },
  {
    "id": 757,
    "wilayaId": 22,
    "name": "Sidi Ali Benyoub",
    "nameAr": "سيدي علي بن يوب"
  },
  {
    "id": 758,
    "wilayaId": 22,
    "name": "Moulay Slissen",
    "nameAr": "مولاي سليسن"
  },
  {
    "id": 759,
    "wilayaId": 22,
    "name": "El Hacaiba",
    "nameAr": "الحصيبة"
  },
  {
    "id": 760,
    "wilayaId": 22,
    "name": "Ain Tindamine",
    "nameAr": "عين تندمين"
  },
  {
    "id": 761,
    "wilayaId": 22,
    "name": "Tenira",
    "nameAr": "تنيرة"
  },
  {
    "id": 762,
    "wilayaId": 22,
    "name": "Oued Sefioun",
    "nameAr": "وادي سفيون"
  },
  {
    "id": 763,
    "wilayaId": 22,
    "name": "Hassi Dahou",
    "nameAr": "حاسي دحو"
  },
  {
    "id": 764,
    "wilayaId": 22,
    "name": "Oued Taourira",
    "nameAr": "وادي تاوريرة"
  },
  {
    "id": 765,
    "wilayaId": 22,
    "name": "Benachiba Chelia",
    "nameAr": "بن عشيبة شلية"
  },
  {
    "id": 766,
    "wilayaId": 22,
    "name": "Sidi Yacoub",
    "nameAr": "سيدي يعقوب"
  },
  {
    "id": 767,
    "wilayaId": 22,
    "name": "Sidi Lahcene",
    "nameAr": "سيدي لحسن"
  },
  {
    "id": 768,
    "wilayaId": 22,
    "name": "Sidi Khaled",
    "nameAr": "سيدي خالد"
  },
  {
    "id": 769,
    "wilayaId": 22,
    "name": "Tabia",
    "nameAr": "طابية"
  },
  {
    "id": 770,
    "wilayaId": 22,
    "name": "Sidi Brahim",
    "nameAr": "سيدي ابراهيم"
  },
  {
    "id": 771,
    "wilayaId": 22,
    "name": "Amarnas",
    "nameAr": "العمارنة"
  },
  {
    "id": 772,
    "wilayaId": 22,
    "name": "Boukhanefis",
    "nameAr": "بوخنفيس"
  },
  {
    "id": 773,
    "wilayaId": 22,
    "name": "Hassi Zahana",
    "nameAr": "حاسي زهانة"
  },
  {
    "id": 774,
    "wilayaId": 22,
    "name": "Chetouane Belaila",
    "nameAr": "شيطوان البلايلة"
  },
  {
    "id": 775,
    "wilayaId": 22,
    "name": "Ben Badis",
    "nameAr": "بن باديس"
  },
  {
    "id": 776,
    "wilayaId": 22,
    "name": "Bedrabine El Mokrani",
    "nameAr": "بضرابين المقراني"
  },
  {
    "id": 777,
    "wilayaId": 22,
    "name": "Sfisef",
    "nameAr": "سفيزف"
  },
  {
    "id": 778,
    "wilayaId": 22,
    "name": "M'cid",
    "nameAr": "مسيد"
  },
  {
    "id": 779,
    "wilayaId": 22,
    "name": "Boudjebaa El Bordj",
    "nameAr": "بوجبهة البرج"
  },
  {
    "id": 780,
    "wilayaId": 22,
    "name": "Ain- Adden",
    "nameAr": "عين أدن"
  },
  {
    "id": 781,
    "wilayaId": 22,
    "name": "Sidi Hamadouche",
    "nameAr": "سيدي حمادوش"
  },
  {
    "id": 782,
    "wilayaId": 22,
    "name": "Sidi Chaib",
    "nameAr": "سيدي شعيب"
  },
  {
    "id": 783,
    "wilayaId": 22,
    "name": "Makedra",
    "nameAr": "مكدرة"
  },
  {
    "id": 784,
    "wilayaId": 22,
    "name": "Ain El Berd",
    "nameAr": "عين البرد"
  },
  {
    "id": 785,
    "wilayaId": 22,
    "name": "Redjem Demouche",
    "nameAr": "رجم دموش"
  },
  {
    "id": 786,
    "wilayaId": 22,
    "name": "Ras El Ma",
    "nameAr": "راس الماء"
  },
  {
    "id": 787,
    "wilayaId": 22,
    "name": "Oued Sebaa",
    "nameAr": "وادي السبع"
  },
  {
    "id": 788,
    "wilayaId": 22,
    "name": "Marhoum",
    "nameAr": "مرحوم"
  },
  {
    "id": 789,
    "wilayaId": 22,
    "name": "Sidi Bel-Abbes",
    "nameAr": "سيدي بلعباس"
  },
  {
    "id": 790,
    "wilayaId": 22,
    "name": "Ain Thrid",
    "nameAr": "عين الثريد"
  },
  {
    "id": 791,
    "wilayaId": 22,
    "name": "Sehala Thaoura",
    "nameAr": "السهالة الثورة"
  },
  {
    "id": 792,
    "wilayaId": 22,
    "name": "Tessala",
    "nameAr": "تسالة"
  },
  {
    "id": 793,
    "wilayaId": 22,
    "name": "Belarbi",
    "nameAr": "بلعربي"
  },
  {
    "id": 794,
    "wilayaId": 22,
    "name": "Mostefa Ben Brahim",
    "nameAr": "مصطفى بن ابراهيم"
  },
  {
    "id": 795,
    "wilayaId": 22,
    "name": "Tilmouni",
    "nameAr": "تلموني"
  },
  {
    "id": 796,
    "wilayaId": 22,
    "name": "Zerouala",
    "nameAr": "زروالة"
  },
  {
    "id": 797,
    "wilayaId": 22,
    "name": "Dhaya",
    "nameAr": "الضاية"
  },
  {
    "id": 798,
    "wilayaId": 22,
    "name": "Mezaourou",
    "nameAr": "مزاورو"
  },
  {
    "id": 799,
    "wilayaId": 22,
    "name": "Teghalimet",
    "nameAr": "تغاليمت"
  },
  {
    "id": 800,
    "wilayaId": 22,
    "name": "Telagh",
    "nameAr": "تلاغ"
  },
  {
    "id": 801,
    "wilayaId": 22,
    "name": "Ain Kada",
    "nameAr": "عين قادة"
  },
  {
    "id": 802,
    "wilayaId": 22,
    "name": "Lamtar",
    "nameAr": "لمطار"
  },
  {
    "id": 803,
    "wilayaId": 22,
    "name": "Sidi Ali Boussidi",
    "nameAr": "سيدي علي بوسيدي"
  },
  {
    "id": 804,
    "wilayaId": 22,
    "name": "Sidi Dahou Zairs",
    "nameAr": "سيدي دحو الزاير"
  },
  {
    "id": 805,
    "wilayaId": 22,
    "name": "Bir El Hammam",
    "nameAr": "بئر الحمام"
  },
  {
    "id": 806,
    "wilayaId": 22,
    "name": "Merine",
    "nameAr": "مرين"
  },
  {
    "id": 807,
    "wilayaId": 22,
    "name": "Tefessour",
    "nameAr": "تفسور"
  },
  {
    "id": 808,
    "wilayaId": 22,
    "name": "Taoudmout",
    "nameAr": "تاودموت"
  },
  {
    "id": 809,
    "wilayaId": 23,
    "name": "Annaba",
    "nameAr": "عنابة"
  },
  {
    "id": 810,
    "wilayaId": 23,
    "name": "Seraidi",
    "nameAr": "سرايدي"
  },
  {
    "id": 811,
    "wilayaId": 23,
    "name": "Berrahal",
    "nameAr": "برحال"
  },
  {
    "id": 812,
    "wilayaId": 23,
    "name": "Oued El Aneb",
    "nameAr": "واد العنب"
  },
  {
    "id": 813,
    "wilayaId": 23,
    "name": "El Hadjar",
    "nameAr": "الحجار"
  },
  {
    "id": 814,
    "wilayaId": 23,
    "name": "Sidi Amar",
    "nameAr": "سيدي عمار"
  },
  {
    "id": 815,
    "wilayaId": 23,
    "name": "El Bouni",
    "nameAr": "البوني"
  },
  {
    "id": 816,
    "wilayaId": 23,
    "name": "Ain El Berda",
    "nameAr": "عين الباردة"
  },
  {
    "id": 817,
    "wilayaId": 23,
    "name": "Cheurfa",
    "nameAr": "الشرفة"
  },
  {
    "id": 818,
    "wilayaId": 23,
    "name": "El Eulma",
    "nameAr": "العلمة"
  },
  {
    "id": 819,
    "wilayaId": 23,
    "name": "Treat",
    "nameAr": "التريعات"
  },
  {
    "id": 820,
    "wilayaId": 23,
    "name": "Chetaibi",
    "nameAr": "شطايبي"
  },
  {
    "id": 821,
    "wilayaId": 24,
    "name": "Nechmaya",
    "nameAr": "نشماية"
  },
  {
    "id": 822,
    "wilayaId": 24,
    "name": "Bou Hamdane",
    "nameAr": "بوحمدان"
  },
  {
    "id": 823,
    "wilayaId": 24,
    "name": "Hammam Debagh",
    "nameAr": "حمام دباغ"
  },
  {
    "id": 824,
    "wilayaId": 24,
    "name": "Roknia",
    "nameAr": "الركنية"
  },
  {
    "id": 825,
    "wilayaId": 24,
    "name": "Dahouara",
    "nameAr": "الدهوارة"
  },
  {
    "id": 826,
    "wilayaId": 24,
    "name": "Hammam N'bail",
    "nameAr": "حمام النبايل"
  },
  {
    "id": 827,
    "wilayaId": 24,
    "name": "Guelma",
    "nameAr": "قالمة"
  },
  {
    "id": 828,
    "wilayaId": 24,
    "name": "Boumahra Ahmed",
    "nameAr": "بومهرة أحمد"
  },
  {
    "id": 829,
    "wilayaId": 24,
    "name": "Ain Ben Beida",
    "nameAr": "عين بن بيضاء"
  },
  {
    "id": 830,
    "wilayaId": 24,
    "name": "Bouchegouf",
    "nameAr": "بوشقوف"
  },
  {
    "id": 831,
    "wilayaId": 24,
    "name": "Medjez Sfa",
    "nameAr": "مجاز الصفاء"
  },
  {
    "id": 832,
    "wilayaId": 24,
    "name": "Oued Ferragha",
    "nameAr": "وادي فراغة"
  },
  {
    "id": 833,
    "wilayaId": 24,
    "name": "Bouati Mahmoud",
    "nameAr": "بوعاتي محمود"
  },
  {
    "id": 834,
    "wilayaId": 24,
    "name": "El Fedjoudj",
    "nameAr": "الفجوج"
  },
  {
    "id": 835,
    "wilayaId": 24,
    "name": "Heliopolis",
    "nameAr": "هيليوبوليس"
  },
  {
    "id": 836,
    "wilayaId": 24,
    "name": "Medjez Amar",
    "nameAr": "مجاز عمار"
  },
  {
    "id": 837,
    "wilayaId": 24,
    "name": "Houari Boumedienne",
    "nameAr": "هواري بومدين"
  },
  {
    "id": 838,
    "wilayaId": 24,
    "name": "Ras El Agba",
    "nameAr": "رأس العقبة"
  },
  {
    "id": 839,
    "wilayaId": 24,
    "name": "Sellaoua Announa",
    "nameAr": "سلاوة عنونة"
  },
  {
    "id": 840,
    "wilayaId": 24,
    "name": "Djeballah Khemissi",
    "nameAr": "جبالة الخميسي"
  },
  {
    "id": 841,
    "wilayaId": 24,
    "name": "Bordj Sabath",
    "nameAr": "برج صباط"
  },
  {
    "id": 842,
    "wilayaId": 24,
    "name": "Oued Zenati",
    "nameAr": "وادي الزناتي"
  },
  {
    "id": 843,
    "wilayaId": 24,
    "name": "Ain Regada",
    "nameAr": "عين رقادة"
  },
  {
    "id": 844,
    "wilayaId": 24,
    "name": "Ain Larbi",
    "nameAr": "عين العربي"
  },
  {
    "id": 845,
    "wilayaId": 24,
    "name": "Ain Makhlouf",
    "nameAr": "عين مخلوف"
  },
  {
    "id": 846,
    "wilayaId": 24,
    "name": "Tamlouka",
    "nameAr": "تاملوكة"
  },
  {
    "id": 847,
    "wilayaId": 24,
    "name": "Ain Sandel",
    "nameAr": "عين صندل"
  },
  {
    "id": 848,
    "wilayaId": 24,
    "name": "Bou Hachana",
    "nameAr": "بوحشانة"
  },
  {
    "id": 849,
    "wilayaId": 24,
    "name": "Khezaras",
    "nameAr": "لخزارة"
  },
  {
    "id": 850,
    "wilayaId": 24,
    "name": "Belkheir",
    "nameAr": "بلخير"
  },
  {
    "id": 851,
    "wilayaId": 24,
    "name": "Beni Mezline",
    "nameAr": "بني مزلين"
  },
  {
    "id": 852,
    "wilayaId": 24,
    "name": "Guelaat Bou Sbaa",
    "nameAr": "قلعة بوصبع"
  },
  {
    "id": 853,
    "wilayaId": 24,
    "name": "Oued Cheham",
    "nameAr": "وادي الشحم"
  },
  {
    "id": 854,
    "wilayaId": 24,
    "name": "Bendjarah",
    "nameAr": "بن جراح"
  },
  {
    "id": 855,
    "wilayaId": 25,
    "name": "Didouche Mourad",
    "nameAr": "ديدوش مراد"
  },
  {
    "id": 856,
    "wilayaId": 25,
    "name": "Hamma Bouziane",
    "nameAr": "حامة بوزيان"
  },
  {
    "id": 857,
    "wilayaId": 25,
    "name": "Beni Hamidane",
    "nameAr": "بني حميدان"
  },
  {
    "id": 858,
    "wilayaId": 25,
    "name": "Zighoud Youcef",
    "nameAr": "زيغود يوسف"
  },
  {
    "id": 859,
    "wilayaId": 25,
    "name": "Ain Smara",
    "nameAr": "عين السمارة"
  },
  {
    "id": 860,
    "wilayaId": 25,
    "name": "El Khroub",
    "nameAr": "الخروب"
  },
  {
    "id": 861,
    "wilayaId": 25,
    "name": "Ouled Rahmoun",
    "nameAr": "أولاد رحمون"
  },
  {
    "id": 862,
    "wilayaId": 25,
    "name": "Ain Abid",
    "nameAr": "عين عبيد"
  },
  {
    "id": 863,
    "wilayaId": 25,
    "name": "Ben Badis",
    "nameAr": "أبن باديس الهرية"
  },
  {
    "id": 864,
    "wilayaId": 25,
    "name": "Ibn Ziad",
    "nameAr": "ابن زياد"
  },
  {
    "id": 865,
    "wilayaId": 25,
    "name": "Messaoud Boudjeriou",
    "nameAr": "بوجريو مسعود"
  },
  {
    "id": 866,
    "wilayaId": 25,
    "name": "Constantine",
    "nameAr": "قسنطينة"
  },
  {
    "id": 867,
    "wilayaId": 66,
    "name": "Ouled Hellal",
    "nameAr": "أولاد هلال"
  },
  {
    "id": 868,
    "wilayaId": 26,
    "name": "Souagui",
    "nameAr": "السواقي"
  },
  {
    "id": 869,
    "wilayaId": 66,
    "name": "Ksar El Boukhari",
    "nameAr": "قصر البخاري"
  },
  {
    "id": 870,
    "wilayaId": 66,
    "name": "M'fatha",
    "nameAr": "مفاتحة"
  },
  {
    "id": 871,
    "wilayaId": 66,
    "name": "Saneg",
    "nameAr": "السانق"
  },
  {
    "id": 872,
    "wilayaId": 26,
    "name": "El Azizia",
    "nameAr": "العزيزية"
  },
  {
    "id": 873,
    "wilayaId": 26,
    "name": "Maghraoua",
    "nameAr": "مغراوة"
  },
  {
    "id": 874,
    "wilayaId": 26,
    "name": "Mihoub",
    "nameAr": "ميهوب"
  },
  {
    "id": 875,
    "wilayaId": 66,
    "name": "Bouaiche",
    "nameAr": "بوعيش"
  },
  {
    "id": 876,
    "wilayaId": 66,
    "name": "Boughzoul",
    "nameAr": "بوغزول"
  },
  {
    "id": 877,
    "wilayaId": 66,
    "name": "Chabounia",
    "nameAr": "الشهبونية"
  },
  {
    "id": 878,
    "wilayaId": 26,
    "name": "Hannacha",
    "nameAr": "حناشة"
  },
  {
    "id": 879,
    "wilayaId": 26,
    "name": "Ouamri",
    "nameAr": "عوامري"
  },
  {
    "id": 880,
    "wilayaId": 26,
    "name": "Oued Harbil",
    "nameAr": "وادي حربيل"
  },
  {
    "id": 881,
    "wilayaId": 26,
    "name": "Beni Slimane",
    "nameAr": "بني سليمان"
  },
  {
    "id": 882,
    "wilayaId": 26,
    "name": "Bouaichoune",
    "nameAr": "بوعيشون"
  },
  {
    "id": 883,
    "wilayaId": 26,
    "name": "Ouled Bouachra",
    "nameAr": "أولاد بوعشرة"
  },
  {
    "id": 884,
    "wilayaId": 26,
    "name": "Si Mahdjoub",
    "nameAr": "سي المحجوب"
  },
  {
    "id": 885,
    "wilayaId": 26,
    "name": "Bouskene",
    "nameAr": "بوسكن"
  },
  {
    "id": 886,
    "wilayaId": 26,
    "name": "Sidi Rabie",
    "nameAr": "سيدي الربيع"
  },
  {
    "id": 887,
    "wilayaId": 26,
    "name": "Berrouaghia",
    "nameAr": "البرواقية"
  },
  {
    "id": 888,
    "wilayaId": 26,
    "name": "Ouled Deid",
    "nameAr": "أولاد دايد"
  },
  {
    "id": 889,
    "wilayaId": 26,
    "name": "Rebaia",
    "nameAr": "الربعية"
  },
  {
    "id": 890,
    "wilayaId": 26,
    "name": "Medjebar",
    "nameAr": "مجبر"
  },
  {
    "id": 891,
    "wilayaId": 26,
    "name": "Tletat Ed Douair",
    "nameAr": "ثلاث دوائر"
  },
  {
    "id": 892,
    "wilayaId": 26,
    "name": "Zoubiria",
    "nameAr": "الزبيرية"
  },
  {
    "id": 893,
    "wilayaId": 26,
    "name": "Aissaouia",
    "nameAr": "العيساوية"
  },
  {
    "id": 894,
    "wilayaId": 26,
    "name": "El Haoudane",
    "nameAr": "الحوضان"
  },
  {
    "id": 895,
    "wilayaId": 26,
    "name": "Mezerana",
    "nameAr": "مزغنة"
  },
  {
    "id": 896,
    "wilayaId": 26,
    "name": "Tablat",
    "nameAr": "تابلاط"
  },
  {
    "id": 897,
    "wilayaId": 66,
    "name": "Boghar",
    "nameAr": "بوغار"
  },
  {
    "id": 898,
    "wilayaId": 26,
    "name": "Seghouane",
    "nameAr": "سغوان"
  },
  {
    "id": 899,
    "wilayaId": 26,
    "name": "Draa Esmar",
    "nameAr": "ذراع السمار"
  },
  {
    "id": 900,
    "wilayaId": 26,
    "name": "Medea",
    "nameAr": "المدية"
  },
  {
    "id": 901,
    "wilayaId": 26,
    "name": "Tamesguida",
    "nameAr": "تمسقيدة"
  },
  {
    "id": 902,
    "wilayaId": 26,
    "name": "Ben Chicao",
    "nameAr": "بن شكاو"
  },
  {
    "id": 903,
    "wilayaId": 26,
    "name": "El Hamdania",
    "nameAr": "الحمدانية"
  },
  {
    "id": 904,
    "wilayaId": 26,
    "name": "Ouzera",
    "nameAr": "وزرة"
  },
  {
    "id": 905,
    "wilayaId": 26,
    "name": "Tizi Mahdi",
    "nameAr": "تيزي مهدي"
  },
  {
    "id": 906,
    "wilayaId": 66,
    "name": "Ain Boucif",
    "nameAr": "عين بوسيف"
  },
  {
    "id": 907,
    "wilayaId": 66,
    "name": "El Ouinet",
    "nameAr": "العوينات"
  },
  {
    "id": 908,
    "wilayaId": 66,
    "name": "Kef Lakhdar",
    "nameAr": "الكاف الاخضر"
  },
  {
    "id": 909,
    "wilayaId": 66,
    "name": "Ouled Emaaraf",
    "nameAr": "أولاد امعرف"
  },
  {
    "id": 910,
    "wilayaId": 66,
    "name": "Sidi Demed",
    "nameAr": "سيدي دامد"
  },
  {
    "id": 911,
    "wilayaId": 26,
    "name": "Baata",
    "nameAr": "بعطة"
  },
  {
    "id": 912,
    "wilayaId": 26,
    "name": "El Omaria",
    "nameAr": "العمارية"
  },
  {
    "id": 913,
    "wilayaId": 26,
    "name": "Ouled Brahim",
    "nameAr": "أولاد إبراهيم"
  },
  {
    "id": 914,
    "wilayaId": 26,
    "name": "Bir Ben Laabed",
    "nameAr": "بئر بن عابد"
  },
  {
    "id": 915,
    "wilayaId": 26,
    "name": "El Guelbelkebir",
    "nameAr": "القلب الكبير"
  },
  {
    "id": 916,
    "wilayaId": 26,
    "name": "Sedraya",
    "nameAr": "سدراية"
  },
  {
    "id": 917,
    "wilayaId": 66,
    "name": "Ain Ouksir",
    "nameAr": "عين اقصير"
  },
  {
    "id": 918,
    "wilayaId": 66,
    "name": "Chelalet El Adhaoura",
    "nameAr": "شلالة العذاورة"
  },
  {
    "id": 919,
    "wilayaId": 66,
    "name": "Cheniguel",
    "nameAr": "شنيقل"
  },
  {
    "id": 920,
    "wilayaId": 66,
    "name": "Tafraout",
    "nameAr": "تفراوت"
  },
  {
    "id": 921,
    "wilayaId": 26,
    "name": "Bouchrahil",
    "nameAr": "بوشراحيل"
  },
  {
    "id": 922,
    "wilayaId": 26,
    "name": "Khams Djouamaa",
    "nameAr": "خمس جوامع"
  },
  {
    "id": 923,
    "wilayaId": 26,
    "name": "Sidi Naamane",
    "nameAr": "سيدي نعمان"
  },
  {
    "id": 924,
    "wilayaId": 66,
    "name": "Aziz",
    "nameAr": "عزيز"
  },
  {
    "id": 925,
    "wilayaId": 66,
    "name": "Derrag",
    "nameAr": "دراق"
  },
  {
    "id": 926,
    "wilayaId": 66,
    "name": "Oum El Djellil",
    "nameAr": "أم الجليل"
  },
  {
    "id": 927,
    "wilayaId": 26,
    "name": "Djouab",
    "nameAr": "جواب"
  },
  {
    "id": 928,
    "wilayaId": 26,
    "name": "Sidi Zahar",
    "nameAr": "سيدي زهار"
  },
  {
    "id": 929,
    "wilayaId": 26,
    "name": "Sidi Ziane",
    "nameAr": "سيدي زيان"
  },
  {
    "id": 930,
    "wilayaId": 66,
    "name": "Ouled Antar",
    "nameAr": "أولاد عنتر"
  },
  {
    "id": 931,
    "wilayaId": 27,
    "name": "Fornaka",
    "nameAr": "فرناقة"
  },
  {
    "id": 932,
    "wilayaId": 27,
    "name": "Oued El Kheir",
    "nameAr": "وادي الخير"
  },
  {
    "id": 933,
    "wilayaId": 27,
    "name": "Hassiane",
    "nameAr": "الحسيان (بني ياحي"
  },
  {
    "id": 934,
    "wilayaId": 27,
    "name": "Hassi Mameche",
    "nameAr": "حاسي ماماش"
  },
  {
    "id": 935,
    "wilayaId": 27,
    "name": "Mazagran",
    "nameAr": "مزغران"
  },
  {
    "id": 936,
    "wilayaId": 27,
    "name": "Stidia",
    "nameAr": "ستيدية"
  },
  {
    "id": 937,
    "wilayaId": 27,
    "name": "Ain-Tedles",
    "nameAr": "عين تادلس"
  },
  {
    "id": 938,
    "wilayaId": 27,
    "name": "Sidi Belaattar",
    "nameAr": "سيدي بلعطار"
  },
  {
    "id": 939,
    "wilayaId": 27,
    "name": "Sour",
    "nameAr": "سور"
  },
  {
    "id": 940,
    "wilayaId": 27,
    "name": "Ain-Boudinar",
    "nameAr": "عين بودينار"
  },
  {
    "id": 941,
    "wilayaId": 27,
    "name": "Kheir-Eddine",
    "nameAr": "خير الدين"
  },
  {
    "id": 942,
    "wilayaId": 27,
    "name": "Sayada",
    "nameAr": "صيادة"
  },
  {
    "id": 943,
    "wilayaId": 27,
    "name": "Sidi Ali",
    "nameAr": "سيدي علي"
  },
  {
    "id": 944,
    "wilayaId": 27,
    "name": "Tazgait",
    "nameAr": "تزقايت"
  },
  {
    "id": 945,
    "wilayaId": 27,
    "name": "Benabdelmalek Ramdane",
    "nameAr": "بن عبد المالك رمضان"
  },
  {
    "id": 946,
    "wilayaId": 27,
    "name": "Mostaganem",
    "nameAr": "مستغانم"
  },
  {
    "id": 947,
    "wilayaId": 27,
    "name": "Hadjadj",
    "nameAr": "حجاج"
  },
  {
    "id": 948,
    "wilayaId": 27,
    "name": "Sidi-Lakhdar",
    "nameAr": "سيدي لخضر"
  },
  {
    "id": 949,
    "wilayaId": 27,
    "name": "Achaacha",
    "nameAr": "عشعاشة"
  },
  {
    "id": 950,
    "wilayaId": 27,
    "name": "Khadra",
    "nameAr": "خضرة"
  },
  {
    "id": 951,
    "wilayaId": 27,
    "name": "Nekmaria",
    "nameAr": "نكمارية"
  },
  {
    "id": 952,
    "wilayaId": 27,
    "name": "Ouled Boughalem",
    "nameAr": "أولاد بوغالم"
  },
  {
    "id": 953,
    "wilayaId": 27,
    "name": "Bouguirat",
    "nameAr": "بوقيراط"
  },
  {
    "id": 954,
    "wilayaId": 27,
    "name": "Safsaf",
    "nameAr": "صفصاف"
  },
  {
    "id": 955,
    "wilayaId": 27,
    "name": "Sirat",
    "nameAr": "سيرات"
  },
  {
    "id": 956,
    "wilayaId": 27,
    "name": "Souaflia",
    "nameAr": "السوافلية"
  },
  {
    "id": 957,
    "wilayaId": 27,
    "name": "Ain-Sidi Cherif",
    "nameAr": "عين سيدي الشريف"
  },
  {
    "id": 958,
    "wilayaId": 27,
    "name": "Mansourah",
    "nameAr": "منصورة"
  },
  {
    "id": 959,
    "wilayaId": 27,
    "name": "Mesra",
    "nameAr": "ماسرة"
  },
  {
    "id": 960,
    "wilayaId": 27,
    "name": "Touahria",
    "nameAr": "الطواهرية"
  },
  {
    "id": 961,
    "wilayaId": 27,
    "name": "Ain-Nouissy",
    "nameAr": "عين نويسي"
  },
  {
    "id": 962,
    "wilayaId": 27,
    "name": "Ouled-Maalah",
    "nameAr": "أولاد مع الله"
  },
  {
    "id": 963,
    "wilayaId": 28,
    "name": "Chellal",
    "nameAr": "شلال"
  },
  {
    "id": 964,
    "wilayaId": 28,
    "name": "Ouled Madhi",
    "nameAr": "أولاد ماضي"
  },
  {
    "id": 965,
    "wilayaId": 28,
    "name": "Khettouti Sed-El-Jir",
    "nameAr": "خطوطي سد الجير"
  },
  {
    "id": 966,
    "wilayaId": 28,
    "name": "Belaiba",
    "nameAr": "بلعايبة"
  },
  {
    "id": 967,
    "wilayaId": 28,
    "name": "Berhoum",
    "nameAr": "برهوم"
  },
  {
    "id": 968,
    "wilayaId": 28,
    "name": "Dehahna",
    "nameAr": "دهاهنة"
  },
  {
    "id": 969,
    "wilayaId": 28,
    "name": "Magra",
    "nameAr": "مقرة"
  },
  {
    "id": 970,
    "wilayaId": 28,
    "name": "Beni Ilmane",
    "nameAr": "بني يلمان"
  },
  {
    "id": 971,
    "wilayaId": 28,
    "name": "Bouti Sayeh",
    "nameAr": "بوطي السايح"
  },
  {
    "id": 972,
    "wilayaId": 28,
    "name": "Sidi Aissa",
    "nameAr": "سيدي عيسى"
  },
  {
    "id": 973,
    "wilayaId": 28,
    "name": "Ain El Hadjel",
    "nameAr": "عين الحجل"
  },
  {
    "id": 974,
    "wilayaId": 64,
    "name": "Sidi Hadjeres",
    "nameAr": "سيدي هجرس"
  },
  {
    "id": 975,
    "wilayaId": 64,
    "name": "Bou Saada",
    "nameAr": "بوسعادة"
  },
  {
    "id": 976,
    "wilayaId": 64,
    "name": "El Hamel",
    "nameAr": "الهامل"
  },
  {
    "id": 977,
    "wilayaId": 64,
    "name": "Oulteme",
    "nameAr": "ولتام"
  },
  {
    "id": 978,
    "wilayaId": 64,
    "name": "Benzouh",
    "nameAr": "بن زوه"
  },
  {
    "id": 979,
    "wilayaId": 64,
    "name": "Ouled Sidi Brahim",
    "nameAr": "أولاد سيدي ابراهيم"
  },
  {
    "id": 980,
    "wilayaId": 64,
    "name": "Sidi Ameur",
    "nameAr": "سيدي عامر"
  },
  {
    "id": 981,
    "wilayaId": 64,
    "name": "Tamsa",
    "nameAr": "تامسة"
  },
  {
    "id": 982,
    "wilayaId": 64,
    "name": "Ben Srour",
    "nameAr": "بن سرور"
  },
  {
    "id": 983,
    "wilayaId": 64,
    "name": "Mohamed Boudiaf",
    "nameAr": "محمد بوضياف"
  },
  {
    "id": 984,
    "wilayaId": 64,
    "name": "Ouled Slimane",
    "nameAr": "أولاد سليمان"
  },
  {
    "id": 985,
    "wilayaId": 64,
    "name": "Zarzour",
    "nameAr": "زرزور"
  },
  {
    "id": 986,
    "wilayaId": 64,
    "name": "Ain El Melh",
    "nameAr": "عين الملح"
  },
  {
    "id": 987,
    "wilayaId": 64,
    "name": "Ain Fares",
    "nameAr": "عين فارس"
  },
  {
    "id": 988,
    "wilayaId": 64,
    "name": "Ain Rich",
    "nameAr": "عين الريش"
  },
  {
    "id": 989,
    "wilayaId": 64,
    "name": "Bir Foda",
    "nameAr": "بئر فضة"
  },
  {
    "id": 990,
    "wilayaId": 64,
    "name": "Sidi M'hamed",
    "nameAr": "سيدي امحمد"
  },
  {
    "id": 991,
    "wilayaId": 64,
    "name": "Medjedel",
    "nameAr": "امجدل"
  },
  {
    "id": 992,
    "wilayaId": 64,
    "name": "Menaa",
    "nameAr": "مناعة"
  },
  {
    "id": 993,
    "wilayaId": 28,
    "name": "Djebel Messaad",
    "nameAr": "جبل مساعد"
  },
  {
    "id": 994,
    "wilayaId": 64,
    "name": "Slim",
    "nameAr": "سليم"
  },
  {
    "id": 995,
    "wilayaId": 28,
    "name": "M'sila",
    "nameAr": "المسيلة"
  },
  {
    "id": 996,
    "wilayaId": 28,
    "name": "Hammam Dalaa",
    "nameAr": "حمام الضلعة"
  },
  {
    "id": 997,
    "wilayaId": 28,
    "name": "Ouanougha",
    "nameAr": "ونوغة"
  },
  {
    "id": 998,
    "wilayaId": 28,
    "name": "Ouled Mansour",
    "nameAr": "أولاد منصور"
  },
  {
    "id": 999,
    "wilayaId": 28,
    "name": "Tarmount",
    "nameAr": "تارمونت"
  },
  {
    "id": 1000,
    "wilayaId": 64,
    "name": "Maadid",
    "nameAr": "المعاضيد"
  },
  {
    "id": 1001,
    "wilayaId": 64,
    "name": "M'tarfa",
    "nameAr": "المطارفة"
  },
  {
    "id": 1002,
    "wilayaId": 64,
    "name": "Maarif",
    "nameAr": "معاريف"
  },
  {
    "id": 1003,
    "wilayaId": 28,
    "name": "Ouled Derradj",
    "nameAr": "أولاد دراج"
  },
  {
    "id": 1004,
    "wilayaId": 28,
    "name": "Souamaa",
    "nameAr": "السوامع"
  },
  {
    "id": 1005,
    "wilayaId": 28,
    "name": "El Houamed",
    "nameAr": "الحوامد"
  },
  {
    "id": 1006,
    "wilayaId": 28,
    "name": "Khoubana",
    "nameAr": "خبانة"
  },
  {
    "id": 1007,
    "wilayaId": 28,
    "name": "M'cif",
    "nameAr": "مسيف"
  },
  {
    "id": 1008,
    "wilayaId": 28,
    "name": "Ain Khadra",
    "nameAr": "عين الخضراء"
  },
  {
    "id": 1009,
    "wilayaId": 28,
    "name": "Ouled Addi Guebala",
    "nameAr": "أولاد عدي لقبالة"
  },
  {
    "id": 1010,
    "wilayaId": 29,
    "name": "Oued El Abtal",
    "nameAr": "وادي الأبطال"
  },
  {
    "id": 1011,
    "wilayaId": 29,
    "name": "Sidi Abdelmoumene",
    "nameAr": "سيدي عبد المومن"
  },
  {
    "id": 1012,
    "wilayaId": 29,
    "name": "Sedjerara",
    "nameAr": "سجرارة"
  },
  {
    "id": 1013,
    "wilayaId": 29,
    "name": "Mohammadia",
    "nameAr": "المحمدية"
  },
  {
    "id": 1014,
    "wilayaId": 29,
    "name": "Tighennif",
    "nameAr": "تيغنيف"
  },
  {
    "id": 1015,
    "wilayaId": 29,
    "name": "Mocta-Douz",
    "nameAr": "مقطع الدوز"
  },
  {
    "id": 1016,
    "wilayaId": 29,
    "name": "Ferraguig",
    "nameAr": "فراقيق"
  },
  {
    "id": 1017,
    "wilayaId": 29,
    "name": "El Ghomri",
    "nameAr": "الغمري"
  },
  {
    "id": 1018,
    "wilayaId": 29,
    "name": "Zahana",
    "nameAr": "زهانة"
  },
  {
    "id": 1019,
    "wilayaId": 29,
    "name": "El Gaada",
    "nameAr": "القعدة"
  },
  {
    "id": 1020,
    "wilayaId": 29,
    "name": "Ras El Ain Amirouche",
    "nameAr": "رأس عين عميروش"
  },
  {
    "id": 1021,
    "wilayaId": 29,
    "name": "Oggaz",
    "nameAr": "عقاز"
  },
  {
    "id": 1022,
    "wilayaId": 29,
    "name": "Alaimia",
    "nameAr": "العلايمية"
  },
  {
    "id": 1023,
    "wilayaId": 29,
    "name": "Sig",
    "nameAr": "سيق"
  },
  {
    "id": 1024,
    "wilayaId": 29,
    "name": "Chorfa",
    "nameAr": "الشرفاء"
  },
  {
    "id": 1025,
    "wilayaId": 29,
    "name": "Bou Henni",
    "nameAr": "بوهني"
  },
  {
    "id": 1026,
    "wilayaId": 29,
    "name": "El Mamounia",
    "nameAr": "المأمونية"
  },
  {
    "id": 1027,
    "wilayaId": 29,
    "name": "El Gueitena",
    "nameAr": "القطنة"
  },
  {
    "id": 1028,
    "wilayaId": 29,
    "name": "Ain Fares",
    "nameAr": "عين فارس"
  },
  {
    "id": 1029,
    "wilayaId": 29,
    "name": "Gharrous",
    "nameAr": "غروس"
  },
  {
    "id": 1030,
    "wilayaId": 29,
    "name": "Benian",
    "nameAr": "بنيان"
  },
  {
    "id": 1031,
    "wilayaId": 29,
    "name": "Aouf",
    "nameAr": "عوف"
  },
  {
    "id": 1032,
    "wilayaId": 29,
    "name": "Guerdjoum",
    "nameAr": "قرجوم"
  },
  {
    "id": 1033,
    "wilayaId": 29,
    "name": "Ain Frass",
    "nameAr": "عين أفرص"
  },
  {
    "id": 1034,
    "wilayaId": 29,
    "name": "Ain Fekan",
    "nameAr": "عين فكان"
  },
  {
    "id": 1035,
    "wilayaId": 29,
    "name": "Khalouia",
    "nameAr": "خلوية"
  },
  {
    "id": 1036,
    "wilayaId": 29,
    "name": "El Menaouer",
    "nameAr": "المنور"
  },
  {
    "id": 1037,
    "wilayaId": 29,
    "name": "El Bordj",
    "nameAr": "البرج"
  },
  {
    "id": 1038,
    "wilayaId": 29,
    "name": "Sidi Boussaid",
    "nameAr": "سيدي بوسعيد"
  },
  {
    "id": 1039,
    "wilayaId": 29,
    "name": "Matemore",
    "nameAr": "المطمور"
  },
  {
    "id": 1040,
    "wilayaId": 29,
    "name": "Sidi Kada",
    "nameAr": "سيدي قادة"
  },
  {
    "id": 1041,
    "wilayaId": 29,
    "name": "Makhda",
    "nameAr": "ماقضة"
  },
  {
    "id": 1042,
    "wilayaId": 29,
    "name": "Mascara",
    "nameAr": "معسكر"
  },
  {
    "id": 1043,
    "wilayaId": 29,
    "name": "Bouhanifia",
    "nameAr": "بوحنيفية"
  },
  {
    "id": 1044,
    "wilayaId": 29,
    "name": "Ghriss",
    "nameAr": "غريس"
  },
  {
    "id": 1045,
    "wilayaId": 29,
    "name": "Hacine",
    "nameAr": "حسين"
  },
  {
    "id": 1046,
    "wilayaId": 29,
    "name": "El Keurt",
    "nameAr": "القرط"
  },
  {
    "id": 1047,
    "wilayaId": 29,
    "name": "Froha",
    "nameAr": "فروحة"
  },
  {
    "id": 1048,
    "wilayaId": 29,
    "name": "Tizi",
    "nameAr": "تيزي"
  },
  {
    "id": 1049,
    "wilayaId": 29,
    "name": "Sehailia",
    "nameAr": "السهايلية"
  },
  {
    "id": 1050,
    "wilayaId": 29,
    "name": "Maoussa",
    "nameAr": "ماوسة"
  },
  {
    "id": 1051,
    "wilayaId": 29,
    "name": "Sidi Abdeldjebar",
    "nameAr": "سيدي عبد الجبار"
  },
  {
    "id": 1052,
    "wilayaId": 29,
    "name": "El Hachem",
    "nameAr": "الحشم"
  },
  {
    "id": 1053,
    "wilayaId": 29,
    "name": "Nesmot",
    "nameAr": "نسمط"
  },
  {
    "id": 1054,
    "wilayaId": 29,
    "name": "Zelamta",
    "nameAr": "زلامطة"
  },
  {
    "id": 1055,
    "wilayaId": 29,
    "name": "Ain Ferah",
    "nameAr": "عين فراح"
  },
  {
    "id": 1056,
    "wilayaId": 29,
    "name": "Oued Taria",
    "nameAr": "وادي التاغية"
  },
  {
    "id": 1057,
    "wilayaId": 30,
    "name": "Ouargla",
    "nameAr": "ورقلة"
  },
  {
    "id": 1058,
    "wilayaId": 30,
    "name": "Hassi Messaoud",
    "nameAr": "حاسي مسعود"
  },
  {
    "id": 1059,
    "wilayaId": 30,
    "name": "Ain Beida",
    "nameAr": "عين البيضاء"
  },
  {
    "id": 1060,
    "wilayaId": 30,
    "name": "Hassi Ben Abdellah",
    "nameAr": "حاسي بن عبد الله"
  },
  {
    "id": 1061,
    "wilayaId": 30,
    "name": "Sidi Khouiled",
    "nameAr": "سيدي خويلد"
  },
  {
    "id": 1062,
    "wilayaId": 30,
    "name": "El Borma",
    "nameAr": "البرمة"
  },
  {
    "id": 1063,
    "wilayaId": 30,
    "name": "Rouissat",
    "nameAr": "الرويسات"
  },
  {
    "id": 1064,
    "wilayaId": 30,
    "name": "N'goussa",
    "nameAr": "انقوسة"
  },
  {
    "id": 1065,
    "wilayaId": 31,
    "name": "Sidi Chami",
    "nameAr": "سيدي الشحمي"
  },
  {
    "id": 1066,
    "wilayaId": 31,
    "name": "Hassi Mefsoukh",
    "nameAr": "حاسي مفسوخ"
  },
  {
    "id": 1067,
    "wilayaId": 31,
    "name": "Bir El Djir",
    "nameAr": "بئر الجير"
  },
  {
    "id": 1068,
    "wilayaId": 31,
    "name": "Hassi Ben Okba",
    "nameAr": "حاسي بن عقبة"
  },
  {
    "id": 1069,
    "wilayaId": 31,
    "name": "Gdyel",
    "nameAr": "قديل"
  },
  {
    "id": 1070,
    "wilayaId": 31,
    "name": "Hassi Bounif",
    "nameAr": "حاسي بونيف"
  },
  {
    "id": 1071,
    "wilayaId": 31,
    "name": "El Kerma",
    "nameAr": "الكرمة"
  },
  {
    "id": 1072,
    "wilayaId": 31,
    "name": "Es Senia",
    "nameAr": "السانية"
  },
  {
    "id": 1073,
    "wilayaId": 31,
    "name": "Ben Freha",
    "nameAr": "بن فريحة"
  },
  {
    "id": 1074,
    "wilayaId": 31,
    "name": "Arzew",
    "nameAr": "أرزيو"
  },
  {
    "id": 1075,
    "wilayaId": 31,
    "name": "Sidi Ben Yebka",
    "nameAr": "سيدي بن يبقى"
  },
  {
    "id": 1076,
    "wilayaId": 31,
    "name": "Ain Biya",
    "nameAr": "عين البية"
  },
  {
    "id": 1077,
    "wilayaId": 31,
    "name": "Bethioua",
    "nameAr": "بطيوة"
  },
  {
    "id": 1078,
    "wilayaId": 31,
    "name": "Marsat El Hadjadj",
    "nameAr": "مرسى الحجاج"
  },
  {
    "id": 1079,
    "wilayaId": 31,
    "name": "Ain Turk",
    "nameAr": "عين الترك"
  },
  {
    "id": 1080,
    "wilayaId": 31,
    "name": "Oran",
    "nameAr": "وهران"
  },
  {
    "id": 1081,
    "wilayaId": 31,
    "name": "El Ancor",
    "nameAr": "العنصر"
  },
  {
    "id": 1082,
    "wilayaId": 31,
    "name": "Mers El Kebir",
    "nameAr": "المرسى الكبير"
  },
  {
    "id": 1083,
    "wilayaId": 31,
    "name": "Boufatis",
    "nameAr": "بوفاتيس"
  },
  {
    "id": 1084,
    "wilayaId": 31,
    "name": "El Braya",
    "nameAr": "البراية"
  },
  {
    "id": 1085,
    "wilayaId": 31,
    "name": "Oued Tlelat",
    "nameAr": "وادي تليلات"
  },
  {
    "id": 1086,
    "wilayaId": 31,
    "name": "Ain Kerma",
    "nameAr": "عين الكرمة"
  },
  {
    "id": 1087,
    "wilayaId": 31,
    "name": "Boutlelis",
    "nameAr": "بوتليليس"
  },
  {
    "id": 1088,
    "wilayaId": 31,
    "name": "Messerghin",
    "nameAr": "مسرغين"
  },
  {
    "id": 1089,
    "wilayaId": 31,
    "name": "Bousfer",
    "nameAr": "بوسفر"
  },
  {
    "id": 1090,
    "wilayaId": 31,
    "name": "Tafraoui",
    "nameAr": "طفراوي"
  },
  {
    "id": 1091,
    "wilayaId": 32,
    "name": "Ain El Orak",
    "nameAr": "عين العراك"
  },
  {
    "id": 1092,
    "wilayaId": 32,
    "name": "Krakda",
    "nameAr": "كراكدة"
  },
  {
    "id": 1093,
    "wilayaId": 32,
    "name": "Sidi Slimane",
    "nameAr": "سيدي سليمان"
  },
  {
    "id": 1094,
    "wilayaId": 32,
    "name": "Sidi Ameur",
    "nameAr": "سيدي عامر"
  },
  {
    "id": 1095,
    "wilayaId": 32,
    "name": "Boualem",
    "nameAr": "بوعلام"
  },
  {
    "id": 1096,
    "wilayaId": 32,
    "name": "El Bnoud",
    "nameAr": "البنود"
  },
  {
    "id": 1097,
    "wilayaId": 32,
    "name": "Bougtoub",
    "nameAr": "بوقطب"
  },
  {
    "id": 1098,
    "wilayaId": 32,
    "name": "El Kheiter",
    "nameAr": "الخيثر"
  },
  {
    "id": 1099,
    "wilayaId": 32,
    "name": "Tousmouline",
    "nameAr": "توسمولين"
  },
  {
    "id": 1100,
    "wilayaId": 32,
    "name": "Sidi Tiffour",
    "nameAr": "سيدي طيفور"
  },
  {
    "id": 1101,
    "wilayaId": 32,
    "name": "Stitten",
    "nameAr": "ستيتن"
  },
  {
    "id": 1102,
    "wilayaId": 32,
    "name": "El Bayadh",
    "nameAr": "البيض"
  },
  {
    "id": 1103,
    "wilayaId": 32,
    "name": "Rogassa",
    "nameAr": "رقاصة"
  },
  {
    "id": 1104,
    "wilayaId": 32,
    "name": "El Mehara",
    "nameAr": "المحرة"
  },
  {
    "id": 1105,
    "wilayaId": 32,
    "name": "Kef El Ahmar",
    "nameAr": "الكاف الأحمر"
  },
  {
    "id": 1106,
    "wilayaId": 60,
    "name": "Brezina",
    "nameAr": "بريزينة"
  },
  {
    "id": 1107,
    "wilayaId": 60,
    "name": "Ghassoul",
    "nameAr": "الغاسول"
  },
  {
    "id": 1108,
    "wilayaId": 60,
    "name": "Labiodh Sidi Cheikh",
    "nameAr": "الأبيض سيدي الشيخ"
  },
  {
    "id": 1109,
    "wilayaId": 60,
    "name": "Boussemghoun",
    "nameAr": "بوسمغون"
  },
  {
    "id": 1110,
    "wilayaId": 60,
    "name": "Cheguig",
    "nameAr": "الشقيق"
  },
  {
    "id": 1111,
    "wilayaId": 60,
    "name": "Chellala",
    "nameAr": "شلالة"
  },
  {
    "id": 1112,
    "wilayaId": 60,
    "name": "Arbaouat",
    "nameAr": "اربوات"
  },
  {
    "id": 1113,
    "wilayaId": 33,
    "name": "Bordj Omar Driss",
    "nameAr": "برج عمر إدريس"
  },
  {
    "id": 1114,
    "wilayaId": 33,
    "name": "Debdeb",
    "nameAr": "دبداب"
  },
  {
    "id": 1115,
    "wilayaId": 33,
    "name": "In Amenas",
    "nameAr": "إن أمناس"
  },
  {
    "id": 1116,
    "wilayaId": 33,
    "name": "Illizi",
    "nameAr": "إيليزي"
  },
  {
    "id": 1117,
    "wilayaId": 34,
    "name": "Elhammadia",
    "nameAr": "الحمادية"
  },
  {
    "id": 1118,
    "wilayaId": 34,
    "name": "Ouled Sidi-Brahim",
    "nameAr": "أولاد سيدي ابراهيم"
  },
  {
    "id": 1119,
    "wilayaId": 34,
    "name": "Ain Taghrout",
    "nameAr": "عين تاغروت"
  },
  {
    "id": 1120,
    "wilayaId": 34,
    "name": "Tixter",
    "nameAr": "تيكستار"
  },
  {
    "id": 1121,
    "wilayaId": 34,
    "name": "Belimour",
    "nameAr": "بليمور"
  },
  {
    "id": 1122,
    "wilayaId": 34,
    "name": "El Annasseur",
    "nameAr": "العناصر"
  },
  {
    "id": 1123,
    "wilayaId": 34,
    "name": "Ghailasa",
    "nameAr": "غيلاسة"
  },
  {
    "id": 1124,
    "wilayaId": 34,
    "name": "Taglait",
    "nameAr": "تقلعيت"
  },
  {
    "id": 1125,
    "wilayaId": 34,
    "name": "Bordj Ghedir",
    "nameAr": "برج الغدير"
  },
  {
    "id": 1126,
    "wilayaId": 34,
    "name": "El Euch",
    "nameAr": "العش"
  },
  {
    "id": 1127,
    "wilayaId": 34,
    "name": "Sidi-Embarek",
    "nameAr": "سيدي أمبارك"
  },
  {
    "id": 1128,
    "wilayaId": 34,
    "name": "Khelil",
    "nameAr": "خليل"
  },
  {
    "id": 1129,
    "wilayaId": 34,
    "name": "Bir Kasdali",
    "nameAr": "بئر قاصد علي"
  },
  {
    "id": 1130,
    "wilayaId": 34,
    "name": "Tefreg",
    "nameAr": "تفرق"
  },
  {
    "id": 1131,
    "wilayaId": 34,
    "name": "El Main",
    "nameAr": "الماين"
  },
  {
    "id": 1132,
    "wilayaId": 34,
    "name": "Djaafra",
    "nameAr": "جعافرة"
  },
  {
    "id": 1133,
    "wilayaId": 34,
    "name": "Colla",
    "nameAr": "القلة"
  },
  {
    "id": 1134,
    "wilayaId": 34,
    "name": "Teniet En Nasr",
    "nameAr": "ثنية النصر"
  },
  {
    "id": 1135,
    "wilayaId": 34,
    "name": "El M'hir",
    "nameAr": "المهير"
  },
  {
    "id": 1136,
    "wilayaId": 34,
    "name": "Ksour",
    "nameAr": "القصور"
  },
  {
    "id": 1137,
    "wilayaId": 34,
    "name": "Mansoura",
    "nameAr": "المنصورة"
  },
  {
    "id": 1138,
    "wilayaId": 34,
    "name": "Haraza",
    "nameAr": "حرازة"
  },
  {
    "id": 1139,
    "wilayaId": 34,
    "name": "Rabta",
    "nameAr": "الرابطة"
  },
  {
    "id": 1140,
    "wilayaId": 34,
    "name": "El Achir",
    "nameAr": "الياشير"
  },
  {
    "id": 1141,
    "wilayaId": 34,
    "name": "Hasnaoua",
    "nameAr": "حسناوة"
  },
  {
    "id": 1142,
    "wilayaId": 34,
    "name": "Medjana",
    "nameAr": "مجانة"
  },
  {
    "id": 1143,
    "wilayaId": 34,
    "name": "Ain Tesra",
    "nameAr": "عين تسرة"
  },
  {
    "id": 1144,
    "wilayaId": 34,
    "name": "Ouled Brahem",
    "nameAr": "أولاد أبراهم"
  },
  {
    "id": 1145,
    "wilayaId": 34,
    "name": "Ras El Oued",
    "nameAr": "رأس الوادي"
  },
  {
    "id": 1146,
    "wilayaId": 34,
    "name": "Bordj Zemmoura",
    "nameAr": "برج زمورة"
  },
  {
    "id": 1147,
    "wilayaId": 34,
    "name": "Ouled Dahmane",
    "nameAr": "أولاد دحمان"
  },
  {
    "id": 1148,
    "wilayaId": 34,
    "name": "Tassamert",
    "nameAr": "تسامرت"
  },
  {
    "id": 1149,
    "wilayaId": 34,
    "name": "B. B. Arreridj",
    "nameAr": "برج بوعريرج"
  },
  {
    "id": 1150,
    "wilayaId": 34,
    "name": "Ben Daoud",
    "nameAr": "بن داود"
  },
  {
    "id": 1151,
    "wilayaId": 35,
    "name": "El Kharrouba",
    "nameAr": "الخروبة"
  },
  {
    "id": 1152,
    "wilayaId": 35,
    "name": "Dellys",
    "nameAr": "دلس"
  },
  {
    "id": 1153,
    "wilayaId": 35,
    "name": "Ben Choud",
    "nameAr": "بن شود"
  },
  {
    "id": 1154,
    "wilayaId": 35,
    "name": "Afir",
    "nameAr": "أعفير"
  },
  {
    "id": 1155,
    "wilayaId": 35,
    "name": "Thenia",
    "nameAr": "الثنية"
  },
  {
    "id": 1156,
    "wilayaId": 35,
    "name": "Beni Amrane",
    "nameAr": "بني عمران"
  },
  {
    "id": 1157,
    "wilayaId": 35,
    "name": "Khemis El Khechna",
    "nameAr": "خميس الخشنة"
  },
  {
    "id": 1158,
    "wilayaId": 35,
    "name": "Ammal",
    "nameAr": "عمال"
  },
  {
    "id": 1159,
    "wilayaId": 35,
    "name": "Timezrit",
    "nameAr": "تيمزريت"
  },
  {
    "id": 1160,
    "wilayaId": 35,
    "name": "Zemmouri",
    "nameAr": "زموري"
  },
  {
    "id": 1161,
    "wilayaId": 35,
    "name": "Larbatache",
    "nameAr": "الاربعطاش"
  },
  {
    "id": 1162,
    "wilayaId": 35,
    "name": "Isser",
    "nameAr": "يسر"
  },
  {
    "id": 1163,
    "wilayaId": 35,
    "name": "Chabet El Ameur",
    "nameAr": "شعبة العامر"
  },
  {
    "id": 1164,
    "wilayaId": 35,
    "name": "Ouled Aissa",
    "nameAr": "أولاد عيسى"
  },
  {
    "id": 1165,
    "wilayaId": 35,
    "name": "Naciria",
    "nameAr": "الناصرية"
  },
  {
    "id": 1166,
    "wilayaId": 35,
    "name": "Bouzegza Keddara",
    "nameAr": "بوزقزة قدارة"
  },
  {
    "id": 1167,
    "wilayaId": 35,
    "name": "Souk El Had",
    "nameAr": "سوق الحد"
  },
  {
    "id": 1168,
    "wilayaId": 35,
    "name": "Sidi Daoud",
    "nameAr": "سيدي داود"
  },
  {
    "id": 1169,
    "wilayaId": 35,
    "name": "Baghlia",
    "nameAr": "بغلية"
  },
  {
    "id": 1170,
    "wilayaId": 35,
    "name": "Leghata",
    "nameAr": "لقاطة"
  },
  {
    "id": 1171,
    "wilayaId": 35,
    "name": "Djinet",
    "nameAr": "جنات"
  },
  {
    "id": 1172,
    "wilayaId": 35,
    "name": "Tidjelabine",
    "nameAr": "تيجلابين"
  },
  {
    "id": 1173,
    "wilayaId": 35,
    "name": "Si Mustapha",
    "nameAr": "سي مصطفى"
  },
  {
    "id": 1174,
    "wilayaId": 35,
    "name": "Ouled Hedadj",
    "nameAr": "أولاد هداج"
  },
  {
    "id": 1175,
    "wilayaId": 35,
    "name": "Ouled Moussa",
    "nameAr": "أولاد موسى"
  },
  {
    "id": 1176,
    "wilayaId": 35,
    "name": "Boumerdes",
    "nameAr": "بومرداس"
  },
  {
    "id": 1177,
    "wilayaId": 35,
    "name": "Corso",
    "nameAr": "قورصو"
  },
  {
    "id": 1178,
    "wilayaId": 35,
    "name": "Bordj Menaiel",
    "nameAr": "برج منايل"
  },
  {
    "id": 1179,
    "wilayaId": 35,
    "name": "Boudouaou",
    "nameAr": "بودواو"
  },
  {
    "id": 1180,
    "wilayaId": 35,
    "name": "Boudouaou El Bahri",
    "nameAr": "بودواو البحري"
  },
  {
    "id": 1181,
    "wilayaId": 35,
    "name": "Taourga",
    "nameAr": "تاورقة"
  },
  {
    "id": 1182,
    "wilayaId": 35,
    "name": "Hammedi",
    "nameAr": "حمادي"
  },
  {
    "id": 1183,
    "wilayaId": 36,
    "name": "Ain El Assel",
    "nameAr": "عين العسل"
  },
  {
    "id": 1184,
    "wilayaId": 36,
    "name": "Bougous",
    "nameAr": "بوقوس"
  },
  {
    "id": 1185,
    "wilayaId": 36,
    "name": "El Tarf",
    "nameAr": "الطارف"
  },
  {
    "id": 1186,
    "wilayaId": 36,
    "name": "Zitouna",
    "nameAr": "الزيتونة"
  },
  {
    "id": 1187,
    "wilayaId": 36,
    "name": "Besbes",
    "nameAr": "البسباس"
  },
  {
    "id": 1188,
    "wilayaId": 36,
    "name": "Ain Kerma",
    "nameAr": "عين الكرمة"
  },
  {
    "id": 1189,
    "wilayaId": 36,
    "name": "Bouhadjar",
    "nameAr": "بوحجار"
  },
  {
    "id": 1190,
    "wilayaId": 36,
    "name": "Hammam Beni Salah",
    "nameAr": "حمام بني صالح"
  },
  {
    "id": 1191,
    "wilayaId": 36,
    "name": "Oued Zitoun",
    "nameAr": "وادي الزيتون"
  },
  {
    "id": 1192,
    "wilayaId": 36,
    "name": "Ben M Hidi",
    "nameAr": "بن مهيدي"
  },
  {
    "id": 1193,
    "wilayaId": 36,
    "name": "Berrihane",
    "nameAr": "بريحان"
  },
  {
    "id": 1194,
    "wilayaId": 36,
    "name": "Chebaita Mokhtar",
    "nameAr": "شبيطة مختار"
  },
  {
    "id": 1195,
    "wilayaId": 36,
    "name": "Echatt",
    "nameAr": "الشط"
  },
  {
    "id": 1196,
    "wilayaId": 36,
    "name": "El Aioun",
    "nameAr": "العيون"
  },
  {
    "id": 1197,
    "wilayaId": 36,
    "name": "El Kala",
    "nameAr": "القالة"
  },
  {
    "id": 1198,
    "wilayaId": 36,
    "name": "Souarekh",
    "nameAr": "السوارخ"
  },
  {
    "id": 1199,
    "wilayaId": 36,
    "name": "Zerizer",
    "nameAr": "زريزر"
  },
  {
    "id": 1200,
    "wilayaId": 36,
    "name": "Bouteldja",
    "nameAr": "بوثلجة"
  },
  {
    "id": 1201,
    "wilayaId": 36,
    "name": "Chefia",
    "nameAr": "الشافية"
  },
  {
    "id": 1202,
    "wilayaId": 36,
    "name": "Lac Des Oiseaux",
    "nameAr": "بحيرة الطيور"
  },
  {
    "id": 1203,
    "wilayaId": 36,
    "name": "Chihani",
    "nameAr": "شحاني"
  },
  {
    "id": 1204,
    "wilayaId": 36,
    "name": "Raml Souk",
    "nameAr": "رمل السوق"
  },
  {
    "id": 1205,
    "wilayaId": 36,
    "name": "Asfour",
    "nameAr": "عصفور"
  },
  {
    "id": 1206,
    "wilayaId": 36,
    "name": "Drean",
    "nameAr": "الذرعـان"
  },
  {
    "id": 1207,
    "wilayaId": 37,
    "name": "Tindouf",
    "nameAr": "تندوف"
  },
  {
    "id": 1208,
    "wilayaId": 37,
    "name": "Oum El Assel",
    "nameAr": "أم العسل"
  },
  {
    "id": 1209,
    "wilayaId": 38,
    "name": "Khemisti",
    "nameAr": "خميستي"
  },
  {
    "id": 1210,
    "wilayaId": 38,
    "name": "Theniet El Had",
    "nameAr": "ثنية الاحد"
  },
  {
    "id": 1211,
    "wilayaId": 38,
    "name": "Ouled Bessam",
    "nameAr": "أولاد بسام"
  },
  {
    "id": 1212,
    "wilayaId": 38,
    "name": "Sidi Boutouchent",
    "nameAr": "سيدي بوتوشنت"
  },
  {
    "id": 1213,
    "wilayaId": 38,
    "name": "Tissemsilt",
    "nameAr": "تيسمسيلت"
  },
  {
    "id": 1214,
    "wilayaId": 38,
    "name": "Sidi Lantri",
    "nameAr": "سيدي العنتري"
  },
  {
    "id": 1215,
    "wilayaId": 38,
    "name": "Beni Chaib",
    "nameAr": "بني شعيب"
  },
  {
    "id": 1216,
    "wilayaId": 38,
    "name": "Beni Lahcene",
    "nameAr": "بني لحسن"
  },
  {
    "id": 1217,
    "wilayaId": 38,
    "name": "Sidi Abed",
    "nameAr": "سيدي عابد"
  },
  {
    "id": 1218,
    "wilayaId": 38,
    "name": "Sidi Slimane",
    "nameAr": "سيدي سليمان"
  },
  {
    "id": 1219,
    "wilayaId": 38,
    "name": "Boucaid",
    "nameAr": "بوقائد"
  },
  {
    "id": 1220,
    "wilayaId": 38,
    "name": "Larbaa",
    "nameAr": "الأربعاء"
  },
  {
    "id": 1221,
    "wilayaId": 38,
    "name": "Lazharia",
    "nameAr": "الأزهرية"
  },
  {
    "id": 1222,
    "wilayaId": 38,
    "name": "Lardjem",
    "nameAr": "لرجام"
  },
  {
    "id": 1223,
    "wilayaId": 38,
    "name": "Melaab",
    "nameAr": "الملعب"
  },
  {
    "id": 1224,
    "wilayaId": 38,
    "name": "Layoune",
    "nameAr": "العيون"
  },
  {
    "id": 1225,
    "wilayaId": 38,
    "name": "Tamellahet",
    "nameAr": "تملاحت"
  },
  {
    "id": 1226,
    "wilayaId": 38,
    "name": "Youssoufia",
    "nameAr": "اليوسفية"
  },
  {
    "id": 1227,
    "wilayaId": 38,
    "name": "Bordj El Emir Abdelkader",
    "nameAr": "برج الأمير عبد القادر"
  },
  {
    "id": 1228,
    "wilayaId": 38,
    "name": "Ammari",
    "nameAr": "عماري"
  },
  {
    "id": 1229,
    "wilayaId": 38,
    "name": "Maacem",
    "nameAr": "المعاصم"
  },
  {
    "id": 1230,
    "wilayaId": 38,
    "name": "Bordj Bounaama",
    "nameAr": "برج بونعامة"
  },
  {
    "id": 1231,
    "wilayaId": 39,
    "name": "Douar El Maa",
    "nameAr": "دوار الماء"
  },
  {
    "id": 1232,
    "wilayaId": 39,
    "name": "El Ogla",
    "nameAr": "العقلة"
  },
  {
    "id": 1233,
    "wilayaId": 39,
    "name": "Magrane",
    "nameAr": "المقرن"
  },
  {
    "id": 1234,
    "wilayaId": 39,
    "name": "Sidi Aoun",
    "nameAr": "سيدي عون"
  },
  {
    "id": 1235,
    "wilayaId": 39,
    "name": "Mih Ouansa",
    "nameAr": "اميه وانسة"
  },
  {
    "id": 1236,
    "wilayaId": 39,
    "name": "Kouinine",
    "nameAr": "كوينين"
  },
  {
    "id": 1237,
    "wilayaId": 39,
    "name": "Bayadha",
    "nameAr": "البياضة"
  },
  {
    "id": 1238,
    "wilayaId": 39,
    "name": "Nakhla",
    "nameAr": "النخلة"
  },
  {
    "id": 1239,
    "wilayaId": 39,
    "name": "Robbah",
    "nameAr": "الرباح"
  },
  {
    "id": 1240,
    "wilayaId": 39,
    "name": "Guemar",
    "nameAr": "قمار"
  },
  {
    "id": 1241,
    "wilayaId": 39,
    "name": "Ben Guecha",
    "nameAr": "بن قشة"
  },
  {
    "id": 1242,
    "wilayaId": 39,
    "name": "Ourmes",
    "nameAr": "ورماس"
  },
  {
    "id": 1243,
    "wilayaId": 39,
    "name": "Taghzout",
    "nameAr": "تغزوت"
  },
  {
    "id": 1244,
    "wilayaId": 39,
    "name": "Hamraia",
    "nameAr": "الحمراية"
  },
  {
    "id": 1245,
    "wilayaId": 39,
    "name": "Reguiba",
    "nameAr": "الرقيبة"
  },
  {
    "id": 1246,
    "wilayaId": 39,
    "name": "Debila",
    "nameAr": "الدبيلة"
  },
  {
    "id": 1247,
    "wilayaId": 39,
    "name": "Hassani Abdelkrim",
    "nameAr": "حساني عبد الكريم"
  },
  {
    "id": 1248,
    "wilayaId": 39,
    "name": "Hassi Khalifa",
    "nameAr": "حاسي خليفة"
  },
  {
    "id": 1249,
    "wilayaId": 39,
    "name": "Trifaoui",
    "nameAr": "الطريفاوي"
  },
  {
    "id": 1250,
    "wilayaId": 39,
    "name": "Taleb Larbi",
    "nameAr": "الطالب العربي"
  },
  {
    "id": 1251,
    "wilayaId": 39,
    "name": "Oued El Alenda",
    "nameAr": "وادي العلندة"
  },
  {
    "id": 1252,
    "wilayaId": 39,
    "name": "El-Oued",
    "nameAr": "الوادي"
  },
  {
    "id": 1253,
    "wilayaId": 40,
    "name": "Khirane",
    "nameAr": "خيران"
  },
  {
    "id": 1254,
    "wilayaId": 40,
    "name": "Babar",
    "nameAr": "بابار"
  },
  {
    "id": 1255,
    "wilayaId": 40,
    "name": "El Mahmal",
    "nameAr": "المحمل"
  },
  {
    "id": 1256,
    "wilayaId": 40,
    "name": "Ouled Rechache",
    "nameAr": "أولاد رشاش"
  },
  {
    "id": 1257,
    "wilayaId": 40,
    "name": "Djellal",
    "nameAr": "جلال"
  },
  {
    "id": 1258,
    "wilayaId": 40,
    "name": "Yabous",
    "nameAr": "يابوس"
  },
  {
    "id": 1259,
    "wilayaId": 40,
    "name": "Khenchela",
    "nameAr": "خنشلة"
  },
  {
    "id": 1260,
    "wilayaId": 40,
    "name": "Kais",
    "nameAr": "قايس"
  },
  {
    "id": 1261,
    "wilayaId": 40,
    "name": "Chelia",
    "nameAr": "شلية"
  },
  {
    "id": 1262,
    "wilayaId": 40,
    "name": "Remila",
    "nameAr": "الرميلة"
  },
  {
    "id": 1263,
    "wilayaId": 40,
    "name": "Taouzianat",
    "nameAr": "تاوزيانت"
  },
  {
    "id": 1264,
    "wilayaId": 40,
    "name": "Baghai",
    "nameAr": "بغاي"
  },
  {
    "id": 1265,
    "wilayaId": 40,
    "name": "El Hamma",
    "nameAr": "الحامة"
  },
  {
    "id": 1266,
    "wilayaId": 40,
    "name": "Ensigha",
    "nameAr": "انسيغة"
  },
  {
    "id": 1267,
    "wilayaId": 40,
    "name": "Tamza",
    "nameAr": "طامزة"
  },
  {
    "id": 1268,
    "wilayaId": 40,
    "name": "Ain Touila",
    "nameAr": "عين الطويلة"
  },
  {
    "id": 1269,
    "wilayaId": 40,
    "name": "M'toussa",
    "nameAr": "متوسة"
  },
  {
    "id": 1270,
    "wilayaId": 40,
    "name": "Bouhmama",
    "nameAr": "بوحمامة"
  },
  {
    "id": 1271,
    "wilayaId": 40,
    "name": "El Oueldja",
    "nameAr": "الولجة"
  },
  {
    "id": 1272,
    "wilayaId": 40,
    "name": "M'sara",
    "nameAr": "مصارة"
  },
  {
    "id": 1273,
    "wilayaId": 40,
    "name": "Chechar",
    "nameAr": "ششار"
  },
  {
    "id": 1274,
    "wilayaId": 41,
    "name": "Souk Ahras",
    "nameAr": "سوق أهراس"
  },
  {
    "id": 1275,
    "wilayaId": 41,
    "name": "Ain Soltane",
    "nameAr": "عين سلطان"
  },
  {
    "id": 1276,
    "wilayaId": 41,
    "name": "Sedrata",
    "nameAr": "سدراتة"
  },
  {
    "id": 1277,
    "wilayaId": 41,
    "name": "Hanencha",
    "nameAr": "الحنانشة"
  },
  {
    "id": 1278,
    "wilayaId": 41,
    "name": "Machroha",
    "nameAr": "المشروحة"
  },
  {
    "id": 1279,
    "wilayaId": 41,
    "name": "Ain Zana",
    "nameAr": "عين الزانة"
  },
  {
    "id": 1280,
    "wilayaId": 41,
    "name": "Ouled Driss",
    "nameAr": "أولاد إدريس"
  },
  {
    "id": 1281,
    "wilayaId": 41,
    "name": "Terraguelt",
    "nameAr": "ترقالت"
  },
  {
    "id": 1282,
    "wilayaId": 41,
    "name": "Oum El Adhaim",
    "nameAr": "أم العظايم"
  },
  {
    "id": 1283,
    "wilayaId": 41,
    "name": "Oued Kebrit",
    "nameAr": "وادي الكبريت"
  },
  {
    "id": 1284,
    "wilayaId": 41,
    "name": "Tiffech",
    "nameAr": "تيفاش"
  },
  {
    "id": 1285,
    "wilayaId": 41,
    "name": "Ragouba",
    "nameAr": "الراقوبة"
  },
  {
    "id": 1286,
    "wilayaId": 41,
    "name": "Drea",
    "nameAr": "الدريعة"
  },
  {
    "id": 1287,
    "wilayaId": 41,
    "name": "Taoura",
    "nameAr": "تاورة"
  },
  {
    "id": 1288,
    "wilayaId": 41,
    "name": "Zaarouria",
    "nameAr": "الزعرورية"
  },
  {
    "id": 1289,
    "wilayaId": 41,
    "name": "Haddada",
    "nameAr": "الحدادة"
  },
  {
    "id": 1290,
    "wilayaId": 41,
    "name": "Khedara",
    "nameAr": "الخضارة"
  },
  {
    "id": 1291,
    "wilayaId": 41,
    "name": "Ouled Moumen",
    "nameAr": "أولاد مومن"
  },
  {
    "id": 1292,
    "wilayaId": 41,
    "name": "Merahna",
    "nameAr": "المراهنة"
  },
  {
    "id": 1293,
    "wilayaId": 41,
    "name": "Ouillen",
    "nameAr": "ويلان"
  },
  {
    "id": 1294,
    "wilayaId": 41,
    "name": "Sidi Fredj",
    "nameAr": "سيدي فرج"
  },
  {
    "id": 1295,
    "wilayaId": 41,
    "name": "Bir Bouhouche",
    "nameAr": "بئر بوحوش"
  },
  {
    "id": 1296,
    "wilayaId": 41,
    "name": "Safel El Ouiden",
    "nameAr": "سافل الويدان"
  },
  {
    "id": 1297,
    "wilayaId": 41,
    "name": "Khemissa",
    "nameAr": "خميسة"
  },
  {
    "id": 1298,
    "wilayaId": 41,
    "name": "M'daourouche",
    "nameAr": "مداوروش"
  },
  {
    "id": 1299,
    "wilayaId": 41,
    "name": "Zouabi",
    "nameAr": "الزوابي"
  },
  {
    "id": 1300,
    "wilayaId": 42,
    "name": "Hadjout",
    "nameAr": "حجوط"
  },
  {
    "id": 1301,
    "wilayaId": 42,
    "name": "Merad",
    "nameAr": "مراد"
  },
  {
    "id": 1302,
    "wilayaId": 42,
    "name": "Menaceur",
    "nameAr": "مناصر"
  },
  {
    "id": 1303,
    "wilayaId": 42,
    "name": "Aghbal",
    "nameAr": "أغبال"
  },
  {
    "id": 1304,
    "wilayaId": 42,
    "name": "Nador",
    "nameAr": "الناظور"
  },
  {
    "id": 1305,
    "wilayaId": 42,
    "name": "Sidi-Amar",
    "nameAr": "سيدي عامر"
  },
  {
    "id": 1306,
    "wilayaId": 42,
    "name": "Gouraya",
    "nameAr": "قوراية"
  },
  {
    "id": 1307,
    "wilayaId": 42,
    "name": "Messelmoun",
    "nameAr": "مسلمون"
  },
  {
    "id": 1308,
    "wilayaId": 42,
    "name": "Cherchell",
    "nameAr": "شرشال"
  },
  {
    "id": 1309,
    "wilayaId": 42,
    "name": "Hadjret Ennous",
    "nameAr": "حجرة النص"
  },
  {
    "id": 1310,
    "wilayaId": 42,
    "name": "Sidi Ghiles",
    "nameAr": "سيدي غيلاس"
  },
  {
    "id": 1311,
    "wilayaId": 42,
    "name": "Damous",
    "nameAr": "الداموس"
  },
  {
    "id": 1312,
    "wilayaId": 42,
    "name": "Larhat",
    "nameAr": "الأرهاط"
  },
  {
    "id": 1313,
    "wilayaId": 42,
    "name": "Fouka",
    "nameAr": "فوكة"
  },
  {
    "id": 1314,
    "wilayaId": 42,
    "name": "Ain Tagourait",
    "nameAr": "عين تاقورايت"
  },
  {
    "id": 1315,
    "wilayaId": 42,
    "name": "Bou Haroun",
    "nameAr": "بوهارون"
  },
  {
    "id": 1316,
    "wilayaId": 42,
    "name": "Bou Ismail",
    "nameAr": "بواسماعيل"
  },
  {
    "id": 1317,
    "wilayaId": 42,
    "name": "Khemisti",
    "nameAr": "خميستي"
  },
  {
    "id": 1318,
    "wilayaId": 42,
    "name": "Ahmer El Ain",
    "nameAr": "أحمر العين"
  },
  {
    "id": 1319,
    "wilayaId": 42,
    "name": "Bourkika",
    "nameAr": "بورقيقة"
  },
  {
    "id": 1320,
    "wilayaId": 42,
    "name": "Douaouda",
    "nameAr": "دواودة"
  },
  {
    "id": 1321,
    "wilayaId": 42,
    "name": "Sidi Rached",
    "nameAr": "سيدي راشد"
  },
  {
    "id": 1322,
    "wilayaId": 42,
    "name": "Attatba",
    "nameAr": "الحطاطبة"
  },
  {
    "id": 1323,
    "wilayaId": 42,
    "name": "Chaiba",
    "nameAr": "الشعيبة"
  },
  {
    "id": 1324,
    "wilayaId": 42,
    "name": "Kolea",
    "nameAr": "القليعة"
  },
  {
    "id": 1325,
    "wilayaId": 42,
    "name": "Sidi Semiane",
    "nameAr": "سيدي سميان"
  },
  {
    "id": 1326,
    "wilayaId": 42,
    "name": "Tipaza",
    "nameAr": "تيبازة"
  },
  {
    "id": 1327,
    "wilayaId": 42,
    "name": "Beni Mileuk",
    "nameAr": "بني ميلك"
  },
  {
    "id": 1328,
    "wilayaId": 43,
    "name": "El Mechira",
    "nameAr": "مشيرة"
  },
  {
    "id": 1329,
    "wilayaId": 43,
    "name": "El Ayadi Barbes",
    "nameAr": "العياضي برباس"
  },
  {
    "id": 1330,
    "wilayaId": 43,
    "name": "Ain Beida Harriche",
    "nameAr": "عين البيضاء أحريش"
  },
  {
    "id": 1331,
    "wilayaId": 43,
    "name": "Tassala Lematai",
    "nameAr": "تسالة لمطاعي"
  },
  {
    "id": 1332,
    "wilayaId": 43,
    "name": "Terrai Bainen",
    "nameAr": "ترعي باينان"
  },
  {
    "id": 1333,
    "wilayaId": 43,
    "name": "Amira Arres",
    "nameAr": "اعميرة اراس"
  },
  {
    "id": 1334,
    "wilayaId": 43,
    "name": "Tassadane Haddada",
    "nameAr": "تسدان حدادة"
  },
  {
    "id": 1335,
    "wilayaId": 43,
    "name": "Minar Zarza",
    "nameAr": "مينار زارزة"
  },
  {
    "id": 1336,
    "wilayaId": 43,
    "name": "Sidi Merouane",
    "nameAr": "سيدي مروان"
  },
  {
    "id": 1337,
    "wilayaId": 43,
    "name": "Chigara",
    "nameAr": "الشيقارة"
  },
  {
    "id": 1338,
    "wilayaId": 43,
    "name": "Hamala",
    "nameAr": "حمالة"
  },
  {
    "id": 1339,
    "wilayaId": 43,
    "name": "Grarem Gouga",
    "nameAr": "القرارم قوقة"
  },
  {
    "id": 1340,
    "wilayaId": 43,
    "name": "Tiberguent",
    "nameAr": "تيبرقنت"
  },
  {
    "id": 1341,
    "wilayaId": 43,
    "name": "Rouached",
    "nameAr": "الرواشد"
  },
  {
    "id": 1342,
    "wilayaId": 43,
    "name": "Derrahi Bousselah",
    "nameAr": "دراحي بوصلاح"
  },
  {
    "id": 1343,
    "wilayaId": 43,
    "name": "Zeghaia",
    "nameAr": "زغاية"
  },
  {
    "id": 1344,
    "wilayaId": 43,
    "name": "Oued Endja",
    "nameAr": "وادي النجاء"
  },
  {
    "id": 1345,
    "wilayaId": 43,
    "name": "Ahmed Rachedi",
    "nameAr": "أحمد راشدي"
  },
  {
    "id": 1346,
    "wilayaId": 43,
    "name": "Tadjenanet",
    "nameAr": "تاجنانت"
  },
  {
    "id": 1347,
    "wilayaId": 43,
    "name": "Ain Mellouk",
    "nameAr": "عين الملوك"
  },
  {
    "id": 1348,
    "wilayaId": 43,
    "name": "Ouled Khalouf",
    "nameAr": "أولاد اخلوف"
  },
  {
    "id": 1349,
    "wilayaId": 43,
    "name": "Benyahia Abderrahmane",
    "nameAr": "بن يحي عبد الرحمن"
  },
  {
    "id": 1350,
    "wilayaId": 43,
    "name": "Teleghma",
    "nameAr": "التلاغمة"
  },
  {
    "id": 1351,
    "wilayaId": 43,
    "name": "Oued Seguen",
    "nameAr": "وادي سقان"
  },
  {
    "id": 1352,
    "wilayaId": 43,
    "name": "Oued Athmenia",
    "nameAr": "وادي العثمانية"
  },
  {
    "id": 1353,
    "wilayaId": 43,
    "name": "Ain Tine",
    "nameAr": "عين التين"
  },
  {
    "id": 1354,
    "wilayaId": 43,
    "name": "Chelghoum Laid",
    "nameAr": "شلغوم العيد"
  },
  {
    "id": 1355,
    "wilayaId": 43,
    "name": "Yahia Beniguecha",
    "nameAr": "يحي بني قشة"
  },
  {
    "id": 1356,
    "wilayaId": 43,
    "name": "Ferdjioua",
    "nameAr": "فرجيوة"
  },
  {
    "id": 1357,
    "wilayaId": 43,
    "name": "Sidi Khelifa",
    "nameAr": "سيدي خليفة"
  },
  {
    "id": 1358,
    "wilayaId": 43,
    "name": "Mila",
    "nameAr": "ميلة"
  },
  {
    "id": 1359,
    "wilayaId": 43,
    "name": "Bouhatem",
    "nameAr": "بوحاتم"
  },
  {
    "id": 1360,
    "wilayaId": 44,
    "name": "Khemis-Miliana",
    "nameAr": "خميس مليانة"
  },
  {
    "id": 1361,
    "wilayaId": 44,
    "name": "Sidi-Lakhdar",
    "nameAr": "سيدي الأخضر"
  },
  {
    "id": 1362,
    "wilayaId": 44,
    "name": "Ain-Benian",
    "nameAr": "عين البنيان"
  },
  {
    "id": 1363,
    "wilayaId": 44,
    "name": "Ain-Torki",
    "nameAr": "عين التركي"
  },
  {
    "id": 1364,
    "wilayaId": 44,
    "name": "Hammam-Righa",
    "nameAr": "حمام ريغة"
  },
  {
    "id": 1365,
    "wilayaId": 44,
    "name": "Bourached",
    "nameAr": "بوراشد"
  },
  {
    "id": 1366,
    "wilayaId": 44,
    "name": "Hoceinia",
    "nameAr": "الحسينية"
  },
  {
    "id": 1367,
    "wilayaId": 44,
    "name": "Djelida",
    "nameAr": "جليدة"
  },
  {
    "id": 1368,
    "wilayaId": 44,
    "name": "Arib",
    "nameAr": "عريب"
  },
  {
    "id": 1369,
    "wilayaId": 44,
    "name": "Djemaa Ouled Cheikh",
    "nameAr": "جمعة أولاد الشيخ"
  },
  {
    "id": 1370,
    "wilayaId": 44,
    "name": "El-Amra",
    "nameAr": "العامرة"
  },
  {
    "id": 1371,
    "wilayaId": 44,
    "name": "El-Attaf",
    "nameAr": "العطاف"
  },
  {
    "id": 1372,
    "wilayaId": 44,
    "name": "Tiberkanine",
    "nameAr": "تبركانين"
  },
  {
    "id": 1373,
    "wilayaId": 44,
    "name": "Ain-Bouyahia",
    "nameAr": "عين بويحيى"
  },
  {
    "id": 1374,
    "wilayaId": 44,
    "name": "El-Abadia",
    "nameAr": "العبادية"
  },
  {
    "id": 1375,
    "wilayaId": 44,
    "name": "Tacheta Zegagha",
    "nameAr": "تاشتة زقاغة"
  },
  {
    "id": 1376,
    "wilayaId": 44,
    "name": "Birbouche",
    "nameAr": "بربوش"
  },
  {
    "id": 1377,
    "wilayaId": 44,
    "name": "Djendel",
    "nameAr": "جندل"
  },
  {
    "id": 1378,
    "wilayaId": 44,
    "name": "Ben Allal",
    "nameAr": "بن علال"
  },
  {
    "id": 1379,
    "wilayaId": 44,
    "name": "Oued Chorfa",
    "nameAr": "وادي الشرفاء"
  },
  {
    "id": 1380,
    "wilayaId": 44,
    "name": "Boumedfaa",
    "nameAr": "بومدفع"
  },
  {
    "id": 1381,
    "wilayaId": 44,
    "name": "Ain-Lechiakh",
    "nameAr": "عين الاشياخ"
  },
  {
    "id": 1382,
    "wilayaId": 44,
    "name": "Ain-Soltane",
    "nameAr": "عين السلطان"
  },
  {
    "id": 1383,
    "wilayaId": 44,
    "name": "Oued Djemaa",
    "nameAr": "واد الجمعة"
  },
  {
    "id": 1384,
    "wilayaId": 44,
    "name": "El-Maine",
    "nameAr": "الماين"
  },
  {
    "id": 1385,
    "wilayaId": 44,
    "name": "Rouina",
    "nameAr": "الروينة"
  },
  {
    "id": 1386,
    "wilayaId": 44,
    "name": "Zeddine",
    "nameAr": "زدين"
  },
  {
    "id": 1387,
    "wilayaId": 44,
    "name": "Bir-Ould-Khelifa",
    "nameAr": "بئر ولد خليفة"
  },
  {
    "id": 1388,
    "wilayaId": 44,
    "name": "Bordj-Emir-Khaled",
    "nameAr": "برج الأمير خالد"
  },
  {
    "id": 1389,
    "wilayaId": 44,
    "name": "Tarik-Ibn-Ziad",
    "nameAr": "طارق بن زياد"
  },
  {
    "id": 1390,
    "wilayaId": 44,
    "name": "Bathia",
    "nameAr": "بطحية"
  },
  {
    "id": 1391,
    "wilayaId": 44,
    "name": "Belaas",
    "nameAr": "بلعاص"
  },
  {
    "id": 1392,
    "wilayaId": 44,
    "name": "Hassania",
    "nameAr": "الحسانية"
  },
  {
    "id": 1393,
    "wilayaId": 44,
    "name": "Ain-Defla",
    "nameAr": "عين الدفلى"
  },
  {
    "id": 1394,
    "wilayaId": 44,
    "name": "Miliana",
    "nameAr": "مليانة"
  },
  {
    "id": 1395,
    "wilayaId": 44,
    "name": "Mekhatria",
    "nameAr": "المخاطرية"
  },
  {
    "id": 1396,
    "wilayaId": 45,
    "name": "Tiout",
    "nameAr": "تيوت"
  },
  {
    "id": 1397,
    "wilayaId": 45,
    "name": "Moghrar",
    "nameAr": "مغرار"
  },
  {
    "id": 1398,
    "wilayaId": 45,
    "name": "Asla",
    "nameAr": "عسلة"
  },
  {
    "id": 1399,
    "wilayaId": 45,
    "name": "Kasdir",
    "nameAr": "القصدير"
  },
  {
    "id": 1400,
    "wilayaId": 45,
    "name": "Makmen Ben Amar",
    "nameAr": "مكمن بن عمار"
  },
  {
    "id": 1401,
    "wilayaId": 45,
    "name": "Ain Sefra",
    "nameAr": "عين الصفراء"
  },
  {
    "id": 1402,
    "wilayaId": 45,
    "name": "Mecheria",
    "nameAr": "المشرية"
  },
  {
    "id": 1403,
    "wilayaId": 45,
    "name": "El Biodh",
    "nameAr": "البيوض"
  },
  {
    "id": 1404,
    "wilayaId": 45,
    "name": "Ain Ben Khelil",
    "nameAr": "عين بن خليل"
  },
  {
    "id": 1405,
    "wilayaId": 45,
    "name": "Naama",
    "nameAr": "النعامة"
  },
  {
    "id": 1406,
    "wilayaId": 45,
    "name": "Djenienne Bourezg",
    "nameAr": "جنين بورزق"
  },
  {
    "id": 1407,
    "wilayaId": 45,
    "name": "Sfissifa",
    "nameAr": "سفيسيفة"
  },
  {
    "id": 1408,
    "wilayaId": 46,
    "name": "Sidi Boumediene",
    "nameAr": "سيدي بومدين"
  },
  {
    "id": 1409,
    "wilayaId": 46,
    "name": "Tamzoura",
    "nameAr": "تامزورة"
  },
  {
    "id": 1410,
    "wilayaId": 46,
    "name": "Chaabat El Ham",
    "nameAr": "شعبة اللحم"
  },
  {
    "id": 1411,
    "wilayaId": 46,
    "name": "El Maleh",
    "nameAr": "المالح"
  },
  {
    "id": 1412,
    "wilayaId": 46,
    "name": "Ouled Kihal",
    "nameAr": "أولاد الكيحل"
  },
  {
    "id": 1413,
    "wilayaId": 46,
    "name": "Chentouf",
    "nameAr": "شنتوف"
  },
  {
    "id": 1414,
    "wilayaId": 46,
    "name": "Terga",
    "nameAr": "تارقة"
  },
  {
    "id": 1415,
    "wilayaId": 46,
    "name": "Oued Sebbah",
    "nameAr": "وادي الصباح"
  },
  {
    "id": 1416,
    "wilayaId": 46,
    "name": "El Amria",
    "nameAr": "العامرية"
  },
  {
    "id": 1417,
    "wilayaId": 46,
    "name": "Hassi El Ghella",
    "nameAr": "حاسي الغلة"
  },
  {
    "id": 1418,
    "wilayaId": 46,
    "name": "Ouled Boudjemaa",
    "nameAr": "أولاد بوجمعة"
  },
  {
    "id": 1419,
    "wilayaId": 46,
    "name": "Aghlal",
    "nameAr": "أغلال"
  },
  {
    "id": 1420,
    "wilayaId": 46,
    "name": "Ain Kihal",
    "nameAr": "عين الكيحل"
  },
  {
    "id": 1421,
    "wilayaId": 46,
    "name": "Ain Tolba",
    "nameAr": "عين الطلبة"
  },
  {
    "id": 1422,
    "wilayaId": 46,
    "name": "Aoubellil",
    "nameAr": "عقب الليل"
  },
  {
    "id": 1423,
    "wilayaId": 46,
    "name": "Beni Saf",
    "nameAr": "بني صاف"
  },
  {
    "id": 1424,
    "wilayaId": 46,
    "name": "Hassasna",
    "nameAr": "الحساسنة"
  },
  {
    "id": 1425,
    "wilayaId": 46,
    "name": "Emir Abdelkader",
    "nameAr": "الأمير عبد القادر"
  },
  {
    "id": 1426,
    "wilayaId": 46,
    "name": "Sidi Safi",
    "nameAr": "سيدي صافي"
  },
  {
    "id": 1427,
    "wilayaId": 46,
    "name": "Oulhaca El Gheraba",
    "nameAr": "ولهاصة الغرابة"
  },
  {
    "id": 1428,
    "wilayaId": 46,
    "name": "Sidi Ouriache",
    "nameAr": "سيدي ورياش"
  },
  {
    "id": 1429,
    "wilayaId": 46,
    "name": "Ain El Arbaa",
    "nameAr": "عين الأربعاء"
  },
  {
    "id": 1430,
    "wilayaId": 46,
    "name": "El Messaid",
    "nameAr": "المساعيد"
  },
  {
    "id": 1431,
    "wilayaId": 46,
    "name": "Oued Berkeche",
    "nameAr": "وادي برقش"
  },
  {
    "id": 1432,
    "wilayaId": 46,
    "name": "Sidi Ben Adda",
    "nameAr": "سيدي بن عدة"
  },
  {
    "id": 1433,
    "wilayaId": 46,
    "name": "Ain Temouchent",
    "nameAr": "عين تموشنت"
  },
  {
    "id": 1434,
    "wilayaId": 46,
    "name": "Bouzedjar",
    "nameAr": "بوزجار"
  },
  {
    "id": 1435,
    "wilayaId": 46,
    "name": "Hammam Bou Hadjar",
    "nameAr": "حمام بوحجر"
  },
  {
    "id": 1436,
    "wilayaId": 47,
    "name": "Dhayet Bendhahoua",
    "nameAr": "ضاية بن ضحوة"
  },
  {
    "id": 1437,
    "wilayaId": 47,
    "name": "Mansoura",
    "nameAr": "المنصورة"
  },
  {
    "id": 1438,
    "wilayaId": 47,
    "name": "El Atteuf",
    "nameAr": "العطف"
  },
  {
    "id": 1439,
    "wilayaId": 47,
    "name": "Bounoura",
    "nameAr": "بونورة"
  },
  {
    "id": 1440,
    "wilayaId": 47,
    "name": "Zelfana",
    "nameAr": "زلفانة"
  },
  {
    "id": 1441,
    "wilayaId": 47,
    "name": "El Guerrara",
    "nameAr": "القرارة"
  },
  {
    "id": 1442,
    "wilayaId": 47,
    "name": "Sebseb",
    "nameAr": "سبسب"
  },
  {
    "id": 1443,
    "wilayaId": 47,
    "name": "Metlili",
    "nameAr": "متليلي"
  },
  {
    "id": 1444,
    "wilayaId": 47,
    "name": "Berriane",
    "nameAr": "بريان"
  },
  {
    "id": 1445,
    "wilayaId": 47,
    "name": "Ghardaia",
    "nameAr": "غرداية"
  },
  {
    "id": 1446,
    "wilayaId": 48,
    "name": "El-Guettar",
    "nameAr": "القطار"
  },
  {
    "id": 1447,
    "wilayaId": 48,
    "name": "Ouled Aiche",
    "nameAr": "أولاد يعيش"
  },
  {
    "id": 1448,
    "wilayaId": 48,
    "name": "Beni Dergoun",
    "nameAr": "بني درقن"
  },
  {
    "id": 1449,
    "wilayaId": 48,
    "name": "Dar Ben Abdelah",
    "nameAr": "دار بن عبد الله"
  },
  {
    "id": 1450,
    "wilayaId": 48,
    "name": "Zemmoura",
    "nameAr": "زمورة"
  },
  {
    "id": 1451,
    "wilayaId": 48,
    "name": "Djidiouia",
    "nameAr": "جديوية"
  },
  {
    "id": 1452,
    "wilayaId": 48,
    "name": "Hamri",
    "nameAr": "حمري"
  },
  {
    "id": 1453,
    "wilayaId": 48,
    "name": "Belaassel Bouzagza",
    "nameAr": "بلعسل بوزقزة"
  },
  {
    "id": 1454,
    "wilayaId": 48,
    "name": "El-Matmar",
    "nameAr": "المطمر"
  },
  {
    "id": 1455,
    "wilayaId": 48,
    "name": "Sidi Khettab",
    "nameAr": "سيدي خطاب"
  },
  {
    "id": 1456,
    "wilayaId": 48,
    "name": "Sidi M'hamed Benaouda",
    "nameAr": "سيدي امحمد بن عودة"
  },
  {
    "id": 1457,
    "wilayaId": 48,
    "name": "Ain-Tarek",
    "nameAr": "عين طارق"
  },
  {
    "id": 1458,
    "wilayaId": 48,
    "name": "Had Echkalla",
    "nameAr": "حد الشكالة"
  },
  {
    "id": 1459,
    "wilayaId": 48,
    "name": "El Ouldja",
    "nameAr": "الولجة"
  },
  {
    "id": 1460,
    "wilayaId": 48,
    "name": "Mazouna",
    "nameAr": "مازونة"
  },
  {
    "id": 1461,
    "wilayaId": 48,
    "name": "Ain Rahma",
    "nameAr": "عين الرحمة"
  },
  {
    "id": 1462,
    "wilayaId": 48,
    "name": "Kalaa",
    "nameAr": "القلعة"
  },
  {
    "id": 1463,
    "wilayaId": 48,
    "name": "Sidi Saada",
    "nameAr": "سيدي سعادة"
  },
  {
    "id": 1464,
    "wilayaId": 48,
    "name": "Yellel",
    "nameAr": "يلل"
  },
  {
    "id": 1465,
    "wilayaId": 48,
    "name": "Souk El Had",
    "nameAr": "سوق الحد"
  },
  {
    "id": 1466,
    "wilayaId": 48,
    "name": "Mendes",
    "nameAr": "منداس"
  },
  {
    "id": 1467,
    "wilayaId": 48,
    "name": "Oued Essalem",
    "nameAr": "وادي السلام"
  },
  {
    "id": 1468,
    "wilayaId": 48,
    "name": "Sidi Lazreg",
    "nameAr": "سيدي لزرق"
  },
  {
    "id": 1469,
    "wilayaId": 48,
    "name": "Ammi Moussa",
    "nameAr": "عمي موسى"
  },
  {
    "id": 1470,
    "wilayaId": 48,
    "name": "Ouarizane",
    "nameAr": "واريزان"
  },
  {
    "id": 1471,
    "wilayaId": 48,
    "name": "Merdja Sidi Abed",
    "nameAr": "مرجة سيدي عابد"
  },
  {
    "id": 1472,
    "wilayaId": 48,
    "name": "Ouled Sidi Mihoub",
    "nameAr": "أولاد سيدي الميهوب"
  },
  {
    "id": 1473,
    "wilayaId": 48,
    "name": "Bendaoud",
    "nameAr": "بن داود"
  },
  {
    "id": 1474,
    "wilayaId": 48,
    "name": "Oued-Rhiou",
    "nameAr": "وادي رهيو"
  },
  {
    "id": 1475,
    "wilayaId": 48,
    "name": "El Hassi",
    "nameAr": "الحاسي"
  },
  {
    "id": 1476,
    "wilayaId": 48,
    "name": "Sidi M'hamed Benali",
    "nameAr": "سيدي أمحمد بن علي"
  },
  {
    "id": 1477,
    "wilayaId": 48,
    "name": "Mediouna",
    "nameAr": "مديونة"
  },
  {
    "id": 1478,
    "wilayaId": 48,
    "name": "Beni Zentis",
    "nameAr": "بني زنطيس"
  },
  {
    "id": 1479,
    "wilayaId": 48,
    "name": "Oued El Djemaa",
    "nameAr": "وادي الجمعة"
  },
  {
    "id": 1480,
    "wilayaId": 48,
    "name": "Lahlef",
    "nameAr": "لحلاف"
  },
  {
    "id": 1481,
    "wilayaId": 48,
    "name": "Relizane",
    "nameAr": "غليزان"
  },
  {
    "id": 1482,
    "wilayaId": 48,
    "name": "El H'madna",
    "nameAr": "الحمادنة"
  },
  {
    "id": 1483,
    "wilayaId": 48,
    "name": "Ramka",
    "nameAr": "الرمكة"
  },
  {
    "id": 1484,
    "wilayaId": 49,
    "name": "Tinerkouk",
    "nameAr": "تنركوك"
  },
  {
    "id": 1485,
    "wilayaId": 49,
    "name": "Timimoun",
    "nameAr": "تيميمون"
  },
  {
    "id": 1486,
    "wilayaId": 49,
    "name": "Ouled Said",
    "nameAr": "أولاد السعيد"
  },
  {
    "id": 1487,
    "wilayaId": 49,
    "name": "Metarfa",
    "nameAr": "المطارفة"
  },
  {
    "id": 1488,
    "wilayaId": 49,
    "name": "Talmine",
    "nameAr": "طالمين"
  },
  {
    "id": 1489,
    "wilayaId": 49,
    "name": "Ouled Aissa",
    "nameAr": "أولاد عيسى"
  },
  {
    "id": 1490,
    "wilayaId": 49,
    "name": "Charouine",
    "nameAr": "شروين"
  },
  {
    "id": 1491,
    "wilayaId": 49,
    "name": "Aougrout",
    "nameAr": "أوقروت"
  },
  {
    "id": 1492,
    "wilayaId": 49,
    "name": "Deldoul",
    "nameAr": "دلدول"
  },
  {
    "id": 1493,
    "wilayaId": 49,
    "name": "Ksar Kaddour",
    "nameAr": "قصر قدور"
  },
  {
    "id": 1494,
    "wilayaId": 50,
    "name": "Timiaouine",
    "nameAr": "تيمياوين"
  },
  {
    "id": 1495,
    "wilayaId": 50,
    "name": "Bordj Badji Mokhtar",
    "nameAr": "برج باجي مختار"
  },
  {
    "id": 1496,
    "wilayaId": 51,
    "name": "Ras El Miad",
    "nameAr": "رأس الميعاد"
  },
  {
    "id": 1497,
    "wilayaId": 51,
    "name": "Besbes",
    "nameAr": "بسباس"
  },
  {
    "id": 1498,
    "wilayaId": 51,
    "name": "Sidi Khaled",
    "nameAr": "سيدي خالد"
  },
  {
    "id": 1499,
    "wilayaId": 51,
    "name": "Doucen",
    "nameAr": "الدوسن"
  },
  {
    "id": 1500,
    "wilayaId": 51,
    "name": "Chaiba",
    "nameAr": "الشعيبة"
  },
  {
    "id": 1501,
    "wilayaId": 51,
    "name": "Ouled Djellal",
    "nameAr": "أولاد جلال"
  },
  {
    "id": 1502,
    "wilayaId": 52,
    "name": "Beni-Abbes",
    "nameAr": "بني عباس"
  },
  {
    "id": 1503,
    "wilayaId": 52,
    "name": "Tamtert",
    "nameAr": "تامترت"
  },
  {
    "id": 1504,
    "wilayaId": 52,
    "name": "Igli",
    "nameAr": "إقلي"
  },
  {
    "id": 1505,
    "wilayaId": 52,
    "name": "El Ouata",
    "nameAr": "الواتة"
  },
  {
    "id": 1506,
    "wilayaId": 52,
    "name": "Ouled-Khodeir",
    "nameAr": "أولاد خضير"
  },
  {
    "id": 1507,
    "wilayaId": 52,
    "name": "Kerzaz",
    "nameAr": "كرزاز"
  },
  {
    "id": 1508,
    "wilayaId": 52,
    "name": "Timoudi",
    "nameAr": "تيمودي"
  },
  {
    "id": 1509,
    "wilayaId": 52,
    "name": "Ksabi",
    "nameAr": "القصابي"
  },
  {
    "id": 1510,
    "wilayaId": 52,
    "name": "Beni-Ikhlef",
    "nameAr": "بن يخلف"
  },
  {
    "id": 1511,
    "wilayaId": 53,
    "name": "Inghar",
    "nameAr": "إينغر"
  },
  {
    "id": 1512,
    "wilayaId": 53,
    "name": "Ain Salah",
    "nameAr": "عين صالح"
  },
  {
    "id": 1513,
    "wilayaId": 53,
    "name": "Foggaret Ezzoua",
    "nameAr": "فقارة الزوى"
  },
  {
    "id": 1514,
    "wilayaId": 54,
    "name": "Tin Zouatine",
    "nameAr": "تين زواتين"
  },
  {
    "id": 1515,
    "wilayaId": 54,
    "name": "Ain Guezzam",
    "nameAr": "عين قزام"
  },
  {
    "id": 1516,
    "wilayaId": 55,
    "name": "Temacine",
    "nameAr": "تماسين"
  },
  {
    "id": 1517,
    "wilayaId": 55,
    "name": "Sidi Slimane",
    "nameAr": "سيدي سليمان"
  },
  {
    "id": 1518,
    "wilayaId": 55,
    "name": "Megarine",
    "nameAr": "المقارين"
  },
  {
    "id": 1519,
    "wilayaId": 55,
    "name": "Nezla",
    "nameAr": "النزلة"
  },
  {
    "id": 1520,
    "wilayaId": 55,
    "name": "Blidet Amor",
    "nameAr": "بلدة اعمر"
  },
  {
    "id": 1521,
    "wilayaId": 55,
    "name": "Tebesbest",
    "nameAr": "تبسبست"
  },
  {
    "id": 1522,
    "wilayaId": 55,
    "name": "Touggourt",
    "nameAr": "تقرت"
  },
  {
    "id": 1523,
    "wilayaId": 55,
    "name": "Taibet",
    "nameAr": "الطيبات"
  },
  {
    "id": 1524,
    "wilayaId": 55,
    "name": "El Alia",
    "nameAr": "العالية"
  },
  {
    "id": 1525,
    "wilayaId": 55,
    "name": "El-Hadjira",
    "nameAr": "الحجيرة"
  },
  {
    "id": 1526,
    "wilayaId": 55,
    "name": "Benaceur",
    "nameAr": "بن ناصر"
  },
  {
    "id": 1527,
    "wilayaId": 55,
    "name": "M'naguer",
    "nameAr": "المنقر"
  },
  {
    "id": 1528,
    "wilayaId": 55,
    "name": "Zaouia El Abidia",
    "nameAr": "الزاوية العابدية"
  },
  {
    "id": 1529,
    "wilayaId": 56,
    "name": "Djanet",
    "nameAr": "جانت"
  },
  {
    "id": 1530,
    "wilayaId": 56,
    "name": "Bordj El Haouass",
    "nameAr": "برج الحواس"
  },
  {
    "id": 1531,
    "wilayaId": 57,
    "name": "Oum Touyour",
    "nameAr": "أم الطيور"
  },
  {
    "id": 1532,
    "wilayaId": 57,
    "name": "Sidi Amrane",
    "nameAr": "سيدي عمران"
  },
  {
    "id": 1533,
    "wilayaId": 57,
    "name": "M'rara",
    "nameAr": "المرارة"
  },
  {
    "id": 1534,
    "wilayaId": 57,
    "name": "Djamaa",
    "nameAr": "جامعة"
  },
  {
    "id": 1535,
    "wilayaId": 57,
    "name": "Tenedla",
    "nameAr": "تندلة"
  },
  {
    "id": 1536,
    "wilayaId": 57,
    "name": "El-M'ghaier",
    "nameAr": "المغير"
  },
  {
    "id": 1537,
    "wilayaId": 57,
    "name": "Still",
    "nameAr": "سطيل"
  },
  {
    "id": 1538,
    "wilayaId": 57,
    "name": "Sidi Khelil",
    "nameAr": "سيدي خليل"
  },
  {
    "id": 1539,
    "wilayaId": 58,
    "name": "El Meniaa",
    "nameAr": "المنيعة"
  },
  {
    "id": 1540,
    "wilayaId": 58,
    "name": "Hassi Gara",
    "nameAr": "حاسي القارة"
  },
  {
    "id": 1541,
    "wilayaId": 58,
    "name": "Hassi Fehal",
    "nameAr": "حاسي الفحل"
  }
];

export function getCommunesByWilaya(wilayaId: number): Commune[] {
  return communes.filter((c) => c.wilayaId === wilayaId);
}
