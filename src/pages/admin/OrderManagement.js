import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Table, Button, Modal, Form, Alert } from "react-bootstrap";
import { auth, db } from "../../config/firebase";
import "../../assets/styles/orderManagement.css";

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useAuthState(auth);

  const statusOptions = [
    { value: "pending", label: "Đang chờ xử lý" },
    { value: "processing", label: "Đang xử lý" },
    { value: "shipped", label: "Đã gửi hàng" },
    { value: "delivered", label: "Đã giao hàng" },
    { value: "cancelled", label: "Đã hủy" }
  ];

  const paymentStatusOptions = [
    { value: "pending", label: "Chờ thanh toán" },
    { value: "paid", label: "Đã thanh toán" },
    { value: "failed", label: "Thanh toán thất bại" },
    { value: "refunded", label: "Đã hoàn tiền" }
  ];

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user) {
        setError("Vui lòng đăng nhập để tiếp tục");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || userDoc.data().role !== "admin") {
        setError("Bạn cần có quyền admin để truy cập trang này");
        return;
      }

      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const ordersData = [];

      for (const orderDoc of ordersSnapshot.docs) {
        const orderData = orderDoc.data();
        const userDoc = await getDoc(doc(db, "users", orderData.user_id));
        const userData = userDoc.exists() ? userDoc.data() : null;

        ordersData.push({
          id: orderDoc.id,
          ...orderData,
          user: userData
        });
      }

      setOrders(ordersData.sort((a, b) => b.created_at.localeCompare(a.created_at)));
    } catch (error) {
      console.error("Đã xảy ra lỗi"), error;
      setError("Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleUpdateStatus = async (orderId, newStatus, newPaymentStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        payment_status: newPaymentStatus,
        updated_at: new Date().toISOString()
      });
      
      alert("Cập nhật trạng thái đơn hàng thành công");
      fetchOrders();
      setShowModal(false);
    } catch (error) {
      console.error("Đã xảy ra lỗi"), error;
      setError("Đã xảy ra lỗi");
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="order-management-container">
      <h3>Quản lý đơn hàng</h3>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID đơn hàng</th>
            <th>Khách hàng</th>
            <th>Tổng</th>
            <th>Trạng thái</th>
            <th>Trạng thái thanh toán</th>
            <th>Ngày đặt</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>
                {order.user ? (
                  <div>
                    <div className="fw-bold">
                      {order.user.username || order.user.email?.split('@')[0] || "Khách hàng không biết"}
                    </div>
                    <small className="text-muted">
                      {order.user.email || "Khách hàng không có email"}
                    </small>
                  </div>
                ) : (
                  "Khách hàng không biết"
                )}
              </td>
              <td>{order.total.toLocaleString()}đ</td>
              <td>
                <span className={`badge bg-${
                  order.status === 'delivered' ? 'success' :
                  order.status === 'cancelled' ? 'danger' :
                  'warning'
                }`}>
                  {order.status === 'delivered' ? 'Đã giao hàng' :
                  order.status === 'cancelled' ? 'Đã hủy' :
                  'Đang chờ xử lý'}
                </span>
              </td>
              <td>
                <span className={`badge bg-${
                  order.payment_status === 'paid' ? 'success' :
                  order.payment_status === 'failed' ? 'danger' :
                  'warning'
                }`}>
                  {order.payment_status === 'paid' ? 'Đã thanh toán' :
                  order.payment_status === 'failed' ? 'Thanh toán thất bại' :
                  'Chờ thanh toán'}
                </span>
              </td>
              <td>{new Date(order.created_at).toLocaleString()}</td>
              <td>
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => handleViewOrder(order)}
                >
                  Xem chi tiết
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết đơn hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <div className="mb-4">
                <h5>Khách hàng</h5>
                <p>
                  {selectedOrder.user ? (
                    <>
                      <strong>
                        {selectedOrder.user.username || selectedOrder.user.email?.split('@')[0]}
                      </strong>
                      <br />
                      <small className="text-muted">{selectedOrder.user.email}</small>
                    </>
                  ) : (
                    "Khách hàng không biết"
                  )}
                </p>
              </div>

              <div className="mb-4">
                <h5>Trạng thái đơn hàng</h5>
                <Form.Select
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value, selectedOrder.payment_status)}
                  className="mb-3"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>

                <h5>Trạng thái thanh toán</h5>
                <Form.Select
                  value={selectedOrder.payment_status}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id, selectedOrder.status, e.target.value)}
                >
                  {paymentStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="mb-4">
                <h5>Chi tiết đơn hàng</h5>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Tên sản phẩm</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.price.toLocaleString()}đ</td>
                        <td>{(item.price * item.quantity).toLocaleString()}đ</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan="3" className="text-end fw-bold">
                        Tổng cộng
                      </td>
                      <td className="fw-bold">
                        {selectedOrder.total.toLocaleString()}đ
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Hủy
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderManagement;