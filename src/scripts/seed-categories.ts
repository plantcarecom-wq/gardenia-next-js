import { connectDB } from '../shared/lib/db';
import { CategoryTypeModel } from '../modules/catalog/infrastructure/category-type.model';
import { CategoryModel } from '../modules/catalog/infrastructure/category.model';
import { normalizeCategoryCode } from '../modules/catalog/domain/category.utils';

type CategoryTypeSeed = {
  name: string;
  domain: 'PRODUCT' | 'SERVICE';
  categories: string[];
};

/**
 * Full catalog taxonomy for a Pakistani plant-nursery storefront.
 * Each CategoryType gets several real Category documents underneath it,
 * since Product.categoryId references Category (not CategoryType).
 */
const CATEGORY_TYPES: CategoryTypeSeed[] = [
  // ---- PRODUCT domain ----
  {
    name: 'Indoor Plants',
    domain: 'PRODUCT',
    categories: ['Air-Purifying Plants', 'Low-Light Plants', 'Flowering Indoor Plants', 'Succulents & Cacti'],
  },
  {
    name: 'Outdoor Plants',
    domain: 'PRODUCT',
    categories: ['Flowering Shrubs', 'Shade Trees', 'Climbers & Vines'],
  },
  {
    name: 'Pots & Planters',
    domain: 'PRODUCT',
    categories: ['Ceramic Pots', 'Plastic Planters', 'Hanging Planters'],
  },
  {
    name: 'Fertilizers & Soil',
    domain: 'PRODUCT',
    categories: ['Organic Fertilizers', 'Potting Mix & Soil', 'Plant Growth Boosters'],
  },
  {
    name: 'Garden Tools',
    domain: 'PRODUCT',
    categories: ['Hand Tools', 'Watering Equipment', 'Pruning Tools'],
  },
  // ---- SERVICE domain ----
  {
    name: 'Garden Care',
    domain: 'SERVICE',
    categories: ['Plant Health Checkups', 'Pest & Disease Control', 'Routine Garden Maintenance'],
  },
  {
    name: 'Landscaping',
    domain: 'SERVICE',
    categories: ['Garden Design & Installation', 'Hardscaping', 'Irrigation Setup'],
  },
  {
    name: 'Lawn Mowing & Restoration',
    domain: 'SERVICE',
    categories: ['Lawn Mowing', 'Lawn Renovation', 'Turf Fertilization'],
  },
  {
    name: 'Garden Design',
    domain: 'SERVICE',
    categories: ['Residential Garden Design', 'Rooftop & Balcony Gardens', 'Vertical Gardens'],
  },
];

async function seedCategories() {
  try {
    await connectDB();

    let categoryTypeCount = 0;
    let categoryCount = 0;

    for (let typeIndex = 0; typeIndex < CATEGORY_TYPES.length; typeIndex++) {
      const { name, domain, categories } = CATEGORY_TYPES[typeIndex];
      const categoryTypeCode = normalizeCategoryCode(name);

      const categoryType = await CategoryTypeModel.findOneAndUpdate(
        { categoryTypeCode },
        { name, domain, categoryTypeCode, sortOrder: typeIndex, isActive: true },
        { upsert: true, new: true }
      );
      categoryTypeCount++;

      for (let catIndex = 0; catIndex < categories.length; catIndex++) {
        const categoryName = categories[catIndex];
        const categoryCode = normalizeCategoryCode(categoryName);

        await CategoryModel.findOneAndUpdate(
          { categoryCode },
          {
            name: categoryName,
            categoryCode,
            categoryTypeId: categoryType._id,
            sortOrder: catIndex,
            isActive: true,
          },
          { upsert: true }
        );
        categoryCount++;
      }
    }

    console.log(
      `✅ Categories seeded successfully: ${categoryTypeCount} category types, ${categoryCount} categories.`
    );
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed categories:', error);
    process.exit(1);
  }
}

seedCategories();
