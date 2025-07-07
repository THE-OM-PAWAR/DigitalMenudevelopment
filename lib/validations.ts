import { z } from 'zod';

export const SignUpSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters').max(50, 'Username must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const OutletSchema = z.object({
  name: z.string().min(2, 'Outlet name must be at least 2 characters').max(100, 'Outlet name must be less than 100 characters'),
});

export const CategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Category name must be less than 50 characters'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  image: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

export const QuantitySchema = z.object({
  value: z.number().min(0, 'Quantity value must be positive'),
  description: z.string().min(1, 'Description is required').max(200, 'Description must be less than 200 characters'),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type OutletInput = z.infer<typeof OutletSchema>;