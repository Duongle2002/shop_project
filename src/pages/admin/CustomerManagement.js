import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Table, Button, Form, Modal, Pagination } from "react-bootstrap";

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "customers"));
        setCustomers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      const customerRef = await addDoc(collection(db, "customers"), {
        ...newCustomer,
        created_at: new Date().toISOString(),
      });
      setCustomers([...customers, { id: customerRef.id, ...newCustomer }]);
      setNewCustomer({ first_name: "", last_name: "", email: "", phone: "", address: "" });
      alert("Customer added successfully!");
    } catch (error) {
      console.error("Error adding customer:", error);
    }
  };

  const handleEditCustomer = async () => {
    try {
      await updateDoc(doc(db, "customers", editingCustomer.id), editingCustomer);
      setCustomers(customers.map((c) => (c.id === editingCustomer.id ? editingCustomer : c)));
      setShowModal(false);
      alert("Customer updated successfully!");
    } catch (error) {
      console.error("Error updating customer:", error);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteDoc(doc(db, "customers", id));
        setCustomers(customers.filter((c) => c.id !== id));
        alert("Customer deleted successfully!");
      } catch (error) {
        console.error("Error deleting customer:", error);
      }
    }
  };

  const paginate = (items) =>
    items.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="container my-5">
      <h3>Customer Management</h3>
      <Form onSubmit={handleAddCustomer} className="mb-4">
        <div className="row">
          <div className="col-md-2">
            <Form.Control
              type="text"
              placeholder="First Name"
              value={newCustomer.first_name}
              onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
              required
            />
          </div>
          <div className="col-md-2">
            <Form.Control
              type="text"
              placeholder="Last Name"
              value={newCustomer.last_name}
              onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
              required
            />
          </div>
          <div className="col-md-2">
            <Form.Control
              type="email"
              placeholder="Email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              required
            />
          </div>
          <div className="col-md-2">
            <Form.Control
              type="text"
              placeholder="Phone"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <Form.Control
              type="text"
              placeholder="Address"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <Button type="submit" variant="success">Add Customer</Button>
          </div>
        </div>
      </Form>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginate(customers).map((customer) => (
            <tr key={customer.id}>
              <td>{customer.first_name}</td>
              <td>{customer.last_name}</td>
              <td>{customer.email}</td>
              <td>{customer.phone}</td>
              <td>{customer.address}</td>
              <td>
                <Button
                  variant="warning"
                  className="me-2"
                  onClick={() => {
                    setEditingCustomer(customer);
                    setShowModal(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDeleteCustomer(customer.id)}
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
          disabled={page * itemsPerPage >= customers.length}
          onClick={() => setPage(page + 1)}
        />
      </Pagination>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingCustomer && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  value={editingCustomer.first_name}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, first_name: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  value={editingCustomer.last_name}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, last_name: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={editingCustomer.email}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, email: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Phone</Form.Label>
                <Form.Control
                  type="text"
                  value={editingCustomer.phone}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, phone: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  value={editingCustomer.address}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, address: e.target.value })
                  }
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleEditCustomer}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CustomerManagement;