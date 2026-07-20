import { Octokit } from "@octokit/rest";
import { env } from '../config/env.js'

export function createGitHubClient() {
    return new Octokit({
        auth: env.GITHUB_TOKEN,
        userAgent: 'mcp-agent-henry/1.0.0',
    });
}

// Exportamos el tipo para inyectarlo facilmente en otra clases
export type GitHubClient = ReturnType<typeof createGitHubClient>;