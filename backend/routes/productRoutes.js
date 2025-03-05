import express from 'express';
import Product from '../models/productModel.js';
import expressAsyncHandler from 'express-async-handler';  
import { isAuth, isAdmin } from '../utils.js';
import QRCode from 'qrcode';

const productRouter = express.Router();
const PAGE_SIZE = 100;        // sets default page size 

// Helper function to generate QR code
const generateProductQRCode = async (product) => {
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
      slug: product.slug,
      image: product.image,
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

// Existing route to get all products
productRouter.get('/', async (req, res) => {
  const products = await Product.find();       
  res.send(products);                         
});

// Route to create a new product
productRouter.post(
  '/',  
  isAuth,        
  isAdmin,      
  expressAsyncHandler(async (req, res) => {
    // Creating new product with default or provided values 
    const newProduct = new Product({
      name: req.body.name || 'sample name ' + Date.now(),
      slug: req.body.slug || 'sample-name-' + Date.now(),
      image: req.body.image || '/images/i1.jpg',
      price: req.body.price || 0,
      category: req.body.category || 'sample category',
      brand: req.body.brand || 'sample brand',
      countInStock: req.body.countInStock || 0,
      rating: req.body.rating || 0,
      numReviews: req.body.numReviews || 0,
      description: req.body.description || 'sample description',
    });

    // Save new product to db
    const product = await newProduct.save();
    
    // Generate and save QR code
    try {
      product.qrCode = await generateProductQRCode(product);
      await product.save();
    } catch (qrError) {
      console.error('Failed to generate QR code:', qrError);
    }

    // Send a success message and the created product as a response
    res.send({ message: 'Product Created', product });  
  })
);

// Route to update a product
productRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;      
    const product = await Product.findById(productId);     

    // If the product exists, update its properties with the new values
    if (product) {
      product.name = req.body.name || product.name;       
      product.slug = req.body.slug || product.slug;
      product.price = req.body.price || product.price;
      product.image = req.body.image || product.image;
      product.category = req.body.category || product.category;
      product.brand = req.body.brand || product.brand;
      product.countInStock = req.body.countInStock || product.countInStock;
      product.description = req.body.description || product.description;
      
      // Regenerate QR code when product details change
      try {
        product.qrCode = await generateProductQRCode(product);
      } catch (qrError) {
        console.error('Failed to regenerate QR code:', qrError);
      }
      
      await product.save(); 
      res.send({ message: 'Product Updated' }); 
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);

// Route to delete a product
productRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);   
    if (product) {
      await product.remove(); 
      res.send({ message: 'Product Deleted' }); 
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);

// Route to add a review to a product
productRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (product) {
      if (product.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }

      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),      
        comment: req.body.comment,
      };      

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating = product.reviews.reduce((a, c) => c.rating + a, 0) / product.reviews.length;
      
      const updatedProduct = await product.save(); 
      res.status(201).send({
        message: 'Review Created',
        review: updatedProduct.reviews[updatedProduct.reviews.length - 1],
        numReviews: product.numReviews,
        rating: product.rating,
      });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);

// Route to get admin products with pagination
productRouter.get(
  '/admin',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;            
    const page = query.page || 1;         
    
    const limit =
      query.limit === 'all' ? 0 : parseInt(query.limit) || PAGE_SIZE;   

    const findQuery = Product.find();              
    const countQuery = Product.countDocuments();  
  
    if (limit > 0) {
      findQuery.skip(limit * (page - 1)).limit(limit);
    }

    const products = await findQuery;     
    const countProducts = await countQuery;  

    res.send({
      products,
      countProducts,
      page,
      pages: limit > 0 ? Math.ceil(countProducts / limit) : 1,   
    });
  })
);

// Route to get product categories
productRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Product.find().distinct('category');
    res.send(categories);  
  })
);

// Route to search products
productRouter.get(
  '/search',
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const pageSize = query.pageSize || PAGE_SIZE;
    const page = query.page || 1;
    const category = query.category || '';
    const price = query.price || '';
    const rating = query.rating || '';
    const order = query.order || '';
    const searchQuery = query.query || '';

    const queryFilter =
      searchQuery && searchQuery !== 'all'
        ? {
            name: {
              $regex: searchQuery,
              $options: 'i', 
            },
          }
        : {};

    const categoryFilter = category && category !== 'all' ? { category } : {};
    const ratingFilter =
      rating && rating !== 'all'
        ? {
            rating: {
              $gte: Number(rating),
            },
          }
        : {};
    const priceFilter =
      price && price !== 'all'
        ? {
            price: {
              $gte: Number(price.split('-')[0]),
              $lte: Number(price.split('-')[1]),
            },
          }
        : {};
    const sortOrder =
      order === 'featured'
        ? { featured: -1 }
        : order === 'lowest'
        ? { price: 1 }
        : order === 'highest'
        ? { price: -1 }
        : order === 'toprated'
        ? { rating: -1 }
        : order === 'newest'
        ? { createdAt: -1 }
        : { _id: -1 };
        
    const products = await Product.find({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    })
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    const countProducts = await Product.countDocuments({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });

    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

// Route to get product by slug
productRouter.get('/slug/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (product) {
    res.send(product);  
  } else {
    res.status(404).send({ message: 'Product Not Found' });
  }
});

// Route to get product by ID
productRouter.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id); 
  if (product) {
    res.send(product); 
  } else {
    res.status(404).send({ message: 'Product Not Found' });
  }
});

// New route to generate/retrieve QR code for a specific product
// In your existing productRoutes.js file
productRouter.get('/:id/qr-code', isAuth, expressAsyncHandler(async (req, res) => {
  // Log the entire authorization header for debugging
  console.log('Full Authorization Header:', req.headers.authorization);

  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).send({ message: 'Product Not Found' });
    }

    // Generate QR code if not already exists
    if (!product.qrCode) {
      product.qrCode = await generateProductQRCode(product);
      await product.save();
    }

    res.send({ qrCode: product.qrCode });
  } catch (error) {
    console.error('QR Code Generation Error:', error);
    res.status(500).send({ 
      message: 'Error generating QR code', 
      error: error.message 
    });
  }
}));

export default productRouter;






// import express from 'express';
// import Product from '../models/productModel.js'; //.js is necessary to get rid of error
// import expressAsyncHandler from 'express-async-handler';  //middleware that wraps asynchronous route handlers, making error handling with async functions easier.
// import { isAuth, isAdmin } from '../utils.js';

// // Includes routes for fetching, creating, updating, and deleting products, managing product reviews, categories, and search criteria.

// const productRouter = express.Router(); // Creating an Express router for handling product-related routes

// // Define routes for handling HTTP GET, POST, PUT, and DELETE requests for products. The routes are designed for admin users, with appropriate authentication and authorization checks.

// // Define a route to handle GET requests to the root URL (/) of the product router
// productRouter.get ('/', async (req, res) => {
//   const products = await Product.find ();       // Retrieve all products from db
//   res.send (products);                         // Send products as a response
// });

// // Define a route to handle POST requests to the root URL (/) of the product router
// productRouter.post(
//   '/',  
//   isAuth,        
//   isAdmin,      
//   expressAsyncHandler (async (req, res) => {
//     // Creating new product with default values 
//     const newProduct = new Product({
//       name: 'sample name ' + Date.now(),
//       slug: 'sample-name-' + Date.now(),
//       image: '/images/i1.jpg',
//       price: 0,
//       category: 'sample category',
//       brand: 'sample brand',
//       countInStock: 0,
//       rating: 0,
//       numReviews: 0,
//       description: 'sample description',
//     });
//     // Save new product to db
//     const product = await newProduct.save();
//     // Send a success message and the created product as a response
//     res.send ({ message: 'Product Created', product });  
//   })
// );


// // Define a route to handle PUT (update) requests to the root URL (/) of the product router
// productRouter.put(
//   '/:id',
//   isAuth,
//   isAdmin,
//   expressAsyncHandler (async (req, res) => {
//     const productId = req.params.id;      // extracts id from route path.
//     const product = await Product.findById (productId);     // queries the db for a product with the specified ID

//     // If the product exists, update its properties with the new values
//     if (product) {
//       product.name = req.body.name;       
//       product.slug = req.body.slug;
//       product.price = req.body.price;
//       product.image = req.body.image;
//       product.category = req.body.category;
//       product.brand = req.body.brand;
//       product.countInStock = req.body.countInStock;
//       product.description = req.body.description;      
//       await product.save(); // Save the updated product to db
//       res.send({ message: 'Product Updated' }); 
//     }     
//     else {
//       res.status(404).send({ message: 'Product Not Found' });
//     }
//   }));


// // Define a route to handle DELETE requests to the root URL (/) of the product router
// productRouter.delete(
//   '/:id',
//   isAuth,
//   isAdmin,
//   expressAsyncHandler(async (req, res) => {
//     // Find the product by ID and remove it from the database
//     const product = await Product.findById(req.params.id);   
//     if (product) {
//       await product.remove(); 
//       res.send({ message: 'Product Deleted' }); 
//     } else {
//       res.status(404).send({ message: 'Product Not Found' });
//     }
//   })
// );




// // Define a route to handle POST requests to the /:id/reviews URL of the product router (for creating a review for a specific product)
// productRouter.post(
//   '/:id/reviews',
//   isAuth,
//   expressAsyncHandler (async (req, res) => {
//     const productId = req.params.id;
//     const product = await Product.findById(productId);

//     if (product) {
//        // Check if the user has already submitted a review for this product
//       if (product.reviews.find((x) => x.name === req.user.name)) {
//         return res
//           .status(400)
//           .send({ message: 'You already submitted a review' }); // Send an error if a review already exists
//       }
//       // Create a new review with user-submitted data
//       const review = {
//         name: req.user.name,
//         rating: Number(req.body.rating),      
//         comment: req.body.comment,
//       };      
//       product.reviews.push(review); //Add new review to product's reviews array
//       // Updates the number of reviews to the length of the reviews array.
//       product.numReviews = product.reviews.length;
//       // calculates the average rating of all reviews.
//       product.rating = product.reviews.reduce ((a, c) => c.rating + a, 0) / product.reviews.length;
//       // Save the updated product to db
//       const updatedProduct = await product.save(); 
//         // Send a success message and the created review as a response
//         res.status(201).send({
//         message: 'Review Created',
//         review: updatedProduct.reviews [updatedProduct.reviews.length - 1],
//         numReviews: product.numReviews,
//         rating: product.rating,
//       });
//     } else {
//       res.status(404).send({ message: 'Product Not Found' });
//     }
//   })
// );



// // Define a route to handle GET requests to the /admin URL of the product router (for fetching products for admin users)
// // This route includes pagination and filtering based on query parameters.
// const PAGE_SIZE = 100;        // sets default page size 

// productRouter.get(
//   '/admin',
//   isAuth,
//   isAdmin,
//   expressAsyncHandler(async (req, res) => {
//     const { query } = req;            // extracts query parameters from request URL
//     const page = query.page || 1;         // defaults to 1 if not provided
    
//     // Sets the limit based on the 'limit' query parameter. If 'all' is provided, limit is set to 0 (no limit).
//     // Otherwise, it uses the provided 'limit' parameter and parses the value to an integer, or defaults to PAGE_SIZE.
//     const limit =
//       query.limit === 'all' ? 0 : parseInt(query.limit) || PAGE_SIZE;   

//       // DB Queries:
//       const findQuery = Product.find();              // Creates a query to find products
//       const countQuery = Product.countDocuments();  // Creates a query to count the total number of products
  
//     // If there is a limit (greater than 0), skips a certain number of products based on the page and limits the number of products returned.
//     if (limit > 0) {
//       findQuery.skip (limit * (page - 1)).limit(limit);
//     }

//     const products = await findQuery;     // Executes the find query to get the products
//     const countProducts = await countQuery;  // Executes the count query to get the total count of products

//     // Send products, total count, current page, and total pages as a response
//     res.send({
//       products,
//       countProducts,
//       page,
//       pages: limit > 0 ? Math.ceil (countProducts / limit) : 1,   // Calculates the total number of pages based on the count of products and the limit (if greater than 0).
//     });
//   })
// );



// // Define a route to handle GET requests to the /search URL of the product router (for fetching products based on search criteria)
// productRouter.get(
//   '/search',
//   expressAsyncHandler(async (req, res) => {
//     const { query } = req;
//     const pageSize = query.pageSize || PAGE_SIZE;
//     const page = query.page || 1;
//     const category = query.category || '';
//     const price = query.price || '';
//     const rating = query.rating || '';
//     const order = query.order || '';
//     const searchQuery = query.query || '';

//     // Define filters based on query parameters
//     const queryFilter =
//       searchQuery && searchQuery !== 'all'
//         ? {
//             name: {
//               $regex: searchQuery,
//               $options: 'i', //case insensitive search
//             },
//           }
//         : {};
//     //category filter
//     const categoryFilter = category && category !== 'all' ? { category } : {};
//     //rating filter
//     const ratingFilter =
//       rating && rating !== 'all'
//         ? {
//             rating: {
//               $gte: Number(rating),
//             },
//           }
//         : {};
//     const priceFilter =
//       price && price !== 'all'
//         ? {
//             // 1-50
//             price: {
//               $gte: Number(price.split('-')[0]),
//               $lte: Number(price.split('-')[1]),
//             },
//           }
//         : {};
//     const sortOrder =
//       order === 'featured'
//         ? { featured: -1 }
//         : order === 'lowest'
//         ? { price: 1 }
//         : order === 'highest'
//         ? { price: -1 }
//         : order === 'toprated'
//         ? { rating: -1 }
//         : order === 'newest'
//         ? { createdAt: -1 }
//         : { _id: -1 };
        
//     //queryFilter is the object that we pass to the find() method on the product model in mongoose
//     const products = await Product.find({
//       ...queryFilter,
//       ...categoryFilter,
//       ...priceFilter,
//       ...ratingFilter,
//     })
//       .sort(sortOrder)
//       .skip(pageSize * (page - 1))
//       .limit(pageSize);

//     const countProducts = await Product.countDocuments({
//       ...queryFilter,
//       ...categoryFilter,
//       ...priceFilter,
//       ...ratingFilter,
//     });
//     // Send the filtered products, total count, current page, and total pages as a response
//     res.send({
//       products,
//       countProducts,
//       page,
//       pages: Math.ceil(countProducts / pageSize),
//     });
//   })
// );



// // Define a route to handle GET requests to the /categories URL of the product router (for fetching unique product categories)
// productRouter.get(
//   '/categories',
//   expressAsyncHandler(async (req, res) => {
//     // Get distinct product categories
//     const categories = await Product.find().distinct('category');
//     res.send(categories);  // Send the categories as a response
//   })
// );




// // Fetch Product Information by Slug. (respond to useEffect in ProductScreen: const result=await axios.get(`/api/products/slug/${slug}`);
// productRouter.get('/slug/:slug', async (req, res) => {

//   // If the product exists, it sends the product details as a response.
//   // uses the Product model to query the database for a product with the specified slug.
//   const product = await Product.findOne({ slug: req.params.slug });
//   if (product) {
//     res.send(product);  // Send the product details as a response
//   } else {
//     res.status(404).send({ message: 'Product Not Found' });
//   }
// });




// // Fetch product by ID (From ProductScreen: const { data }=await axios.get(`/api/products/${match.params.id}`);
// productRouter.get('/:id', async (req, res) => {
//   const product = await Product.findById (req.params.id); // Find the product by ID
//   if (product) {
//     res.send(product); 
//   } else {
//     res.status(404).send({ message: 'Product Not Found' });
//   }
// });

// export default productRouter;

