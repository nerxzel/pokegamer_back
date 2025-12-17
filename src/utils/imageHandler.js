const isValidBase64 = (str) => {
  if (!str || typeof str !== 'string') return false;
  
  const dataUriRegex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
  if (dataUriRegex.test(str)) {
    return true;
  }
  
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  return base64Regex.test(str);
};


const encodeImageForStorage = (imageData) => {
  if (!imageData) return null;
  
  const dataUriRegex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/;
  const match = imageData.match(dataUriRegex);
  
  if (match) {
    return match[2];
  }
  
  return imageData;
};


const decodeImageForResponse = (imageData, mimeType = 'image/jpeg') => {
  if (!imageData) return null;
  
  if (imageData.startsWith('data:image/')) {
    return imageData;
  }

  return `data:${mimeType};base64,${imageData}`;
};


const detectImageMimeType = (imageData) => {
  if (!imageData) return 'image/jpeg';
  
  const dataUriRegex = /^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,/;
  const match = imageData.match(dataUriRegex);
  
  if (match) {
    return match[1];
  }
  
  try {
    const buffer = Buffer.from(imageData.substring(0, 20), 'base64');
    const signature = buffer.toString('hex').toUpperCase();
    
    if (signature.startsWith('89504E47')) return 'image/png';
    if (signature.startsWith('FFD8FF')) return 'image/jpeg';
    if (signature.startsWith('47494638')) return 'image/gif';
    if (signature.startsWith('52494646') && signature.includes('57454250')) return 'image/webp';
  } catch (error) {

  }
  
  return 'image/jpeg';
};


const validateImageSize = (imageData, maxSizeMB = 5) => {
  if (!imageData) return true;
  
  const base64Pure = encodeImageForStorage(imageData);
  
  const sizeInBytes = (base64Pure.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  return sizeInMB <= maxSizeMB;
};

module.exports = {
  isValidBase64,
  encodeImageForStorage,
  decodeImageForResponse,
  detectImageMimeType,
  validateImageSize
};

