import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry { data: unknown; expiresAt: number; }

@Injectable({ providedIn: 'root' })
export class DataCacheService {
  private cache = new Map<string, CacheEntry>();

  /** Retorna datos del caché si están frescos, si no ejecuta fetcher y cachea el resultado. */
  get<T>(key: string, ttlMs: number, fetcher: () => Observable<T>): Observable<T> {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiresAt) {
      return of(entry.data as T);
    }
    return fetcher().pipe(
      tap(data => this.cache.set(key, { data, expiresAt: Date.now() + ttlMs })),
    );
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }
}
