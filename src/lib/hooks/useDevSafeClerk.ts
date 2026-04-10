'use client'

/**
 * Dev-safe Clerk hook replacements.
 *
 * In development WITHOUT a Clerk publishable key, these hooks return
 * a mock admin user so the HR portal works without authentication.
 *
 * In production (or when the key is set), real Clerk hooks are used.
 */

import { DEV_BYPASS_ENABLED, DEV_USER } from '../devAuth'

// Lazy-load real Clerk hooks only when not bypassed
function getClerkHooks() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@clerk/nextjs')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MOCK_USER: any = {
  id: DEV_USER.userId,
  firstName: DEV_USER.firstName,
  lastName: DEV_USER.lastName,
  fullName: `${DEV_USER.firstName} ${DEV_USER.lastName}`,
  emailAddresses: [{ emailAddress: DEV_USER.email, id: 'dev_email' }],
  primaryEmailAddressId: 'dev_email',
  imageUrl: '',
  username: 'dev-admin',
  publicMetadata: { role: DEV_USER.role },
}

export function useDevSafeUser() {
  if (DEV_BYPASS_ENABLED) {
    return { user: MOCK_USER, isLoaded: true, isSignedIn: true }
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return getClerkHooks().useUser()
}

export function useDevSafeAuth() {
  if (DEV_BYPASS_ENABLED) {
    return {
      isLoaded: true,
      isSignedIn: true,
      userId: DEV_USER.userId,
      sessionId: 'dev_session',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signOut: async () => {},
    }
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return getClerkHooks().useAuth()
}

export function useDevSafeClerk() {
  if (DEV_BYPASS_ENABLED) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signOut: async () => {},
      openUserProfile: () => {},
    }
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return getClerkHooks().useClerk()
}
