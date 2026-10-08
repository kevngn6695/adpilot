import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodError } from 'zod';
import type { ApiFailure, ApiSuccess } from '../../../shared/types.js';

export function sendData<T>(res: Response, data: T, status = 200): void {
  const body: ApiSuccess<T> = { ok: true, data };
  res.status(status).json(body);
}

export function sendError(
  res: Response,
  status: number,
  error: string,
  issues?: Record<string, string>
): void {
  const body: ApiFailure = { ok: false, error, ...(issues ? { issues } : {}) };
  res.status(status).json(body);
}

/** Flattens a Zod error into `{ "audience.ageMin": "message" }` for form fields. */
export function zodIssues(error: ZodError): Record<string, string> {
  const issues: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'body';
    issues[key] ??= issue.message;
  }
  return issues;
}

/** Forwards a rejected promise to Express's error handler (Express 4 doesn't). */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/** Parses a positive integer route param, or returns null. */
export function parseId(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
