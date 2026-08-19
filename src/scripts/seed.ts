import { connectDB } from '../shared/lib/db';
import { UserModel } from '../modules/users/infrastructure/user.model';
import { CategoryTypeModel } from '../modules/catalog/infrastructure/category-type.model';
import { CategoryModel } from '../modules/catalog/infrastructure/category.model';
import { ProductModel } from '../modules/catalog/infrastructure/product.model';
import { MediaModel } from '../modules/media/infrastructure/media.model';
import { GardenerProfileModel } from '../modules/services/infrastructure/gardener-profile.model';
import { ServiceOfferingModel } from '../modules/services/infrastructure/service-offering.model';
import { normalizeCategoryCode } from '../modules/catalog/domain/category.utils';
import { Roles } from '../shared/types/roles';
import { DEFAULT_KYC_REGION } from '../shared/lib/kyc';
import { env } from '../config/env';
import bcrypt from 'bcryptjs';

/**
 * Shared pool of placeholder photos. Keyed so products can reference the
 * images relevant to their category. Renders via placehold.co (a stable,
 * purpose-built placeholder-image generator) rather than Unsplash's old
 * "Source" API, which was shut down in 2023 and no longer serves images —
 * seeding real product photos isn't in scope here, and a clearly-labeled
 * placeholder beats a silently dead image link.
 */
const MEDIA_POOL: { key: string; label: string }[] = [
  { key: 'monstera', label: 'Monstera Deliciosa' },
  { key: 'areca-palm', label: 'Areca Palm' },
  { key: 'snake-plant', label: 'Snake Plant' },
  { key: 'zz-plant', label: 'ZZ Plant' },
  { key: 'peace-lily', label: 'Peace Lily' },
  { key: 'anthurium', label: 'Anthurium' },
  { key: 'succulents', label: 'Succulents' },
  { key: 'hibiscus', label: 'Hibiscus' },
  { key: 'bougainvillea', label: 'Bougainvillea' },
  { key: 'neem-tree', label: 'Neem Sapling' },
  { key: 'climbing-vine', label: 'Money Plant' },
  { key: 'ceramic-pot', label: 'Ceramic Pot' },
  { key: 'terracotta-pot', label: 'Terracotta Pot' },
  { key: 'plastic-planter', label: 'Plastic Planter' },
  { key: 'hanging-planter', label: 'Hanging Planter' },
  { key: 'compost', label: 'Vermicompost' },
  { key: 'potting-soil', label: 'Potting Mix' },
  { key: 'garden-tools', label: 'Garden Tools' },
  { key: 'watering-can', label: 'Watering Can' },
  { key: 'pruning-shears', label: 'Pruning Shears' },
];

type ProductSeed = {
  name: string;
  slug: string;
  categoryName: string; // must match a category name created by seed-categories.ts
  description: string;
  price: number;
  stockQty: number;
  mediaKeys: string[];
  attributes: Record<string, string>;
  isFeatured?: boolean;
  unit?: string;
};

const PRODUCTS: ProductSeed[] = [
  {
    name: 'Monstera Deliciosa',
    slug: 'monstera-deliciosa',
    categoryName: 'Air-Purifying Plants',
    description:
      'A lush tropical Monstera Deliciosa with iconic split leaves, perfect for brightening up living rooms and offices.',
    price: 3500,
    stockQty: 40,
    isFeatured: true,
    mediaKeys: ['monstera'],
    attributes: { light: 'Bright indirect', watering: 'Weekly' },
  },
  {
    name: 'Areca Palm',
    slug: 'areca-palm',
    categoryName: 'Air-Purifying Plants',
    description:
      'Elegant Areca Palm known for its feathery fronds and excellent air-purifying qualities, ideal for indoor corners.',
    price: 4200,
    stockQty: 25,
    mediaKeys: ['areca-palm'],
    attributes: { light: 'Bright indirect', watering: 'Twice weekly' },
  },
  {
    name: 'Snake Plant (Sansevieria)',
    slug: 'snake-plant-sansevieria',
    categoryName: 'Low-Light Plants',
    description:
      'Hardy Snake Plant that thrives in low light and requires minimal watering, a great choice for beginners.',
    price: 1800,
    stockQty: 60,
    isFeatured: true,
    mediaKeys: ['snake-plant'],
    attributes: { light: 'Low to bright indirect', watering: 'Every 2-3 weeks' },
  },
  {
    name: 'ZZ Plant',
    slug: 'zz-plant',
    categoryName: 'Low-Light Plants',
    description:
      'Glossy-leaved ZZ Plant that tolerates neglect and low light, a resilient choice for busy plant owners.',
    price: 2600,
    stockQty: 35,
    mediaKeys: ['zz-plant'],
    attributes: { light: 'Low to medium', watering: 'Every 2 weeks' },
  },
  {
    name: 'Peace Lily',
    slug: 'peace-lily',
    categoryName: 'Flowering Indoor Plants',
    description:
      'Graceful Peace Lily with elegant white blooms that also helps purify indoor air throughout the year.',
    price: 2200,
    stockQty: 45,
    isFeatured: true,
    mediaKeys: ['peace-lily'],
    attributes: { light: 'Medium indirect', watering: 'Weekly' },
  },
  {
    name: 'Anthurium Red',
    slug: 'anthurium-red',
    categoryName: 'Flowering Indoor Plants',
    description:
      'Vibrant red Anthurium with heart-shaped waxy blooms that last for months, a stunning tabletop accent.',
    price: 2900,
    stockQty: 20,
    mediaKeys: ['anthurium'],
    attributes: { light: 'Bright indirect', watering: 'Weekly' },
  },
  {
    name: 'Assorted Succulent Trio',
    slug: 'assorted-succulent-trio',
    categoryName: 'Succulents & Cacti',
    description:
      'A set of three hand-picked succulents in mixed varieties, low-maintenance and perfect for desk decor.',
    price: 1500,
    stockQty: 70,
    mediaKeys: ['succulents'],
    attributes: { light: 'Bright direct', watering: 'Every 2 weeks' },
  },
  {
    name: 'Golden Barrel Cactus',
    slug: 'golden-barrel-cactus',
    categoryName: 'Succulents & Cacti',
    description:
      'Striking spherical Golden Barrel Cactus with golden spines, a low-water statement plant for sunny spots.',
    price: 2100,
    stockQty: 30,
    mediaKeys: ['succulents'],
    attributes: { light: 'Full sun', watering: 'Monthly' },
  },
  {
    name: 'Hibiscus Shrub',
    slug: 'hibiscus-shrub',
    categoryName: 'Flowering Shrubs',
    description:
      'Vigorous Hibiscus shrub producing large, colorful trumpet-shaped blooms throughout the growing season.',
    price: 1200,
    stockQty: 55,
    mediaKeys: ['hibiscus'],
    attributes: { light: 'Full sun', watering: 'Every 2-3 days' },
  },
  {
    name: 'Bougainvillea Vine',
    slug: 'bougainvillea-vine',
    categoryName: 'Flowering Shrubs',
    description:
      'Hardy Bougainvillea with vivid papery bracts, ideal for fences, trellises, and boundary walls.',
    price: 1400,
    stockQty: 40,
    mediaKeys: ['bougainvillea'],
    attributes: { light: 'Full sun', watering: 'Every 3-4 days' },
  },
  {
    name: 'Neem Sapling',
    slug: 'neem-sapling',
    categoryName: 'Shade Trees',
    description:
      'Young Neem sapling valued for its shade, medicinal properties, and adaptability to local climates.',
    price: 800,
    stockQty: 50,
    mediaKeys: ['neem-tree'],
    attributes: { light: 'Full sun', watering: 'Every 2-3 days' },
  },
  {
    name: 'Money Plant Climber',
    slug: 'money-plant-climber',
    categoryName: 'Climbers & Vines',
    description:
      'Fast-growing Money Plant climber with heart-shaped leaves, popular for trellises and hanging displays.',
    price: 900,
    stockQty: 65,
    mediaKeys: ['climbing-vine'],
    attributes: { light: 'Medium indirect', watering: 'Weekly' },
  },
  {
    name: 'Glazed Ceramic Pot - Blue',
    slug: 'glazed-ceramic-pot-blue',
    categoryName: 'Ceramic Pots',
    description:
      'Elegant glazed ceramic pot in deep blue with a drainage hole, suited for medium-sized indoor plants.',
    price: 1900,
    stockQty: 40,
    isFeatured: true,
    mediaKeys: ['ceramic-pot'],
    attributes: { material: 'Ceramic', diameter: '20 cm' },
  },
  {
    name: 'Terracotta Ceramic Planter',
    slug: 'terracotta-ceramic-planter',
    categoryName: 'Ceramic Pots',
    description:
      'Classic handcrafted terracotta planter that provides excellent breathability for plant roots.',
    price: 1100,
    stockQty: 50,
    mediaKeys: ['terracotta-pot'],
    attributes: { material: 'Terracotta', diameter: '18 cm' },
  },
  {
    name: 'Self-Watering Plastic Planter',
    slug: 'self-watering-plastic-planter',
    categoryName: 'Plastic Planters',
    description:
      'Durable self-watering plastic planter with a built-in reservoir that reduces watering frequency.',
    price: 1600,
    stockQty: 45,
    mediaKeys: ['plastic-planter'],
    attributes: { material: 'Plastic', capacity: '3 L' },
  },
  {
    name: 'Macrame Hanging Planter',
    slug: 'macrame-hanging-planter',
    categoryName: 'Hanging Planters',
    description:
      'Handwoven macrame hanging planter holder that adds a boho touch to balconies and porches.',
    price: 1300,
    stockQty: 35,
    mediaKeys: ['hanging-planter'],
    attributes: { material: 'Cotton rope', style: 'Boho' },
  },
  {
    name: 'Organic Vermicompost 5kg',
    slug: 'organic-vermicompost-5kg',
    categoryName: 'Organic Fertilizers',
    description:
      'Nutrient-rich organic vermicompost made from earthworm castings, ideal for all plant types.',
    price: 700,
    stockQty: 100,
    isFeatured: true,
    mediaKeys: ['compost'],
    attributes: { type: 'Organic', weight: '5 kg' },
  },
  {
    name: 'NPK Fertilizer 1kg',
    slug: 'npk-fertilizer-1kg',
    categoryName: 'Organic Fertilizers',
    description:
      'Balanced NPK fertilizer blend that supports healthy root, leaf, and flower development.',
    price: 550,
    stockQty: 90,
    mediaKeys: ['compost'],
    attributes: { type: 'Mineral', weight: '1 kg' },
  },
  {
    name: 'Premium Potting Mix 10L',
    slug: 'premium-potting-mix-10l',
    categoryName: 'Potting Mix & Soil',
    description:
      'Well-draining premium potting mix blended with coco peat, perlite, and compost for healthy roots.',
    price: 850,
    stockQty: 80,
    mediaKeys: ['potting-soil'],
    attributes: { type: 'Potting mix', volume: '10 L' },
  },
  {
    name: 'Garden Hand Trowel Set',
    slug: 'garden-hand-trowel-set',
    categoryName: 'Hand Tools',
    description:
      'Sturdy stainless steel hand trowel and cultivator set with ergonomic grips for everyday gardening.',
    price: 950,
    stockQty: 60,
    mediaKeys: ['garden-tools'],
    attributes: { material: 'Stainless steel', pieces: '3' },
  },
  {
    name: 'Watering Can 5L',
    slug: 'watering-can-5l',
    categoryName: 'Watering Equipment',
    description:
      'Lightweight 5-litre watering can with a long spout for precise, gentle watering of indoor and outdoor plants.',
    price: 1100,
    stockQty: 55,
    mediaKeys: ['watering-can'],
    attributes: { material: 'Plastic', capacity: '5 L' },
  },
  {
    name: 'Bypass Pruning Shears',
    slug: 'bypass-pruning-shears',
    categoryName: 'Pruning Tools',
    description:
      'Sharp bypass pruning shears designed for clean cuts on stems, branches, and flowers.',
    price: 1250,
    stockQty: 40,
    mediaKeys: ['pruning-shears'],
    attributes: { material: 'Carbon steel', type: 'Bypass' },
  },
];

// Service category (under "Lawn Mowing & Restoration") used for the demo Gardener offering.
const SERVICE_CATEGORY_NAME = 'Lawn Mowing';

async function seed() {
  await connectDB();
  console.log('Connected to DB');

  // --- Guard: seed-categories.ts must have run first ---
  const productCategoryTypeIds = await CategoryTypeModel.find({ domain: 'PRODUCT' }).distinct('_id');
  const productCategoryCount = await CategoryModel.countDocuments({
    categoryTypeId: { $in: productCategoryTypeIds },
  });
  if (productCategoryTypeIds.length === 0 || productCategoryCount === 0) {
    throw new Error(
      'No PRODUCT categories found in the database. Run "npm run seed:categories" (src/scripts/seed-categories.ts) before running this script.'
    );
  }

  // --- Gardener demo user ---
  const gardenerEmail = 'gardener.expert@example.com';
  let gardenerUser = await UserModel.findOne({ email: gardenerEmail });
  if (!gardenerUser) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    gardenerUser = await UserModel.create({
      name: 'John the Gardener',
      email: gardenerEmail,
      passwordHash: hashedPassword,
      role: Roles.GARDENER,
    });
    console.log('Created Gardener User');
  }

  // --- Determine who media uploads should be attributed to ---
  let uploader = env.ADMIN_SEED_EMAIL ? await UserModel.findOne({ email: env.ADMIN_SEED_EMAIL }) : null;
  if (!uploader) {
    uploader = gardenerUser;
  }

  // --- Seed shared media pool ---
  const mediaIdByKey = new Map<string, string>();
  if (uploader) {
    for (const { key, label } of MEDIA_POOL) {
      const url = `https://placehold.co/800x600/dcfce7/166534?text=${encodeURIComponent(label)}`;
      const media = await MediaModel.findOneAndUpdate(
        { url },
        {
          provider: 'local',
          url,
          mimeType: 'image/jpeg',
          size: 100000,
          uploadedBy: uploader._id,
        },
        { upsert: true, new: true }
      );
      mediaIdByKey.set(key, media._id.toString());
    }
    console.log(`Seeded ${mediaIdByKey.size} media documents`);
  } else {
    console.warn('No admin or Gardener user available to attribute media uploads to; skipping media seed.');
  }

  // --- Seed products ---
  let productCount = 0;
  let featuredCount = 0;
  for (const p of PRODUCTS) {
    const categoryCode = normalizeCategoryCode(p.categoryName);
    const category = await CategoryModel.findOne({ categoryCode });
    if (!category) {
      console.warn(
        `⚠️ Category "${p.categoryName}" (${categoryCode}) not found, skipping product "${p.name}". Run seed-categories.ts first.`
      );
      continue;
    }

    const imageMediaIds = p.mediaKeys
      .map((key) => mediaIdByKey.get(key))
      .filter((id): id is string => Boolean(id));

    await ProductModel.findOneAndUpdate(
      { slug: p.slug },
      {
        name: p.name,
        slug: p.slug,
        categoryId: category._id,
        description: p.description,
        imageMediaIds,
        price: p.price,
        stockQty: p.stockQty,
        unit: p.unit,
        attributes: p.attributes,
        isActive: true,
        isFeatured: Boolean(p.isFeatured),
      },
      { upsert: true }
    );
    productCount++;
    if (p.isFeatured) featuredCount++;
  }
  console.log(`Seeded ${productCount} products (${featuredCount} featured)`);

  // --- Gardener demo service data ---
  const serviceCategoryCode = normalizeCategoryCode(SERVICE_CATEGORY_NAME);
  const catSvc = await CategoryModel.findOne({ categoryCode: serviceCategoryCode });
  if (!catSvc) {
    throw new Error(
      `Service category "${SERVICE_CATEGORY_NAME}" (${serviceCategoryCode}) not found. Run seed-categories.ts first.`
    );
  }

  let profile = await GardenerProfileModel.findOne({ userId: gardenerUser._id });
  if (!profile) {
    profile = await GardenerProfileModel.create({
      userId: gardenerUser._id,
      bio: 'Expert gardener with 10 years of experience in lawn care and landscaping.',
      serviceAreaCities: ['Lahore', 'Karachi'],
      experienceYears: 10,
      verificationStatus: 'approved',
      kycRegion: DEFAULT_KYC_REGION,
    });
    console.log('Created Gardener Profile');
  }

  await ServiceOfferingModel.findOneAndUpdate(
    { gardenerId: gardenerUser._id, categoryId: catSvc._id },
    {
      title: 'Premium Lawn Mowing',
      description: 'Full-service lawn care including mowing, edging, and trimming for residential lawns.',
      priceType: 'hourly',
      price: 1500,
      serviceAreaCities: ['Lahore', 'Karachi'],
      isActive: true,
    },
    { upsert: true }
  );
  console.log('Seeded Gardener Skill (Service Offering)');

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Failed to seed:', error);
  process.exit(1);
});
