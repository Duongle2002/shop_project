import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import ProductCard from "../components/ProductCard";
import "../assets/styles/products.css";

const Products = () => {
  const [products, setProducts] = useState([]);

  // Fetch products from Firestore
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
      {/* All Products Section */}
      <div className="products-section">
        <div className="products-header">
          <h3 className="just-for-you-title">
            <span className="red-bar"></span> All Products ({products.length})
          </h3>
          <button className="move-to-bag-btn">MOVE ALL TO BAG</button>
        </div>

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
            <ProductCard
              key={product.id}
              product={{
                ...product,
                discount: index === 0 ? "-35%" : null,
                newTag: index === 2 ? "NEW" : null,
                originalPrice: index === 0 ? 960 : null,
                discountedPrice: index === 0 ? 1160 : product.price,
              }}
            />
          ))
        ) : (
          <p>No products available.</p>
        )}
      </div>
    </div>
  );
};

export default Products;
