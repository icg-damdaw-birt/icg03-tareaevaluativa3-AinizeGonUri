const jwt = require('jsonwebtoken');

// Middleware de autenticación: protege rutas que requieren login
// Se ejecuta ANTES de los controladores para verificar que el usuario esté logueado
module.exports = (req, res, next) => {
  // Busca el header "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No autorizado, no hay token' });
  }

  // Extrae el token (elimina "Bearer " del principio)
  const token = authHeader.split(' ')[1];

  try {
    // Verifica que el token sea válido y no haya expirado
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Añade la información del usuario a la petición
    // Los controladores pueden acceder a req.user.userId
    req.user = { userId: decoded.userId };

    // Continúa al siguiente middleware/controlador
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token no válido' });
  }
};
