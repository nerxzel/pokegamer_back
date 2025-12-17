const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getCart = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user.userId;

    let cart = await Cart.findOne({ tenantId, userId }).populate('items.productId');

    if (!cart) {
      cart = await Cart.create({
        tenantId,
        userId,
        items: []
      });
    }

    res.status(200).json({
      message: 'Carrito obtenido exitosamente',
      statusCode: 200,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        message: 'Faltan campos requeridos: productId, quantity (mínimo 1)',
        statusCode: 400
      });
    }

    const product = await Product.findOne({ _id: productId, tenantId, isActive: true });

    if (!product) {
      return res.status(404).json({
        message: 'Producto no encontrado o inactivo',
        statusCode: 404
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        message: 'Stock insuficiente',
        statusCode: 400
      });
    }

    let cart = await Cart.findOne({ tenantId, userId });

    if (!cart) {
      cart = new Cart({
        tenantId,
        userId,
        items: []
      });
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId.toString()
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({
      message: 'Producto agregado al carrito',
      statusCode: 200,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user.userId;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 1) {
      return res.status(400).json({
        message: 'La cantidad debe ser al menos 1',
        statusCode: 400
      });
    }

    const cart = await Cart.findOne({ tenantId, userId });

    if (!cart) {
      return res.status(404).json({
        message: 'Carrito no encontrado',
        statusCode: 404
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId.toString()
    );

    if (itemIndex < 0) {
      return res.status(404).json({
        message: 'Producto no encontrado en el carrito',
        statusCode: 404
      });
    }

    const product = await Product.findOne({ _id: productId, tenantId });
    if (product && product.stock < quantity) {
      return res.status(400).json({
        message: 'Stock insuficiente',
        statusCode: 400
      });
    }

    cart.items[itemIndex].quantity = quantity;

    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({
      message: 'Cantidad actualizada',
      statusCode: 200,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user.userId;
    const { productId } = req.params;

    const cart = await Cart.findOne({ tenantId, userId });

    if (!cart) {
      return res.status(404).json({
        message: 'Carrito no encontrado',
        statusCode: 404
      });
    }

    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId.toString()
    );

    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({
      message: 'Producto eliminado del carrito',
      statusCode: 200,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user.userId;

    const cart = await Cart.findOne({ tenantId, userId });

    if (!cart) {
      return res.status(404).json({
        message: 'Carrito no encontrado',
        statusCode: 404
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      message: 'Carrito vaciado',
      statusCode: 200,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
