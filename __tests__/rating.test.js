const request = require('supertest');
const express = require('express');

// Mock de Prisma
const mockPrisma = {
  movie: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};
jest.mock('../lib/prisma', () => mockPrisma);

// Mock del middleware de autenticación
jest.mock('../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { userId: 'user-123' };
    next();
  };
});

const movieRoutes = require('../routes/movieRoutes');
const app = express();
app.use(express.json());
app.use('/api/movies', movieRoutes);

describe('Rating - Actualizar puntuación', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ✅ CAMINO FELIZ
  test('PATCH /api/movies/:id/rating - Actualizar rating correctamente', async () => {
    const movieId = 'movie-123';

    mockPrisma.movie.findFirst.mockResolvedValue({
      id: movieId,
      title: 'Inception',
      rating: 0,
      ownerId: 'user-123',
    });

    mockPrisma.movie.update.mockResolvedValue({
      id: movieId,
      title: 'Inception',
      rating: 4,
      ownerId: 'user-123',
    });

    const res = await request(app)
      .patch(`/api/movies/${movieId}/rating`)
      .send({ rating: 4 });

    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(4);
    expect(mockPrisma.movie.findFirst).toHaveBeenCalledWith({
      where: { id: movieId, ownerId: 'user-123' },
    });
    expect(mockPrisma.movie.update).toHaveBeenCalledWith({
      where: { id: movieId },
      data: { rating: 4 },
    });
  });

  // ❌ CAMINOS TRISTES (Bonus)
  test('PATCH /api/movies/:id/rating - Rating mayor que 5 devuelve 400', async () => {
    const res = await request(app)
      .patch('/api/movies/movie-123/rating')
      .send({ rating: 6 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('El rating debe ser un número entero entre 0 y 5');
    expect(mockPrisma.movie.findFirst).not.toHaveBeenCalled();
  });

  test('PATCH /api/movies/:id/rating - Rating negativo devuelve 400', async () => {
    const res = await request(app)
      .patch('/api/movies/movie-123/rating')
      .send({ rating: -1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('El rating debe ser un número entero entre 0 y 5');
  });

  test('PATCH /api/movies/:id/rating - Sin rating en el body devuelve 400', async () => {
    const res = await request(app)
      .patch('/api/movies/movie-123/rating')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('El rating debe ser un número entero entre 0 y 5');
  });

  test('PATCH /api/movies/:id/rating - Película no encontrada devuelve 404', async () => {
    mockPrisma.movie.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/movies/invalid-id/rating')
      .send({ rating: 3 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Película no encontrada');
  });
});