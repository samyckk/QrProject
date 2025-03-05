import mongoose from 'mongoose';

// Existing review schema remains the same
const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Updated product schema with QR code and additional optional fields
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    salePrice: { type: Number }, // Optional sale price
    countInStock: { type: Number, required: true },
    rating: { type: Number, required: true },
    numReviews: { type: Number, required: true },
    reviews: [reviewSchema],
    
    // New fields for QR code and additional product details
    qrCode: { type: String }, // Store QR code data URL
    expiryDate: { type: Date }, // Optional expiry date for perishable items
    batchNumber: { type: String }, // Optional batch number
    manufacturingDate: { type: Date }, // Optional manufacturing date
  },
  {
    timestamps: true,
  }
);

productSchema.methods.generateQRCode = async function() {
  return await generateProductQRCode(this._id);
};

const Product = mongoose.model('Product', productSchema);

export default Product;














// import mongoose from 'mongoose';
// //review orders schema
// const reviewSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     rating: { type: Number, required: true },
//     comment: { type: String, required: true },
//   },
//   {
//     timestamps: true,
//   }
// );

// //mongoose schema accepts 2 parameters- fields and options
// const productSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, unique: true },
//     slug: { type: String, required: true, unique: true },
//     image: { type: String, required: true },
//     brand: { type: String, required: true },
//     category: { type: String, required: true },
//     description: { type: String, required: true },
//     price: { type: Number, required: true },
//     countInStock: { type: Number, required: true },
//     rating: { type: Number, required: true },
//     numReviews: { type: Number, required: true },
//     reviews: [reviewSchema],
//   },
//   {
//     timestamps: true,
//   }
// );
// const Product = mongoose.model('Product', productSchema);

// export default Product;

