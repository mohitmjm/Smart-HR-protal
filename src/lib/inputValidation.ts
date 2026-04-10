import { z } from 'zod';

// Common validation schemas
export const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 100) : 10),
  search: z.string().max(100).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export const userIdSchema = z.object({
  userId: z.string().min(1).max(100)
});

export const leaveIdSchema = z.object({
  leaveId: z.string().min(1).max(100)
});

export const teamIdSchema = z.object({
  teamId: z.string().min(1).max(100)
});

// Sanitize string inputs
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

// Validate and sanitize request body
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: any): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

// Validate URL parameters
export function validateParams<T>(schema: z.ZodSchema<T>, params: any): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Parameter validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}
