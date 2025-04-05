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
    <div className="product-item">
      {product.discount && <div className="discount-tag">{product.discount}</div>}
      {product.newTag && <div className="new-tag">{product.newTag}</div>}
      <img
        src={product.image_url || "https://via.placeholder.com/150"} // Hiển thị ảnh từ Firestore, nếu không có thì dùng placeholder
        alt={product.name}
        className="product-image"
      />
      <p>{product.name}</p>
      <div className="product-details">
        <div className="price">
          {product.originalPrice && (
            <span className="original-price">${product.originalPrice}</span>
          )}
          <span className={product.originalPrice ? "discounted-price" : ""}>
            ${product.price || product.discountedPrice || "N/A"}
          </span>
        </div>
        <div className="rating">★★★★☆</div>
        {/* //add to cart button */}
        <button className="add-to-cart-btn">Add to Cart</button>
        <Link to={`/product/${product.id}`}>
          <button className="view-details-btn">View Details</button>
        </Link>
      </div>
<<<<<<< HEAD
=======
      <div className="rating">★★★★☆</div> {/* Có thể thay bằng dữ liệu thực từ Firestore nếu có */}
      <button className="add-to-cart">Add to Cart</button>
>>>>>>> e96a66938e2d395d28d76e9ff4955ec52e916775
    </div>
  );
};

export default ProductCard;
