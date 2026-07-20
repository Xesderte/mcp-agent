import { GitHubClient } from "../github/client.js";
import { GitHubOperations } from "../github/operations.js";
import { ListRepositories_Input } from "../schemas/index.js";

export async function listRepositories(
    client: GitHubClient,
    operations: GitHubOperations,
    args: ListRepositories_Input
){
    const data = await operations.execute(() =>
        client.repos.listForAuthenticatedUser({
            page: args.page,
            per_page: args.per_page,
            sort: args.sort,
            direction: args.direction,
            type: args.type,
        })
    );

    //DTO: Mapeos al array para cada objeto repositorio
    return data.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        url: repo.html_url,
    }));
}