#!/usr/bin/env tsx

/**
 * Production Deployment Validation Script
 * 
 * This script helps validate that all required environment variables
 * and configurations are properly set for production deployment.
 */

import { config, validateEnvironment } from '../src/lib/config';

console.log('🚀 Production Deployment Validation');
console.log('=====================================\n');

// Check environment
console.log('📋 Environment Check:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  Environment: ${config.environment}`);
console.log(`  Is Production: ${config.isProduction}`);
console.log(`  Is Development: ${config.isDevelopment}\n`);

// Check required environment variables
console.log('🔑 Required Environment Variables:');
const requiredVars = [
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'MONGODB_URI',
  'CLERK_WEBHOOK_SECRET'
];

const missingVars: string[] = [];
const presentVars: string[] = [];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    presentVars.push(varName);
    // Mask sensitive values
    const maskedValue = varName.includes('SECRET') || varName.includes('KEY') 
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : value;
    console.log(`  ✅ ${varName}: ${maskedValue}`);
  } else {
    missingVars.push(varName);
    console.log(`  ❌ ${varName}: NOT SET`);
  }
});

console.log('');

// Check Clerk configuration
console.log('🔐 Clerk Configuration:');
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
if (clerkSecretKey) {
  if (clerkSecretKey.startsWith('sk_test_')) {
    console.log('  ⚠️  WARNING: Using TEST Clerk keys in production!');
    console.log('     You need to switch to production keys (sk_live_*)');
  } else if (clerkSecretKey.startsWith('sk_live_')) {
    console.log('  ✅ Using production Clerk keys');
  } else {
    console.log('  ❓ Unknown Clerk key format');
  }
} else {
  console.log('  ❌ Clerk secret key not set');
}

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (clerkPublishableKey) {
  if (clerkPublishableKey.startsWith('pk_test_')) {
    console.log('  ⚠️  WARNING: Using TEST Clerk publishable key in production!');
    console.log('     You need to switch to production keys (pk_live_*)');
  } else if (clerkPublishableKey.startsWith('pk_live_')) {
    console.log('  ✅ Using production Clerk publishable key');
  } else {
    console.log('  ❓ Unknown Clerk publishable key format');
  }
} else {
  console.log('  ❌ Clerk publishable key not set');
}

console.log('');

// Check MongoDB configuration
console.log('🗄️  MongoDB Configuration:');
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  if (mongoUri.includes('/careers?')) {
    console.log('  ⚠️  WARNING: MongoDB URI points to "careers" database');
    console.log('     Should be "hr" database for production');
  } else if (mongoUri.includes('/hr?')) {
    console.log('  ✅ MongoDB URI points to "hr" database');
  } else {
    console.log('  ❓ MongoDB URI database name unclear');
  }
  
  // Check if URI is complete
  if (mongoUri.includes('mongodb+srv://') && mongoUri.includes('@') && mongoUri.includes('.mongodb.net/')) {
    console.log('  ✅ MongoDB URI format looks correct');
  } else {
    console.log('  ❌ MongoDB URI format appears incomplete');
  }
} else {
  console.log('  ❌ MongoDB URI not set');
}

console.log('');

// Check CORS configuration
console.log('🌐 CORS Configuration:');
console.log(`  Allowed Origins: ${config.api.cors.allowedOrigins.length} origins configured`);
console.log(`  Allowed Methods: ${config.api.cors.allowedMethods.join(', ')}`);
console.log(`  Credentials: ${config.isProduction ? 'enabled' : 'disabled'}`);

// Show some allowed origins
const origins = config.api.cors.allowedOrigins.slice(0, 3);
console.log(`  Sample Origins: ${origins.map(o => typeof o === 'string' ? o : o.toString()).join(', ')}`);

console.log('');

// Validation summary
console.log('📊 Validation Summary:');
console.log(`  ✅ Present Variables: ${presentVars.length}/${requiredVars.length}`);
console.log(`  ❌ Missing Variables: ${missingVars.length}`);

if (missingVars.length > 0) {
  console.log('\n🚨 CRITICAL: Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`     - ${varName}`);
  });
  console.log('\n   Please set these in your Vercel environment variables before deploying.');
}

// Check for test keys in production
const hasTestKeys = (clerkSecretKey?.startsWith('sk_test_') || clerkPublishableKey?.startsWith('pk_test_'));
if (hasTestKeys && config.isProduction) {
  console.log('\n⚠️  WARNING: Using test Clerk keys in production environment!');
  console.log('   This will cause authentication failures.');
  console.log('   Switch to production keys (sk_live_*, pk_live_*) in Vercel.');
}

// Check MongoDB database name
if (mongoUri?.includes('/careers?') && config.isProduction) {
  console.log('\n⚠️  WARNING: MongoDB URI points to "careers" database in production!');
  console.log('   Should be "hr" database for production use.');
}

console.log('\n🎯 Next Steps:');
if (missingVars.length === 0 && !hasTestKeys && !mongoUri?.includes('/careers?')) {
  console.log('  ✅ All checks passed! Ready for production deployment.');
  console.log('  📝 Deploy to Vercel and test the authentication endpoint:');
  console.log('     https://your-domain.com/api/test-auth');
} else {
  console.log('  🔧 Fix the issues above before deploying to production.');
  console.log('  📚 See docs/production-troubleshooting.md for detailed instructions.');
}

console.log('\n📚 For more help, see: docs/production-troubleshooting.md');
