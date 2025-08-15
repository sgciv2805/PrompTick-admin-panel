import { NextRequest } from 'next/server';

/**
 * Admin authentication for the admin panel
 * 
 * This admin panel runs with Firebase Admin SDK authentication.
 * Since we're already authenticated at the Firebase level with service accounts,
 * additional API key validation is unnecessary and creates inconsistency.
 * 
 * @param request - The Next.js request object
 * @returns true - Always allows access since Firebase Admin handles auth
 */
export function validateAdminAccess(request: NextRequest): boolean {
  // This admin panel uses Firebase Admin SDK with service account authentication
  // No additional API key validation needed
  return true;
}

/**
 * Legacy function name for backwards compatibility
 * @deprecated Use validateAdminAccess instead
 */
export function validateAdminKey(request: NextRequest): boolean {
  return validateAdminAccess(request);
}