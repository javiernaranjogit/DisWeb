# Ingeniería de desarrollo web

Dos prácticas: una API REST con autenticación por token y un sitio estático de streaming.

**Tecnologías**: Node.js · Express · MongoDB · Mongoose · JWT · HTML5

## Contenido

### `backend/` — API REST

CRUD de tareas sobre MongoDB, con rutas públicas y rutas protegidas por JWT.

```bash
cd backend
npm ci
npm start             # http://localhost:3000
```

Necesita MongoDB en local (`backendDB` por defecto, configurable con `MONGODB_URI`). El secreto
de firma se toma de `TOKEN_SECRET`; si no se define, se genera uno aleatorio en cada arranque.

| Método | Ruta | Descripción |
|---|---|---|
| GET · POST | `/tasks` | Listar y crear tareas |
| GET · PUT · DELETE | `/tasks/:id` | Leer, actualizar y borrar una tarea |
| POST | `/newUser` | Alta de usuario |
| POST | `/auth` | Devuelve un JWT válido 24 minutos |
| POST | `/listTask` | Listado que exige `Authorization: Bearer` |

Las colecciones de Postman incluidas (`Server Test`, `AWS Test`) sirven para probar los endpoints.

**Correcciones aplicadas** sobre la entrega original: las contraseñas se guardan hasheadas con
bcrypt en lugar de en claro; `/auth` comprueba de verdad la contraseña (antes emitía el token
con sólo encontrar el usuario) y el token identifica a quién pertenece; y se han actualizado
Express, Mongoose y jsonwebtoken, migrando los controladores a `async/await`.

### `streaming/` — Sitio estático

Plantilla HTML5 Boilerplate con contenido de vídeo.

```bash
cd streaming && python3 -m http.server 8080
```

> Prácticas de 2020, conservadas tal y como se entregaron salvo por la eliminación del secreto
> de firma que venía escrito en el código.
