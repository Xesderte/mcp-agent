# AutomateHub - GitHub MCP Server

Un servidor Model Context Protocol (MCP) desarrollado en Node.js y TypeScript que permite a agentes de IA (como Claude o Gemini) automatizar operaciones de gestión de repositorios, issues y commits en GitHub usando lenguaje natural.

## 🚀 Casos de Uso
Este servidor es útil para:
* Crear estructuras de repositorios y proyectos automáticamente.
* Gestionar y auditar el backlog (listar y crear issues).
* Realizar commits programáticos mediante el modelo de objetos internos de Git.

## ⚙️ Requisitos del Sistema
* **Node.js**: v18 o superior.
* **Gestor de paquetes**: npm.

## 🛠️ Instalación paso a paso
1. Clona el repositorio:
   ```bash
   git clone [https://github.com/tu-usuario/mcp-agent.git](https://github.com/tu-usuario/mcp-agent.git)
   cd mcp-agent

   ## 🛡️ Validación y Manejo de Errores (LLM-Readiness)

El servidor utiliza el patrón **Contract-First**. Antes de realizar cualquier petición a la API externa, los parámetros son analizados en tiempo de ejecución (*runtime*) mediante esquemas de **Zod**.

El sistema clasifica las excepciones para devolver *hints* semánticos (en lenguaje natural) que el LLM puede leer para auto-corregir sus peticiones. Se manejan los siguientes tipos de errores:

* **`VALIDATION_ERROR`**: Ocurre cuando el *prompt* de la IA no cumple con el esquema (ej. crear un repositorio con un nombre menor a 3 caracteres). El servidor detiene la ejecución localmente y devuelve la lista de campos faltantes.
* **`UNAUTHORIZED` / `FORBIDDEN` (AuthenticationError)**: Fallos relacionados con un token inválido o permisos insuficientes (`scopes`).
* **`NOT_FOUND`**: La IA intentó interactuar con un repositorio o issue que no existe, previniendo fallos en cadena.
* **`RATE_LIMIT`**: Al exceder las cuotas de GitHub, el sistema sugiere esperar el ciclo de reseteo para no causar un bloqueo total de la cuenta.
* **`UPSTREAM_ERROR` / `INTERNAL_ERROR`**: Fallos de conectividad no controlados de la API de GitHub.