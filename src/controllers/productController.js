const Product = require('../models/Product');

const {
  encodeImageForStorage,
  decodeImageForResponse,
  detectImageMimeType,
  validateImageSize,
  isValidBase64
} = require('../utils/imageHandler');


const getProducts = async (req, res, next) => {
  try {
    const tenantId = req.tenantId; 
    const { isActive, page = 1, limit = 20 } = req.query;

    const filter = { tenantId };

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    const productsWithDecodedImages = products.map(product => {
      const productObj = product.toObject();
      if (productObj.imagen) {
        const mimeType = detectImageMimeType(productObj.imagen);
        productObj.imagen = decodeImageForResponse(productObj.imagen, mimeType);
      }
      return productObj;
    });

    res.status(200).json({
      message: 'Productos obtenidos exitosamente',
      statusCode: 200,
      data: {
        products: productsWithDecodedImages,
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

const getProductById = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, tenantId });

    if (!product) {
      return res.status(404).json({
        message: 'Producto no encontrado',
        statusCode: 404
      });
    }

    const productObj = product.toObject();
    if (productObj.imagen) {
      const mimeType = detectImageMimeType(productObj.imagen);
      productObj.imagen = decodeImageForResponse(productObj.imagen, mimeType);
    }

    res.status(200).json({
      message: 'Producto obtenido exitosamente',
      statusCode: 200,
      data: productObj
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { name, description, category, price, stock, imagen } = req.body;

    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({
        message: 'Faltan campos requeridos: name, category, price, stock',
        statusCode: 400
      });
    }

    let encodedImage = null;
    if (imagen) {
      if (!isValidBase64(imagen)) {
        return res.status(400).json({
          message: 'El formato de la imagen debe ser base64 válido',
          statusCode: 400
        });
      }

      if (!validateImageSize(imagen, 5)) {
        return res.status(400).json({
          message: 'La imagen es demasiado grande. Tamaño máximo: 5MB',
          statusCode: 400
        });
      }

      encodedImage = encodeImageForStorage(imagen);
    }

    const product = await Product.create({
      tenantId,
      name,
      category,
      description,
      price,
      stock,
      imagen: encodedImage,
      isActive: true
    });

    const productObj = product.toObject();
    if (productObj.imagen) {
      const mimeType = detectImageMimeType(imagen);
      productObj.imagen = decodeImageForResponse(productObj.imagen, mimeType);
    }

    res.status(201).json({
      message: 'Producto creado exitosamente',
      statusCode: 201,
      data: productObj
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { name, description, category, price, stock, isActive, imagen } = req.body;

    const product = await Product.findOne({ _id: id, tenantId });

    if (!product) {
      return res.status(404).json({
        message: 'Producto no encontrado',
        statusCode: 404
      });
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (isActive !== undefined) product.isActive = isActive;

    if (imagen !== undefined) {
      if (imagen === null || imagen === '') {
        product.imagen = null;
      } else {
        if (!isValidBase64(imagen)) {
          return res.status(400).json({
            message: 'El formato de la imagen debe ser base64 válido',
            statusCode: 400
          });
        }

        if (!validateImageSize(imagen, 5)) {
          return res.status(400).json({
            message: 'La imagen es demasiado grande. Tamaño máximo: 5MB',
            statusCode: 400
          });
        }

        product.imagen = encodeImageForStorage(imagen);
      }
    }

    await product.save();

    const productObj = product.toObject();
    if (productObj.imagen) {
      const mimeType = detectImageMimeType(productObj.imagen);
      productObj.imagen = decodeImageForResponse(productObj.imagen, mimeType);
    }

    res.status(200).json({
      message: 'Producto actualizado exitosamente',
      statusCode: 200,
      data: productObj
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, tenantId });

    if (!product) {
      return res.status(404).json({
        message: 'Producto no encontrado',
        statusCode: 404
      });
    }

    product.isActive = false;
    await product.save();

    res.status(200).json({
      message: 'Producto desactivado exitosamente',
      statusCode: 200,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const categories = await Product.distinct('category', { tenantId });

    res.status(200).json({
      message: 'Categorías obtenidas exitosamente',
      statusCode: 200,
      data: categories
    })
  } catch (error) {
    next(error)
  }
};

module.exports = {
  getCategories,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};

