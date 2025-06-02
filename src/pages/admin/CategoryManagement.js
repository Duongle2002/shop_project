
import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

import { Table, Button, Form, Modal, Pagination } from "react-bootstrap";
import { db } from "../../config/firebase";
const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "categories"));
        setCategories(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const categoryRef = await addDoc(collection(db, "categories"), {
        ...newCategory,
      });
      setCategories([...categories, { id: categoryRef.id, ...newCategory }]);
      setNewCategory({ name: "", description: "" });
      alert("Category added successfully!");
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleEditCategory = async () => {
    try {
      await updateDoc(doc(db, "categories", editingCategory.id), editingCategory);
      setCategories(categories.map((c) => (c.id === editingCategory.id ? editingCategory : c)));
      setShowModal(false);
      alert("Category updated successfully!");
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteDoc(doc(db, "categories", id));
        setCategories(categories.filter((c) => c.id !== id));
        alert("Category deleted successfully!");
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const paginate = (items) =>
    items.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="container my-5">
      <h3>Category Management</h3>
      <Form onSubmit={handleAddCategory} className="mb-4">
        <div className="row">
          <div className="col-md-3">
            <Form.Control
              type="text"
              placeholder="Name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              required
            />
          </div>
          <div className="col-md-5">
            <Form.Control
              type="text"
              placeholder="Description"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <Button type="submit" variant="success">Add Category</Button>
          </div>
        </div>
      </Form>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginate(categories).map((category) => (
            <tr key={category.id}>
              <td>{category.name}</td>
              <td>{category.description}</td>
              <td>
                <Button
                  variant="warning"
                  className="me-2"
                  onClick={() => {
                    setEditingCategory(category);
                    setShowModal(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDeleteCategory(category.id)}
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
          disabled={page * itemsPerPage >= categories.length}
          onClick={() => setPage(page + 1)}
        />
      </Pagination>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingCategory && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, name: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  value={editingCategory.description}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, description: e.target.value })
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
          <Button variant="primary" onClick={handleEditCategory}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CategoryManagement;