import { auth as clerkAuth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { DEV_BYPASS_ENABLED, DEV_USER } from './devAuth';

export const auth = async () => {
  if (DEV_BYPASS_ENABLED) {
    return {
      userId: DEV_USER.userId,
      sessionClaims: {
        email: DEV_USER.email,
        firstName: DEV_USER.firstName,
        lastName: DEV_USER.lastName
      }
    };
  }
  return await clerkAuth();
};

export const currentUser = async () => {
  if (DEV_BYPASS_ENABLED) {
    return {
      id: DEV_USER.userId,
      firstName: DEV_USER.firstName,
      lastName: DEV_USER.lastName,
      emailAddresses: [{ emailAddress: DEV_USER.email }],
      publicMetadata: {}
    };
  }
  return await clerkCurrentUser();
};
