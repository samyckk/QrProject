import axios from 'axios';
import { useContext, useEffect, useReducer, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Rating from '../components/Rating';
import { Helmet } from 'react-helmet-async';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { getError } from '../utils';
import { Store } from '../Store';
import Form from 'react-bootstrap/Form';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import { toast } from 'react-toastify';

// Reducer function
const reducer = (state, action) => {
  switch (action.type) {
    case 'REFRESH_PRODUCT':
      return { ...state, product: action.payload };
    case 'CREATE_REQUEST':
      return { ...state, loadingCreateReview: true };
    case 'CREATE_SUCCESS':
      return { ...state, loadingCreateReview: false };
    case 'CREATE_FAIL':
      return { ...state, loadingCreateReview: false };
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, product: action.payload, loading: false };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'QR_FETCH_REQUEST':
      return { ...state, loadingQR: true, errorQR: '' };
    case 'QR_FETCH_SUCCESS':
      return { ...state, qrCode: action.payload, loadingQR: false };
    case 'QR_FETCH_FAIL':
      return { ...state, loadingQR: false, errorQR: action.payload };
    default:
      return state;
  }
};

function ProductScreen() {
  let reviewsRef = useRef();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const navigate = useNavigate();
  const params = useParams();
  const { slug } = params;

  const [{ loading, error, product, loadingCreateReview, qrCode, loadingQR, errorQR }, dispatch] =
    useReducer(reducer, {
      product: [],
      loading: true,
      error: '',
      qrCode: '',
      loadingQR: false,
      errorQR: '',
    });

  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart, userInfo } = state;

  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'FETCH_REQUEST' });
      try {
        const result = await axios.get(`/api/products/slug/${slug}`);
        dispatch({ type: 'FETCH_SUCCESS', payload: result.data });

        // Fetch QR Code
        if (userInfo && userInfo.token) {
          dispatch({ type: 'QR_FETCH_REQUEST' });
          try {
            const qrResult = await axios.get(
              `/api/products/${result.data._id}/qr-code`,
              {
                headers: { 
                  Authorization: `Bearer ${userInfo.token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            dispatch({ 
              type: 'QR_FETCH_SUCCESS', 
              payload: qrResult.data.qrCode 
            });
          } catch (qrError) {
            dispatch({ 
              type: 'QR_FETCH_FAIL', 
              payload: qrError.response?.data?.message || 'Failed to fetch QR code' 
            });
          }
        }
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
      }
    };
    fetchData();
  }, [slug, userInfo]);

  const addToCartHandler = async () => {
    const existItem = cart.cartItems.find((x) => x._id === product._id);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`/api/products/${product._id}`);
    if (data.countInStock < quantity) {
      window.alert('Sorry. Product is out of stock');
      return;
    }
    ctxDispatch({
      type: 'CART_ADD_ITEM',
      payload: { ...product, quantity },
    });
    navigate('/cart');
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!comment || !rating) {
      toast.error('Please enter comment and rating');
      return;
    }
    try {
      const { data } = await axios.post(
        `/api/products/${product._id}/reviews`,
        { rating, comment, name: userInfo.name },
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        }
      );

      dispatch({
        type: 'CREATE_SUCCESS',
      });
      toast.success('Review submitted successfully');

      product.reviews.unshift(data.review);
      product.numReviews = data.numReviews;
      product.rating = data.rating;

      dispatch({ type: 'REFRESH_PRODUCT', payload: product });

      window.scrollTo({
        behavior: 'smooth',
        top: reviewsRef.current.offsetTop,
      });
    } catch (error) {
      toast.error(getError(error));
      dispatch({ type: 'CREATE_FAIL' });
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `${product.name}-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return loading ? (
    <LoadingBox />
  ) : error ? (
    <MessageBox variant="danger">{error}</MessageBox>
  ) : (
    <div>
      <Row>
        <Col md={6}>
          <img className="img-large" src={product.image} alt={product.name} />
        </Col>
        <Col md={3}>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <Helmet>
                <title>{product.name}</title>
              </Helmet>
              <h1>{product.name}</h1>
            </ListGroup.Item>
            <ListGroup.Item>
              <Rating rating={product.rating} numReviews={product.numReviews} />
            </ListGroup.Item>
            <ListGroup.Item>Price : ${product.price}</ListGroup.Item>
            <ListGroup.Item>
              Description:
              <p>{product.description}</p>
            </ListGroup.Item>
            {/* QR Code Section */}
            <ListGroup.Item>
              <h5>Product QR Code</h5>
              {loadingQR ? (
                <LoadingBox />
              ) : errorQR ? (
                <MessageBox variant="danger">{errorQR}</MessageBox>
              ) : qrCode ? (
                <>
                  <img
                    src={qrCode}
                    alt="QR Code"
                    className="w-50 border border-secondary rounded"
                  />
                  <div className="mt-2">
                    <Button variant="success" onClick={downloadQRCode}>
                      Download QR Code
                    </Button>
                  </div>
                </>
              ) : (
                <p>QR Code not available</p>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <Row>
                    <Col>Price:</Col>
                    <Col>${product.price}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Status:</Col>
                    <Col>
                      {product.countInStock > 0 ? (
                        <Badge bg="success">In Stock</Badge>
                      ) : (
                        <Badge bg="danger">Unavailable</Badge>
                      )}
                    </Col>
                  </Row>
                </ListGroup.Item>

                {product.countInStock > 0 && (
                  <ListGroup.Item>
                    <div className="d-grid">
                      <Button onClick={addToCartHandler} variant="primary">
                        Add to Cart
                      </Button>
                    </div>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ProductScreen;




















// import ProductQRCode from '../components/ProductQRCode';
// import axios from 'axios';

// import { useContext, useEffect, useReducer, useRef, useState } from 'react';
// import { Link, useNavigate, useParams } from 'react-router-dom';
// import Row from 'react-bootstrap/Row';
// import Col from 'react-bootstrap/Col';
// import Card from 'react-bootstrap/Card';
// import ListGroup from 'react-bootstrap/ListGroup';
// import Badge from 'react-bootstrap/Badge';
// import Button from 'react-bootstrap/Button';
// import Rating from '../components/Rating';
// import { Helmet } from 'react-helmet-async';
// import LoadingBox from '../components/LoadingBox';
// import MessageBox from '../components/MessageBox';
// import { getError } from '../utils';
// import { Store } from '../Store';
// import Form from 'react-bootstrap/Form';
// import FloatingLabel from 'react-bootstrap/FloatingLabel';
// import { toast } from 'react-toastify';


// // Functional component for displaying product details and reviews

// // Reducer function to manage the state based on dispatched actions
// const reducer = (state, action) => {
//   switch (action.type) {
//     //for order review
//     case 'REFRESH_PRODUCT':
//       return { ...state, product: action.payload };
//     case 'CREATE_REQUEST':
//       return { ...state, loadingCreateReview: true };
//     case 'CREATE_SUCCESS':
//       return { ...state, loadingCreateReview: false };
//     case 'CREATE_FAIL':
//       return { ...state, loadingCreateReview: false };
//     //for product
//     case 'FETCH_REQUEST':
//       return { ...state, loading: true };
//     case 'FETCH_SUCCESS':
//       return { ...state, product: action.payload, loading: false };
//     case 'FETCH_FAIL':
//       return { ...state, loading: false, error: action.payload };
//     default:
//       return state;
//   }
// };



// function ProductScreen() {

//   // useRef to store a reference to the reviews section for scrolling
//   let reviewsRef = useRef();

//   // State variables for rating and comment inputs
//   const [rating, setRating] = useState(0);
//   const [comment, setComment] = useState('');
//   const navigate = useNavigate();

//   // Extracting parameters from the URL using useParams
//   const params = useParams();
//   const { slug } = params;

//   // useReducer to manage state and dispatch actions using the defined reducer
//   const [{ loading, error, product, loadingCreateReview }, dispatch] =
//     useReducer(reducer, {
//       product: [],
//       loading: true,
//       error: '',
//     });



//   // uses the useEffect hook to fetch product data when the component mounts or when the slug parameter changes.
//   useEffect(() => {
//     const fetchData = async () => {
//       dispatch({ type: 'FETCH_REQUEST' });
//       try {
//         //${slug} is the value of slug user entered in the url
//         const result = await axios.get (`/api/products/slug/${slug}`);
//         // if the request is successful, it dispatches a 'FETCH_SUCCESS' action with the fetched data.
//         dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
//       } catch (err) {
//         dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
//       }
//     };
//     fetchData();
//   }, [slug]);     // run useEffect when slug change (when user click on a different product)



  
//   // Extracting cart and user information from the global state using useContext
//   const { state, dispatch: ctxDispatch } = useContext(Store);
//   const { cart, userInfo } = state; //diconstructing



//   // Event handler for adding the product to the cart
//   const addToCartHandler = async () => {
//     //if current product exist in cart, increase quantity by 1 when clicked
//     const existItem = cart.cartItems.find((x) => x._id === product._id);
//     const quantity = existItem ? existItem.quantity + 1 : 1;
//     //ajax request to current product to check if the product stock is less than the quantity im going to add to the cart
//     const { data } = await axios.get(`/api/products/${product._id}`);
//     if (data.countInStock < quantity) {
//       window.alert('Sorry. Product is out of stock');
//       return;
//     }

//     // Dispatch an action to add the item to the cart
//     ctxDispatch({
//       type: 'CART_ADD_ITEM',
//       payload: { ...product, quantity },
//     });
//     //redirect user to cart screen
//     navigate('/cart');
//   };



//   // Event handler for submitting a review
//   const submitHandler = async (e) => {
//     e.preventDefault();
//     if (!comment || !rating) {
//       toast.error('Please enter comment and rating');
//       return;
//     }
//     try {
//       // Send a POST request to submit the review
//       const { data } = await axios.post(
//         `/api/products/${product._id}/reviews`,
//         { rating, comment, name: userInfo.name },
//         {
//           headers: { Authorization: `Bearer ${userInfo.token}` },   //server requires valid user token to access protected routes
//         }
//       );

//       // Dispatch actions for order review
//       dispatch({
//         type: 'CREATE_SUCCESS',
//       });
//       toast.success('Review submitted successfully');

//       // Update product reviews and ratings
//       product.reviews.unshift(data.review);
//       product.numReviews = data.numReviews;
//       product.rating = data.rating;

//       // Refresh the product in the global state
//       dispatch({ type: 'REFRESH_PRODUCT', payload: product });

//       // Scroll to the reviews section
//       window.scrollTo({
//         behavior: 'smooth',
//         top: reviewsRef.current.offsetTop,
//       });
//     } catch (error) {
//       toast.error(getError(error));
//       dispatch({ type: 'CREATE_FAIL' });
//     }
//   };




//   return loading ? (
//     <LoadingBox />
//   ) : error ? (
//     <MessageBox variant="danger">{error}</MessageBox>
//   ) : (
//     <div>
//       {/* Displaying product details */}
//       <Row>
//         <Col md={6}>
//           <img
//             className="img-large"
//             src={product.image}
//             alt={product.name}
//           ></img>
//         </Col>
//         <Col md={3}>
//           <ListGroup variant="flush">
//             <ListGroup.Item>
//               <Helmet>
//                 <title>{product.name}</title>
//               </Helmet>
//               <h1>{product.name}</h1>
//             </ListGroup.Item>
//             <ListGroup.Item>
//               <Rating
//                 rating={product.rating}
//                 numReviews={product.numReviews}
//               ></Rating>
//             </ListGroup.Item>
//             <ListGroup.Item>Price : ${product.price}</ListGroup.Item>
//             <ListGroup.Item>
//               Description:
//               <p>{product.description}</p>
//             </ListGroup.Item>
//           </ListGroup>
//         </Col>
//         <Col md={3}>
//           <Card>
//             <Card.Body>
//               <ListGroup variant="flush">
//                 <ListGroup.Item>
//                   <Row>
//                     <Col>Price:</Col>
//                     <Col>${product.price}</Col>
//                   </Row>
//                 </ListGroup.Item>
//                 <ListGroup.Item>
//                   <Row>
//                     <Col>Status:</Col>
//                     <Col>
//                       {product.countInStock > 0 ? (
//                         <Badge bg="success">In Stock</Badge>
//                       ) : (
//                         <Badge bg="danger">Unavailable</Badge>
//                       )}
//                     </Col>
//                   </Row>
//                 </ListGroup.Item>

//                 {/*conditionally render the Add to Cart button*/}
//                 {product.countInStock > 0 && (
//                   <ListGroup.Item>
//                     <div className="d-grid">
//                       <Button onClick={addToCartHandler} variant="primary">
//                         Add to Cart
//                       </Button>
//                     </div>
//                   </ListGroup.Item>
//                 )}
//               </ListGroup>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>
//       {/*Order Reviews*/}
//       <div className="my-3">
//         <h2 ref={reviewsRef}>Reviews</h2>
//         <div className="mb-3">
//           {product.reviews.length === 0 && (
//             <MessageBox>There is no review</MessageBox>
//           )}
//         </div>
//         <ListGroup>
//           {product.reviews.map((review) => (
//             <ListGroup.Item key={review._id}>
//               <strong>{review.name}</strong>
//               <Rating rating={review.rating} caption=" "></Rating>
//               <p>{review.createdAt.substring(0, 10)}</p>
//               <p>{review.comment}</p>
//             </ListGroup.Item>
//           ))}
//         </ListGroup>
//         <div className="my-3">
//           {userInfo ? (
//             <form onSubmit={submitHandler}>
//               <h2>Write a customer review</h2>
//               <Form.Group className="mb-3" controlId="rating">
//                 <Form.Label>Rating</Form.Label>
//                 <Form.Select
//                   aria-label="Rating"
//                   value={rating}
//                   onChange={(e) => setRating(e.target.value)}
//                 >
//                   <option value="">Select...</option>
//                   <option value="1">1- Poor</option>
//                   <option value="2">2- Fair</option>
//                   <option value="3">3- Good</option>
//                   <option value="4">4- Very good</option>
//                   <option value="5">5- Excelent</option>
//                 </Form.Select>
//               </Form.Group>
//               <FloatingLabel
//                 controlId="floatingTextarea"
//                 label="Comments"
//                 className="mb-3"
//               >
//                 <Form.Control
//                   as="textarea"
//                   placeholder="Leave a comment here"
//                   value={comment}
//                   onChange={(e) => setComment(e.target.value)}
//                 />
//               </FloatingLabel>

//               <div className="mb-3">
//                 <Button disabled={loadingCreateReview} type="submit">
//                   Submit
//                 </Button>
//                 {loadingCreateReview && <LoadingBox></LoadingBox>}
//               </div>
//             </form>
//           ) : (
//             <MessageBox>
//               Please{' '}
//               <Link to={`/signin?redirect=/product/${product.slug}`}>
//                 Sign In
//               </Link>{' '}
//               to write a review
//             </MessageBox>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
// export default ProductScreen;
