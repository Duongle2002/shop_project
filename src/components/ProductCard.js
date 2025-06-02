import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../config/firebase";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { Button, Toast, ToastContainer } from "react-bootstrap";
import "../assets/styles/productCard.css";

const ProductCard = ({ product }) => {
  const [user] = useAuthState(auth);
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

  const handleAddToCart = async () => {
    if (!user) {
      showToast("Please log in to add items to your cart!", "warning");
      return;
    }

    try {
      const cartRef = doc(db, "carts", user.uid);
      const cartSnap = await getDoc(cartRef);

      if (!cartSnap.exists()) {
        await setDoc(cartRef, {
          user_id: user.uid,
          created_at: new Date().toISOString(),
        });
      }

      // Check if product already exists in cart
      const itemsSnapshot = await getDocs(
        collection(db, "carts", user.uid, "items")
      );
      const existingItem = itemsSnapshot.docs.find(
        (doc) => doc.data().product_id === product.id
      );

      if (existingItem) {
        // Increase quantity
        await updateDoc(
          doc(db, "carts", user.uid, "items", existingItem.id),
          {
            quantity: existingItem.data().quantity + 1,
          }
        );
      } else {
        // Add new item
        await addDoc(collection(db, "carts", user.uid, "items"), {
          product_id: product.id,
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

  return (
    <div className="product-item">
      {product.discount && (
        <div className="discount-tag">{product.discount}</div>
      )}
      {product.newTag && <div className="new-tag">{product.newTag}</div>}

      <img
        src={product.image_url || "https://via.placeholder.com/150"}
        alt={product.name}
        className="product-image"
      />

      <p>{product.name}</p>

      <div className="product-details">
        <div className="price">
          {product.originalPrice && (
            <span className="original-price">
              ${product.originalPrice}
            </span>
          )}
          <span className={product.originalPrice ? "discounted-price" : ""}>
            ${product.price || product.discountedPrice || "N/A"}
          </span>
        </div>

        <div className="rating">★★★★☆</div>

        {/* Add to cart button */}
        <Button
          variant="primary"
          className="add-to-cart-btn"
          onClick={handleAddToCart}
        >
          Add to Cart
        </Button>

        <Link to={`/products/${product.id}`}>
          <Button variant="secondary" className="view-details-btn">
            View Details
          </Button>
        </Link>
      </div>

      {/* Toast Container để hiển thị thông báo */}
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
    </div>
  );
};

export default ProductCard;