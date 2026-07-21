import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Importamos nuestra infraestructura
import { createGitHubClient } from "../github/client.js";
import { GitHubOperations } from "../github/operations.js";

// Importamos nuestros esquemas de validación (Contract-First)
import { 
    createRepositorySchema, 
    listRepositoriesSchema, 
    createIssueSchema, 
    listIssuesSchema, 
    createCommitSchema 
} from "../schemas/index.js";

// Importamos nuestras Tools
import { createRepository } from "../tools/create-repository.js";
import { listRepositories } from "../tools/list-repositories.js";
import { createIssue } from "../tools/create-issue.js";
import { listIssues } from "../tools/list-issues.js";
import { createCommit } from "../tools/create-commit.js";

// Importamos nuestro traductor de errores de Zod
import { zodToToolError } from "../errors/index.js";

// Inicializamos los clientes base
const client = createGitHubClient();
const operations = new GitHubOperations(client);

// Instanciamos el servidor MCP
const server = new Server(
    {
        name: "mcp-agent-henry",
        version: "1.0.0",
    },
    {
        capabilities: {
        tools: {},
        },
    }
);

// 1. Declarar el Catálogo de Herramientas (ListTools)
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
        {
            name: "create_repository",
            description: "Crea un nuevo repositorio en GitHub.",
            inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Nombre del repositorio" },
                description: { type: "string", description: "Descripción opcional" },
                private: { type: "boolean", description: "Si es privado o público" }
            },
            required: ["name"]
            }
        },
        {
            name: "list_repositories",
            description: "Lista los repositorios del usuario de forma paginada.",
            inputSchema: {
            type: "object",
            properties: {
                page: { type: "number" },
                per_page: { type: "number" },
                sort: { type: "string" },
                direction: { type: "string" },
                type: { type: "string" }
            }
            }
        },
        {
            name: "create_issue",
            description: "Crea un issue (tarea) en un repositorio.",
            inputSchema: {
            type: "object",
            properties: {
                owner: { type: "string" },
                repo: { type: "string" },
                title: { type: "string" },
                body: { type: "string" },
                labels: { type: "array", items: { type: "string" } },
                assignees: { type: "array", items: { type: "string" } }
            },
            required: ["owner", "repo", "title"]
            }
        },
        {
            name: "list_issues",
            description: "Obtiene los issues de un repositorio.",
            inputSchema: {
            type: "object",
            properties: {
                owner: { type: "string" },
                repo: { type: "string" },
                state: { type: "string", enum: ["open", "closed", "all"] },
                page: { type: "number" },
                per_page: { type: "number" },
                labels: { type: "array", items: { type: "string" } }
            },
            required: ["owner", "repo"]
            }
        },
        {
            name: "create_commit",
            description: "Crea o actualiza un archivo creando un commit en una rama. Muta el historial de forma segura.",
            inputSchema: {
            type: "object",
            properties: {
                owner: { type: "string" },
                repo: { type: "string" },
                branch: { type: "string" },
                path: { type: "string" },
                content: { type: "string" },
                message: { type: "string" }
            },
            required: ["owner", "repo", "branch", "path", "content", "message"]
            }
        }
        ]
    };
});

// 2. Enrutar y Ejecutar la Herramienta (CallTool)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        let result;

        switch (name) {
        case "create_repository": {
            const parsed = createRepositorySchema.safeParse(args);
            if (!parsed.success) throw zodToToolError(parsed.error);
            result = await createRepository(client, operations, parsed.data);
            break;
        }
        case "list_repositories": {
            const parsed = listRepositoriesSchema.safeParse(args || {});
            if (!parsed.success) throw zodToToolError(parsed.error);
            result = await listRepositories(client, operations, parsed.data);
            break;
        }
        case "create_issue": {
            const parsed = createIssueSchema.safeParse(args);
            if (!parsed.success) throw zodToToolError(parsed.error);
            result = await createIssue(client, operations, parsed.data);
            break;
        }
        case "list_issues": {
            const parsed = listIssuesSchema.safeParse(args);
            if (!parsed.success) throw zodToToolError(parsed.error);
            result = await listIssues(client, operations, parsed.data);
            break;
        }
        case "create_commit": {
            const parsed = createCommitSchema.safeParse(args);
            if (!parsed.success) throw zodToToolError(parsed.error);
            result = await createCommit(client, operations, parsed.data);
            break;
        }
        default:
            throw new Error(`La herramienta ${name} no existe.`);
        }

        // Respuesta exitosa formateada para el agente
        return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };

    } catch (error: any) {
        // Si la herramienta lanzó un MCPError (o cualquier otro), lo devolvemos estructurado
        return {
        content: [{ type: "text", text: JSON.stringify(error, null, 2) }],
        isError: true
        };
    }
});

// 3. Inicializar el transporte sobre STDIO
async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Server ejecutándose sobre stdio...");
}

run().catch((error) => {
    console.error("Error crítico iniciando el servidor:", error);
    process.exit(1);
});