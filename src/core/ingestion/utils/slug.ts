import crypto from 'node:crypto';
import slugify from 'slugify';

const shortHash = (value: string): string =>
  crypto.createHash('sha256').update(value).digest('hex').slice(0, 10);

export const stableSlugBase = (title: string): string => {
  const raw = title?.trim() ? title : 'untitled';
  return slugify(raw, { lower: true, strict: true, trim: true }).slice(0, 200);
};

/**
 * Build a deterministic, source-aware slug.
 *
 * This is used to guarantee global uniqueness across multiple sources while keeping slugs readable.
 */
export const buildSourceAwareSlug = (params: { title: string; sourceKey: string; externalId: string }): string => {
  const base = stableSlugBase(params.title);
  const suffix = shortHash(`${params.sourceKey}:${params.externalId}`);
  return `${base}-${suffix}`.slice(0, 255);
};

