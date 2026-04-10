import { z } from 'zod'

export const jobTypeEnum = z.enum(['full-time', 'part-time', 'contract', 'internship'])
export const experienceEnum = z.enum(['entry', 'mid', 'senior', 'lead'])

const trimmedString = z.string().trim()
const nonEmptyTrimmed = trimmedString.min(1)

export const jobBaseSchema = z.object({
  title: nonEmptyTrimmed.max(100),
  department: nonEmptyTrimmed.max(100),
  location: nonEmptyTrimmed.max(100),
  type: jobTypeEnum,
  experience: experienceEnum,
  description: trimmedString.min(50),
  requirements: z.array(nonEmptyTrimmed).min(1).max(50),
  responsibilities: z.array(nonEmptyTrimmed).min(1).max(50),
  benefits: z.array(trimmedString).max(50).default([]),
  salary: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
    currency: nonEmptyTrimmed.max(10).default('INR'),
  }).refine(v => v.max >= v.min, { message: 'salary.max must be >= salary.min' }),
  tags: z.array(trimmedString).max(50).default([]),
  company: nonEmptyTrimmed.max(100).optional(),
  contactEmail: trimmedString.email(),
  postedDate: z.string().datetime().optional(),
  deadline: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
})

export const jobCreateSchema = jobBaseSchema

export const jobUpdateSchema = jobBaseSchema.partial()

export type JobCreateInput = z.infer<typeof jobCreateSchema>
export type JobUpdateInput = z.infer<typeof jobUpdateSchema>


