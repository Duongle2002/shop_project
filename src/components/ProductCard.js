import React from "react";
import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
  return (
    <div className="product-item">
      {product.discount && <div className="discount-tag">{product.discount}</div>}
      {product.newTag && <div className="new-tag">{product.newTag}</div>}
      <img
        src={product.image_url || product.image || "https://via.placeholder.com/150"}
        alt={product.name}
        className="product-image"
      />
      <button className="add-to-cart-btn">Add to Cart</button>
      <p>{product.name}</p>
      <div className="price">
        {product.originalPrice && (
          <span className="original-price">${product.originalPrice}</span>
        )}
        <span className={product.originalPrice ? "discounted-price" : ""}>
          ${product.price || product.discountedPrice || "N/A"}
        </span>
      </div>
      <div className="rating">★★★★☆</div> {/* Có thể thay bằng dữ liệu thực */}
    </div>
  );
};

export default ProductCard;