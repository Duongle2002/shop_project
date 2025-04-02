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
  );
};

export default Products;