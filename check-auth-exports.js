const helpers = require('@supabase/auth-helpers-nextjs');
console.log('Has createMiddlewareClient:', !!helpers.createMiddlewareClient);
console.log('Exports:', Object.keys(helpers));
