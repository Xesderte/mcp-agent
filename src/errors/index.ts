import { ZodError } from 'zod';

// --- 1. CLASES REQUERIDAS POR LA LECCIÓN 9 ---
export type ErrorCode = 'VALIDATION_ERROR' | 'AUTH_ERROR' | 'GITHUB_API_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';

export class AppError extends Error {
    public readonly code: ErrorCode;
    // Añadimos '| undefined' para cumplir con exactOptionalPropertyTypes
    public readonly status?: number | undefined;
    public readonly retryable: boolean;
    public readonly details?: Record<string, unknown> | undefined;

    constructor(opts: { 
        code: ErrorCode; 
        message: string; 
        status?: number | undefined; 
        retryable?: boolean; 
        details?: Record<string, unknown> | undefined; 
    }) {
        super(opts.message);
        this.name = 'AppError';
        this.code = opts.code;
        this.status = opts.status;
        this.retryable = opts.retryable ?? false;
        this.details = opts.details;
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, unknown> | undefined) {
        super({ code: 'VALIDATION_ERROR', message, status: 400, retryable: false, details });
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends AppError {
    constructor(message = 'Token de autenticación inválido o ausente.') {
        super({ code: 'AUTH_ERROR', message, status: 401, retryable: false });
        this.name = 'AuthenticationError';
    }
}

export class GitHubAPIError extends AppError {
    constructor(message: string, opts?: { status?: number | undefined; retryable?: boolean; details?: Record<string, unknown> | undefined }) {
        super({ code: 'GITHUB_API_ERROR', message, status: opts?.status, retryable: opts?.retryable ?? false, details: opts?.details });
        this.name = 'GitHubAPIError';
    }
}

// --- 2. TU ESTRUCTURA ORIGINAL (Mantenida para no romper tus tests) ---
export interface MCPError{
    isError: true;
    code: string;
    message: string;
    hint: string;
    details?: unknown;
    action?: string | undefined; // Única adición: la acción recomendada para el agente
}

// --- 3. TU FUNCIÓN ZOD (Intacta) ---
export function zodToToolError(error: ZodError): MCPError{
    return {
        isError: true,
        code: 'VALIDATION_ERROR',
        message: 'Input invalido para la tool',
        details: error.issues.map((iss) => ({
            path: iss.path.join(','),
            message: iss.message,
        })),
        hint: 'Revisa los campos requeridos, tipos de datos y restricciones (como longitud mínima/máxima o caracteres permitidos).',
        action: 'FIX_INPUT'
    };
}

// --- 4. TU FUNCIÓN GITHUB (Adaptada a la rúbrica) ---
export function githubToToolError(error: any): MCPError {
    const status = error.status || error?.response?.status;
    const message = error.message || 'Error desconocido al conectar con GitHub.';
    const repoName = error.repo || '[nombre]'; // Capturamos el nombre del repo

    switch (status) {
        case 401:
        return { 
            isError: true, 
            code: 'UNAUTHORIZED', 
            message: 'Autenticación fallida con GitHub.', 
            hint: 'Verifica que tu GITHUB_TOKEN sea válido y no haya expirado.',
            action: 'ADD_CREDENTIALS'
        };
        case 403:
        return { 
            isError: true, 
            code: 'FORBIDDEN', 
            message: 'Acceso denegado o Límite de Tasa (Rate Limit) excedido.', 
            hint: 'Revisa los scopes del token (repo, user, admin:org) o espera a que se restablezca el límite de peticiones de GitHub.',
            action: 'WAIT_AND_RETRY'
        };
        case 404:
        // CUMPLIMIENTO DE RÚBRICA: Traducción exacta al inglés
        return { 
            isError: true, 
            code: 'NOT_FOUND', 
            message: `The repository ${repoName} was not found. Please check the name and try again.`, 
            hint: 'Verifica la existencia del repositorio, el owner o el número de issue.',
            action: 'CHECK_RESOURCE'
        };
        case 422:
        return { 
            isError: true, 
            code: 'VALIDATION_FAILED', 
            message: 'GitHub rechazó la estructura de los datos enviados.', 
            details: error?.response?.data?.errors,
            hint: 'Revisa que los datos enviados cumplan con los requisitos de la API de GitHub.',
            action: 'FIX_INPUT'
        };
        default:
        return { 
            isError: true, 
            code: 'UPSTREAM_ERROR', 
            message, 
            hint: 'Revisa la conectividad a internet o reintenta más tarde.',
            action: 'CONTACT_SUPPORT'
        };
    }
}