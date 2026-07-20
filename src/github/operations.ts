import { GitHubClient } from "./client.js";
import { githubToToolError } from "../errors/index.js";

export class GitHubOperations{
    constructor(private octokit: GitHubClient){}

    //Telemetria: Registra el Rate Limit en la salida de error estandar
    private logRateLimit(headers: any){
        const remaining = headers['x-ratelimit-remaining'];
        const limit = headers['x-ratelimit-limit'];
        if(remaining && limit){
            console.error(`[GitHub Operations] Rate Limit: Quedan ${remaining} de ${limit} peticiones.`);
        }
    }

    //Wrapper generico: Todas las peticiones a GitHub deben pasar por aqui
    async execute<T>(operations: () => Promise<{ headers: any; data: T }>): Promise<T>{
        try{
            const response = await operations();
            this.logRateLimit(response.headers);
            return response.data;
        }catch (error){
            //Atrapamos el error crudo de Octokit y lo traducimos
            throw githubToToolError(error);
        }
    }
}

