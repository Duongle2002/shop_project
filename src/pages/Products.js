// src/pages/Products.js
import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import ProductCard from "../components/ProductCard";
import "../assets/styles/products.css"; // Tạo file CSS riêng nếu cần

const Products = () => {
  const [products, setProducts] = useState([]);

  // Lấy tất cả sản phẩm từ Firestore
  const fetchProducts = async () => {
    try {
      const productsQuery = query(
        collection(db, "products"),
        where("is_deleted", "==", false),
        where("is_active", "==", true)
      );
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="products-container">
      {/* All Products Section (replacing Wishlist) */}
      <div className="products-section">
        <div className="products-header">
          <h2 className="section-title">All Products ({products.length})</h2>
          <button className="move-to-bag-btn">MOVE ALL TO BAG</button>
        </div>
        <div className="products-grid">
          {products.length > 0 ? (
            products.slice(0, 4).map((product, index) => (
              <div className="product-item" key={product.id}>
                {index === 0 && <div className="discount-tag">-30%</div>}
                <img
                  src={product.image || "placeholder.jpg"}
                  alt={product.name}
                />
                <button className="add-to-cart-btn">Add to Cart</button>
                <p>{product.name}</p>
                <p>
                  {index === 0 ? (
                    <>
                      <span className="original-price">$960</span>{" "}
                      <span className="discounted-price">$1160</span>
                    </>
                  ) : (
                    `$${product.price || "N/A"}`
                  )}
                </p>
              </div>
            ))
          ) : (
            <p>No products available.</p>
          )}
        </div>
        {/* Just For You Section */}
        <div className="just-for-you-header">
          <h3 className="just-for-you-title">
            <span className="red-bar"></span> Just For You
          </h3>
          <button className="see-all-btn">SEE ALL</button>
        </div>
        <div className="products-grid">
          {products.length > 0 ? (
            products.slice(4, 8).map((product, index) => (
              <div className="product-item" key={product.id}>
                {index === 0 && <div className="discount-tag">-35%</div>}
                {index === 2 && <div className="new-tag">NEW</div>}
                <img
                  src={product.image || "placeholder.jpg"}
                  alt={product.name}
                />
                <button className="add-to-cart-btn">Add to Cart</button>
                <p>{product.name}</p>
                <p>
                  {index === 0 ? (
                    <>
                      <span className="original-price">$960</span>{" "}
                      <span className="discounted-price">$1160</span>
                    </>
                  ) : (
                    `$${product.price || "N/A"}`
                  )}
                </p>
                <div className="rating">★★★★★ (65)</div>
              </div>
            ))
          ) : (
            <p>No products available.</p>
          )}
        </div>
        {/* All Products Section DEMO */}
      <div className="products-container">
      <h2 className="section-title">All Products</h2>
      <div className="products-grid">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <p>No products available.</p>
        )}
      </div>
    </div>
      </div>
    </div>
  );
};

export default Products;