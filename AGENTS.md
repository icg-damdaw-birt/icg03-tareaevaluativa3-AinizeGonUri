# Guía para Agentes de IA (Vibecoding)

Bienvenido, Co-piloto. Este documento te guía sobre cómo generar código para el proyecto `mivideoteca-api`.

## 1. Stack Tecnológico

* **Backend:** Node.js, Express 5
* **ORM:** Prisma 7 (con driver adapters)
* **Base de Datos:** SQLite (en desarrollo), PostgreSQL (en producción)
* **Testing:** Jest 30, Supertest
* **Seguridad:** JWT (con middleware `authMiddleware`), bcryptjs

## 2. Arquitectura y Estructura

* `/controllers`: Lógica de negocio (funciones separadas, ej. `getAllMovies`, `toggleFavorite`).
* `/routes`: Definición de endpoints. Todas las rutas de movies usan `router.use(authMiddleware)`.
* `/middleware`: Middlewares de la aplicación (ej. `authMiddleware.js`).
* `/lib`: Utilidades compartidas (ej. `prisma.js` - cliente de Prisma).
* `/prisma`: Esquema y migraciones.
* `/__tests__`: Tests de integración. Cada *feature* tiene su propio archivo (ej. `auth.test.js`, `movie.test.js`, `favorite.test.js`).

## 3. Reglas de la Casa (Principios de Código)

* **Seguridad primero:** Todos los endpoints de movies están protegidos por `authMiddleware` a nivel de router.
* **Lógica en Controladores:** NO escribas lógica de negocio en los archivos de rutas. Las rutas solo importan y aplican controladores.
* **Testing es Obligatorio:** CADA nuevo endpoint debe tener su archivo de test en `__tests__` que pruebe su "camino feliz" y casos de error.
* **Mockear Prisma:** En los tests, SIEMPRE se debe "mockear" el cliente de Prisma con `jest.mock`. El test NUNCA debe tocar la base de datos real.

```javascript
// Patrón de mock en los tests
const mockPrisma = {
  movie: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};
jest.mock('../lib/prisma', () => mockPrisma);

// Mock del middleware de auth (simula usuario autenticado)
jest.mock('../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { userId: 'user-123' };
    next();
  };
});
```

* **Manejo de Errores:** Usa bloques `try...catch` y devuelve `res.status(500)` genérico si algo falla.
* **Verificar propiedad:** Antes de actualizar/eliminar, verifica que el recurso pertenece al usuario con `ownerId: req.user.userId`.