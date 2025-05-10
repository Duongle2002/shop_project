import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import {
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  ListGroup,
} from "react-bootstrap";
import { db } from "../config/firebase";
import "../assets/styles/ProductDetail.css"; // File CSS cho spinner và tùy chỉnh
import { FaStar, FaHeart } from "react-icons/fa";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Lấy thông tin sản phẩm chi tiết
        const productDoc = await getDoc(doc(db, "products", id));
        if (productDoc.exists()) {
          setProduct({ id: productDoc.id, ...productDoc.data() });
        }

        // Lấy đánh giá từ product_reviews
        const reviewsSnapshot = await getDocs(collection(db, "product_reviews"));
        const reviewList = reviewsSnapshot.docs
          .filter((doc) => doc.data().product_id === id)
          .map((doc) => ({ id: doc.id, ...doc.data() }));
        setReviews(reviewList);

        // Lấy sản phẩm liên quan (cùng category_id, không bị xóa, đang active)
        if (productDoc.exists()) {
          const relatedQuery = query(
            collection(db, "products"),
            where("category_id", "==", productDoc.data().category_id),
            where("is_deleted", "==", false),
            where("is_active", "==", true)
          );
          const relatedSnapshot = await getDocs(relatedQuery);
          const relatedList = relatedSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((p) => p.id !== id)
            .slice(0, 4); // Lấy tối đa 4 sản phẩm
          setRelatedProducts(relatedList);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleQuantityChange = (change) => {
    setQuantity((prev) => Math.max(1, prev + change));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container my-5">
        <Card>
          <Card.Body>
            <Card.Title>Product Not Found</Card.Title>
            <Card.Text>
              The product you are looking for does not exist or has been removed.
            </Card.Text>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="container my-5">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/">Home</a>
          </li>
          <li className="breadcrumb-item">
            <a href="/category">Category</a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Gaming
          </li>
        </ol>
      </nav>

      {/* Product Detail Section */}
      <Row>
        <Col md={5}>
          <Row>
            <Col xs={3}>
              <div className="thumbnail-gallery">
                {[product.image_url, product.image_url, product.image_url].map(
                  (img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      className="thumbnail-img mb-2"
                    />
                  )
                )}
              </div>
            </Col>
            <Col xs={9}>
              <img
                src={product.image_url}
                alt={product.name}
                className="main-image"
              />
            </Col>
          </Row>
        </Col>
        <Col md={7}>
          <h2>{product.name}</h2>
          <div className="d-flex align-items-center mb-2">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={
                  i < Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1))
                    ? "text-warning"
                    : "text-muted"
                }
              />
            ))}
            <span className="ms-2 text-muted">({reviews.length} Reviews)</span>
            <Badge bg={product.stock > 0 ? "success" : "danger"} className="ms-2">
              {product.stock > 0 ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>
          <h4 className="text-danger">
            ${product.discountedPrice || product.price}{" "}
            {product.originalPrice && (
              <span className="text-muted text-decoration-line-through">
                ${product.originalPrice}
              </span>
            )}
          </h4>
          <p className="text-muted">{product.description?.replace(/<[^>]+>/g, "") || "No description available."}</p>

          <hr />

          {/* Colors */}
          <div className="mb-3">
            <strong>Colours:</strong>
            <div className="d-flex mt-2">
              {["#ff0000", "#0000ff", "#ffffff"].map((color) => (
                <div
                  key={color}
                  className={`color-option me-2 ${
                    selectedColor === color ? "selected" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                ></div>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="mb-3">
            <strong>Size:</strong>
            <div className="d-flex mt-2">
              {["XS", "S", "M", "L", "XL"].map((size) => (
                <Button
                  key={size}
                  variant={selectedSize === size ? "dark" : "outline-secondary"}
                  className="size-option me-2"
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {/* Quantity and Add to Cart */}
          <div className="d-flex align-items-center mb-3">
            <Button
              variant="outline-secondary"
              onClick={() => handleQuantityChange(-1)}
            >
              -
            </Button>
            <span className="mx-3">{quantity}</span>
            <Button
              variant="outline-secondary"
              onClick={() => handleQuantityChange(1)}
            >
              +
            </Button>
            <Button variant="danger" className="ms-3">
              Buy Now
            </Button>
            <Button variant="outline-secondary" className="ms-2">
              <FaHeart />
            </Button>
          </div>

          {/* Delivery Info */}
          <Card className="delivery-info">
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex align-items-center">
                  <i className="bi bi-truck me-2"></i> Free Delivery
                </ListGroup.Item>
                <ListGroup.Item className="d-flex align-items-center">
                  <i className="bi bi-arrow-counterclockwise me-2"></i> Return
                  Delivery <br />
                  Free 30 Days Delivery Returns
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Reviews Section */}
      <h3 className="mt-5 mb-3 related-items-title">Reviews</h3>
      {reviews.length > 0 ? (
        <ListGroup variant="flush">
          {reviews.map((review) => (
            <ListGroup.Item key={review.id} className="mb-3">
              <div className="d-flex align-items-center">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={i < review.rating ? "text-warning" : "text-muted"}
                  />
                ))}
                <span className="ms-2 text-muted">
                  {new Date(review.review_date).toLocaleDateString()}
                </span>
              </div>
              <p>{review.comment}</p>
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <p>No reviews yet.</p>
      )}

      {/* Related Items Section */}
      <h3 className="mt-5 mb-3 related-items-title">Related Items</h3>
      <Row>
        {relatedProducts.map((related, index) => (
          <Col md={3} key={related.id} className="mb-4">
            <Card className="related-product-card">
              <Card.Img variant="top" src={related.image_url} />
              <Card.Body>
                <Card.Title>{related.name}</Card.Title>
                <div className="d-flex align-items-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={i < 4 ? "text-warning" : "text-muted"}
                    />
                  ))}
                  <span className="ms-2 text-muted">
                    ({Math.floor(Math.random() * 100)})
                  </span>
                </div>
                <Card.Text className="text-danger">
                  ${related.discountedPrice || related.price}{" "}
                  {related.originalPrice && (
                    <span className="text-muted text-decoration-line-through">
                      ${related.originalPrice}
                    </span>
                  )}
                </Card.Text>
                <Button variant="outline-dark" size="sm">
                  Add To Cart
                </Button>
                <Button variant="outline-secondary" size="sm" className="ms-2">
                  <FaHeart />
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ProductDetail;