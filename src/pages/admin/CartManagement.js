// src/pages/CartManagement.js
import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Table, Button, Modal, Alert } from "react-bootstrap";
import { auth, db } from "../../config/firebase";
import "../../assets/styles/cartManagement.css";

const CartManagement = () => {
  const [carts, setCarts] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCart, setSelectedCart] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useAuthState(auth);

  // Lấy dữ liệu từ Firestore
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Kiểm tra quyền admin
      if (!user) {
        setError("Vui lòng đăng nhập để tiếp tục");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || userDoc.data().role !== "admin") {
        setError("Bạn không có quyền truy cập vào trang này");
        return;
      }

      // Lấy danh sách người dùng từ Firestore
      const userSnapshot = await getDocs(collection(db, "users"));
      const userData = userSnapshot.docs.map((doc) => {
        const userData = doc.data();
        return {
          id: doc.id,
          user_id: userData.user_id || doc.id,
          ...userData,
          displayName: userData.username || userData.email?.split('@')[0] || "Người dùng không xác định",
          email: userData.email || "Chưa có email"
        };
      });
      setUsers(userData);

      // Lấy danh sách sản phẩm
      const productSnapshot = await getDocs(collection(db, "products"));
      const productData = productSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(productData);

      // Lấy danh sách giỏ hàng
      const cartSnapshot = await getDocs(collection(db, "carts"));
      const cartData = [];
      
      for (const cartDoc of cartSnapshot.docs) {
        const itemsSnapshot = await getDocs(collection(db, "carts", cartDoc.id, "items"));
        const items = itemsSnapshot.docs.map((itemDoc) => ({
          id: itemDoc.id,
          ...itemDoc.data(),
        }));
        
        cartData.push({
          id: cartDoc.id,
          ...cartDoc.data(),
          items,
        });
      }
      
      setCarts(cartData);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Xóa một sản phẩm khỏi giỏ hàng
  const handleRemoveItem = async (cartId, itemId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng không?")) {
      try {
        await deleteDoc(doc(db, "carts", cartId, "items", itemId));
        await fetchData();
      } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        setError(error.message);
      }
    }
  };

  // Xóa toàn bộ giỏ hàng của người dùng
  const handleDeleteCart = async (cartId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa giỏ hàng này không?")) {
      try {
        const itemsSnapshot = await getDocs(collection(db, "carts", cartId, "items"));
        const deletePromises = itemsSnapshot.docs.map((itemDoc) =>
          deleteDoc(doc(db, "carts", cartId, "items", itemDoc.id))
        );
        await Promise.all(deletePromises);
        await deleteDoc(doc(db, "carts", cartId));
        await fetchData();
        setShowModal(false);
      } catch (error) {
        console.error("Lỗi khi xóa giỏ hàng:", error);
        setError(error.message);
      }
    }
  };

  // Hiển thị chi tiết giỏ hàng
  const handleViewCart = (cart) => {
    setSelectedCart(cart);
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="cart-management-container">
      <h3>Quản lý giỏ hàng</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Người dùng</th>
            <th>Thời gian tạo</th>
            <th>Số lượng sản phẩm</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {carts.map((cart) => {
            // Tìm người dùng theo user_id hoặc id
            const userInfo = users.find((u) => u.user_id === cart.user_id || u.id === cart.user_id);
            return (
              <tr key={cart.id}>
                <td>
                  {userInfo ? (
                    <div>
                      <div className="fw-bold">{userInfo.username || userInfo.email?.split('@')[0] || "Người dùng không xác định"}</div>
                      <small className="text-muted">{userInfo.email || "Chưa có email"}</small>
                    </div>
                  ) : (
                    <div>
                      <div className="fw-bold">Người dùng không xác định</div>
                      <small className="text-muted">ID: {cart.user_id}</small>
                    </div>
                  )}
                </td>
                <td>{new Date(cart.created_at).toLocaleString()}</td>
                <td>{cart.items.length}</td>
                <td>
                  <Button
                    variant="info"
                    className="me-2"
                    onClick={() => handleViewCart(cart)}
                  >
                    Xem chi tiết
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteCart(cart.id)}
                  >
                    Xóa giỏ hàng
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {/* Modal hiển thị chi tiết giỏ hàng */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết giỏ hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCart && (
            <div>
              <h5>
                {(() => {
                  const userInfo = users.find((u) => u.user_id === selectedCart.user_id || u.id === selectedCart.user_id);
                  return userInfo ? (
                    <div>
                      <div className="fw-bold">{userInfo.username || userInfo.email?.split('@')[0] || "Người dùng không xác định"}</div>
                      <small className="text-muted">{userInfo.email || "Chưa có email"}</small>
                    </div>
                  ) : (
                    <div>
                      <div className="fw-bold">Người dùng không xác định</div>
                      <small className="text-muted">ID: {selectedCart.user_id}</small>
                    </div>
                  );
                })()}
              </h5>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Hình ảnh</th>
                    <th>Số lượng</th>
                    <th>Giá</th>
                    <th>Thời gian thêm</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCart.items.map((item) => {
                    const product = products.find((p) => p.id === item.product_id);
                    return (
                      <tr key={item.id}>
                        <td>{product ? product.name : "Không tìm thấy sản phẩm"}</td>
                        <td>
                          {product && product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              style={{ width: "50px" }}
                            />
                          ) : (
                            "Không có hình ảnh"
                          )}
                        </td>
                        <td>{item.quantity}</td>
                        <td>{product ? `$${product.price}` : "N/A"}</td>
                        <td>{new Date(item.added_at).toLocaleString()}</td>
                        <td>
                          <Button
                            variant="danger"
                            onClick={() => handleRemoveItem(selectedCart.id, item.id)}
                          >
                            Xóa
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CartManagement;