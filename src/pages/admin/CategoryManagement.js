import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Table, Button, Form, Modal, Pagination } from "react-bootstrap";
import { useTranslation } from "react-i18next";

const CategoryManagement = () => {
  const { t } = useTranslation();
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
        alert(t("admin.categories.fetchError"));
      }
    };
    fetchCategories();
  }, [t]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const categoryRef = await addDoc(collection(db, "categories"), {
        ...newCategory,
      });
      setCategories([...categories, { id: categoryRef.id, ...newCategory }]);
      setNewCategory({ name: "", description: "" });
      alert(t("admin.categories.addSuccess"));
    } catch (error) {
      console.error("Error adding category:", error);
      alert(t("admin.categories.addError"));
    }
  };

  const handleEditCategory = async () => {
    try {
      await updateDoc(doc(db, "categories", editingCategory.id), editingCategory);
      setCategories(categories.map((c) => (c.id === editingCategory.id ? editingCategory : c)));
      setShowModal(false);
      alert(t("admin.categories.updateSuccess"));
    } catch (error) {
      console.error("Error updating category:", error);
      alert(t("admin.categories.updateError"));
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm(t("admin.categories.confirmDelete"))) {
      try {
        await deleteDoc(doc(db, "categories", id));
        setCategories(categories.filter((c) => c.id !== id));
        alert(t("admin.categories.deleteSuccess"));
      } catch (error) {
        console.error("Error deleting category:", error);
        alert(t("admin.categories.deleteError"));
      }
    }
  };

  const paginate = (items) =>
    items.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="container my-5">
      <h3>{t("admin.categories.title")}</h3>
      <Form onSubmit={handleAddCategory} className="mb-4">
        <div className="row">
          <div className="col-md-3">
            <Form.Control
              type="text"
              placeholder={t("admin.categories.namePlaceholder")}
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              required
            />
          </div>
          <div className="col-md-5">
            <Form.Control
              type="text"
              placeholder={t("admin.categories.descriptionPlaceholder")}
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <Button type="submit" variant="success">{t("admin.categories.addButton")}</Button>
          </div>
        </div>
      </Form>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>{t("admin.categories.nameColumn")}</th>
            <th>{t("admin.categories.descriptionColumn")}</th>
            <th>{t("admin.categories.actionsColumn")}</th>
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
                  {t("admin.categories.editButton")}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  {t("admin.categories.deleteButton")}
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
          <Modal.Title>{t("admin.categories.editModalTitle")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingCategory && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>{t("admin.categories.nameLabel")}</Form.Label>
                <Form.Control
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, name: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>{t("admin.categories.descriptionLabel")}</Form.Label>
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
            {t("admin.categories.closeButton")}
          </Button>
          <Button variant="primary" onClick={handleEditCategory}>
            {t("admin.categories.saveButton")}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CategoryManagement;