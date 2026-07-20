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

## 🔐 Configuración y Autenticación
El servidor requiere un GitHub Personal Access Token (PAT) clásico.

1. Ve a GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic).
2. Genera un nuevo token marcando estrictamente estos **scopes**:
   * `repo` (Full control of private repositories)
   * `user` (Update all user data)
   * `admin:org` (Full control of orgs and teams, read and write org projects)
3. Renombra el archivo `.env.example` a `.env` (o crea uno nuevo) y pega tu token:
   ```text
   GITHUB_TOKEN=ghp_tu_token_aqui

## 🧰 Catálogo de Herramientas (Tools)

El servidor expone las siguientes herramientas (tools) que el agente de IA puede utilizar. Los datos de respuesta son optimizados mediante DTOs (Data Transfer Objects) para reducir el consumo de tokens y mejorar el contexto del modelo.

### 1. `create_repository`
* **Descripción:** Crea un nuevo repositorio en la cuenta del usuario autenticado.
* **Parámetros:** `name` (string, requerido), `description` (string, opcional), `private` (boolean, opcional).
* **Prompt de ejemplo:** *"Crea un repositorio privado llamado 'mcp-agent-test' con la descripción 'Repositorio de prueba para el integrador'."*

### 2. `list_repositories`
* **Descripción:** Lista los repositorios del usuario autenticado de forma paginada.
* **Parámetros:** `page` (number), `per_page` (number), `sort` (string), `direction` (string), `type` (string).
* **Prompt de ejemplo:** *"Lista mis últimos 5 repositorios públicos actualizados."*

### 3. `create_issue`
* **Descripción:** Crea un issue (tarea) en el backlog de un repositorio específico.
* **Parámetros:** `owner` (string, requerido), `repo` (string, requerido), `title` (string, requerido), `body` (string), `labels` (array de strings), `assignees` (array de strings).
* **Prompt de ejemplo:** *"En el repositorio 'mcp-agent-test' de 'mi-usuario-github', crea un issue titulado 'Fix Bug' con la etiqueta 'bug'."*

### 4. `list_issues`
* **Descripción:** Obtiene los issues abiertos o cerrados de un repositorio específico.
* **Parámetros:** `owner` (string, requerido), `repo` (string, requerido), `state` (string: open/closed/all), `page` (number), `per_page` (number), `labels` (array de strings).
* **Prompt de ejemplo:** *"Muéstrame todos los issues cerrados en el repositorio 'mcp-agent-test'."*

### 5. `create_commit` (Operación de Historial Mutacional)
* **Descripción:** Permite crear o actualizar un archivo directamente en una rama específica. Esta operación implementa el flujo atómico interno de Git (Blob -> Tree -> Commit -> Ref) para garantizar la inmutabilidad del historial del repositorio.
* **Parámetros:** `owner` (string, requerido), `repo` (string, requerido), `branch` (string, requerido), `path` (string, requerido, ruta exacta del archivo con extensión), `content` (string, requerido), `message` (string, requerido).
* **Prompt de ejemplo:** *"En el repositorio 'mcp-agent-test' de 'mi-usuario', crea o actualiza el archivo 'src/index.js' en la rama 'main' agregando un `console.log('Hola Mundo');`. El mensaje del commit debe ser 'feat: agrega log inicial'."*