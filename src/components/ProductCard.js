// src/components/ProductCard.js
import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../config/firebase";
import { collection, addDoc, doc, setDoc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import "../assets/styles/productCard.css";

const ProductCard = ({ product }) => {
  const [user] = useAuthState(auth);

  const handleAddToCart = async () => {
    if (!user) {
      alert("Please log in to add items to your cart!");
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
  
      // Kiểm tra xem sản phẩm đã có trong giỏ chưa
      const itemsSnapshot = await getDocs(collection(db, "carts", user.uid, "items"));
      const existingItem = itemsSnapshot.docs.find(
        (doc) => doc.data().product_id === product.id
      );
  
      if (existingItem) {
        // Nếu sản phẩm đã có, tăng quantity
        await updateDoc(doc(db, "carts", user.uid, "items", existingItem.id), {
          quantity: existingItem.data().quantity + 1,
        });
      } else {
        // Nếu chưa có, thêm mới
        await addDoc(collection(db, "carts", user.uid, "items"), {
          product_id: product.id,
          quantity: 1,
          added_at: new Date().toISOString(),
        });
      }
  
      alert("Product added to cart successfully!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add product to cart.");
    }
  };

  return (
    <div className="product-card">
      <img
        src={product.image_url || "https://via.placeholder.com/150"}
        alt={product.name}
        className="product-image"
      />
      <h3 className="product-title">{product.name}</h3>
      <div className="price">
        <span className="current">${product.price}</span>
        {product.original_price && (
          <span className="original">${product.original_price}</span>
        )}
      </div>
      <div className="rating">★★★★☆</div>
      <button className="add-to-cart" onClick={handleAddToCart}>
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;