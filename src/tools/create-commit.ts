import { GitHubClient } from "../github/client.js";
import { GitHubOperations } from "../github/operations.js";
import { CreateCommit_Input } from "../schemas/index.js";
import { createCommitFlow } from "../github/helpers.js";

export async function createCommit(
    client: GitHubClient,
    operations: GitHubOperations,
    args: CreateCommit_Input
){
    //Delegamos la complejidad atomica al Helper
    const result = await createCommitFlow(client, operations, {
        owner: args.owner,
        repo: args.repo,
        branch: args.branch,
        path: args.path,
        content: args.content,
        message: args.message,
    });

    //DTO (Data Transfer Object): Retornamos la confirmacion clara y concisa
    return{
        branch: args.branch,
        file_path: args.path,
        commit_sha: result.object.sha,
        url: `https://github.com/${args.owner}/${args.repo}/commit/${result.object.sha}`
    };
}