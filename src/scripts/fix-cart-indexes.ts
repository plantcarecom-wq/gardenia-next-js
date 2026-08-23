/**
 * One-off maintenance script: rebuilds the `carts` collection's indexes
 * from the current schema.
 *
 * Why this is needed: the `customerId` and `sessionId` fields were declared
 * `unique: true, sparse: true` in cart.model.ts, but MongoDB does not
 * retroactively alter an index's options when a schema changes — an index
 * created before `sparse: true` was added stays non-sparse in the database.
 * A non-sparse unique index treats every document missing the field as
 * having the field set to `null`, so the *second* guest cart ever created
 * (no `customerId`) collides with the first on `E11000 duplicate key error
 * ... dup key: { customerId: null }`, and guest checkout/cart breaks
 * entirely. Run this once against any environment's database to fix it:
 *
 *   npm run db:fix-cart-indexes
 */
import { connectDB } from '@/shared/lib/db';
import { CartModel } from '@/modules/orders/infrastructure/cart.model';
import mongoose from 'mongoose';

async function main() {
  await connectDB();
  const coll = mongoose.connection.collection('carts');

  const before = await coll.indexes();
  console.log('Indexes before:', JSON.stringify(before));

  for (const idx of before) {
    if (idx.name !== '_id_' && (idx.key.customerId !== undefined || idx.key.sessionId !== undefined)) {
      console.log(`Dropping index for clean rebuild: ${idx.name}`);
      await coll.dropIndex(idx.name!);
    }
  }

  await CartModel.syncIndexes();

  // A sparse index only excludes documents where the field is entirely
  // *absent* — a document that already has customerId/sessionId explicitly
  // set to `null` (a leftover from before this fix) still collides under
  // the now-sparse index. Normalize those to genuinely absent so they're
  // excluded too, without touching any cart's actual items.
  const unsetCustomer = await coll.updateMany({ customerId: null }, { $unset: { customerId: '' } });
  const unsetSession = await coll.updateMany({ sessionId: null }, { $unset: { sessionId: '' } });
  console.log('Normalized explicit-null customerId docs:', unsetCustomer.modifiedCount);
  console.log('Normalized explicit-null sessionId docs:', unsetSession.modifiedCount);

  const after = await coll.indexes();
  console.log('Indexes after:', JSON.stringify(after));

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
