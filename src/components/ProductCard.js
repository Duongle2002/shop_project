import React from "react";
import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <img
        src={product.image_url || "https://via.placeholder.com/150"} // Hiển thị ảnh từ Firestore, nếu không có thì dùng placeholder
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
      <div className="rating">★★★★☆</div> {/* Có thể thay bằng dữ liệu thực từ Firestore nếu có */}
      <button className="add-to-cart">Add to Cart</button>
    </div>
  );
};

export default ProductCard;