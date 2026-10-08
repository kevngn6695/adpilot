import type { ApiResult } from '@shared/types';

/** Thrown for any failed request; `issues` maps form field paths to messages. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly issues: Record<string, string> = {}
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError('Can’t reach the server. Check that the API is running, then try again.', 0);
  }

  if (response.status === 204) return undefined as T;

  let body: ApiResult<T>;
  try {
    body = (await response.json()) as ApiResult<T>;
  } catch {
    throw new ApiError(`The server sent an unreadable response (${response.status}).`, response.status);
  }

  if (!body.ok) throw new ApiError(body.error, response.status, body.issues);
  return body.data;
}
