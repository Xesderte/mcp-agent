import { describe, it, expect } from "vitest";
import { z } from "zod";
import { zodToToolError } from "../src/errors/index.js";

describe("Funciones Puras - zodToToolError", () => {
    it("Debería formatear correctamente un error de Zod a un objeto Error legible", () => {
        // Generamos un error de Zod forzado
        const testSchema = z.object({ nombre: z.string() });
        const parseResult = testSchema.safeParse({ nombre: 123 });
        
        // Verificamos que no fue exitoso para extraer el error
        expect(parseResult.success).toBe(false);
        
        if (!parseResult.success) {
            const translatedError = zodToToolError(parseResult.error);
            
            // Afirmaciones (Asserts)
            expect(translatedError).toBeInstanceOf(Error);
            expect(translatedError.message).toContain("Validation Error");
            expect(translatedError.message).toContain("nombre");
        }
    });
});