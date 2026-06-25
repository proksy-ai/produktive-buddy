export const REQUEST_ID_HEADER = "x-request-id";

export interface LogContext {
  requestId?: string;
  route?: string;
  method?: string;
  actorId?: string | null;
  status?: number;
  durationMs?: number;
  errorCode?: string;
  [key: string]: unknown;
}

function errorToObject(err: unknown) {
  if (!(err instanceof Error)) return undefined;
  return {
    name: err.name,
    message: err.message,
    stack: err.stack,
  };
}

function write(level: "info" | "warn" | "error", message: string, context: LogContext = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  if (level === "error") {
    console.error(JSON.stringify(payload));
  } else if (level === "warn") {
    console.warn(JSON.stringify(payload));
  } else {
    console.info(JSON.stringify(payload));
  }
}

export function requestLogContext(request: Request): LogContext {
  const url = new URL(request.url);
  return {
    requestId: request.headers.get(REQUEST_ID_HEADER) ?? undefined,
    route: url.pathname,
    method: request.method,
  };
}

export function info(message: string, context: LogContext = {}) {
  write("info", message, context);
}

export function warn(message: string, context: LogContext = {}) {
  write("warn", message, context);
}

export function error(message: string, err: unknown, context: LogContext = {}) {
  write("error", message, {
    ...context,
    error: errorToObject(err),
  });
}

export function isUnauthorizedError(err: unknown): boolean {
  return err instanceof Error && err.message === "Unauthorized";
}
