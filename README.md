# 🎬 MiVideoteca API

API REST para gestionar una videoteca personal. Proyecto de referencia para el curso de Integración Continua con GitHub.

## 🗄️ Base de Datos

### **UD3: Desarrollo Local (SQLite)**
Este proyecto usa **SQLite** para desarrollo local:
- ✅ Fácil de configurar (no requiere instalación de servidor)
- ✅ Perfecto para aprender y prototipar
- ✅ Base de datos en archivo: `prisma/dev.db`
- ✅ Funciona sin internet

### **UD5: Producción (PostgreSQL en Neon)**
En la Unidad 5 migraremos a **PostgreSQL** en Neon:
- Base de datos robusta y escalable
- Alojada en la nube
- Ideal para aplicaciones en producción

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/icg-damdaw-birt/mivideoteca-api.git
cd mivideoteca-api
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# El .env ya está configurado para SQLite:
DATABASE_URL="file:./dev.db"
JWT_SECRET="tu-secreto-super-seguro-cambialo-en-produccion"
```

### 4. Crear la base de datos
```bash
# Esto crea el archivo dev.db y aplica las migraciones
npm run prisma:migrate
```

### 5. (Opcional) Explorar la base de datos
```bash
# Abre Prisma Studio en http://localhost:5555
npm run prisma:studio
```

### 6. Iniciar el servidor
```bash
# Modo desarrollo (con auto-reload)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

---

## 🧪 Testing

```bash
# Ejecutar todos los tests una vez
npm test

# Ejecutar tests en modo watch (re-ejecuta al guardar cambios)
npm run test:watch
```

### ¿Los tests usan la base de datos?

**NO.** Los tests usan **mocks** (impostores) de Prisma.

Esto significa:
- Los tests **no conectan** a `dev.db`
- Los tests **no modifican** datos reales
- Los tests son **ultrarrápidos** (sin I/O de disco)
- El `DATABASE_URL` **no se usa** durante `npm test`

### Estado actual de tests (UD3)
```bash
npm test

# ✅ auth.test.js (implementado)
# ⏸️ favorite.test.js (se creará en video UD3)
# ⏸️ rating.test.js (ejercicio del alumno)
```

---

## 📋 Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `npm run dev` | nodemon server.js | Servidor con auto-reload |
| `npm start` | node server.js | Servidor modo producción |
| `npm test` | jest --verbose | Ejecutar tests |
| `npm run test:watch` | jest --watchAll --verbose | Tests en modo watch |
| `npm run prisma:migrate` | prisma migrate dev | Crear/aplicar migraciones |
| `npm run prisma:generate` | prisma generate | Regenerar cliente Prisma |
| `npm run prisma:studio` | prisma studio | GUI de base de datos |
| `npm run prisma:reset` | prisma migrate reset | Resetear BD (⚠️ borra datos) |

---

## 🛠️ Stack Tecnológico

- **Node.js** - Entorno de ejecución JavaScript
- **Express 5** - Framework web minimalista
- **Prisma 7** - ORM moderno con driver adapters
- **SQLite** (UD3) / **PostgreSQL** (UD5) - Base de datos
- **JWT** - Autenticación stateless
- **bcryptjs** - Hash de contraseñas
- **Jest 30** - Framework de testing
- **Supertest** - Testing de APIs HTTP

---

## 📁 Estructura del Proyecto

```
mivideoteca-api/
├── controllers/          # Lógica de negocio
│   ├── authController.js     ✅ Implementado + testeado
│   └── movieController.js    ✅ Implementado + testeado
├── routes/              # Definición de endpoints
│   ├── authRoutes.js
│   └── movieRoutes.js
├── middleware/          # Funciones intermedias
│   └── authMiddleware.js
├── lib/                 # Utilidades compartidas
│   └── prisma.js        # Cliente Prisma configurado
├── prisma/              # Configuración de base de datos
│   ├── schema.prisma    # Esquema de datos
│   ├── dev.db           # SQLite (generado tras migrate)
│   └── migrations/      # Historial de cambios en BD
├── __tests__/           # Tests automatizados
│   ├── auth.test.js     ✅ Implementado
│   ├── movie.test.js    ✅ Implementado (referencia CRUD)
│   ├── favorite.test.js ⏸️ Video UD3
│   └── rating.test.js   ⏸️ Ejercicio alumno
├── prisma.config.ts     # Configuración Prisma 7
├── server.js            # Punto de entrada
├── package.json         # Dependencias y scripts
└── .env                 # Variables de entorno (local)
```

---

## 🔐 Endpoints de la API

### Autenticación

#### Registro
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "tucontraseña"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "tucontraseña"
}
```

### Películas (requieren autenticación)

Todas las rutas de películas requieren el header:
```
Authorization: Bearer <tu-token-jwt>
```

#### Listar películas del usuario
```http
GET /api/movies
```

#### Obtener una película
```http
GET /api/movies/:id
```

#### Crear película
```http
POST /api/movies
Content-Type: application/json

{
  "title": "Inception",
  "director": "Christopher Nolan",
  "year": 2010,
  "posterUrl": "https://image.tmdb.org/t/p/w500/..."
}
```

#### Actualizar película
```http
PUT /api/movies/:id
Content-Type: application/json

{
  "title": "Inception (Director's Cut)",
  "director": "Christopher Nolan",
  "year": 2010,
  "posterUrl": "https://image.tmdb.org/t/p/w500/..."
}
```

#### Eliminar película
```http
DELETE /api/movies/:id
```

---

## 🎓 Para Estudiantes

### **UD3: El Backend y su Red de Seguridad (Testing)**
**Público: DAM + DAW (todos juntos)**

#### **Estado inicial:**
- ✅ API funcionando con CRUD completo
- ✅ Tests de autenticación implementados

#### **🎬 En el video harás:**
1. **Implementar Favoritos**
   - Modificar schema de Prisma (campo `isFavorite`)
   - Endpoint: PATCH /api/movies/:id/favorite
   - Crear `favorite.test.js` con tests completos

#### **📝 Tu ejercicio:**
Implementar **Rating** (calificación 0-5) usando IA:
- Modificar schema (campo `rating`)
- Endpoint: PATCH /api/movies/:id/rating
- Validación: rating entre 0 y 5
- Crear `rating.test.js` con tests completos

---

### **UD4: Frontend (Flutter o SvelteKit)**
**Público dividido:**
- **DAM**: Flutter obligatorio, Svelte opcional
- **DAW**: Svelte obligatorio, Flutter opcional

En esta unidad consumirás el backend que creaste en UD3.

---

### **UD5: Deploy en Producción**
**Público: DAM + DAW**

Migraremos de SQLite a **PostgreSQL en Neon**:
```env
# Producción
DATABASE_URL="postgresql://user:password@host.neon.tech/mivideoteca?sslmode=require"
```

Y desplegaremos en:
- Backend → Render/Railway
- Frontend Flutter → GitHub Releases (APK)
- Frontend Svelte → Vercel

---

## 🐛 Debugging

### Ver los datos de la base de datos
```bash
npm run prisma:studio
```

### Resetear la base de datos (⚠️ BORRA TODOS LOS DATOS)
```bash
npm run prisma:reset
```

### Si los tests fallan
1. Verifica que el archivo `.env` existe
2. Ejecuta `npm run prisma:generate`
3. Limpia la cache: `npm test -- --clearCache`

---

## 📚 Recursos Útiles

- [Documentación de Prisma](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [JWT Introduction](https://jwt.io/introduction)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

---

## 📝 Licencia

Este proyecto es material educativo.