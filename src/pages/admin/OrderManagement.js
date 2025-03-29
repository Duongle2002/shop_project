import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Table, Button, Pagination } from "react-bootstrap";

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const snapshot = await getDocs(collection(db, "orders"));
        setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };
    fetchOrders();
  }, []);

  const handleUpdateOrder = async (orderId, updatedData) => {
    try {
      await updateDoc(doc(db, "orders", orderId), updatedData);
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, ...updatedData } : o)));
      alert("Order updated successfully!");
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const paginate = (items) =>
    items.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="container my-5">
      <h3>Order Management</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer ID</th>
            <th>Promotion ID</th>
            <th>Order Date</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Order Details</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginate(orders).map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customer_id}</td>
              <td>{order.promotion_id || "N/A"}</td>
              <td>{new Date(order.order_date).toLocaleDateString()}</td>
              <td>${order.total_amount}</td>
              <td>{order.status}</td>
              <td>
                {order.order_details && order.order_details.length > 0 ? (
                  <ul>
                    {order.order_details.map((detail, index) => (
                      <li key={index}>
                        Product ID: {detail.product_id}, Quantity: {detail.quantity}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "No details"
                )}
              </td>
              <td>
                <Button
                  variant="warning"
                  onClick={() =>
                    handleUpdateOrder(order.id, {
                      status: order.status === "Pending" ? "Confirmed" : "Delivered",
                    })
                  }
                >
                  {order.status === "Pending" ? "Confirm" : "Mark as Delivered"}
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
          disabled={page * itemsPerPage >= orders.length}
          onClick={() => setPage(page + 1)}
        />
      </Pagination>
    </div>
  );
};

export default OrderManagement;