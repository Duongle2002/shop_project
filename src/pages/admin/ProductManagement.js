import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { Table, Button, Form, Modal, Pagination, Tabs, Tab } from "react-bootstrap";
import { auth, db } from "../../config/firebase";
import axios from "axios";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [deletedProducts, setDeletedProducts] = useState([]); // Danh sách sản phẩm đã xóa
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
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
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [deletedPage, setDeletedPage] = useState(1); // Trang cho tab sản phẩm đã xóa
  const itemsPerPage = 5;

  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/duuzl8vye/image/upload";
  const UPLOAD_PRESET = "shop_project";

  const fetchData = async () => {
    try {
      const productSnapshot = await getDocs(collection(db, "products"));
      const allProducts = productSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      // Lọc sản phẩm chưa xóa
      setProducts(allProducts.filter((product) => !product.is_deleted));
      // Lọc sản phẩm đã xóa
      setDeletedProducts(allProducts.filter((product) => product.is_deleted));

      const categorySnapshot = await getDocs(collection(db, "categories"));
      setCategories(categorySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const userSnapshot = await getDocs(collection(db, "users"));
      const allUsers = userSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSellers(allUsers.filter((user) => user.role === "admin" || user.role === "seller"));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const uploadImageToCloudinary = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      setIsUploading(true);
      const response = await axios.post(CLOUDINARY_URL, formData);
      console.log("Cloudinary response:", response.data);
      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error.response?.data || error.message);
      alert("Failed to upload image to Cloudinary. Check console for details.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const handleEditImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);

      const imageUrl = await uploadImageToCloudinary(file);
      if (imageUrl) {
        setEditingProduct({ ...editingProduct, image_url: imageUrl });
      }
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      if (isUploading) {
        alert("Image is still uploading. Please wait.");
        return;
      }

      let finalImageUrl = newProduct.image_url;
      if (imageFile) {
        finalImageUrl = await uploadImageToCloudinary(imageFile);
        if (!finalImageUrl) {
          alert("Image upload failed. Product not added.");
          return;
        }
      }

      const productRef = await addDoc(collection(db, "products"), {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        image_url: finalImageUrl || "",
        created_at: new Date().toISOString(),
        is_active: newProduct.is_active,
        is_deleted: false,
      });
      await addDoc(collection(db, "inventory_logs"), {
        product_id: productRef.id,
        change_amount: parseInt(newProduct.stock),
        reason: "Initial stock",
        change_date: new Date().toISOString(),
        user_id: auth.currentUser.uid,
      });
      await fetchData();
      setNewProduct({
        name: "",
        price: "",
        stock: "",
        category_id: "",
        seller_id: "",
        image_url: "",
        is_active: true,
      });
      setImagePreview(null);
      setImageFile(null);
      alert("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleEditProduct = async () => {
    try {
      if (isUploading) {
        alert("Image is still uploading. Please wait.");
        return;
      }

      let finalImageUrl = editingProduct.image_url;
      if (imageFile) {
        finalImageUrl = await uploadImageToCloudinary(imageFile);
        if (!finalImageUrl) {
          alert("Image upload failed. Product not updated.");
          return;
        }
      }

      const oldProduct = products.find((p) => p.id === editingProduct.id);
      await updateDoc(doc(db, "products", editingProduct.id), {
        ...editingProduct,
        image_url: finalImageUrl || editingProduct.image_url,
      });
      if (editingProduct.stock !== oldProduct.stock) {
        await addDoc(collection(db, "inventory_logs"), {
          product_id: editingProduct.id,
          change_amount: editingProduct.stock - oldProduct.stock,
          reason: "Stock update",
          change_date: new Date().toISOString(),
          user_id: auth.currentUser.uid,
        });
      }
      await fetchData();
      setShowModal(false);
      setImagePreview(null);
      setImageFile(null);
      alert("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to mark this product as deleted?")) {
      try {
        await updateDoc(doc(db, "products", id), {
          is_deleted: true,
        });
        await fetchData();
        alert("Product marked as deleted successfully!");
      } catch (error) {
        console.error("Error marking product as deleted:", error);
      }
    }
  };

  const handleRestoreProduct = async (id) => {
    if (window.confirm("Are you sure you want to restore this product?")) {
      try {
        await updateDoc(doc(db, "products", id), {
          is_deleted: false,
        });
        await fetchData();
        alert("Product restored successfully!");
      } catch (error) {
        console.error("Error restoring product:", error);
      }
    }
  };

  const paginate = (items, currentPage) =>
    items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
            <Form.Select
              value={newProduct.category_id}
              onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-2">
            <Form.Select
              value={newProduct.seller_id}
              onChange={(e) => setNewProduct({ ...newProduct, seller_id: e.target.value })}
            >
              <option value="">Select Seller</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.username}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-2">
            <Form.Control
              type="text"
              placeholder="Image URL (or upload below)"
              value={newProduct.image_url}
              onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
            />
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-2"
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                style={{ width: "100px", marginTop: "10px" }}
              />
            )}
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
            <Button type="submit" variant="success" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Add Product"}
            </Button>
          </div>
        </div>
      </Form>

      <Tabs defaultActiveKey="active" id="product-tabs" className="mb-3">
        {/* Tab sản phẩm đang hoạt động */}
        <Tab eventKey="active" title="Active Products">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Seller</th>
                <th>Image</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginate(products, page).map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>${product.price}</td>
                  <td>{product.stock}</td>
                  <td>{categories.find((cat) => cat.id === product.category_id)?.name || "N/A"}</td>
                  <td>{sellers.find((seller) => seller.id === product.seller_id)?.username || "N/A"}</td>
                  <td>
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name} style={{ width: "50px" }} />
                    )}
                  </td>
                  <td>{product.is_active ? "Yes" : "No"}</td>
                  <td>
                    <Button
                      variant="warning"
                      className="me-2"
                      onClick={() => {
                        setEditingProduct(product);
                        setImagePreview(product.image_url);
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
            <Pagination.Prev disabled={page === 1} onClick={() => setPage(page - 1)} />
            <Pagination.Next
              disabled={page * itemsPerPage >= products.length}
              onClick={() => setPage(page + 1)}
            />
          </Pagination>
        </Tab>

        {/* Tab sản phẩm đã xóa */}
        <Tab eventKey="deleted" title="Deleted Products">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Seller</th>
                <th>Image</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginate(deletedProducts, deletedPage).map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>${product.price}</td>
                  <td>{product.stock}</td>
                  <td>{categories.find((cat) => cat.id === product.category_id)?.name || "N/A"}</td>
                  <td>{sellers.find((seller) => seller.id === product.seller_id)?.username || "N/A"}</td>
                  <td>
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name} style={{ width: "50px" }} />
                    )}
                  </td>
                  <td>{product.is_active ? "Yes" : "No"}</td>
                  <td>
                    <Button
                      variant="success"
                      onClick={() => handleRestoreProduct(product.id)}
                    >
                      Restore
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Pagination>
            <Pagination.Prev disabled={deletedPage === 1} onClick={() => setDeletedPage(deletedPage - 1)} />
            <Pagination.Next
              disabled={deletedPage * itemsPerPage >= deletedProducts.length}
              onClick={() => setDeletedPage(deletedPage + 1)}
            />
          </Pagination>
        </Tab>
      </Tabs>

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
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={editingProduct.category_id}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, category_id: e.target.value })
                  }
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Seller</Form.Label>
                <Form.Select
                  value={editingProduct.seller_id}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, seller_id: e.target.value })
                  }
                >
                  <option value="">Select Seller</option>
                  {sellers.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.username}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Image URL (or upload below)</Form.Label>
                <Form.Control
                  type="text"
                  value={editingProduct.image_url}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, image_url: e.target.value })
                  }
                />
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="mt-2"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: "100px", marginTop: "10px" }}
                  />
                )}
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
          <Button variant="primary" onClick={handleEditProduct} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProductManagement;