const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// Función auxiliar: crea un JWT que identifica al usuario por 1 hora
// Los frontends (Flutter/SvelteKit) enviarán este token en cada petición
const buildToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }

  // El token incluye el ID del usuario y expira en 1 hora
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Endpoint de registro: crea una nueva cuenta de usuario
// Pasos: validar datos → hashear contraseña → guardar en DB
exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    // NUNCA guardar contraseñas en texto plano - siempre hashear
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    res.status(201).json({ message: 'Usuario registrado con éxito' });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El email ya existe' });
    }

    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
};

// Endpoint de login: valida credenciales y devuelve un token JWT
// Pasos: buscar usuario → verificar contraseña → generar token
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    // Busca el usuario por email en la base de datos
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Compara la contraseña enviada con el hash guardado
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = buildToken(user.id);

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
};
