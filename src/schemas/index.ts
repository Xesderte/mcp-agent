import { z } from 'zod';

// 1. Tool: create_repository
export const createRepositorySchema = z.object({
    name: z.string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(100, "El nombre no puede exeder 100 caracteres")
        .regex(/^[A-Za-z0-9._-]+$/, "El nombre solo puede contener letras, números, puntos, guiones y guiones bajos"),
    description: z.string().max(200, "Maximo 200 caracteres").optional(),
    private: z.boolean().default(false).optional(),
});

// 2. Tool: create_issue
export const createIssueSchema = z.object({
    owner: z.string().min(1, "Owner requerido"),
    repo: z.string().min(1, "Repo requerido"),
    title: z.string().min(1, "El titulo es obligatorio"),
    body: z.string().optional(),
    labels: z.array(z.string()).optional(),
    assigness: z.array(z.string()).optional(),
});

// 3. Tool: list_repositories
export const listRepositoriesSchema = z.object({
    page: z.number().int().min(1).default(1),
    per_page: z.number().int().min(1).max(100).default(30),
    sort: z.enum(['created', 'updated', 'pushed', 'full_name']).default('updated'),
    direction: z.enum(['asc', 'desc']).default('desc'),
    type: z.enum(['all', 'public', 'private']).default('all'),
});

// 4. Tool: list_issues
export const listIssuesSchema = z.object({
    owner: z.string().min(1, "Owner requerido"),
    repo: z.string().min(1, "Repo requerido"),
    state: z.enum(["open", "closed", "all"]).default("open"),
    page: z.number().int().min(1).default(1),
    per_page: z.number().int().min(1).max(100).default(30),
    labels: z.array(z.string()).optional(),
});

// 5. Tool: create_commit(Operacion multi-paso)
export const createCommitSchema = z.object({
    owner: z.string().min(1, "Owner requerido"),
    repo: z.string().min(1, "Repo requerido"),
    branch: z.string().min(1, "Rama requerida (ej. 'main')"),
    path: z.string().min(1, "Ruta del archivo requerida (ej. 'src/index.js')"),
    content: z.string().min(1, "Contenido del archivo requerido"),
    message: z.string().min(1, "Mensaje del commit requerido"),
});

// Autoderivacion de Tipos de TypeScript usando Zod
export type CreateRepository_Input = z.infer<typeof createRepositorySchema>;
export type CreateIssue_Input = z.infer<typeof createIssueSchema>;
export type ListRepositories_Input = z.infer<typeof listRepositoriesSchema>;
export type ListIssues_Input = z.infer<typeof listIssuesSchema>;
export type createCommit_Input = z.infer<typeof createCommitSchema>;