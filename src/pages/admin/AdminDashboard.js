import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"; // Sửa đường dẫn import
import { Tabs, Tab, Table, Button, Form, Modal, Pagination } from "react-bootstrap";
import { Link } from "react-router-dom";
import { auth, db } from "../../config/firebase";

const AdminDashboard = () => {
  // State cho các danh sách
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shippings, setShippings] = useState([]);
  
  // State cho form thêm sản phẩm
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    category_id: "",
    seller_id: "",
    image_url: "",
  });

  // State cho form thêm user
  const [newUser, setNewUser] = useState({
    email: "",
    username: "",
    role: "customer",
  });

  // State cho modal chỉnh sửa
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // State cho phân trang
  const [productPage, setProductPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [shippingPage, setShippingPage] = useState(1);
  const itemsPerPage = 5;

  // Lấy dữ liệu từ Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const productSnapshot = await getDocs(collection(db, "products"));
        setProducts(productSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        const userSnapshot = await getDocs(collection(db, "users"));
        setUsers(userSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        const orderSnapshot = await getDocs(collection(db, "orders"));
        setOrders(orderSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        const shippingSnapshot = await getDocs(collection(db, "shipping"));
        setShippings(shippingSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Hàm phân trang
  const paginate = (items, page) =>
    items.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // --- Quản lý sản phẩm ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const productRef = await addDoc(collection(db, "products"), {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        created_at: new Date().toISOString(),
      });
      await addDoc(collection(db, "inventory_logs"), {
        product_id: productRef.id,
        change_amount: parseInt(newProduct.stock),
        reason: "Initial stock",
        change_date: new Date().toISOString(),
        user_id: auth.currentUser.uid,
      });
      setProducts([...products, { id: productRef.id, ...newProduct }]);
      setNewProduct({ name: "", price: "", stock: "", category_id: "", seller_id: "", image_url: "" });
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
      setShowEditProductModal(false);
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

  // --- Quản lý user ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const userRef = await addDoc(collection(db, "users"), {
        ...newUser,
        created_at: new Date().toISOString(),
        is_active: true,
      });
      setUsers([...users, { id: userRef.id, ...newUser }]);
      setNewUser({ email: "", username: "", role: "customer" });
      alert("User added successfully!");
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleEditUser = async () => {
    try {
      await updateDoc(doc(db, "users", editingUser.id), editingUser);
      setUsers(users.map((u) => (u.id === editingUser.id ? editingUser : u)));
      setShowEditUserModal(false);
      alert("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteDoc(doc(db, "users", id));
        setUsers(users.filter((u) => u.id !== id));
        alert("User deleted successfully!");
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  // --- Quản lý đơn hàng ---
  const handleUpdateOrder = async (orderId, updatedData) => {
    try {
      await updateDoc(doc(db, "orders", orderId), updatedData);
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, ...updatedData } : o)));
      alert("Order updated successfully!");
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  // --- Quản lý vận chuyển ---
  const handleUpdateShipping = async (shippingId, updatedData) => {
    try {
      await updateDoc(doc(db, "shipping", shippingId), updatedData);
      setShippings(shippings.map((s) => (s.id === shippingId ? { ...s, ...updatedData } : s)));
      alert("Shipping updated successfully!");
    } catch (error) {
      console.error("Error updating shipping:", error);
    }
  };

  return (
    <div className="container my-5">
      <h2>Admin Dashboard</h2>

      <Tabs defaultActiveKey="products" id="admin-tabs" className="mb-3">
        {/* Tab Quản lý sản phẩm */}
        <Tab eventKey="products" title="Product Management">
          <h3>Manage Products</h3>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginate(products, productPage).map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>${product.price}</td>
                  <td>{product.stock}</td>
                  <td>
                    <Button
                      variant="warning"
                      className="me-2"
                      onClick={() => {
                        setEditingProduct(product);
                        setShowEditProductModal(true);
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
              disabled={productPage === 1}
              onClick={() => setProductPage(productPage - 1)}
            />
            <Pagination.Next
              disabled={productPage * itemsPerPage >= products.length}
              onClick={() => setProductPage(productPage + 1)}
            />
          </Pagination>

          {/* Modal chỉnh sửa sản phẩm */}
          <Modal show={showEditProductModal} onHide={() => setShowEditProductModal(false)}>
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
                </Form>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowEditProductModal(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={handleEditProduct}>
                Save Changes
              </Button>
            </Modal.Footer>
          </Modal>
        </Tab>

        {/* Tab Quản lý user */}
        <Tab eventKey="users" title="User Management">
          <h3>Manage Users</h3>
          <Form onSubmit={handleAddUser} className="mb-4">
            <div className="row">
              <div className="col-md-3">
                <Form.Control
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-2">
                <Form.Control
                  type="text"
                  placeholder="Username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-2">
                <Form.Select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </div>
              <div className="col-md-2">
                <Button type="submit" variant="success">Add User</Button>
              </div>
            </div>
          </Form>

          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Email</th>
                <th>Username</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginate(users, userPage).map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>
                    <Button
                      variant="warning"
                      className="me-2"
                      onClick={() => {
                        setEditingUser(user);
                        setShowEditUserModal(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteUser(user.id)}
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
              disabled={userPage === 1}
              onClick={() => setUserPage(userPage - 1)}
            />
            <Pagination.Next
              disabled={userPage * itemsPerPage >= users.length}
              onClick={() => setUserPage(userPage + 1)}
            />
          </Pagination>

          {/* Modal chỉnh sửa user */}
          <Modal show={showEditUserModal} onHide={() => setShowEditUserModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Edit User</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {editingUser && (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={editingUser.email}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, email: e.target.value })
                      }
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                      type="text"
                      value={editingUser.username}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, username: e.target.value })
                      }
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Role</Form.Label>
                    <Form.Select
                      value={editingUser.role}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, role: e.target.value })
                      }
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </Form.Select>
                  </Form.Group>
                </Form>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowEditUserModal(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={handleEditUser}>
                Save Changes
              </Button>
            </Modal.Footer>
          </Modal>
        </Tab>

        {/* Tab Quản lý đơn hàng */}
        <Tab eventKey="orders" title="Order Management">
          <h3>Manage Orders</h3>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer ID</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginate(orders, orderPage).map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer_id}</td>
                  <td>${order.total_amount}</td>
                  <td>{order.status}</td>
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
              disabled={orderPage === 1}
              onClick={() => setOrderPage(orderPage - 1)}
            />
            <Pagination.Next
              disabled={orderPage * itemsPerPage >= orders.length}
              onClick={() => setOrderPage(orderPage + 1)}
            />
          </Pagination>
        </Tab>

        {/* Tab Quản lý vận chuyển */}
        <Tab eventKey="shippings" title="Shipping Management">
          <h3>Manage Shipping</h3>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Method</th>
                <th>Status</th>
                <th>Tracking Number</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginate(shippings, shippingPage).map((shipping) => (
                <tr key={shipping.id}>
                  <td>{shipping.order_id}</td>
                  <td>{shipping.shipping_method}</td>
                  <td>{shipping.status}</td>
                  <td>{shipping.tracking_number || "N/A"}</td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Pagination>
            <Pagination.Prev
              disabled={shippingPage === 1}
              onClick={() => setShippingPage(shippingPage - 1)}
            />
            <Pagination.Next
              disabled={shippingPage * itemsPerPage >= shippings.length}
              onClick={() => setShippingPage(shippingPage + 1)}
            />
          </Pagination>
        </Tab>

        {/* Tab Quản lý khuyến mãi */}
        <Tab eventKey="promotions" title="Promotion Management">
          <h3>Manage Promotions</h3>
          <p>
            Go to the <Link to="/admin/promotions">Promotions Page</Link> to manage promotions.
          </p>
        </Tab>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;