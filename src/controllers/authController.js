const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const tenantId = req.tenantId;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Faltan campos requeridos: name, email, password',
        statusCode: 400
      });
    }

    const existingUser = await User.findOne({ tenantId, email });
    if (existingUser) {
      return res.status(409).json({
        message: 'El email ya está registrado en este tenant',
        statusCode: 409
      });
    }

    const user = await User.create({
      tenantId,
      name,
      email,
      password,
      role: role || 'customer',
      isActive: true
    });

    const token = generateToken({
      userId: user._id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email
    });

    const userResponse = {
      id: user._id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      statusCode: 201,
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};


const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const tenantId = req.tenantId; 

    if (!email || !password) {
      return res.status(400).json({
        message: 'Faltan campos requeridos: email, password',
        statusCode: 400
      });
    }

    const user = await User.findOne({ tenantId, email }).select('+password');

    if (!user) {
      return res.status(401).json({
        message: 'Credenciales inválidas',
        statusCode: 401
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: 'Usuario inactivo',
        statusCode: 403
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Credenciales inválidas',
        statusCode: 401
      });
    }

    const token = generateToken({
      userId: user._id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email
    });

    const userResponse = {
      id: user._id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    };

    res.status(200).json({
      message: 'Login exitoso',
      statusCode: 200,
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login
};
