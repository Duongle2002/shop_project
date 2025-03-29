import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Table, Pagination } from "react-bootstrap";

const InventoryLogManagement = () => {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const snapshot = await getDocs(collection(db, "inventory_logs"));
        setLogs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching inventory logs:", error);
      }
    };
    fetchLogs();
  }, []);

  const paginate = (items) =>
    items.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="container my-5">
      <h3>Inventory Log Management</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Product ID</th>
            <th>Change Amount</th>
            <th>Reason</th>
            <th>Change Date</th>
            <th>User ID</th>
          </tr>
        </thead>
        <tbody>
          {paginate(logs).map((log) => (
            <tr key={log.id}>
              <td>{log.product_id}</td>
              <td>{log.change_amount}</td>
              <td>{log.reason}</td>
              <td>{new Date(log.change_date).toLocaleDateString()}</td>
              <td>{log.user_id}</td>
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
          disabled={page * itemsPerPage >= logs.length}
          onClick={() => setPage(page + 1)}
        />
      </Pagination>
    </div>
  );
};

export default InventoryLogManagement;