import { connectDB } from '../shared/lib/db';
import { PostModel } from '../modules/content/infrastructure/post.model';
import { UserModel } from '../modules/users/infrastructure/user.model';
import { env } from '../config/env';

type PostSeed = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
};

const POSTS: PostSeed[] = [
  {
    title: 'Watering Basics: How Often Should You Really Water Your Plants?',
    slug: 'watering-basics-how-often',
    excerpt: 'The most common way to kill a houseplant is overwatering, not underwatering. Here\'s how to get it right.',
    body: `Most houseplant deaths come from overwatering, not neglect. Roots need oxygen as much as they need water, and soil that stays soggy suffocates them, inviting root rot.

Instead of watering on a fixed schedule, check the soil. Push a finger about two inches into the pot. If it's dry at that depth, it's time to water. If it's still moist, wait a few more days and check again.

Different plants have very different needs. Succulents and cacti prefer to dry out almost completely between waterings. Tropical plants like Monstera and Peace Lily like consistent moisture but still don't want to sit in water. Ferns are thirstier still and rarely want to fully dry out.

Always make sure your pot has drainage holes, and empty any saucer that collects excess water within 30 minutes of watering. Letting a pot sit in standing water is one of the fastest ways to cause root rot, even if you're otherwise watering correctly.

In Pakistan's hot summer months, indoor plants will dry out faster and may need water every 3-4 days, while in winter the same plant might go 10-14 days between waterings.`,
  },
  {
    title: 'Understanding Light Requirements: Bright Indirect vs Direct Sun',
    slug: 'understanding-light-requirements',
    excerpt: 'Light is the single biggest factor in whether your plant thrives or just survives. Here\'s how to read your space.',
    body: `Plant tags often say "bright indirect light," but what does that actually mean in your home?

Direct sun is unfiltered sunlight hitting the leaves directly, usually from a south or west-facing window. It's intense and can scorch the leaves of plants that aren't adapted to it.

Bright indirect light is what you get near a window but out of the direct sun path, or through a sheer curtain. Most popular houseplants like Monstera, Pothos, and Peace Lily thrive here.

Low light doesn't mean no light. It means away from windows but still in a room with natural daylight. Snake Plants and ZZ Plants tolerate this well, but "tolerate" doesn't mean "thrive" — they'll grow slower and may not flower.

A simple test: hold your hand about a foot above where the plant sits during the brightest part of the day. If you see a sharp, defined shadow, that's direct light. A soft, fuzzy shadow means bright indirect. Barely any shadow means low light.

If a plant's leaves are pale, stretched out, or leaning hard toward the window, it's asking for more light. If leaves are scorched, crispy, or bleached, it's getting too much direct sun.`,
  },
  {
    title: 'When and How to Repot: Signs Your Plant Has Outgrown Its Pot',
    slug: 'when-and-how-to-repot',
    excerpt: 'Repotting at the right time keeps roots healthy and prevents your plant from getting stuck in a growth plateau.',
    body: `Plants don't need repotting as often as people think — most houseplants are happy in the same pot for one to two years. But there are clear signs it's time.

Roots growing out of the drainage holes, or circling tightly around the inside of the pot, mean the plant is rootbound. Water running straight through the pot without being absorbed is another sign — it means there's more root than soil left to hold moisture.

The best time to repot is during spring or early summer, when the plant is actively growing and can recover quickly. Avoid repotting in winter when growth slows down.

Choose a new pot only one to two inches larger in diameter than the current one. A pot that's too large holds excess soil that stays wet for too long, which can lead to root rot.

Gently loosen the roots at the bottom and sides before placing the plant in fresh potting mix. Water thoroughly after repotting, then hold off on fertilizing for about four weeks to let the roots settle in without stress.`,
  },
  {
    title: 'Common Houseplant Pests in Pakistan and How to Deal With Them',
    slug: 'common-houseplant-pests-pakistan',
    excerpt: 'From mealybugs to spider mites, here\'s how to spot the most common pests early and treat them before they spread.',
    body: `Pests are far easier to manage when caught early, so it's worth inspecting your plants — especially the undersides of leaves and new growth — every week or two.

Mealybugs look like small clumps of white cotton, usually clustered where leaves meet stems. Dab them directly with a cotton swab dipped in rubbing alcohol, then follow up with a neem oil spray weekly until they're gone.

Spider mites are tiny and hard to see, but their damage isn't: fine speckled yellowing on leaves and faint webbing in bad infestations. They thrive in hot, dry conditions, which makes them common during Pakistani summers. Increasing humidity and spraying leaves with water helps, along with neem oil treatment.

Fungus gnats are small flies that hover around the soil surface. They're mostly a nuisance but signal that your soil is staying too wet. Let the top inch of soil dry out fully between waterings and consider a layer of sand on top of the soil to disrupt their breeding cycle.

Scale insects appear as small, waxy brown bumps on stems and leaves. They can be scraped off gently with a fingernail or soft brush, followed by a neem oil treatment.

For most minor infestations, a weekly neem oil spray (diluted per the label) is a safe, effective first line of defense that also works as prevention.`,
  },
  {
    title: 'Indoor Plant Care Through Pakistan\'s Seasons',
    slug: 'indoor-plant-care-pakistan-seasons',
    excerpt: 'Your plant\'s needs change with the weather outside, even if it never leaves your living room. Here\'s what to adjust.',
    body: `Indoor plants respond to seasonal changes even when they're not directly exposed to the outdoors, because light levels, humidity, and temperature all shift indoors too.

In summer, high heat means faster soil drying and more frequent watering — sometimes daily for smaller pots in peak heat. Move plants away from direct afternoon sun near west-facing windows, where intense light can scorch leaves. Increased humidity from watering also raises the risk of fungal issues, so make sure there's good airflow.

Monsoon season brings high humidity, which most tropical houseplants enjoy, but it also raises the risk of root rot if soil doesn't dry between waterings and of fungal leaf spots if leaves stay wet. Water less frequently during this period and ensure pots drain well.

Winter slows most plants' growth significantly. Reduce watering frequency, hold off on fertilizing until spring, and keep plants away from cold drafts and heaters, both of which can stress them. Dry winter air from indoor heating can also stress tropical plants — a light misting or a humidity tray can help.

Spring is the active growing season for most houseplants. This is the best time to repot, resume regular fertilizing, and propagate cuttings, since the plant has the energy to recover and put on new growth.`,
  },
  {
    title: 'Choosing the Right Pot: Material, Size, and Drainage Explained',
    slug: 'choosing-the-right-pot',
    excerpt: 'The pot you choose affects how often you\'ll need to water and how healthy your plant\'s roots stay.',
    body: `It's easy to choose a pot based on looks alone, but material and drainage matter just as much for plant health.

Terracotta pots are porous, which means they let excess moisture evaporate through the walls. This makes them forgiving for plants prone to overwatering, like succulents and cacti, but it also means soil dries out faster, so you'll water more often.

Ceramic and glazed pots hold moisture longer since the glaze seals the porous clay. They work well for plants that like consistent moisture, like ferns and Peace Lilies, but require more careful watering to avoid waterlogging.

Plastic pots are lightweight, retain moisture longer than terracotta, and are the most affordable option. They're a solid, low-maintenance default for most houseplants.

Regardless of material, drainage holes are non-negotiable. A pot without drainage traps excess water at the bottom, which suffocates roots and leads to rot, even if you're watering carefully. If you love a pot without holes, use it as a decorative outer cover and keep the plant in its original nursery pot with drainage inside.

On sizing: go only one to two inches larger than the current pot when upgrading. Oversized pots hold too much soil relative to the roots, which stays wet for too long and increases the risk of root rot.`,
  },
];

async function seedBlog() {
  await connectDB();
  console.log('Connected to DB');

  const author = env.ADMIN_SEED_EMAIL ? await UserModel.findOne({ email: env.ADMIN_SEED_EMAIL }) : null;

  let count = 0;
  for (const post of POSTS) {
    await PostModel.findOneAndUpdate(
      { slug: post.slug },
      {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        body: post.body,
        isPublished: true,
        publishedAt: new Date(),
        authorId: author?._id,
      },
      { upsert: true }
    );
    count++;
  }
  console.log(`Seeded ${count} blog posts`);
  process.exit(0);
}

seedBlog().catch((error) => {
  console.error('❌ Failed to seed blog:', error);
  process.exit(1);
});
