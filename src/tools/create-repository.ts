import { GitHubClient } from '../github/client.js';
import { GitHubOperations } from '../github/operations.js';
import { CreateRepository_Input } from '../schemas/index.js';

export async function createRepository(
    client: GitHubClient,
    operations: GitHubOperations,
    args: CreateRepository_Input
) {
    // Pasamos la llamada a GitHub a través de nuestro Wrapper (Aduana)
    const data = await operations.execute(() =>
        client.repos.createForAuthenticatedUser({
            name: args.name,
            ...(args.description && { description: args.description }),
            ...(args.private !== undefined && { private: args.private }),
        })
    );

    // DTO (Data Transfer Object): Recortamos la respuesta gigante
    return {
        name: data.name,
        url: data.html_url,
        clone_url: data.clone_url,
    };
}