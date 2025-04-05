import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading...</p>;
  if (!product) return <p>Product not found</p>;

  return (
    <div className="container my-5">
      <h2>{product.name}</h2>
      <img src={product.image_url} alt={product.name} className="img-fluid" />
      <p>Price: ${product.price}</p>
      <p>Stock: {product.stock}</p>
      <p>Category ID: {product.category_id}</p>
      <p>Seller ID: {product.seller_id}</p>
      <p>Created At: {new Date(product.created_at).toLocaleDateString()}</p>

      <h3>Reviews</h3>
      {reviews.length > 0 ? (
        reviews.map((review) => (
          <div key={review.review_id} className="border p-3 mb-3">
            <p>Rating: {review.rating}/5</p>
            <p>{review.comment}</p>
            <p>
              Reviewed on:{" "}
              {new Date(review.review_date).toLocaleDateString()}
            </p>
          </div>
        ))
      ) : (
        <p>No reviews yet.</p>
      )}
    </div>
  );
};

export default ProductDetail;
