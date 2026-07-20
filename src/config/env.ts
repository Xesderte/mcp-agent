import 'dotenv/config';

//Funcion estrictita para validar que la variable exista en el sistema

function requireEnv(name: string): string{
    const value = process.env[name];
    if(!value){
        throw new Error('[Setup Error] Lavariable de entorno ${name} es obligatoria y no esta definida en tu archivo .env')
    }
    return value;
}

export const env = {
    GITHUB_TOKEN: requireEnv('GITHUB_TOKEN'),
};