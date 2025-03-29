import React, { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Table, Button, Pagination } from "react-bootstrap";

const ProductReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const snapshot = await getDocs(collection(db, "product_reviews"));
        setReviews(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };
    fetchReviews();
  }, []);

  const handleDeleteReview = async (id) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await deleteDoc(doc(db, "product_reviews", id));
        setReviews(reviews.filter((r) => r.id !== id));
        alert("Review deleted successfully!");
      } catch (error) {
        console.error("Error deleting review:", error);
      }
    }
  };

  const paginate = (items) =>
    items.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="container my-5">
      <h3>Product Review Management</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Product ID</th>
            <th>Customer ID</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Review Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginate(reviews).map((review) => (
            <tr key={review.id}>
              <td>{review.product_id}</td>
              <td>{review.customer_id}</td>
              <td>{review.rating}</td>
              <td>{review.comment}</td>
              <td>{new Date(review.review_date).toLocaleDateString()}</td>
              <td>
                <Button
                  variant="danger"
                  onClick={() => handleDeleteReview(review.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination>
        <Pagination.Prev
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        />
        <Pagination.Next
          disabled={page * itemsPerPage >= reviews.length}
          onClick={() => setPage(page + 1)}
        />
      </Pagination>
    </div>
  );
};

export default ProductReviewManagement;