/**
 * TESTS DE PELÍCULAS (CRUD)
 * 
 * Este archivo contiene tests para las operaciones CRUD de películas.
 * Usamos MOCKS de Prisma para no tocar la base de datos real durante los tests.
 * 
 * Todas las rutas de películas requieren autenticación, por lo que
 * también mockeamos el middleware de autenticación.
 * 
 * Herramientas:
 * - Jest: Framework de testing
 * - Supertest: Para hacer peticiones HTTP a la API
 * - Mocks: Impostores de Prisma y del middleware de auth
 */

const request = require('supertest');

// ============================================
// CONFIGURACIÓN DE MOCKS
// ============================================

// Mock del módulo prisma ANTES de importar el servidor
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  movie: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock('../lib/prisma', () => mockPrisma);

// Mock del middleware de autenticación
// Simula que el usuario está autenticado con userId 'user-123'
jest.mock('../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { userId: 'user-123' };
    next();
  };
});

const app = require('../server');
const prisma = require('../lib/prisma');

// ============================================
// SUITE DE TESTS: API DE PELÍCULAS
// ============================================
describe('API de Películas', () => {
  // Limpiar todos los mocks después de cada test
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // TESTS DE LISTAR PELÍCULAS (GET /api/movies)
  // ==========================================
  describe('GET /api/movies', () => {
    
    it('debería devolver todas las películas del usuario', async () => {
      // ARRANGE
      const peliculasMock = [
        {
          id: 'movie-1',
          title: 'Inception',
          director: 'Christopher Nolan',
          year: 2010,
          posterUrl: 'https://example.com/inception.jpg',
          ownerId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'movie-2',
          title: 'The Matrix',
          director: 'Wachowski Sisters',
          year: 1999,
          posterUrl: 'https://example.com/matrix.jpg',
          ownerId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.movie.findMany.mockResolvedValue(peliculasMock);

      // ACT
      const response = await request(app)
        .get('/api/movies')
        .set('Authorization', 'Bearer fake-token');

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('Inception');
      expect(prisma.movie.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'user-123' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('debería devolver array vacío si el usuario no tiene películas', async () => {
      // ARRANGE
      prisma.movie.findMany.mockResolvedValue([]);

      // ACT
      const response = await request(app)
        .get('/api/movies')
        .set('Authorization', 'Bearer fake-token');

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
      expect(response.body).toEqual([]);
    });
  });

  // ==========================================
  // TESTS DE OBTENER PELÍCULA (GET /api/movies/:id)
  // ==========================================
  describe('GET /api/movies/:id', () => {
    
    it('debería devolver una película por su ID', async () => {
      // ARRANGE
      const peliculaMock = {
        id: 'movie-1',
        title: 'Inception',
        director: 'Christopher Nolan',
        year: 2010,
        posterUrl: 'https://example.com/inception.jpg',
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.movie.findFirst.mockResolvedValue(peliculaMock);

      // ACT
      const response = await request(app)
        .get('/api/movies/movie-1')
        .set('Authorization', 'Bearer fake-token');

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Inception');
      expect(prisma.movie.findFirst).toHaveBeenCalledWith({
        where: { id: 'movie-1', ownerId: 'user-123' },
      });
    });

    it('debería devolver 404 si la película no existe', async () => {
      // ARRANGE
      prisma.movie.findFirst.mockResolvedValue(null);

      // ACT
      const response = await request(app)
        .get('/api/movies/no-existe')
        .set('Authorization', 'Bearer fake-token');

      // ASSERT
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Película no encontrada');
    });
  });

  // ==========================================
  // TESTS DE CREAR PELÍCULA (POST /api/movies)
  // ==========================================
  describe('POST /api/movies', () => {
    
    it('debería crear una película correctamente', async () => {
      // ARRANGE
      const nuevaPelicula = {
        id: 'movie-new',
        title: 'Interstellar',
        director: 'Christopher Nolan',
        year: 2014,
        posterUrl: 'https://example.com/interstellar.jpg',
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.movie.create.mockResolvedValue(nuevaPelicula);

      // ACT
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', 'Bearer fake-token')
        .send({
          title: 'Interstellar',
          director: 'Christopher Nolan',
          year: 2014,
          posterUrl: 'https://example.com/interstellar.jpg',
        });

      // ASSERT
      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Interstellar');
      expect(response.body.ownerId).toBe('user-123');
      expect(prisma.movie.create).toHaveBeenCalledTimes(1);
    });

    it('debería crear película sin posterUrl (campo opcional)', async () => {
      // ARRANGE
      const peliculaSinPoster = {
        id: 'movie-new',
        title: 'Dunkirk',
        director: 'Christopher Nolan',
        year: 2017,
        posterUrl: null,
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.movie.create.mockResolvedValue(peliculaSinPoster);

      // ACT
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', 'Bearer fake-token')
        .send({
          title: 'Dunkirk',
          director: 'Christopher Nolan',
          year: 2017,
          // posterUrl no se envía
        });

      // ASSERT
      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Dunkirk');
    });
  });

  // ==========================================
  // TESTS DE ACTUALIZAR PELÍCULA (PUT /api/movies/:id)
  // ==========================================
  describe('PUT /api/movies/:id', () => {
    
    it('debería actualizar una película correctamente', async () => {
      // ARRANGE
      const peliculaActualizada = {
        id: 'movie-1',
        title: 'Inception (Director\'s Cut)',
        director: 'Christopher Nolan',
        year: 2010,
        posterUrl: 'https://example.com/inception-dc.jpg',
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // updateMany devuelve { count: N }
      prisma.movie.updateMany.mockResolvedValue({ count: 1 });
      prisma.movie.findUnique.mockResolvedValue(peliculaActualizada);

      // ACT
      const response = await request(app)
        .put('/api/movies/movie-1')
        .set('Authorization', 'Bearer fake-token')
        .send({
          title: 'Inception (Director\'s Cut)',
          director: 'Christopher Nolan',
          year: 2010,
          posterUrl: 'https://example.com/inception-dc.jpg',
        });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Inception (Director\'s Cut)');
      expect(prisma.movie.updateMany).toHaveBeenCalledWith({
        where: { id: 'movie-1', ownerId: 'user-123' },
        data: {
          title: 'Inception (Director\'s Cut)',
          director: 'Christopher Nolan',
          year: 2010,
          posterUrl: 'https://example.com/inception-dc.jpg',
        },
      });
    });

    it('debería devolver 404 si la película a actualizar no existe', async () => {
      // ARRANGE
      prisma.movie.updateMany.mockResolvedValue({ count: 0 });

      // ACT
      const response = await request(app)
        .put('/api/movies/no-existe')
        .set('Authorization', 'Bearer fake-token')
        .send({
          title: 'Título actualizado',
          director: 'Director',
          year: 2020,
        });

      // ASSERT
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Película no encontrada');
    });
  });

  // ==========================================
  // TESTS DE ELIMINAR PELÍCULA (DELETE /api/movies/:id)
  // ==========================================
  describe('DELETE /api/movies/:id', () => {
    
    it('debería eliminar una película correctamente', async () => {
      // ARRANGE
      prisma.movie.deleteMany.mockResolvedValue({ count: 1 });

      // ACT
      const response = await request(app)
        .delete('/api/movies/movie-1')
        .set('Authorization', 'Bearer fake-token');

      // ASSERT
      expect(response.status).toBe(204);
      expect(prisma.movie.deleteMany).toHaveBeenCalledWith({
        where: { id: 'movie-1', ownerId: 'user-123' },
      });
    });

    it('debería devolver 404 si la película a eliminar no existe', async () => {
      // ARRANGE
      prisma.movie.deleteMany.mockResolvedValue({ count: 0 });

      // ACT
      const response = await request(app)
        .delete('/api/movies/no-existe')
        .set('Authorization', 'Bearer fake-token');

      // ASSERT
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Película no encontrada');
    });
  });
});

/**
 * NOTAS PARA ESTUDIANTES:
 * 
 * 1. MOCK DEL MIDDLEWARE DE AUTENTICACIÓN:
 *    Como todas las rutas de películas requieren auth, mockeamos
 *    el middleware para simular un usuario autenticado (user-123).
 *    Así nos centramos en testear la lógica de películas.
 * 
 * 2. PATRÓN AAA (ARRANGE-ACT-ASSERT):
 *    - Arrange: Configuramos los mocks con los datos que esperamos
 *    - Act: Hacemos la petición HTTP
 *    - Assert: Verificamos respuesta y llamadas a Prisma
 * 
 * 3. ¿QUÉ ESTAMOS TESTEANDO?
 *    - GET /api/movies: Lista las películas del usuario
 *    - GET /api/movies/:id: Obtiene una película específica
 *    - POST /api/movies: Crea una nueva película
 *    - PUT /api/movies/:id: Actualiza una película
 *    - DELETE /api/movies/:id: Elimina una película
 * 
 * 4. SEGURIDAD:
 *    Fíjate cómo en cada test verificamos que Prisma se llama
 *    con ownerId: 'user-123'. Esto asegura que un usuario
 *    solo puede ver/modificar SUS películas.
 * 
 * 5. TU EJERCICIO (rating.test.js):
 *    Usa este archivo como referencia para crear los tests
 *    del endpoint PATCH /api/movies/:id/rating
 */
