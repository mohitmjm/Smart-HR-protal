/**
 * Development Authentication Bypass
 *
 * When NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set,
 * this module provides a mock authenticated admin user for local development.
 *
 * THIS IS NEVER USED IN PRODUCTION.
 */

export const DEV_BYPASS_ENABLED =
  process.env.NODE_ENV === 'development' &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const DEV_USER = {
  userId: 'dev_user_admin_001',
  email: 'admin@tielo.dev',
  firstName: 'Dev',
  lastName: 'Admin',
  role: 'HR Manager',
  permissions: ['*'], // All permissions in dev
};
