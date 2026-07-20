import { GitHubClient } from "./client.js";
import { GitHubOperations } from "./operations.js";

interface CommitOptions{
    owner: string;
    repo: string;
    branch: string;
    path: string;
    content: string;
    message: string;
}

export async function createCommitFlow(
    client: GitHubClient,
    operations: GitHubOperations,
    options: CommitOptions
){
    const {owner, repo, branch, path, content, message} = options;

    // Paso 1: Obtener la referencia (Ref) de la rama actual para saber cuál es el último commit
    const refData = await operations.execute(() => 
        client.git.getRef({
            owner,
            repo,
            ref: `heads/${branch}`,
        })
    );
    const baseCommitSha = refData.object.sha;

    // Paso 2: Obtener el commit base y su arbol estructural (Tree)
    const baseCommitData = await operations.execute(() => 
        client.git.getCommit({
            owner,
            repo,
            commit_sha: baseCommitSha,
        })
    );
    const baseTreeSha = baseCommitData.tree.sha;

    // Paso 3: Crear el Blob (Convertir tu texto/codigo en un objeto binario de Git)
    const blobData = await operations.execute(() => 
        client.git.createBlob({
            owner,
            repo,
            content: content,
            encoding: 'utf-8',
        })
    );
    const blobSha = blobData.sha;

    // Paso 4: Crear un nuevo Tree. Toma el árbol anterior y le "enchufa" nuestro nuevo archivo (Blob)
    const newTreeData = await operations.execute(() => 
        client.git.createTree({
            owner,
            repo,
            tree: [
                {
                    path:path,
                    mode: '100644', //Codigo interno de Git para "Archivo Regular"
                    type: 'blob',
                    sha: blobSha,
                },
            ],
        })
    );
    const newTreeSha = newTreeData.sha;

    // Paso 5: Crear el Snapshot (El Commit en sí mismo), uniendo el nuevo Tree con el padre anterior
    const newCommitData = await operations.execute(() => 
        client.git.createCommit({
            owner,
            repo,
            message: message,
            tree: newTreeSha,
            parents: [baseCommitSha], //Vital: Define la herencia para no romper el historial
        })
    );
    const newCommitSha = newCommitData.sha;

    // Paso 6: Actualizar la Referencia de la rama para que apunte a nuestro flamante commit
    const updateRefData = await operations.execute(() =>
        client.git.updateRef({
            owner,
            repo,
            ref: `heads/${branch}`,
            sha: newCommitSha,
        })
    ); 
    
    return updateRefData;
}
