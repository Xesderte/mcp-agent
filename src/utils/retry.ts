// src/utils/retry.ts
import { logger } from './logger.js';

export async function withExponentialBackoff<T>(
    fn: () => Promise<T>,
    opts: {
        maxRetries: number;
        baseDelayMs: number;
        maxDelayMs: number;
        shouldRetry: (err: any) => { retry: boolean; waitMs?: number; reason?: string };
    }
): Promise<T> {
    let attempt = 0;

    while (true) {
        try {
        return await fn();
        } catch (err: any) {
        attempt++;

        // Evaluamos si el error es 403 para reintentar
        const decision = opts.shouldRetry(err);
        if (!decision.retry || attempt > opts.maxRetries) {
            throw err; // Abortamos si no es retryable (ej: 401 o 404) o si superamos los reintentos
        }

        // Cálculo del Exponential Backoff
        const exp = opts.baseDelayMs * Math.pow(2, attempt - 1);
        const wait = Math.min(decision.waitMs ?? exp, opts.maxDelayMs);

        logger.warn('Reintentando petición a la API por límite de tasa', {
            attempt,
            waitMs: wait,
            reason: decision.reason ?? 'rate_limit',
        });

        await new Promise((resolve) => setTimeout(resolve, wait));
        }
    }
}