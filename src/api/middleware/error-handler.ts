export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export type RouteHandler = (request: Request) => Promise<Response>;

export const handleError = (error: unknown): Response => {
  if (error instanceof ApiError) {
    return Response.json(
      {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : 'Internal error';
  return Response.json(
    {
      error: message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    },
    { status: 500 }
  );
};

export const withErrorHandler = (handler: RouteHandler): RouteHandler => async (request) => {
  try {
    return await handler(request);
  } catch (error) {
    return handleError(error);
  }
};
