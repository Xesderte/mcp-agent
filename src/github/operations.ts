import { GitHubClient } from "./client.js";
import { githubToToolError } from "../errors/index.js";
import { withExponentialBackoff } from "../utils/retry.js"; // <-- Importamos tu lógica de reintento
import { logger } from "../utils/logger.js"; // <-- Usamos tu logger

export class GitHubOperations{
    constructor(private octokit: GitHubClient){}

    // Telemetría: Registra el Rate Limit en la salida de error estandar
    private logRateLimit(headers: any){
        const remaining = headers['x-ratelimit-remaining'];
        const limit = headers['x-ratelimit-limit'];
        if(remaining && limit){
            logger.info(`[GitHub Operations] Rate Limit: Quedan ${remaining} de ${limit} peticiones.`);
        }
    }

    // Wrapper genérico: Todas las peticiones a GitHub pasan por aquí
    async execute<T>(operations: () => Promise<{ headers: any; data: T }>): Promise<T>{
        
        // Envolvemos la ejecución en tu función de reintento
        return withExponentialBackoff(
            async () => {
                try {
                    const response = await operations();
                    this.logRateLimit(response.headers);
                    return response.data;
                } catch (error) {
                    // Atrapamos el error crudo de Octokit y lo traducimos a tu formato MCPError
                    throw githubToToolError(error);
                }
            },
            {
                maxRetries: 3, // Intentará 3 veces antes de rendirse
                baseDelayMs: 1000, // Empieza esperando 1 segundo
                maxDelayMs: 10000, // No esperará más de 10 segundos
                shouldRetry: (err: any) => {
                    // Si el error traducido es un 403 (FORBIDDEN), damos luz verde al reintento
                    if (err?.code === 'FORBIDDEN') {
                        return { retry: true, reason: 'rate_limit' };
                    }
                    // Cualquier otro error (404, 401, 400) NO se reintenta
                    return { retry: false };
                }
            }
        );
    }
}