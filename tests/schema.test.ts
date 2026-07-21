import { describe, it, expect } from "vitest";
import { createIssueSchema } from "../src/schemas/index.js";

describe("Validación de Contrato Zod - createIssueSchema", () => {
    // --- 3 CASOS VÁLIDOS ---
    it("Caso Válido 1: Acepta un input mínimo requerido", () => {
        const res = createIssueSchema.safeParse({
        owner: "mi-usuario",
        repo: "mi-repo",
        title: "Error en la base de datos"
        });
        expect(res.success).toBe(true);
    });

    it("Caso Válido 2: Acepta un input con el campo opcional 'body'", () => {
        const res = createIssueSchema.safeParse({
        owner: "mi-usuario",
        repo: "mi-repo",
        title: "Actualizar README",
        body: "Se necesita agregar las instrucciones de instalación."
        });
        expect(res.success).toBe(true);
    });

    it("Caso Válido 3: Acepta un input con arrays opcionales (labels y assignees)", () => {
        const res = createIssueSchema.safeParse({
        owner: "mi-usuario",
        repo: "mi-repo",
        title: "Revisar logs",
        labels: ["bug", "urgent"],
        assignees: ["dev1"]
        });
        expect(res.success).toBe(true);
    });

    // --- 6 CASOS INVÁLIDOS ---
    it("Caso Inválido 1: Falla si falta el 'owner'", () => {
        const res = createIssueSchema.safeParse({
            repo: "mi-repo",
            title: "Bug"
        });
        expect(res.success).toBe(false);
        if (!res.success) {
            expect(res.error.issues[0].path).toContain("owner");
        }
    });

    it("Caso Inválido 2: Falla si falta el 'repo'", () => {
        const res = createIssueSchema.safeParse({
            owner: "mi-usuario",
            title: "Bug"
        });
        expect(res.success).toBe(false);
        if (!res.success) {
            expect(res.error.issues[0].path).toContain("repo");
        }
    });

    it("Caso Inválido 3: Falla si falta el 'title'", () => {
        const res = createIssueSchema.safeParse({
            owner: "mi-usuario",
            repo: "mi-repo"
        });
        expect(res.success).toBe(false);
        if (!res.success) {
            expect(res.error.issues[0].path).toContain("title");
        }
    });

    it("Caso Inválido 4: Falla si 'owner' es un número (tipo incorrecto)", () => {
        const res = createIssueSchema.safeParse({
            owner: 12345,
            repo: "mi-repo",
            title: "Bug"
        });
        expect(res.success).toBe(false);
    });

    it("Caso Inválido 5: Falla si 'labels' no es un array", () => {
        const res = createIssueSchema.safeParse({
            owner: "mi-usuario",
            repo: "mi-repo",
            title: "Bug",
            labels: "bug" // Debería ser ["bug"]
        });
        expect(res.success).toBe(false);
    });

    it("Caso Inválido 6: Falla si el input está completamente vacío", () => {
        const res = createIssueSchema.safeParse({});
        expect(res.success).toBe(false);
    });
});