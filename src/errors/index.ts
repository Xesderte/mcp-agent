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