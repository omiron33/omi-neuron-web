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

export type ErrorHandlerContext = {
  requestId?: string;
};

export const handleError = (error: unknown, context?: ErrorHandlerContext): Response => {
  if (error instanceof ApiError) {
    return Response.json(
      {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        requestId: context?.requestId,
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
      requestId: context?.requestId,
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
