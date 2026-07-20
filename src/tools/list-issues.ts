import { GitHubClient } from "../github/client.js";
import { GitHubOperations } from "../github/operations.js";
import { ListIssues_Input } from "../schemas/index.js";

export async function listIssues(
    client: GitHubClient,
    operations: GitHubOperations,
    args: ListIssues_Input,
){
    //Aseguramos el formato correcto para los labels enviandolo como una separada si existe
    const labelsString = args.labels ? args.labels.join(',') : undefined;

    const data = await operations.execute(() => 
        client.issues.listForRepo({
            owner: args.owner,
            repo: args.repo,
            state: args.state,
            page: args.page,
            per_page: args.per_page,
            ...(args.labels && args.labels.length > 0 && { labels: args.labels.join(',') }),   
        })
    );

    //DTO
    return data.map((issue) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        url: issue.html_url,
        user: issue.user?.login,
    }));
}