import { z } from 'zod';

export const InstagramStringListDataSchema = z.object({
  href: z.string().optional(),
  value: z.string().optional(),
  timestamp: z.number().optional(),
});

export const InstagramModernEntrySchema = z.object({
  title: z.string().optional(),
  media_list_data: z.array(z.unknown()).optional(),
  string_list_data: z.array(InstagramStringListDataSchema).optional(),
});

export const FollowersExportWrapperSchema = z.object({
  relationships_followers: z.array(InstagramModernEntrySchema),
});

export const FollowingExportWrapperSchema = z.object({
  relationships_following: z.array(InstagramModernEntrySchema),
});

export const ModernEntryListSchema = z.array(InstagramModernEntrySchema);

