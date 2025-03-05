import QRCode from 'qrcode';

/**
 * Generate a QR code for a product
 * @param {Object} product - Product details to encode in QR code
 * @returns {Promise<string>} Base64 encoded QR code image
 */
export const generateProductQRCode = async (product) => {
  try {
    // Create a detailed product information string
    const productInfo = JSON.stringify({
      name: product.name,
      price: product.price,
      brand: product.brand,
      category: product.category,
      description: product.description,
      inStock: product.countInStock,
      rating: product.rating,
      id: product._id,
      // Optional: Add expiry date for edible products
      ...(product.category === 'Food' && { 
        expiryDate: product.expiryDate 
      }),
      // Optional: Add sale information if applicable
      ...(product.salePrice && { 
        originalPrice: product.price,
        salePrice: product.salePrice,
        saleDiscount: Math.round((1 - product.salePrice / product.price) * 100) + '%'
      })
    });

    // Generate QR code as a data URL
    const qrCodeDataUrl = await QRCode.toDataURL(productInfo, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

/**
 * Validate and extract QR code information
 * @param {string} qrCodeData - QR code data string
 * @returns {Object} Parsed product information
 */
export const validateQRCode = (qrCodeData) => {
  try {
    return JSON.parse(qrCodeData);
  } catch (error) {
    console.error('Invalid QR code data:', error);
    return null;
  }
};