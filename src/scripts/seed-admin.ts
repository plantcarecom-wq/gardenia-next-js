import { connectDB } from '../shared/lib/db';
import { userRepository } from '../modules/users/infrastructure/UserRepository';
import { hashPassword } from '../shared/lib/password';
import { Roles } from '../shared/types/roles';
import { env } from '../config/env';


async function seedAdmin() {
  try {
    await connectDB();

    const email = env.ADMIN_SEED_EMAIL;
    const password = env.ADMIN_SEED_PASSWORD;

    if (!email || !password) {
      console.error('ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD not provided in environment variables.');
      process.exit(1);
    }

    const existingAdmin = await userRepository.findByEmail(email);
    if (existingAdmin) {
      console.log('Super Admin already exists. Seed skipped.');
      process.exit(0);
    }

    const passwordHash = await hashPassword(password);

    await userRepository.create({
      name: 'Super Admin',
      email,
      passwordHash,
      role: Roles.SUPER_ADMIN,
      status: 'active',
    });

    console.log('✅ Super Admin seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed Super Admin:', error);
    process.exit(1);
  }
}

seedAdmin();
