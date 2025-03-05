// import React, { useContext, useEffect, useState } from 'react';
// import axios from 'axios';
// import { Store } from '../Store';
// import { toast } from 'react-toastify';
// import LoadingBox from './LoadingBox';
// import MessageBox from './MessageBox';

// const ProductQRCode = ({ productId }) => {
//   const [qrCode, setQrCode] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const { state } = useContext(Store);
//   const { userInfo } = state;

//   useEffect(() => {
//     const fetchQRCode = async () => {
//       // Check if user is logged in
//       if (!userInfo) {
//         setError('Please log in to view QR code');
//         return;
//       }

//       setLoading(true);
//       try {
//         // Include authorization header
//         const config = {
//           headers: { 
//             Authorization: `Bearer ${userInfo.token}` 
//           }
//         };

//         const { data } = await axios.get(
//           `/api/products/${productId}/qr-code`, 
//           config
//         );

//         setQrCode(data.qrCode);
//         setError('');
//       } catch (error) {
//         console.error('Error fetching QR Code:', error);
        
//         // More detailed error handling
//         if (error.response) {
//           // The request was made and the server responded with a status code
//           // that falls out of the range of 2xx
//           setError(error.response.data.message || 'Failed to fetch QR code');
          
//           // Check for unauthorized access
//           if (error.response.status === 401) {
//             toast.error('Unauthorized. Please log in again.');
//           }
//         } else if (error.request) {
//           // The request was made but no response was received
//           setError('No response from server');
//         } else {
//           // Something happened in setting up the request
//           setError('Error setting up the request');
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (productId && userInfo) {
//       fetchQRCode();
//     }
//   }, [productId, userInfo]);

//   // Render different states
//   if (loading) {
//     return <LoadingBox />;
//   }

//   if (error) {
//     return <MessageBox variant="danger">{error}</MessageBox>;
//   }

//   const downloadQRCode = () => {
//     if (!qrCode) return;
//     const link = document.createElement('a');
//     link.href = qrCode;
//     link.download = `product-qr-${productId}.png`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   return (
//     <div className="text-center">
//       {qrCode ? (
//         <div>
//           <img 
//             src={qrCode} 
//             alt="Product QR Code" 
//             className="img-fluid rounded mx-auto d-block"
//             style={{ maxWidth: '200px' }}
//           />
//           <button 
//             onClick={downloadQRCode}
//             className="btn btn-primary mt-2"
//           >
//             Download QR Code
//           </button>
//         </div>
//       ) : (
//         <p>No QR Code available</p>
//       )}
//     </div>
//   );
// };

// export default ProductQRCode;