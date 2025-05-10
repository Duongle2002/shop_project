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

      console.log("Người dùng hiện tại:", user.uid, user.email);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || userDoc.data().role !== "admin") {
        setError("Bạn cần có quyền admin để truy cập trang này");
        return;
      }

      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const ordersData = [];

      // Gom customer_id
      const customerIds = ordersSnapshot.docs
        .map(doc => doc.data().customer_id)
        .filter(id => id);
      const uniqueCustomerIds = [...new Set(customerIds)];
      const userDocs = await Promise.all(
        uniqueCustomerIds.map(id => getDoc(doc(db, "users", id)))
      );
      const userMap = {};
      userDocs.forEach((userDoc, index) => {
        if (userDoc.exists()) {
          userMap[uniqueCustomerIds[index]] = userDoc.data();
        }
      });

      for (const orderDoc of ordersSnapshot.docs) {
        const orderData = orderDoc.data();
        console.log("Order data:", orderData);

        if (!orderData.customer_id) {
          console.warn(`Order ${orderDoc.id} missing customer_id`);
          continue;
        }

        // Chuyển đổi created_at
        if (orderData.order_date && typeof orderData.order_date === 'string') {
          orderData.created_at = orderData.order_date;
        } else if (orderData.order_date && orderData.order_date.toDate) {
          orderData.created_at = orderData.order_date.toDate().toISOString();
        } else {
          orderData.created_at = new Date().toISOString();
        }

        ordersData.push({
          id: orderDoc.id,
          ...orderData,
          user: userMap[orderData.customer_id] || null,
          total: orderData.total_amount,
          status: orderData.status.toLowerCase(),
          items: orderData.order_details
        });
      }

      const validOrders = ordersData.filter(order => typeof order.created_at === 'string');
      setOrders(validOrders.sort((a, b) => b.created_at.localeCompare(a.created_at)));
    } catch (error) {
      console.error("Lỗi trong fetchOrders:", error.message, error.code, error.stack);
      setError(`Đã xảy ra lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user === null || user === undefined) return;
    fetchOrders();
  }, [user]);

  const handleUpdateStatus = async (orderId, newStatus, newPaymentStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        payment_status: newPaymentStatus || "pending",
        updated_at: new Date().toISOString()
      });
      
      alert("Cập nhật trạng thái đơn hàng thành công");
      fetchOrders();
      setShowModal(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error.message, error.code, error.stack);
      setError(`Đã xảy ra lỗi: ${error.message}`);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="container order-management-container">
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
                      {order.user.username || (order.user.email && order.user.email.split('@')[0]) || order.receiver_name || "Khách hàng không biết"}
                    </div>
                    <small className="text-muted">
                      {order.user.email || "Khách hàng không có email"}
                    </small>
                  </div>
                ) : (
                  order.receiver_name || "Khách hàng không biết"
                )}
              </td>
              <td>{order.total_amount.toLocaleString()}đ</td>
              <td>
                <span className={`badge bg-${
                  order.status === 'delivered' ? 'success' :
                  order.status === 'cancelled' ? 'danger' :
                  'warning'
                }`}>
                  {order.status === 'delivered' ? 'Đã giao hàng' :
                   order.status === 'cancelled' ? 'Đã hủy' :
                   order.status === 'pending' ? 'Đang chờ xử lý' : order.status}
                </span>
              </td>
              <td>
                <span className={`badge bg-warning`}>
                  Chờ thanh toán {/* Cập nhật nếu có payment_status */}
                </span>
              </td>
              <td>{order.order_date ? new Date(order.order_date).toLocaleString() : 'Không xác định'}</td>
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
                        {selectedOrder.user.username || (selectedOrder.user.email && selectedOrder.user.email.split('@')[0]) || selectedOrder.receiver_name || "Khách hàng không biết"}
                      </strong>
                      <br />
                      <small className="text-muted">{selectedOrder.user.email || "Không có email"}</small>
                    </>
                  ) : (
                    selectedOrder.receiver_name || "Khách hàng không biết"
                  )}
                </p>
              </div>

              <div className="mb-4">
                <h5>Trạng thái đơn hàng</h5>
                <Form.Select
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value, selectedOrder.payment_status || "pending")}
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
                  value={selectedOrder.payment_status || "pending"}
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
                    {selectedOrder.order_details.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product_id}</td> {/* Thay bằng product_name nếu có */}
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
                        {selectedOrder.total_amount.toLocaleString()}đ
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