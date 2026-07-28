# Ingeniería de desarrollo web

Dos prácticas: una API REST con autenticación por token y un sitio estático de streaming.

**Tecnologías**: Node.js · Express · MongoDB · Mongoose · JWT · HTML5

## Contenido

### `backend/` — API REST

CRUD de tareas sobre MongoDB, con rutas públicas y rutas protegidas por JWT.

```bash
cd backend
npm install
node server.js        # http://localhost:3000
```

Necesita MongoDB en local (usa la base de datos `backendDB`). El secreto de firma se toma de
`TOKEN_SECRET`; si no se define, se genera uno aleatorio en cada arranque.

Las colecciones de Postman incluidas (`Server Test`, `AWS Test`) sirven para probar los
endpoints: `/tasks`, `/tasks/:id`, `/auth`, `/newUser` y `/listTask`.

### `streaming/` — Sitio estático

Plantilla HTML5 Boilerplate con contenido de vídeo.

```bash
cd streaming && python3 -m http.server 8080
```

> Prácticas de 2020, conservadas tal y como se entregaron salvo por la eliminación del secreto
> de firma que venía escrito en el código.
