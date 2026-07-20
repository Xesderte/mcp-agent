import { GitHubClient } from "../github/client.js";
import { GitHubOperations } from "../github/operations.js";
import { CreateIssue_Input } from "../schemas/index.js";

export async function createIssue(
    client: GitHubClient,
    operations: GitHubOperations,
    args: CreateIssue_Input
){
    const data = await operations.execute(() =>
        client.issues.create({
            owner: args.owner,
            repo: args.repo,
            title: args.title,
            ...(args.body && { body: args.body }),
            ...(args.labels && { labels: args.labels }),
            ...(args.assigness && { assignees: args.assigness }),
        })
    );

    //DTO
    return{
        number: data.number,
        title: data.title,
        state: data.state,
        url: data.html_url,
    };
}