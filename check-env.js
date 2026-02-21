require('dotenv').config();
console.log('DATABASE_URL loaded:', !!process.env.DATABASE_URL);
console.log('DIRECT_URL loaded:', !!process.env.DIRECT_URL);
if (process.env.DATABASE_URL) console.log('DATABASE_URL length:', process.env.DATABASE_URL.length);
