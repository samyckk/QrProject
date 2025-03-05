import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function ProductQRCodeScreen() {
  const [scannedProductId, setScannedProductId] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleScan = async (result) => {
    if (result) {
      const productId = result.getText();
      setScannedProductId(productId);
      
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/products/${productId}`);
        setProduct(data);
        setError(null);
      } catch (err) {
        setError('Product not found or invalid QR code');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleError = (error) => {
    console.error('QR Code Scan Error:', error);
    setError('Error scanning QR code');
  };

  const resetScanner = () => {
    setScannedProductId(null);
    setProduct(null);
    setError(null);
  };

  const handleViewProduct = () => {
    navigate(`/product/${product._id}`);
  };

  return (
    <Container className="mt-4">
      <h1 className="text-center mb-4">Product QR Code Scanner</h1>
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>Scan QR Code</Card.Header>
            <Card.Body>
              <div style={{ width: '100%', maxHeight: '400px' }}>
                <QrReader
                  constraints={{ facingMode: 'environment' }}
                  onResult={handleScan}
                  onError={handleError}
                  style={{ width: '100%' }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : product ? (
            <Card>
              <Card.Header>{product.name}</Card.Header>
              <Card.Body>
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="img-fluid mb-3" 
                  style={{ maxHeight: '300px', objectFit: 'cover' }}
                />
                <div className="product-details">
                  <p><strong>Price:</strong> ${product.price}</p>
                  <p><strong>Description:</strong> {product.description}</p>
                  
                  <Row>
                    <Col>
                      <p>
                        <strong>Stock:</strong>{' '}
                        {product.countInStock > 0 ? (
                          <span className="text-success">
                            In Stock ({product.countInStock} available)
                          </span>
                        ) : (
                          <span className="text-danger">Out of Stock</span>
                        )}
                      </p>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-between">
                    <Button 
                      variant="primary" 
                      onClick={handleViewProduct}
                    >
                      View Product Details
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={resetScanner}
                    >
                      Scan Another
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body className="text-center">
                <p>Scan a product QR code to view details</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default ProductQRCodeScreen;