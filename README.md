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

## 🏗️ Arquitectura del Sistema y Flujo de Peticiones

El servidor se rige bajo la arquitectura del Protocolo de Contexto de Modelos (MCP), utilizando una comunicación basada en la entrada/salida estándar (`stdio`) mediante JSON-RPC 2.0.

El flujo atómico de una operación se compone de los siguientes pasos:

1. **Host (IDE):** Antigravity captura el prompt del usuario.
2. **Client (LLM):** La Inteligencia Artificial analiza el prompt, lee los contratos Zod (`ListTools`) y decide qué herramienta invocar.
3. **Transport (stdio):** El Host envía la petición JSON-RPC a nuestro servidor Node.js.
4. **Server (MCP):** El `server.ts` valida los argumentos entrantes mediante esquemas estrictos (`safeParse`).
5. **Wrapper (Adapter):** La petición se envía a través de `GitHubOperations` para manejar posibles errores externos y rastrear el Rate Limit.
6. **API Externa:** Octokit muta o lee el estado en la base de datos de GitHub.
7. **DTO:** El servidor extrae solo la información relevante y retorna la respuesta procesada al LLM.

```text
+----------------+       JSON-RPC 2.0      +----------------------+       REST API       +----------------+
|                |      (via stdio)        |                      |    (HTTPS / Auth)    |                |
|  Antigravity   | ----------------------> |   MCP Server (Node)  | -------------------> |   GitHub API   |
|  (Host + LLM)  |                         |   - Zod Validation   |                      |   - Repos      |
|                | <---------------------- |   - GitHub Wrapper   | <------------------- |   - Git Object |
+----------------+    DTO Response / Error +----------------------+      JSON Data       +----------------+

```


## 🚀 Integración con Antigravity (IDE)

Para utilizar este servidor MCP dentro del entorno Antigravity, debes darlo de alta en la configuración global del IDE.

1. Compila el proyecto ejecutando `npm run build` en la raíz del repositorio. Esto generará la carpeta `/dist`.
2. Abre la configuración de servidores MCP en Antigravity.
3. Agrega la siguiente configuración, reemplazando las rutas y tokens por los tuyos:

\`\`\`json
{
  "mcpServers": {
    "github-mcp-agent": {
      "command": "node",
      "args": [
        "/ruta/absoluta/a/tu/mcp-agent/dist/utils/server.js"
      ],
      "env": {
        "GITHUB_TOKEN": "tu_personal_access_token_aqui"
      }
    }
  }
}
\`\`\`
4. Reinicia Antigravity. El agente ahora tendrá acceso al catálogo de herramientas.

---

## 🛠️ Troubleshooting (Diagnóstico de Errores Comunes)

Si el servidor no se conecta o las herramientas fallan, verifica los siguientes puntos:

* **El servidor crashea inmediatamente al iniciar:**
  * *Causa:* Aplicación del principio *Fail-Fast* en `src/config/env.ts`.
  * *Solución:* Verifica que la variable `GITHUB_TOKEN` esté correctamente definida en el archivo `mcp_config.json` de Antigravity.
* **Error "Cannot find module... server.js":**
  * *Causa:* Antigravity está intentando leer el código compilado, pero no existe.
  * *Solución:* Asegúrate de haber ejecutado `npm run build`. El archivo `mcp_config.json` debe apuntar siempre a la carpeta `/dist`, nunca a `/src`.
* **La IA recibe un error "UNAUTHORIZED" o "FORBIDDEN":**
  * *Causa:* El token de GitHub ha expirado o carece de los permisos necesarios.
  * *Solución:* Genera un nuevo token asegurándote de marcar los scopes `repo`, `user` y `admin:org`.
* **La IA inventa datos o utiliza parámetros incorrectos (Alucinación):**
  * *Causa:* Las descripciones (`description`) en el archivo `server.ts` son ambiguas.
  * *Solución:* Refina el *Prompt Engineering* interno modificando las descripciones de las herramientas en `ListToolsRequestSchema` para ser más directivo.
* **Error "TypeScript exactOptionalPropertyTypes":**
  * *Causa:* Se está enviando un valor `undefined` explícito a la API de GitHub.
  * *Solución:* Utiliza el *Spread Operator* condicional (`...`) en los handlers para omitir por completo las propiedades que no fueron proporcionadas por la IA.

  ## 🧪 Evidencia de Testing y Verificación Manual (Wiring)

El servidor ha sido sometido a pruebas unitarias y de integración determinísticas mediante `Vitest`, simulando respuestas de la API de GitHub (Mocking de casos de éxito, 401 y 403) para garantizar su robustez sin depender de la red.

Adicionalmente, se realizó la comprobación manual del flujo (Wiring) a través de MCP Inspector para confirmar el correcto enrutamiento de datos.

**Comando de ejecución del servidor de pruebas:**
\`\`\`bash
npx @modelcontextprotocol/inspector node dist/utils/server.js
\`\`\`

**Prueba de Input Válido (Happy Path):**
* **Tool ejecutada:** `list_repositories`
* **Parámetros enviados:** `{ "page": 1, "per_page": 5 }`
* **Resultado observado:** El servidor procesó la petición, se conectó a GitHub y retornó exitosamente el DTO con la lista de repositorios, incluyendo el campo `url` y `default_branch`.

**Prueba de Input Inválido (Rechazo Zod):**
* **Tool ejecutada:** `create_issue`
* **Parámetros enviados:** `{ "repo": "mcp-agent" }` *(Falta el parámetro requerido 'owner' y 'title')*
* **Resultado observado:** El request no alcanzó la API de GitHub. El servidor interceptó la petición en la capa de esquemas y devolvió un error estructurado validando la falla del contrato: `Validation Error: "owner" is required`.