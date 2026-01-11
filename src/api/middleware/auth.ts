import type { RequestContext, ContextualRouteHandler } from './request-context';

export type AuthorizeResult =
  | boolean
  | {
      allowed: boolean;
      statusCode?: number;
      code?: string;
      error?: string;
      details?: Record<string, unknown>;
    };

export type AuthorizeFn = (request: Request, context: RequestContext) => AuthorizeResult | Promise<AuthorizeResult>;

export type AuthGuardOptions = {
  authorize?: AuthorizeFn;
};

const defaultUnauthorized = () => ({
  statusCode: 401,
  code: 'UNAUTHORIZED',
  error: 'Unauthorized',
});

export const withAuthGuard = (handler: ContextualRouteHandler, options?: AuthGuardOptions): ContextualRouteHandler => {
  return async (request, context) => {
    if (!options?.authorize) {
      return handler(request, context);
    }

    if (request.method === 'OPTIONS') {
      return handler(request, context);
    }

    const decision = await options.authorize(request, context);
    const allowed = typeof decision === 'boolean' ? decision : decision.allowed;

    if (allowed) {
      return handler(request, context);
    }

    const fallback = defaultUnauthorized();
    const statusCode = typeof decision === 'boolean' ? fallback.statusCode : (decision.statusCode ?? fallback.statusCode);
    const code = typeof decision === 'boolean' ? fallback.code : (decision.code ?? fallback.code);
    const error = typeof decision === 'boolean' ? fallback.error : (decision.error ?? fallback.error);
    const details = typeof decision === 'boolean' ? undefined : decision.details;

    return Response.json(
      {
        error,
        code,
        statusCode,
        requestId: context.requestId,
        details,
      },
      {
        status: statusCode,
        headers: { 'x-request-id': context.requestId },
      }
    );
  };
};
