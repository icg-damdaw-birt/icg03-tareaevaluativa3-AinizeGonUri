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

// Setup de Express y rutas
const movieRoutes = require('../routes/movieRoutes');
const app = express();
app.use(express.json());
app.use('/api/movies', movieRoutes);

describe('Favoritos - Toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('PATCH /api/movies/:id/favorite - Marcar como favorito', async () => {
    const movieId = 'movie-123';
    
    mockPrisma.movie.findFirst.mockResolvedValue({
      id: movieId,
      title: 'Inception',
      isFavorite: false,
      ownerId: 'user-123',
    });

    mockPrisma.movie.update.mockResolvedValue({
      id: movieId,
      title: 'Inception',
      isFavorite: true,
      ownerId: 'user-123',
    });

    const res = await request(app).patch(`/api/movies/${movieId}/favorite`);

    expect(res.status).toBe(200);
    expect(res.body.isFavorite).toBe(true);
    expect(mockPrisma.movie.findFirst).toHaveBeenCalledWith({
      where: { id: movieId, ownerId: 'user-123' },
    });
    expect(mockPrisma.movie.update).toHaveBeenCalledWith({
      where: { id: movieId },
      data: { isFavorite: true },
    });
  });

  test('PATCH /api/movies/:id/favorite - Desmarcar como favorito', async () => {
    const movieId = 'movie-456';
    
    mockPrisma.movie.findFirst.mockResolvedValue({
      id: movieId,
      title: 'The Matrix',
      isFavorite: true,
      ownerId: 'user-123',
    });

    mockPrisma.movie.update.mockResolvedValue({
      id: movieId,
      title: 'The Matrix',
      isFavorite: false,
      ownerId: 'user-123',
    });

    const res = await request(app).patch(`/api/movies/${movieId}/favorite`);

    expect(res.status).toBe(200);
    expect(res.body.isFavorite).toBe(false);
  });

  test('PATCH /api/movies/:id/favorite - Película no encontrada (404)', async () => {
    mockPrisma.movie.findFirst.mockResolvedValue(null);

    const res = await request(app).patch('/api/movies/invalid-id/favorite');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Película no encontrada');
  });

  test('PATCH /api/movies/:id/favorite - Error del servidor (500)', async () => {
    mockPrisma.movie.findFirst.mockRejectedValue(
      new Error('Database error')
    );

    const res = await request(app).patch('/api/movies/movie-123/favorite');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error al actualizar favorito');
  });
});
