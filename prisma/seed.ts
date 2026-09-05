import { seedDatabase } from '../src/lib/seedDatabase';

seedDatabase()
  .then((res) => {
    console.log('✅ Hotel Sherpa Soul PMS database seeded successfully:', res.message);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  });
