import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Table, Button, Pagination } from "react-bootstrap";

const ShippingManagement = () => {
  const [shippings, setShippings] = useState([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchShippings = async () => {
      try {
        const snapshot = await getDocs(collection(db, "shipping"));
        setShippings(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching shippings:", error);
      }
    };
    fetchShippings();
  }, []);

  const handleUpdateShipping = async (shippingId, updatedData) => {
    try {
      await updateDoc(doc(db, "shipping", shippingId), updatedData);
      setShippings(shippings.map((s) => (s.id === shippingId ? { ...s, ...updatedData } : s)));
      alert("Shipping updated successfully!");
    } catch (error) {
      console.error("Error updating shipping:", error);
    }
  };

  const paginate = (items) =>
    items.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="container my-5">
      <h3>Shipping Management</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Shipping Method</th>
            <th>Shipping Cost</th>
            <th>Address</th>
            <th>Status</th>
            <th>Tracking Number</th>
            <th>Shipped Date</th>
            <th>Delivered Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginate(shippings).map((shipping) => (
            <tr key={shipping.id}>
              <td>{shipping.order_id}</td>
              <td>{shipping.shipping_method}</td>
              <td>${shipping.shipping_cost}</td>
              <td>{shipping.address}</td>
              <td>{shipping.status}</td>
              <td>{shipping.tracking_number || "N/A"}</td>
              <td>{shipping.shipped_date ? new Date(shipping.shipped_date).toLocaleDateString() : "N/A"}</td>
              <td>{shipping.delivered_date ? new Date(shipping.delivered_date).toLocaleDateString() : "N/A"}</td>
              <td>
                <Button
                  variant="warning"
                  onClick={() =>
                    handleUpdateShipping(shipping.id, {
                      status: "Shipped",
                      tracking_number: "TRK" + Math.random().toString(36).substr(2, 9),
                      shipped_date: new Date().toISOString(),
                    })
                  }
                >
                  Mark as Shipped
                </Button>
                <Button
                  variant="success"
                  className="ms-2"
                  onClick={() =>
                    handleUpdateShipping(shipping.id, {
                      status: "Delivered",
                      delivered_date: new Date().toISOString(),
                    })
                  }
                >
                  Mark as Delivered
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
          disabled={page * itemsPerPage >= shippings.length}
          onClick={() => setPage(page + 1)}
        />
      </Pagination>
    </div>
  );
};

export default ShippingManagement;