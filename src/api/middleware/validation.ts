import type { z } from 'zod';
import { ApiError } from './error-handler';

export const withValidation = <T>(schema: z.ZodSchema<T>, source: 'body' | 'query' | 'params') => {
  return async (request: Request): Promise<T> => {
    let data: unknown;
    if (source === 'body') {
      data = await request.json();
    } else if (source === 'query') {
      const url = new URL(request.url);
      data = Object.fromEntries(url.searchParams.entries());
    } else {
      data = {};
    }

    const result = schema.safeParse(data);
    if (!result.success) {
      throw new ApiError('Validation failed', 'VALIDATION_ERROR', 400, {
        issues: result.error.issues,
      });
    }

    return result.data;
  };
};
