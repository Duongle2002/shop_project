import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Table, Button, Form, Modal, Pagination } from "react-bootstrap";
import { auth, db } from "../../config/firebase";


const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    category_id: "",
    seller_id: "",
    image_url: "",
    is_active: true,
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const productRef = await addDoc(collection(db, "products"), {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        created_at: new Date().toISOString(),
        is_active: newProduct.is_active,
      });
      await addDoc(collection(db, "inventory_logs"), {
        product_id: productRef.id,
        change_amount: parseInt(newProduct.stock),
        reason: "Initial stock",
        change_date: new Date().toISOString(),
        user_id: auth.currentUser.uid,
      });
      setProducts([...products, { id: productRef.id, ...newProduct }]);
      setNewProduct({
        name: "",
        price: "",
        stock: "",
        category_id: "",
        seller_id: "",
        image_url: "",
        is_active: true,
      });
      alert("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleEditProduct = async () => {
    try {
      const oldProduct = products.find((p) => p.id === editingProduct.id);
      await updateDoc(doc(db, "products", editingProduct.id), editingProduct);
      if (editingProduct.stock !== oldProduct.stock) {
        await addDoc(collection(db, "inventory_logs"), {
          product_id: editingProduct.id,
          change_amount: editingProduct.stock - oldProduct.stock,
          reason: "Stock update",
          change_date: new Date().toISOString(),
          user_id: auth.currentUser.uid,
        });
      }
      setProducts(products.map((p) => (p.id === editingProduct.id ? editingProduct : p)));
      setShowModal(false);
      alert("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        setProducts(products.filter((p) => p.id !== id));
        alert("Product deleted successfully!");
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const paginate = (items) =>
    items.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="container my-5">
      <h3>Product Management</h3>
      <Form onSubmit={handleAddProduct} className="mb-4">
        <div className="row">
          <div className="col-md-2">
            <Form.Control
              type="text"
              placeholder="Name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              required
            />
          </div>
          <div className="col-md-2">
            <Form.Control
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              required
            />
          </div>
          <div className="col-md-2">
            <Form.Control
              type="number"
              placeholder="Stock"
              value={newProduct.stock}
              onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
              required
            />
          </div>
          <div className="col-md-2">
            <Form.Control
              type="text"
              placeholder="Category ID"
              value={newProduct.category_id}
              onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <Form.Control
              type="text"
              placeholder="Seller ID"
              value={newProduct.seller_id}
              onChange={(e) => setNewProduct({ ...newProduct, seller_id: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <Form.Control
              type="text"
              placeholder="Image URL"
              value={newProduct.image_url}
              onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <Form.Check
              type="checkbox"
              label="Active"
              checked={newProduct.is_active}
              onChange={(e) => setNewProduct({ ...newProduct, is_active: e.target.checked })}
            />
          </div>
          <div className="col-md-2">
            <Button type="submit" variant="success">Add Product</Button>
          </div>
        </div>
      </Form>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Category ID</th>
            <th>Seller ID</th>
            <th>Image URL</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginate(products).map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>${product.price}</td>
              <td>{product.stock}</td>
              <td>{product.category_id}</td>
              <td>{product.seller_id}</td>
              <td>{product.image_url}</td>
              <td>{product.is_active ? "Yes" : "No"}</td>
              <td>
                <Button
                  variant="warning"
                  className="me-2"
                  onClick={() => {
                    setEditingProduct(product);
                    setShowModal(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDeleteProduct(product.id)}
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
          disabled={page * itemsPerPage >= products.length}
          onClick={() => setPage(page + 1)}
        />
      </Pagination>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingProduct && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Price</Form.Label>
                <Form.Control
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Stock</Form.Label>
                <Form.Control
                  type="number"
                  value={editingProduct.stock}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Category ID</Form.Label>
                <Form.Control
                  type="text"
                  value={editingProduct.category_id}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, category_id: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Seller ID</Form.Label>
                <Form.Control
                  type="text"
                  value={editingProduct.seller_id}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, seller_id: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Image URL</Form.Label>
                <Form.Control
                  type="text"
                  value={editingProduct.image_url}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, image_url: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Active"
                  checked={editingProduct.is_active}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, is_active: e.target.checked })
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
          <Button variant="primary" onClick={handleEditProduct}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProductManagement;