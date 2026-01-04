---
title: API Middleware - Validation, Errors, CORS
status: completed
priority: 2
labels:
  - 'Phase:3-API'
  - 'Type:Middleware'
assignees:
  - CodingAgent
depends_on:
  - task-3-3-api-routes
---

# Task 3.4: API Middleware

## Objective
Build middleware stack for validation, error handling, logging, and CORS.

## Requirements

### 1. Validation Middleware (`src/api/middleware/validation.ts`)

```typescript
function withValidation<T>(
  schema: z.ZodSchema<T>,
  source: 'body' | 'query' | 'params'
) {
  return async (request: Request) => {
    // Extract and validate data
    // Throw ValidationError if invalid
    return validatedData;
  };
}
```

### 2. Error Handling (`src/api/middleware/error-handler.ts`)

```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}

function withErrorHandler(handler: RouteHandler) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      return handleError(error);
    }
  };
}
```

### 3. Logging Middleware (`src/api/middleware/logging.ts`)
- [ ] Log request method, path, timing
- [ ] Log response status
- [ ] Log errors with stack traces
- [ ] Configurable log level

### 4. CORS Middleware (`src/api/middleware/cors.ts`)
- [ ] Configurable origins
- [ ] Handle preflight
- [ ] Set appropriate headers

### 5. Timing Middleware (`src/api/middleware/timing.ts`)
- [ ] Track request duration
- [ ] Add timing header
- [ ] Include in response meta

### 6. Combined Middleware (`src/api/middleware/index.ts`)

```typescript
function withNeuronMiddleware(
  handler: RouteHandler,
  options?: MiddlewareOptions
) {
  return compose(
    withErrorHandler,
    withLogging,
    withTiming,
    options?.cors ? withCors(options.cors) : identity,
  )(handler);
}
```

## Deliverables
- [ ] `src/api/middleware/validation.ts`
- [ ] `src/api/middleware/error-handler.ts`
- [ ] `src/api/middleware/logging.ts`
- [ ] `src/api/middleware/cors.ts`
- [ ] `src/api/middleware/timing.ts`
- [ ] `src/api/middleware/index.ts`

## Error Response Format

```typescript
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "statusCode": 400,
  "details": {
    "field": "label",
    "message": "Required"
  }
}
```

## Error Codes
- `VALIDATION_ERROR` (400)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `RATE_LIMITED` (429)
- `INTERNAL_ERROR` (500)
- `DATABASE_ERROR` (500)
- `OPENAI_ERROR` (502)

## Acceptance Criteria
- Validation errors are clear
- All errors have consistent format
- Logging captures useful info
- CORS works for configured origins
- Timing is accurate

## Notes
- Use Zod for validation
- Don't expose stack traces in production
- Consider rate limiting (optional)

