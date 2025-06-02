import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where, addDoc, setDoc, updateDoc } from "firebase/firestore";
import {
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  ListGroup,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { db, auth } from "../config/firebase";
import "../assets/styles/ProductDetail.css";
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
  const [toasts, setToasts] = useState([]);

  // Hàm hiển thị Toast
  const showToast = (message, variant = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => removeToast(id), 3000);
  };

  // Hàm xóa Toast
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

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

        // Lấy sản phẩm liên quan
        if (productDoc.exists() && productDoc.data().category_id) {
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
            .slice(0, 4);
          setRelatedProducts(relatedList);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        // showToast("Failed to load product details.", "danger");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleQuantityChange = (change) => {
    setQuantity((prev) => Math.max(1, prev + change));
  };

  const handleAddToCart = async () => {
    if (!auth.currentUser) {
      showToast("Please log in to add items to your cart!", "warning");
      return;
    }
    if (product.stock <= 0) {
      showToast("This product is out of stock!", "danger");
      return;
    }
    try {
      const cartRef = doc(db, "carts", auth.currentUser.uid);
      const cartSnap = await getDoc(cartRef);
      if (!cartSnap.exists()) {
        await setDoc(cartRef, {
          user_id: auth.currentUser.uid,
          created_at: new Date().toISOString(),
        });
      }
      const itemsSnapshot = await getDocs(collection(db, "carts", auth.currentUser.uid, "items"));
      const existingItem = itemsSnapshot.docs.find(
        (doc) =>
          doc.data().product_id === product.id &&
          doc.data().color === selectedColor &&
          doc.data().size === selectedSize
      );
      if (existingItem) {
        await updateDoc(doc(db, "carts", auth.currentUser.uid, "items", existingItem.id), {
          quantity: existingItem.data().quantity + quantity,
        });
      } else {
        await addDoc(collection(db, "carts", auth.currentUser.uid, "items"), {
          product_id: product.id,
          quantity,
          color: selectedColor,
          size: selectedSize,
          added_at: new Date().toISOString(),
        });
      }
      showToast("Product added to cart successfully!", "success");
    } catch (error) {
      console.error("Error adding to cart:", error);
      showToast("Failed to add product to cart.", "danger");
    }
  };

  const handleAddRelatedToCart = async (related) => {
    if (!auth.currentUser) {
      showToast("Please log in to add items to your cart!", "warning");
      return;
    }
    if (related.stock <= 0) {
      showToast("This product is out of stock!", "danger");
      return;
    }
    try {
      const cartRef = doc(db, "carts", auth.currentUser.uid);
      const cartSnap = await getDoc(cartRef);
      if (!cartSnap.exists()) {
        await setDoc(cartRef, {
          user_id: auth.currentUser.uid,
          created_at: new Date().toISOString(),
        });
      }
      const itemsSnapshot = await getDocs(collection(db, "carts", auth.currentUser.uid, "items"));
      const existingItem = itemsSnapshot.docs.find(
        (doc) => doc.data().product_id === related.id
      );
      if (existingItem) {
        await updateDoc(doc(db, "carts", auth.currentUser.uid, "items", existingItem.id), {
          quantity: existingItem.data().quantity + 1,
        });
      } else {
        await addDoc(collection(db, "carts", auth.currentUser.uid, "items"), {
          product_id: related.id,
          quantity: 1,
          added_at: new Date().toISOString(),
        });
      }
      showToast("Product added to cart successfully!", "success");
    } catch (error) {
      console.error("Error adding to cart:", error);
      showToast("Failed to add product to cart.", "danger");
    }
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

  const thumbnails = product.image_urls?.length > 0
    ? product.image_urls
    : [product.image_url || "https://via.placeholder.com/150"];
  const averageRating = reviews.length > 0
    ? Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
    : 0;

  return (
    <div className="container my-5">
      {/* Toast Container */}
      <ToastContainer position="top-end" className="p-3">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            onClose={() => removeToast(toast.id)}
            show={true}
            delay={3000}
            autohide
            bg={toast.variant}
          >
            <Toast.Header>
              <strong className="me-auto">
                {toast.variant === "success"
                  ? "Success"
                  : toast.variant === "danger"
                  ? "Error"
                  : "Warning"}
              </strong>
            </Toast.Header>
            <Toast.Body>{toast.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/">Home</a>
          </li>
          <li className="breadcrumb-item">
            <a href="/products">Products</a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {product.category_id || "Gaming"}
          </li>
        </ol>
      </nav>

      {/* Product Detail Section */}
      <Row>
        <Col md={5}>
          <Row>
            <Col xs={3}>
              <div className="thumbnail-gallery">
                {thumbnails.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className="thumbnail-img mb-2"
                  />
                ))}
              </div>
            </Col>
            <Col xs={9}>
              <img
                src={product.image_url || "https://via.placeholder.com/150"}
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
                className={i < averageRating ? "text-warning" : "text-muted"}
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
          <p className="text-muted">
            {product.description?.replace(/<[^>]+>/g, "") || "No description available."}
          </p>

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
            <Button
              variant="primary"
              className="ms-3"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              Add to Cart
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
        {relatedProducts.map((related) => (
          <Col md={3} key={related.id} className="mb-4">
            <Card className="related-product-card">
              <Card.Img
                variant="top"
                src={related.image_url || "https://via.placeholder.com/150"}
              />
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
                <Button
                  variant="outline-dark"
                  size="sm"
                  onClick={() => handleAddRelatedToCart(related)}
                  disabled={related.stock <= 0}
                >
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