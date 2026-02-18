// Configura las variables de entorno desde el archivo .env
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
// Cliente de Prisma: ORM que conecta con la base de datos (SQLite en dev, PostgreSQL en prod)
const prisma = require('./lib/prisma');

// Importamos las rutas modularizadas
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares esenciales que preparan la API para recibir peticiones JSON desde clientes web y móviles.
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Ruta raíz - Bienvenida
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenido a MiVideoteca API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      movies: '/api/movies'
    }
  });
});

// Punto de control rápido para comprobar que el servicio está disponible y operativo.
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta pública de prueba - Conexión a base de datos
app.get('/api/movies/public', async (req, res) => {
  try {
    const count = await prisma.movie.count();
    res.json({ 
      message: 'Conexión a base de datos exitosa', 
      totalMovies: count 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error de conexión a la base de datos' });
  }
});

// ========================================
// RUTAS DE LA API
// ========================================
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);

// Captura rutas inexistentes para ofrecer un mensaje claro al alumnado.
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// Solo arranca el servidor si NO estamos en modo test
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
}

// Exportar app para tests
module.exports = app;
