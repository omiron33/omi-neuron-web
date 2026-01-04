import slugify from 'slugify';
import { nodeCreateSchema } from '../schemas/node';
import type { NeuronNodeCreate } from '../types/node';

export interface ProcessingOptions {
  skipDuplicates?: boolean;
  updateOnConflict?: boolean;
  defaultNodeType?: string;
  defaultDomain?: string;
  contentFields?: string[];
  labelField?: string;
  slugField?: string;
  metadataFields?: string[];
}

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, ' ');

const normalizeValue = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item) => normalizeValue(item)).filter(Boolean).join(' ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, nextKey));
    } else {
      result[nextKey] = value;
    }
  }
  return result;
};

export class DataProcessor {
  constructor(private options: ProcessingOptions = {}) {}

  processItem(item: Record<string, unknown>): NeuronNodeCreate {
    const flattened = flattenObject(item);
    const labelField = this.options.labelField ?? 'label';
    const label = normalizeValue(flattened[labelField]) ?? 'Untitled';

    const slugField = this.options.slugField;
    const slug = slugField ? normalizeValue(flattened[slugField]) : undefined;

    const content = this.extractContent(flattened);
    const metadata = this.extractMetadata(flattened);

    const node: NeuronNodeCreate = {
      slug,
      label,
      nodeType: this.options.defaultNodeType,
      domain: this.options.defaultDomain,
      content,
      metadata,
    };

    return nodeCreateSchema.parse(node);
  }

  processBatch(items: Record<string, unknown>[]): {
    nodes: NeuronNodeCreate[];
    errors: Array<{ index: number; error: string }>;
  } {
    const nodes: NeuronNodeCreate[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    items.forEach((item, index) => {
      try {
        nodes.push(this.processItem(item));
      } catch (error) {
        errors.push({
          index,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    return { nodes, errors };
  }

  processJSON(json: string): NeuronNodeCreate[] {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return this.processBatch(parsed).nodes;
    }
    return [this.processItem(parsed)];
  }

  processCSV(csv: string): NeuronNodeCreate[] {
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map((h) => h.trim());
    const items = lines.slice(1).map((line) => {
      const values = line.split(',');
      const item: Record<string, unknown> = {};
      headers.forEach((header, idx) => {
        item[header] = values[idx]?.trim();
      });
      return item;
    });
    return this.processBatch(items).nodes;
  }

  generateSlug(label: string, existingSlugs: Set<string> = new Set()): string {
    const base = slugify(label, { lower: true, strict: true, trim: true }).slice(0, 255);
    if (!existingSlugs.has(base)) return base;
    let suffix = 1;
    let slug = `${base}-${suffix}`;
    while (existingSlugs.has(slug)) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
    return slug;
  }

  extractContent(item: Record<string, unknown>): string {
    const fields = this.options.contentFields ?? ['label', 'summary', 'description', 'content'];
    const parts = fields
      .map((field) => normalizeValue(item[field]))
      .filter((value): value is string => Boolean(value));
    const joined = parts.join(' ');
    return stripHtml(joined).replace(/\s+/g, ' ').trim();
  }

  detectDuplicates(nodes: NeuronNodeCreate[]): {
    unique: NeuronNodeCreate[];
    duplicates: Array<{ node: NeuronNodeCreate; reason: string }>;
  } {
    const seen = new Set<string>();
    const unique: NeuronNodeCreate[] = [];
    const duplicates: Array<{ node: NeuronNodeCreate; reason: string }> = [];

    nodes.forEach((node) => {
      const slug = node.slug ?? this.generateSlug(node.label, seen);
      if (seen.has(slug)) {
        duplicates.push({ node, reason: `Duplicate slug: ${slug}` });
        return;
      }
      seen.add(slug);
      unique.push({ ...node, slug });
    });

    return { unique, duplicates };
  }

  private extractMetadata(item: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!this.options.metadataFields?.length) return undefined;
    const metadata: Record<string, unknown> = {};
    this.options.metadataFields.forEach((field) => {
      if (field in item) {
        metadata[field] = item[field];
      }
    });
    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }
}
