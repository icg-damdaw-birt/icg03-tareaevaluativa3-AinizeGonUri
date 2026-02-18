/**
 * TESTS DE AUTENTICACIÓN
 * 
 * Este archivo contiene tests para las funcionalidades de registro y login.
 * Usamos MOCKS de Prisma para no tocar la base de datos real durante los tests.
 * 
 * Herramientas:
 * - Jest: Framework de testing
 * - Supertest: Para hacer peticiones HTTP a la API
 * - Mocks: Impostores de Prisma que simulan la base de datos
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ============================================
// CONFIGURACIÓN DE MOCKS
// ============================================
// Mock del módulo prisma ANTES de importar el servidor
// Esto reemplaza el cliente de Prisma con un objeto falso que controlamos
const mockPrisma = {
  user: {
    findUnique: jest.fn(),  // Simula búsqueda de usuario
    create: jest.fn(),      // Simula creación de usuario
  },
};

jest.mock('../lib/prisma', () => mockPrisma);

const app = require('../server');
const prisma = require('../lib/prisma');

// ============================================
// SUITE DE TESTS: API DE AUTENTICACIÓN
// ============================================
describe('API de Autenticación', () => {
  // Limpiar todos los mocks después de cada test
  // Esto evita que los datos de un test afecten a otro
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // TESTS DE REGISTRO
  // ==========================================
  describe('POST /api/auth/register', () => {
    
    it('debería registrar un nuevo usuario correctamente', async () => {
      // ARRANGE (Preparar)
      // Simulamos el usuario que devolvería la base de datos
      const nuevoUsuario = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword',  // En realidad sería un hash
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Configuramos el mock para que devuelva este usuario
      prisma.user.create.mockResolvedValue(nuevoUsuario);

      // ACT (Actuar)
      // Hacemos la petición POST a /api/auth/register
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // ASSERT (Verificar)
      // Comprobamos que la respuesta es correcta
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('debería fallar si el email ya existe', async () => {
      // ARRANGE
      // Simulamos el error que lanza Prisma cuando hay un email duplicado
      const error = new Error('Unique constraint failed');
      error.code = 'P2002';  // Código de error de Prisma para duplicados
      
      prisma.user.create.mockRejectedValue(error);

      // ACT
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existente@example.com',
          password: 'password123',
        });

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El email ya existe');
    });

    it('debería fallar si falta el email o la contraseña', async () => {
      // ACT
      // Enviamos solo el email, sin contraseña
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          // password falta intencionadamente
        });

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email y contraseña son obligatorios');
    });
  });

  // ==========================================
  // TESTS DE LOGIN
  // ==========================================
  describe('POST /api/auth/login', () => {
    
    it('debería hacer login correctamente con credenciales válidas', async () => {
      // ARRANGE
      // Creamos un hash real de la contraseña (como haría bcrypt en el registro)
      const hashedPassword = await bcrypt.hash('password123', 10);
      const usuarioMock = {
        id: 'user-123',
        email: 'test@example.com',
        password: hashedPassword,  // Hash real para que bcrypt.compare funcione
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Configuramos el mock para que "encuentre" este usuario
      prisma.user.findUnique.mockResolvedValue(usuarioMock);

      // ACT
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',  // Contraseña en texto plano
        });

      // ASSERT
      // Verificamos que recibimos un token JWT
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      
      // Decodificamos el token para verificar que contiene el userId correcto
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe('user-123');
    });

    it('debería fallar el login con contraseña incorrecta', async () => {
      // ARRANGE
      // Hash de la contraseña correcta
      const hashedPassword = await bcrypt.hash('passwordCorrecta', 10);
      const usuarioMock = {
        id: 'user-123',
        email: 'test@example.com',
        password: hashedPassword,
      };

      prisma.user.findUnique.mockResolvedValue(usuarioMock);

      // ACT
      // Intentamos login con contraseña incorrecta
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'passwordIncorrecta',
        });

      // ASSERT
      // Por seguridad, no decimos "contraseña incorrecta" sino "credenciales inválidas"
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Credenciales inválidas');
    });

    it('debería fallar el login con usuario inexistente', async () => {
      // ARRANGE
      // Configuramos el mock para que NO encuentre ningún usuario
      prisma.user.findUnique.mockResolvedValue(null);

      // ACT
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noexiste@example.com',
          password: 'password123',
        });

      // ASSERT
      // Por seguridad, el mensaje es genérico (no revelamos si el email existe o no)
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Credenciales inválidas');
    });

    it('debería fallar si falta el email o la contraseña', async () => {
      // ACT
      // Enviamos solo email, sin contraseña
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          // password falta intencionadamente
        });

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email y contraseña son obligatorios');
    });
  });
});

/**
 * NOTAS PARA ESTUDIANTES:
 * 
 * 1. ARRANGE-ACT-ASSERT (AAA):
 *    - Arrange: Preparar datos y mocks
 *    - Act: Ejecutar la acción (hacer la petición)
 *    - Assert: Verificar el resultado
 * 
 * 2. ¿POR QUÉ USAMOS MOCKS?
 *    - Los tests son rápidos (no esperan a la BD)
 *    - Son predecibles (controlamos qué devuelve la BD)
 *    - No ensucian la base de datos real
 *    - Podemos simular errores fácilmente
 * 
 * 3. ¿QUÉ ESTAMOS TESTEANDO?
 *    - Que los endpoints respondan con los códigos HTTP correctos
 *    - Que las validaciones funcionen (campos obligatorios)
 *    - Que se manejen errores correctamente (email duplicado)
 *    - Que el JWT se genere correctamente en el login
 * 
 * 4. EJECUTAR ESTOS TESTS:
 *    - Todos: npm test
 *    - En modo watch: npm run test:watch
 */