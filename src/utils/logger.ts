// src/utils/logger.ts

export const logger = {
    info: (msg: string, context?: object) => {
        // Redirigimos a stderr para proteger el protocolo MCP
        console.error(JSON.stringify({ 
            ts: new Date().toISOString(), 
            level: 'INFO', 
            msg, 
            ...context 
        }));
    },
    warn: (msg: string, context?: object) => {
        console.error(JSON.stringify({ 
            ts: new Date().toISOString(), 
            level: 'WARN', 
            msg, 
            ...context 
        }));
    },
    error: (msg: string, error?: any) => {
        console.error(JSON.stringify({ 
            ts: new Date().toISOString(), 
            level: 'ERROR', 
            msg, 
            errorCode: error?.code
        }));
    }
};