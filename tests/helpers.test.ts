import { describe, it, expect } from "vitest";
import { z } from "zod";
import { zodToToolError } from "../src/errors/index.js";

describe("Funciones Puras - zodToToolError", () => {
    it("Debería formatear correctamente un error de Zod a un formato de respuesta de error MCP", () => {
        // Generamos un error de Zod forzado
        const testSchema = z.object({ nombre: z.string() });
        const parseResult = testSchema.safeParse({ nombre: 123 });
        
        // Verificamos que no fue exitoso para extraer el error
        expect(parseResult.success).toBe(false);
        
        if (!parseResult.success) {
            // Obtenemos el error traducido por tu función
            const translatedError = zodToToolError(parseResult.error) as any;
            
            // 1. Verificamos que efectivamente lo marca como error
            expect(translatedError.isError).toBe(true);
            
            // 2. Convertimos todo tu objeto a string (sea cual sea su estructura interna)
            // y verificamos que el nombre del campo que falló ("nombre") esté ahí.
            const errorString = JSON.stringify(translatedError);
            expect(errorString).toContain("nombre");
        }
    });
});