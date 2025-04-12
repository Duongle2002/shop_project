import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, getDocs, setDoc, addDoc, updateDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../config/firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../assets/styles/ProductDetail.css";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth); // Get authenticated user

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productDoc = await getDoc(doc(db, "products", id));
        if (productDoc.exists()) {
          setProduct({ id: productDoc.id, ...productDoc.data() });
        }

        const reviewsSnapshot = await getDocs(collection(db, "product_reviews"));
        const reviewList = reviewsSnapshot.docs
          .filter((doc) => doc.data().product_id === id)
          .map((doc) => ({ id: doc.id, ...doc.data() }));
        setReviews(reviewList);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Function to render star ratings
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? "star filled" : "star"}>
          ★
        </span>
      );
    }
    return stars;
  };

  // Add to Cart functionality (from ProductCard.js)
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

      alert("Product added to cart successfully!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add product to cart.");
    }
  };

  if (loading) return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  if (!product) return <div className="alert alert-warning text-center my-5">Product not found</div>;

  return (
    <div className="container my-5">
      <div className="row">
        {/* Product Image */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <img
              src={product.image_url}
              alt={product.name}
              className="card-img-top product-image"
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="col-md-6">
          <div className="card shadow-sm p-4">
            <h2 className="card-title">{product.name}</h2>
            <hr />
            <p className="card-text"><strong>Price:</strong> ${product.price.toFixed(2)}</p>
            <p className="card-text"><strong>Stock:</strong> {product.stock} units</p>
            <p className="card-text"><strong>Category ID:</strong> {product.category_id}</p>
            <p className="card-text"><strong>Seller ID:</strong> {product.seller_id}</p>
            <p className="card-text">
              <strong>Created At:</strong>{" "}
              {new Date(product.created_at).toLocaleDateString()}
            </p>
            <button className="add-to-cart-btn mt-3" onClick={handleAddToCart}>
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-5">
        <h3 className="mb-4">Customer Reviews</h3>
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.review_id} className="card shadow-sm mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div className="star-rating">{renderStars(review.rating)}</div>
                  <small className="text-muted">
                    {new Date(review.review_date).toLocaleDateString()}
                  </small>
                </div>
                <p className="card-text mt-2">{review.comment}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="alert alert-info">No reviews yet.</div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;