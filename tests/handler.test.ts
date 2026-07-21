import { describe, it, expect, vi } from "vitest";
import { createIssue } from "../src/tools/create-issue.js";

describe("Integración - Handler de createIssue con Mocks", () => {
    // Simulamos un input válido que ya pasó por Zod
    const validArgs = {
        owner: "test-org",
        repo: "test-repo",
        title: "Test Issue",
        body: "Contenido del issue"
    };

    // Dummy del cliente de GitHub (no se usará porque mockeamos operations)
    const dummyClient = {} as any;

    it("Caso Feliz: Retorna la URL del issue cuando GitHub responde exitosamente", async () => {
        const mockOperations = {
            execute: vi.fn().mockResolvedValue({
                html_url: "https://github.com/test-org/test-repo/issues/1",
                number: 1,
                title: "Test Issue"
            })
        } as any;

        const result = await createIssue(dummyClient, mockOperations, validArgs);
        
        expect(mockOperations.execute).toHaveBeenCalledOnce();
        expect(result.url).toBe("https://github.com/test-org/test-repo/issues/1");
    });

    it("Caso 401 Unauthorized: Rechaza la promesa cuando las credenciales fallan", async () => {
        const mockOperations = {
            execute: vi.fn().mockRejectedValue({
                status: 401,
                message: "Bad credentials"
            })
        } as any;

        await expect(createIssue(dummyClient, mockOperations, validArgs)).rejects.toMatchObject({
            status: 401
        });
    });

    it("Caso 403 Rate Limit: Rechaza la promesa indicando límite excedido", async () => {
        const mockOperations = {
            execute: vi.fn().mockRejectedValue({
                status: 403,
                message: "API rate limit exceeded"
            })
        } as any;

        await expect(createIssue(dummyClient, mockOperations, validArgs)).rejects.toMatchObject({
            status: 403
        });
    });
});