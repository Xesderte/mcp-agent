import { ZodError } from 'zod';

//Estructura estandarizada para todos los errores de nuestras tools
export interface MCPError{
    isError: true;
    code: string;
    message: string;
    hint: string;
    details?: unknown;
}

// Transforma un error de validacion de Zod en un mensaje util para el LUM
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
    };
}

// Aquí, en el próximo paso, agregaremos el mapeo de errores de GitHub (401, 403, 404)
// Transforma un error de la API de GitHub en un mensaje útil para el LLM
export function githubToToolError(error: any): MCPError {
    const status = error.status || error?.response?.status;
    const message = error.message || 'Error desconocido al conectar con GitHub.';

    switch (status) {
        case 401:
        return { 
            isError: true, 
            code: 'UNAUTHORIZED', 
            message: 'Autenticación fallida con GitHub.', 
            hint: 'Verifica que tu GITHUB_TOKEN sea válido y no haya expirado.' 
        };
        case 403:
        return { 
            isError: true, 
            code: 'FORBIDDEN', 
            message: 'Acceso denegado o Límite de Tasa (Rate Limit) excedido.', 
            hint: 'Revisa los scopes del token (repo, user, admin:org) o espera a que se restablezca el límite de peticiones de GitHub.' 
        };
        case 404:
        return { 
            isError: true, 
            code: 'NOT_FOUND', 
            message: 'El recurso solicitado en GitHub no existe.', 
            hint: 'Verifica la existencia del repositorio, el owner o el número de issue.' 
        };
        case 422:
        return { 
            isError: true, 
            code: 'VALIDATION_FAILED', 
            message: 'GitHub rechazó la estructura de los datos enviados.', 
            details: error?.response?.data?.errors,
            hint: 'Revisa que los datos enviados cumplan con los requisitos de la API de GitHub.' 
        };
        default:
        return { 
            isError: true, 
            code: 'UPSTREAM_ERROR', 
            message, 
            hint: 'Revisa la conectividad a internet o reintenta más tarde.' 
        };
    }
}