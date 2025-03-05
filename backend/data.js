import bcrypt from 'bcryptjs';

const data = {
  users: [
    {
      name: 'Shani',
      email: 'admin@example.com',
      password: bcrypt.hashSync('123456'),
      isAdmin: true,
    },
    {
      name: 'John',
      email: 'user@example.com',
      password: bcrypt.hashSync('123456'),
      isAdmin: false,
    },
  ],

  products: [
      {
        name: 'Gray T-shirt',
        slug: 'T-shirt',
        category: 'Shirts',
        image: '/images/i1.jpg', // 679px × 829px
        price: 120,
        countInStock: 10,
        brand: 'H&M',
        rating: 4.5,
        numReviews: 10,
        description: 'high quality shirt',
      },
      {
        name: 'Workout blue set',
        slug: 'workout-blue-set',
        category: 'Shirts',
        image: '/images/i2.jpg',
        price: 250,
        countInStock: 20,
        brand: 'H&M',
        rating: 4.0,
        numReviews: 10,
        description: 'high quality product',
      },
      {
        name: 'White Pants',
        slug: 'white-pant',
        category: 'Pants',
        image: '/images/i3.jpg',
        price: 25,
        countInStock: 15,
        brand: 'H&M',
        rating: 4.5,
        numReviews: 14,
        description: 'high quality product',
      },
      {
        name: 'Crop cotton shirt',
        slug: 'crop-cotton-shirt',
        category: 'Shirts',
        image: '/images/i4.jpg',
        price: 65,
        countInStock: 5,
        brand: 'H&M',
        rating: 4.5,
        numReviews: 10,
        description: 'high quality product',
      },
    ],
  };
  
export default data;
