/**
 * Form validation schemas using Zod
 * Provides type-safe validation for forms with detailed error messages
 */

import { z } from 'zod';

// Common validation patterns
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

const coordinatesSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90)
]);

const locationSchema = z.object({
  coordinates: coordinatesSchema,
  address: z.string().min(1, 'Address is required'),
});

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  location: locationSchema.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .optional(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .optional(),
  email: emailSchema.optional(),
  location: locationSchema.optional(),
});

// Post/Incident schemas
export const createPostSchema = z.object({
  type: z.enum(['crime', 'accident', 'hazard', 'suspicious', 'emergency', 'other'], {
    required_error: 'Please select an alert type',
  }),
  title: z
    .string()
    .min(1, 'Title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  location: locationSchema,
  severity: z.enum(['low', 'medium', 'high', 'critical'], {
    required_error: 'Please select a severity level',
  }),
  media: z
    .array(z.instanceof(File))
    .max(5, 'Maximum 5 files allowed')
    .optional(),
});

export const updatePostSchema = createPostSchema.partial().extend({
  status: z.enum(['pending', 'verified', 'resolved', 'dismissed']).optional(),
});

// Alert schemas
export const createAlertSchema = z.object({
  type: z.enum(['critical', 'warning', 'info', 'safe'], {
    required_error: 'Please select an alert type',
  }),
  title: z
    .string()
    .min(1, 'Title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(500, 'Message must be less than 500 characters'),
  location: locationSchema,
  priority: z.enum(['low', 'medium', 'high', 'critical'], {
    required_error: 'Please select a priority level',
  }),
  targetAudience: z.enum(['all', 'authorities', 'citizens']).default('all'),
  radius: z
    .number()
    .min(0.1, 'Radius must be at least 0.1 km')
    .max(50, 'Radius cannot exceed 50 km')
    .optional(),
  expiresAt: z.string().datetime().optional(),
});

// Search/Filter schemas
export const postsFilterSchema = z.object({
  type: z.enum(['crime', 'accident', 'hazard', 'suspicious', 'emergency', 'other']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['pending', 'verified', 'resolved', 'dismissed']).optional(),
  location: z.object({
    coordinates: coordinatesSchema,
    radius: z.number().min(0.1).max(50),
  }).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const alertsFilterSchema = z.object({
  type: z.enum(['critical', 'warning', 'info', 'safe']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  location: z.object({
    coordinates: coordinatesSchema,
    radius: z.number().min(0.1).max(50),
  }).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Media upload validation
export const mediaFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].includes(file.type),
      'Only JPEG, PNG, WebP images and MP4, WebM videos are allowed'
    ),
});

// Utility function for form validation
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// Type exports for TypeScript
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type CreatePostFormData = z.infer<typeof createPostSchema>;
export type UpdatePostFormData = z.infer<typeof updatePostSchema>;
export type CreateAlertFormData = z.infer<typeof createAlertSchema>;
export type PostsFilterData = z.infer<typeof postsFilterSchema>;
export type AlertsFilterData = z.infer<typeof alertsFilterSchema>;
