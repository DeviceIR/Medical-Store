import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "Admin@12345", 10);
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? "admin@medical.local" },
    update: { role: "ADMIN", passwordHash },
    create: {
      email: process.env.ADMIN_EMAIL ?? "admin@medical.local",
      phone: process.env.ADMIN_PHONE ?? "09120000000",
      name: "مدیر فروشگاه",
      role: "ADMIN",
      passwordHash,
      wallet: { create: { balanceIrr: 0 } },
    },
  });

  const provinces = [
    { slug: "tehran", nameFa: "تهران", nameEn: "Tehran", cities: ["تهران", "ری", "شمیرانات"], rate: 45000 },
    { slug: "isfahan", nameFa: "اصفهان", nameEn: "Isfahan", cities: ["اصفهان", "کاشان"], rate: 65000 },
    { slug: "razavi-khorasan", nameFa: "خراسان رضوی", nameEn: "Razavi Khorasan", cities: ["مشهد", "نیشابور"], rate: 75000 },
    { slug: "fars", nameFa: "فارس", nameEn: "Fars", cities: ["شیراز", "مرودشت"], rate: 70000 },
    { slug: "east-azerbaijan", nameFa: "آذربایجان شرقی", nameEn: "East Azerbaijan", cities: ["تبریز"], rate: 80000 },
    { slug: "alborz", nameFa: "البرز", nameEn: "Alborz", cities: ["کرج"], rate: 50000 },
  ];

  for (const p of provinces) {
    const province = await prisma.province.upsert({
      where: { slug: p.slug },
      update: {},
      create: { slug: p.slug, nameFa: p.nameFa, nameEn: p.nameEn },
    });
    for (const city of p.cities) {
      const slug = city.toLowerCase().replace(/\s+/g, "-");
      await prisma.city.upsert({
        where: { provinceId_slug: { provinceId: province.id, slug } },
        update: {},
        create: { provinceId: province.id, slug, nameFa: city, nameEn: city },
      });
    }
    const existingRate = await prisma.shippingRate.findFirst({ where: { provinceId: province.id } });
    if (!existingRate) {
      await prisma.shippingRate.create({
        data: { provinceId: province.id, priceIrr: p.rate, priceUsd: 8, priceEur: 7, estimatedDays: 3 },
      });
    }
  }

  const parents = [
    { slug: "surgical", tag: "surgical" as const, fa: "تجهیزات جراحی", en: "Surgical instruments", descFa: "قیچی، فورسپس، رترکتور و ست اتاق عمل", descEn: "Scissors, forceps, retractors and OR sets" },
    { slug: "diagnostic", tag: "diagnostic" as const, fa: "تجهیزات تشخیصی", en: "Diagnostic devices", descFa: "گوشی، فشارسنج، پالس‌اکسیمتر و ترمومتر", descEn: "Stethoscopes, BP monitors, oximeters" },
    { slug: "consumable", tag: "consumable" as const, fa: "مصرفی پزشکی", en: "Medical consumables", descFa: "دستکش، ماسک، سرنگ و پانسمان", descEn: "Gloves, masks, syringes and dressings" },
    { slug: "hospital", tag: "hospital" as const, fa: "تجهیزات بیمارستانی", en: "Hospital equipment", descFa: "تخت، مانیتورینگ و تجهیزات بخش", descEn: "Beds, monitoring and ward equipment" },
    { slug: "laboratory", tag: "diagnostic" as const, fa: "آزمایشگاه", en: "Laboratory", descFa: "میکروسکوپ، سانتریفیوژ و لوازم آزمایش", descEn: "Microscopes, centrifuges and labware" },
    { slug: "emergency", tag: "hospital" as const, fa: "اورژانس و امداد", en: "Emergency & first aid", descFa: "کیف احیا، آتل و تجهیزات تروما", descEn: "Crash bags, splints and trauma kits" },
    { slug: "dental", tag: "surgical" as const, fa: "دندان‌پزشکی", en: "Dental", descFa: "آینه، پروب و ست معاینه دهان", descEn: "Mirrors, probes and exam sets" },
    { slug: "sterilization", tag: "hospital" as const, fa: "استریلیزاسیون", en: "Sterilization", descFa: "اتوکلاو، رول پک و اندیکاتور", descEn: "Autoclaves, pouches and indicators" },
    { slug: "imaging", tag: "diagnostic" as const, fa: "تصویربرداری", en: "Imaging", descFa: "سونوگرافی پرتابل و ژل اولتراسوند", descEn: "Portable ultrasound and gel" },
    { slug: "physiotherapy", tag: "hospital" as const, fa: "فیزیوتراپی", en: "Physiotherapy", descFa: "توان‌بخشی، اولتراسوند تراپی و واکر", descEn: "Rehab, therapy ultrasound and walkers" },
  ];
  const children = [
    { slug: "surgical-scissors", parent: "surgical", fa: "قیچی جراحی", en: "Surgical scissors" },
    { slug: "surgical-forceps", parent: "surgical", fa: "فورسپس و کلمپ", en: "Forceps & clamps" },
    { slug: "surgical-retractors", parent: "surgical", fa: "رترکتور", en: "Retractors" },
    { slug: "stethoscopes", parent: "diagnostic", fa: "گوشی پزشکی", en: "Stethoscopes" },
    { slug: "vital-signs", parent: "diagnostic", fa: "علائم حیاتی", en: "Vital signs" },
    { slug: "ppe", parent: "consumable", fa: "PPE و حفاظت فردی", en: "PPE & protection" },
    { slug: "injection", parent: "consumable", fa: "سرنگ و تزریق", en: "Syringes & injection" },
    { slug: "wound-care", parent: "consumable", fa: "پانسمان", en: "Wound care" },
    { slug: "patient-furniture", parent: "hospital", fa: "تخت و مبلمان بخش", en: "Beds & ward furniture" },
    { slug: "patient-monitoring", parent: "hospital", fa: "مانیتورینگ بیمار", en: "Patient monitoring" },
    { slug: "lab-devices", parent: "laboratory", fa: "دستگاه آزمایشگاهی", en: "Lab devices" },
    { slug: "first-aid", parent: "emergency", fa: "کیف کمک‌های اولیه", en: "First-aid kits" },
    { slug: "dental-hand", parent: "dental", fa: "ابزار معاینه دهان", en: "Dental hand instruments" },
    { slug: "autoclave", parent: "sterilization", fa: "اتوکلاو", en: "Autoclaves" },
    { slug: "ultrasound", parent: "imaging", fa: "سونوگرافی", en: "Ultrasound" },
    { slug: "rehab", parent: "physiotherapy", fa: "توان‌بخشی", en: "Rehabilitation" },
  ];

  const categoryIds: Record<string, string> = {};

  async function ensureCategory(input: {
    slug: string;
    tag: "surgical" | "diagnostic" | "consumable" | "hospital";
    fa: string;
    en: string;
    descFa?: string;
    descEn?: string;
    parentId?: string;
    sortOrder: number;
  }) {
    const row = await prisma.category.upsert({
      where: { slug: input.slug },
      update: { parentId: input.parentId ?? null, medicalTag: input.tag, sortOrder: input.sortOrder },
      create: {
        slug: input.slug,
        parentId: input.parentId,
        medicalTag: input.tag,
        sortOrder: input.sortOrder,
      },
    });
    await prisma.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: row.id, locale: "fa" } },
      update: { name: input.fa, description: input.descFa ?? input.fa },
      create: { categoryId: row.id, locale: "fa", name: input.fa, description: input.descFa ?? input.fa },
    });
    await prisma.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: row.id, locale: "en" } },
      update: { name: input.en, description: input.descEn ?? input.en },
      create: { categoryId: row.id, locale: "en", name: input.en, description: input.descEn ?? input.en },
    });
    categoryIds[input.slug] = row.id;
  }

  for (const [i, c] of parents.entries()) {
    await ensureCategory({ ...c, sortOrder: i });
  }
  for (const [i, c] of children.entries()) {
    const parent = parents.find((p) => p.slug === c.parent)!;
    await ensureCategory({
      slug: c.slug,
      tag: parent.tag,
      fa: c.fa,
      en: c.en,
      parentId: categoryIds[c.parent],
      sortOrder: i,
    });
  }

  const brands = [
    { slug: "mediline", name: "Mediline", nameFa: "مدیلاین" },
    { slug: "helix", name: "Helix Surgical", nameFa: "هلیکس سرجیکال" },
    { slug: "vita", name: "VitaCare", nameFa: "ویتاکر" },
  ];
  const brandIds: Record<string, string> = {};
  for (const b of brands) {
    const row = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: b,
    });
    brandIds[b.slug] = row.id;
  }

  const products = [
    {
      slug: "surgical-scissors-iris",
      category: "surgical-scissors",
      brand: "helix",
      cert: ["CE", "ISO"],
      featured: true,
      fa: { name: "قیچی جراحی آیریس", desc: "قیچی استیل ضدزنگ برای جراحی ظریف چشم و بافت نرم. قابل اتوکلاو." },
      en: { name: "Iris surgical scissors", desc: "Stainless steel scissors for ophthalmic and fine tissue work. Autoclavable." },
      sku: "HX-SC-IRIS-11",
      priceIrr: 1850000,
      priceUsd: 28,
      stock: 40,
    },
    {
      slug: "hemostat-kelly",
      category: "surgical-forceps",
      brand: "helix",
      cert: ["CE", "ISO"],
      featured: true,
      fa: { name: "فورسپس هموستات کلی", desc: "کلمپ کلی ۱۴ سانتی برای کنترل خونریزی حین عمل." },
      en: { name: "Kelly hemostat forceps", desc: "14 cm Kelly clamp for intraoperative hemorrhage control." },
      sku: "HX-HM-KELLY-14",
      priceIrr: 2100000,
      priceUsd: 32,
      stock: 55,
    },
    {
      slug: "stethoscope-cardio",
      category: "stethoscopes",
      brand: "mediline",
      cert: ["CE", "FDA"],
      featured: true,
      fa: { name: "گوشی پزشکی کاردیو", desc: "گوشی دو سر دوگانه با دیافراگم حساس برای معاینه قلب و ریه." },
      en: { name: "Cardiology stethoscope", desc: "Dual-head stethoscope with high-sensitivity diaphragm for cardiac exams." },
      sku: "ML-ST-CARD-01",
      priceIrr: 4200000,
      priceUsd: 64,
      stock: 30,
    },
    {
      slug: "bp-monitor-digital",
      category: "vital-signs",
      brand: "vita",
      cert: ["CE", "ISO"],
      featured: true,
      fa: { name: "فشارسنج دیجیتال بازویی", desc: "فشارسنج دیجیتال با حافظه دو کاربر و کاف استاندارد." },
      en: { name: "Digital arm blood pressure monitor", desc: "Dual-user memory and standard adult cuff." },
      sku: "VT-BP-ARM-200",
      priceIrr: 3150000,
      priceUsd: 48,
      stock: 70,
    },
    {
      slug: "pulse-oximeter",
      category: "vital-signs",
      brand: "vita",
      cert: ["CE", "FDA"],
      featured: true,
      fa: { name: "پالس‌اکسیمتر انگشتی", desc: "اندازه‌گیری SpO2 و ضربان با نمایشگر OLED." },
      en: { name: "Fingertip pulse oximeter", desc: "SpO2 and pulse rate with OLED display." },
      sku: "VT-OX-FNG-01",
      priceIrr: 1450000,
      priceUsd: 22,
      stock: 120,
    },
    {
      slug: "nitrile-gloves-m",
      category: "ppe",
      brand: "mediline",
      cert: ["CE", "ISO"],
      featured: false,
      fa: { name: "دستکش نیتریل سایز M (۱۰۰ عدد)", desc: "بدون پودر، مقاوم در برابر پارگی، مناسب معاینه." },
      en: { name: "Nitrile gloves size M (box of 100)", desc: "Powder-free examination gloves." },
      sku: "ML-GL-NIT-M100",
      priceIrr: 890000,
      priceUsd: 14,
      stock: 200,
    },
    {
      slug: "surgical-mask-50",
      category: "ppe",
      brand: "mediline",
      cert: ["CE", "ISO"],
      featured: false,
      fa: { name: "ماسک جراحی سه‌لایه (۵۰ عدد)", desc: "ماسک پزشکی با لایه ملت‌بلون و کش راحت." },
      en: { name: "3-ply surgical mask (box of 50)", desc: "Melt-blown filter layer with comfortable earloops." },
      sku: "ML-MSK-3P-50",
      priceIrr: 320000,
      priceUsd: 5,
      stock: 400,
    },
    {
      slug: "syringe-5ml",
      category: "injection",
      brand: "vita",
      cert: ["CE", "ISO"],
      featured: false,
      fa: { name: "سرنگ ۵ میلی‌لیتر (۱۰۰ عدد)", desc: "سرنگ استریل یکبارمصرف با سوزن ۲۲G." },
      en: { name: "5 ml syringe (box of 100)", desc: "Sterile disposable syringes with 22G needle." },
      sku: "VT-SYR-5ML-100",
      priceIrr: 780000,
      priceUsd: 12,
      stock: 180,
    },
    {
      slug: "hospital-bed-manual",
      category: "patient-furniture",
      brand: "vita",
      cert: ["CE", "ISO"],
      featured: true,
      fa: { name: "تخت بیمارستانی دو شکن مکانیکی", desc: "تخت فولادی با تنظیم سر و پا، نرده کناری و چرخ قفل‌دار." },
      en: { name: "Manual two-crank hospital bed", desc: "Steel frame with head/foot adjustment, side rails and lockable casters." },
      sku: "VT-BED-MAN-2C",
      priceIrr: 28500000,
      priceUsd: 420,
      stock: 8,
    },
    {
      slug: "ecg-3lead",
      category: "patient-monitoring",
      brand: "mediline",
      cert: ["CE", "FDA", "ISO"],
      featured: true,
      fa: { name: "دستگاه نوار قلب ۳ کاناله", desc: "ECG قابل حمل با چاپ حرارتی و باتری داخلی." },
      en: { name: "3-channel ECG machine", desc: "Portable ECG with thermal printer and internal battery." },
      sku: "ML-ECG-3CH-10",
      priceIrr: 64000000,
      priceUsd: 890,
      stock: 6,
    },
    {
      slug: "lab-microscope-binocular",
      category: "lab-devices",
      brand: "vita",
      cert: ["CE", "ISO"],
      featured: true,
      fa: { name: "میکروسکوپ دوچشمی آزمایشگاهی", desc: "بزرگ‌نمایی ۴۰ تا ۱۰۰۰ با کندانسور و منبع LED." },
      en: { name: "Binocular laboratory microscope", desc: "40–1000x with condenser and LED illumination." },
      sku: "VT-MIC-BIN-40",
      priceIrr: 18500000,
      priceUsd: 265,
      stock: 12,
    },
    {
      slug: "first-aid-trauma-kit",
      category: "first-aid",
      brand: "mediline",
      cert: ["CE", "ISO"],
      featured: false,
      fa: { name: "کیف کمک‌های اولیه تروما", desc: "کیف کامل پانسمان، آتل نرم و دستکش برای کلینیک و خودرو امداد." },
      en: { name: "Trauma first-aid kit", desc: "Dressings, soft splint and gloves for clinic and response vehicles." },
      sku: "ML-FAK-TRM-01",
      priceIrr: 2450000,
      priceUsd: 36,
      stock: 40,
    },
    {
      slug: "dental-exam-set",
      category: "dental-hand",
      brand: "helix",
      cert: ["CE", "ISO"],
      featured: false,
      fa: { name: "ست معاینه دندان‌پزشکی ۵ تکه", desc: "آینه، پروب، پنس و اکسکاویتور استیل ضدزنگ." },
      en: { name: "5-piece dental exam set", desc: "Mirror, probe, tweezers and excavator in stainless steel." },
      sku: "HX-DNT-EX-05",
      priceIrr: 1650000,
      priceUsd: 24,
      stock: 60,
    },
    {
      slug: "autoclave-18l",
      category: "autoclave",
      brand: "vita",
      cert: ["CE", "ISO"],
      featured: true,
      fa: { name: "اتوکلاو رومیزی ۱۸ لیتر", desc: "چرخه ۱۲۱ و ۱۳۴ درجه با خشک‌کن و پرینتر سیکل." },
      en: { name: "18 L tabletop autoclave", desc: "121°C and 134°C cycles with drying and cycle printout." },
      sku: "VT-AC-18L-CL",
      priceIrr: 98000000,
      priceUsd: 1280,
      stock: 4,
    },
    {
      slug: "portable-ultrasound",
      category: "ultrasound",
      brand: "mediline",
      cert: ["CE", "FDA"],
      featured: false,
      fa: { name: "سونوگرافی پرتابل خطی", desc: "پروب خطی با نمایشگر تبلتی برای ارزیابی بالینی." },
      en: { name: "Portable linear ultrasound", desc: "Linear probe with tablet display for point-of-care exams." },
      sku: "ML-US-LIN-P1",
      priceIrr: 145000000,
      priceUsd: 1890,
      stock: 3,
    },
    {
      slug: "rehab-walker",
      category: "rehab",
      brand: "vita",
      cert: ["CE"],
      featured: false,
      fa: { name: "واکر آلومینیومی تاشو", desc: "واکر سبک با دستگیره ضدلغزش برای توان‌بخشی." },
      en: { name: "Folding aluminium walker", desc: "Lightweight walker with non-slip grips for rehab." },
      sku: "VT-RH-WLK-01",
      priceIrr: 2750000,
      priceUsd: 42,
      stock: 25,
    },
    {
      slug: "gauze-pad-sterile",
      category: "wound-care",
      brand: "mediline",
      cert: ["CE", "ISO"],
      featured: false,
      fa: { name: "گاز استریل ۱۰×۱۰ (۱۰۰ عدد)", desc: "گاز استریل ۸ لایه برای پانسمان زخم." },
      en: { name: "Sterile gauze 10×10 (box of 100)", desc: "8-ply sterile gauze for wound dressing." },
      sku: "ML-GZ-1010-100",
      priceIrr: 540000,
      priceUsd: 8,
      stock: 220,
    },
  ];

  const createdProducts: { slug: string; id: string }[] = [];
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { featured: p.featured, categoryId: categoryIds[p.category], certifications: p.cert },
      create: {
        slug: p.slug,
        categoryId: categoryIds[p.category],
        brandId: brandIds[p.brand],
        certifications: p.cert,
        featured: p.featured,
        translations: {
          create: [
            { locale: "fa", name: p.fa.name, description: p.fa.desc, specs: { material: "Medical grade" } },
            { locale: "en", name: p.en.name, description: p.en.desc, specs: { material: "Medical grade" } },
          ],
        },
        variants: {
          create: {
            sku: p.sku,
            titleFa: "استاندارد",
            titleEn: "Standard",
            priceIrr: p.priceIrr,
            priceUsd: p.priceUsd,
            priceEur: Math.round(p.priceUsd * 0.92),
            stock: p.stock,
          },
        },
        images: {
          create: {
            url: `https://picsum.photos/seed/${p.slug}/900/700`,
            altFa: p.fa.name,
            altEn: p.en.name,
          },
        },
      },
    });
    createdProducts.push({ slug: p.slug, id: product.id });
  }

  const iris = createdProducts.find((p) => p.slug === "surgical-scissors-iris");
  const kelly = createdProducts.find((p) => p.slug === "hemostat-kelly");
  if (iris && kelly) {
    await prisma.relatedProduct.upsert({
      where: { fromId_toId: { fromId: iris.id, toId: kelly.id } },
      update: {},
      create: { fromId: iris.id, toId: kelly.id },
    });
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: { active: true },
    create: { code: "WELCOME10", percentOff: 10, minOrderIrr: 500000, active: true },
  });

  await prisma.banner.createMany({
    data: [
      {
        imageUrl: "https://picsum.photos/seed/med-hero/1400/560",
        href: "/fa/catalog/diagnostic",
        titleFa: "تجهیزات تشخیصی کلینیک",
        titleEn: "Clinic diagnostic range",
        sortOrder: 0,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.blogPost.upsert({
    where: { slug: "sterilization-guide" },
    update: {},
    create: {
      slug: "sterilization-guide",
      authorId: admin.id,
      coverUrl: "https://picsum.photos/seed/sterile/1200/700",
      translations: {
        create: [
          {
            locale: "fa",
            title: "راهنمای استریل ابزار جراحی",
            excerpt: "اصول اتوکلاو و نگهداری استیل جراحی برای کلینیک‌ها.",
            body: "ابزار جراحی باید مطابق پروتکل استریل گرم و خشک نگهداری شود. پس از شستشو، بسته‌بندی و چرخه اتوکلاو ۱۲۱ یا ۱۳۴ درجه را کامل کنید و تاریخ استریل را ثبت نمایید.",
          },
          {
            locale: "en",
            title: "Surgical instrument sterilization guide",
            excerpt: "Autoclave basics and stainless-steel care for clinics.",
            body: "Surgical instruments should follow a validated steam-sterilization protocol. After cleaning, pack and complete a 121°C or 134°C autoclave cycle, then log the sterile date.",
          },
        ],
      },
    },
  });

  await prisma.blogPost.upsert({
    where: { slug: "choosing-stethoscope" },
    update: {},
    create: {
      slug: "choosing-stethoscope",
      authorId: admin.id,
      coverUrl: "https://picsum.photos/seed/steth/1200/700",
      translations: {
        create: [
          {
            locale: "fa",
            title: "چطور گوشی پزشکی مناسب انتخاب کنیم",
            excerpt: "تفاوت مدل عمومی و کاردیولوژی برای مطب و اورژانس.",
            body: "برای معاینه عمومی دیافراگم استاندارد کافی است. در کاردیولوژی، تیوب دولومن و وزن بالاتر صدا را دقیق‌تر منتقل می‌کند.",
          },
          {
            locale: "en",
            title: "How to choose a stethoscope",
            excerpt: "General vs cardiology models for clinic and emergency use.",
            body: "A standard diaphragm is enough for general practice. Cardiology models use dual-lumen tubing and extra mass for finer auscultation.",
          },
        ],
      },
    },
  });

  console.log("Seed complete. Admin:", admin.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
