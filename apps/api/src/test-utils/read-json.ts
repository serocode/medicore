// Node's fetch types return `Promise<unknown>` from `Response.json()`. Tests
// know the shape of the API responses they're asserting on, so this just
// gives them a typed way to say so instead of scattering `as` casts.
export async function readJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
