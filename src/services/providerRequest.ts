/// <reference types="vite/client" />

/** Bounded per-browser caching and request coalescing for public, non-user data. */
export class RequestCache<T> {
  private readonly values = new Map<string, { value: T; expiresAt: number }>();
  private readonly pending = new Map<string, Promise<T>>();

  constructor(private readonly capacity = 100, private readonly ttlMs = 120_000) {}

  get(key: string): T | undefined {
    const entry = this.values.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.values.delete(key);
      return undefined;
    }
    this.values.delete(key);
    this.values.set(key, entry);
    return entry.value;
  }

  async load(key: string, loader: () => Promise<T>, forceRefresh = false): Promise<T> {
    // A forced refresh still shares an already-running request.
    const active = this.pending.get(key);
    if (active) return active;
    const value = forceRefresh ? undefined : this.get(key);
    if (value !== undefined) return value;
    if (this.pending.size >= this.capacity) throw new Error('Too many pending provider requests');

    const request = Promise.resolve().then(loader).then(result => {
      for (const [existingKey, entry] of this.values) {
        if (entry.expiresAt <= Date.now()) this.values.delete(existingKey);
      }
      this.values.delete(key);
      this.values.set(key, { value: result, expiresAt: Date.now() + this.ttlMs });
      while (this.values.size > this.capacity) this.values.delete(this.values.keys().next().value!);
      return result;
    }).finally(() => this.pending.delete(key));
    this.pending.set(key, request);
    return request;
  }
}

let activeRequests = 0;
const waiters: Array<() => void> = [];
const MAX_ACTIVE = 4;
const MAX_QUEUED = 32;

async function acquire(): Promise<void> {
  if (activeRequests < MAX_ACTIVE) {
    activeRequests++;
    return;
  }
  if (waiters.length >= MAX_QUEUED) throw new Error('Provider request queue is full');
  await new Promise<void>(resolve => waiters.push(resolve));
}

function release(): void {
  const next = waiters.shift();
  if (next) next();
  else activeRequests--;
}

/** The timeout remains active until the response body has been consumed. */
export async function fetchProviderJson<T>(url: string, timeoutMs = 6000): Promise<T> {
  await acquire();
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const timedOut = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(new Error('Provider request timed out'));
      }, timeoutMs);
    });
    return await Promise.race([
      (async () => {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
          credentials: 'omit',
          referrerPolicy: 'strict-origin-when-cross-origin'
        });
        if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
        return await response.json() as T;
      })(),
      timedOut
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
    release();
  }
}

export function validCoordinates(latitude: unknown, longitude: unknown): boolean {
  return typeof latitude === 'number' && Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
    typeof longitude === 'number' && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
}

export function assertCoordinates(latitude: number, longitude: number): void {
  if (!validCoordinates(latitude, longitude)) throw new Error('Invalid geographic coordinates');
}

/** Only public endpoint URLs belong in Vite configuration, never provider secrets. */
export function providerBaseUrl(setting: string, developmentDefault?: string): string | undefined {
  const env = import.meta.env;
  const configured = env?.[setting];
  const base = typeof configured === 'string' && configured.trim() ? configured.trim() :
    (env?.DEV ? developmentDefault : undefined);
  if (!base) return undefined;
  if (base.startsWith('/')) {
    if (base.startsWith('//') || /[?#\\]/.test(base)) throw new Error(`Invalid public provider URL for ${setting}`);
    return base.replace(/\/$/, '');
  }
  const url = new URL(base);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && local))) {
    throw new Error(`Invalid public provider URL for ${setting}`);
  }
  return base.replace(/\/$/, '');
}

export function photonBaseUrl(): string {
  const base = providerBaseUrl('VITE_PHOTON_BASE_URL', 'https://photon.komoot.io');
  if (!base) throw new Error('Location search provider is not configured');
  return base;
}
