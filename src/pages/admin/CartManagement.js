// src/pages/CartManagement.js
import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Table, Button, Modal, Alert } from "react-bootstrap";
import { auth, db } from "../../config/firebase";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
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
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Lấy dữ liệu từ Firestore
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Kiểm tra quyền admin
      if (!user) {
        setError(t('admin.loginRequired'));
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || userDoc.data().role !== "admin") {
        setError(t('admin.adminRequired'));
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
      console.error(t('admin.error'), error);
      setError(t('admin.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, t]);

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
    if (window.confirm(t('admin.confirmDelete'))) {
      try {
        const itemsSnapshot = await getDocs(collection(db, "carts", cartId, "items"));
        const deletePromises = itemsSnapshot.docs.map((itemDoc) =>
          deleteDoc(doc(db, "carts", cartId, "items", itemDoc.id))
        );
        await Promise.all(deletePromises);
        await deleteDoc(doc(db, "carts", cartId));
        await fetchData();
        setShowModal(false);
        alert(t('admin.deleteSuccess'));
      } catch (error) {
        console.error(t('admin.error'), error);
        setError(t('admin.error'));
      }
    }
  };

  // Hiển thị chi tiết giỏ hàng
  const handleViewCart = (cart) => {
    setSelectedCart(cart);
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">{t('cart.loading')}</div>;
  }

  if (!user) {
    return (
      <div className="cart-container">
        <Alert variant="warning">
          {t('admin.loginRequired')}
        </Alert>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="cart-management-container">
      <h3>{t('admin.carts')}</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>{t('admin.cart.user')}</th>
            <th>{t('admin.table.createdAt')}</th>
            <th>{t('admin.cart.items')}</th>
            <th>{t('admin.table.action')}</th>
          </tr>
        </thead>
        <tbody>
          {carts.map((cart) => {
            // Tìm người dùng theo user_id hoặc id
            const userInfo = users.find((u) => u.user_id === cart.user_id || u.id === cart.user_id);
            return (
              <tr key={cart.id}>
                <td>
                  <div>
                    <div className="fw-bold">
                      {userInfo ? (
                        userInfo.username || userInfo.email?.split('@')[0]
                      ) : (
                        t('cart.loginRequired')
                      )}
                    </div>
                    <small className="text-muted">
                      {userInfo?.email || userInfo?.user_id}
                    </small>
                  </div>
                </td>
                <td>{new Date(cart.created_at).toLocaleString()}</td>
                <td>{cart.items.length}</td>
                <td>
                  <Button
                    variant="info"
                    className="me-2"
                    onClick={() => handleViewCart(cart)}
                  >
                    {t('admin.cart.viewCart')}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteCart(cart.id)}
                  >
                    {t('admin.cart.deleteCart')}
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
          <Modal.Title>{t('admin.cart.viewCart')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCart && (
            <div>
              <h5>
                {(() => {
                  const userInfo = users.find((u) => u.user_id === selectedCart.user_id || u.id === selectedCart.user_id);
                  return userInfo ? (
                    <div>
                      <div className="fw-bold">
                        {userInfo.username || userInfo.email?.split('@')[0] || t('admin.customer.unknown')}
                      </div>
                      <small className="text-muted">
                        {userInfo.email || t('admin.customer.noEmail')}
                      </small>
                    </div>
                  ) : (
                    <div>
                      <div className="fw-bold">{t('admin.customer.unknown')}</div>
                      <small className="text-muted">ID: {selectedCart.user_id}</small>
                    </div>
                  );
                })()}
              </h5>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>{t('admin.product.name')}</th>
                    <th>{t('admin.product.image')}</th>
                    <th>{t('admin.table.quantity')}</th>
                    <th>{t('admin.table.price')}</th>
                    <th>{t('admin.table.createdAt')}</th>
                    <th>{t('admin.table.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCart.items.map((item) => {
                    const product = products.find((p) => p.id === item.product_id);
                    return (
                      <tr key={item.id}>
                        <td>{product ? product.name : t('admin.product.notFound')}</td>
                        <td>
                          {product && product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              style={{ width: "50px" }}
                            />
                          ) : (
                            t('admin.product.noImage')
                          )}
                        </td>
                        <td>{item.quantity}</td>
                        <td>{product ? `${product.price.toLocaleString()}đ` : "N/A"}</td>
                        <td>{new Date(item.added_at).toLocaleString()}</td>
                        <td>
                          <Button
                            variant="danger"
                            onClick={() => handleRemoveItem(selectedCart.id, item.id)}
                          >
                            {t('admin.delete')}
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
            {t('admin.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CartManagement;