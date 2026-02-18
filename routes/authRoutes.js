const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// Rutas públicas: NO requieren autenticación
// POST /api/auth/register - Crear cuenta nueva
// POST /api/auth/login - Iniciar sesión
router.post('/register', register);
router.post('/login', login);

module.exports = router;
