const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const createOrder = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user.userId;

    const cart = await Cart.findOne({ tenantId, userId }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message: 'El carrito está vacío',
        statusCode: 400
      });
    }

    const orderItems = [];
    let total = 0;

    for (const cartItem of cart.items) {
      const product = cartItem.productId;

      if (!product || !product.isActive) {
        return res.status(400).json({
          message: `Producto ${product?.name || 'desconocido'} no disponible`,
          statusCode: 400
        });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          message: `Stock insuficiente para ${product.name}`,
          statusCode: 400
        });
      }

      orderItems.push({
        productId: product._id,
        quantity: cartItem.quantity,
        price: product.price
      });

      total += product.price * cartItem.quantity;
    }

    const order = await Order.create({
      tenantId,
      userId,
      items: orderItems,
      total,
      status: 'pending'
    });

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    cart.items = [];
    await cart.save();

    await order.populate('items.productId');

    res.status(201).json({
      message: 'Orden creada exitosamente',
      statusCode: 201,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { page = 1, limit = 10 } = req.query;

    const filter = { tenantId };

    if (userRole !== 'admin') {
      filter.userId = userId;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .populate('items.productId')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      message: 'Órdenes obtenidas exitosamente',
      statusCode: 200,
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { id } = req.params;

    const filter = { _id: id, tenantId };

    if (userRole !== 'admin') {
      filter.userId = userId;
    }

    const order = await Order.findOne(filter).populate('items.productId');

    if (!order) {
      return res.status(404).json({
        message: 'Orden no encontrada',
        statusCode: 404
      });
    }

    res.status(200).json({
      message: 'Orden obtenida exitosamente',
      statusCode: 200,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'paid', 'shipped', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Status inválido. Debe ser uno de: ${validStatuses.join(', ')}`,
        statusCode: 400
      });
    }

    const order = await Order.findOne({ _id: id, tenantId });

    if (!order) {
      return res.status(404).json({
        message: 'Orden no encontrada',
        statusCode: 404
      });
    }

    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } }
        );
      }
    }

    order.status = status;
    await order.save();
    await order.populate('items.productId');

    res.status(200).json({
      message: 'Estado de orden actualizado',
      statusCode: 200,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
};
