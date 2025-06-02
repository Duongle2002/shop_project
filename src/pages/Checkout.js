import React, { useEffect, useState, useContext } from "react";
import { collection, getDocs, addDoc, getDoc, doc, query, where, deleteDoc } from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { PromoContext } from "./PromoContext";
import { Form, Button, Alert, Table, Toast, ToastContainer } from "react-bootstrap";
import "../assets/styles/checkout.css";

const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    method: "Standard",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [validPromos, setValidPromos] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const { promoState, setPromoState } = useContext(PromoContext);

  // Hàm hiển thị Toast
  const showToast = (message, variant = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => removeToast(id), 3000);
  };

  // Hàm xóa Toast
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const fetchCart = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError("Vui lòng đăng nhập để đặt hàng");
      setLoading(false);
      return;
    }

    try {
      const itemsCollection = collection(db, "carts", user.uid, "items");
      const itemsSnapshot = await getDocs(itemsCollection);

      const items = await Promise.all(
        itemsSnapshot.docs.map(async (itemDoc) => {
          const data = itemDoc.data();
          const productDoc = await getDoc(doc(db, "products", data.product_id));
          return {
            id: itemDoc.id,
            ...data,
            product: productDoc.exists() ? productDoc.data() : null,
          };
        })
      );

      setCartItems(items);
      const total = items.reduce(
        (sum, item) => sum + (item.product?.price || 0) * item.quantity,
        0
      );
      setSubtotal(total);
    } catch (error) {
      console.error("Lỗi khi lấy giỏ hàng:", error);
      setError("Có lỗi xảy ra khi lấy giỏ hàng");
      showToast("Có lỗi xảy ra khi lấy giỏ hàng", "danger");
    }
  };

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setShippingInfo((prev) => ({
          ...prev,
          fullName: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
          address: userData.address || "",
        }));
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      showToast("Lỗi khi lấy thông tin người dùng", "danger");
    }
  };

  const fetchValidPromos = async () => {
    try {
      const promoQuery = query(
        collection(db, "promotions"),
        where("is_active", "==", true)
      );
      const promoSnapshot = await getDocs(promoQuery);
      const currentDate = new Date();
      const user = auth.currentUser;

      const validPromos = await Promise.all(
        promoSnapshot.docs.map(async (doc) => {
          const promo = { id: doc.id, ...doc.data() };
          const startDate = new Date(promo.start_date);
          const endDate = new Date(promo.end_date);

          const usageQuery = query(
            collection(db, "promo_usages"),
            where("user_id", "==", user.uid),
            where("promo_code", "==", promo.code)
          );
          const usageSnapshot = await getDocs(usageQuery);
          const usageCount = usageSnapshot.size;
          const remainingUses = promo.max_usage - usageCount;

          return {
            ...promo,
            remainingUses,
            isValid:
              currentDate >= startDate &&
              currentDate <= endDate &&
              subtotal >= promo.min_order_amount &&
              remainingUses > 0,
          };
        })
      );

      setValidPromos(
        validPromos
          .filter((promo) => promo.isValid)
          .sort((a, b) => b.discount_value - a.discount_value)
      );
    } catch (error) {
      console.error("Lỗi khi lấy mã giảm giá hợp lệ:", error);
      showToast("Lỗi khi lấy mã giảm giá hợp lệ", "danger");
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchCart();
      await fetchUserData();
      await fetchValidPromos();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    fetchValidPromos();
  }, [subtotal]);

  const applyPromoCode = async (code = promoCode) => {
    if (!code) {
      showToast("Vui lòng nhập mã giảm giá!", "warning");
      return;
    }

    try {
      const promoQuery = query(
        collection(db, "promotions"),
        where("code", "==", code)
      );
      const promoSnapshot = await getDocs(promoQuery);

      if (promoSnapshot.empty) {
        showToast("Mã giảm giá không hợp lệ!", "danger");
        setPromoCode("");
        return;
      }

      const promoData = promoSnapshot.docs[0].data();
      const currentDate = new Date();
      const startDate = new Date(promoData.start_date);
      const endDate = new Date(promoData.end_date);

      if (!promoData.is_active) {
        showToast("Mã giảm giá đã bị vô hiệu hóa!", "danger");
        setPromoCode("");
        return;
      }

      if (currentDate < startDate || currentDate > endDate) {
        showToast("Mã giảm giá đã hết hạn hoặc chưa bắt đầu!", "danger");
        setPromoCode("");
        return;
      }

      if (subtotal < promoData.min_order_amount) {
        showToast(`Đơn hàng phải có giá trị tối thiểu ${promoData.min_order_amount.toLocaleString()}đ để áp dụng mã này!`, "danger");
        setPromoCode("");
        return;
      }

      const usageQuery = query(
        collection(db, "promo_usages"),
        where("user_id", "==", auth.currentUser.uid),
        where("promo_code", "==", code)
      );
      const usageSnapshot = await getDocs(usageQuery);
      const usageCount = usageSnapshot.size;

      if (usageCount >= promoData.max_usage) {
        showToast(`Bạn đã sử dụng mã ${code} tối đa ${promoData.max_usage} lần!`, "danger");
        setPromoCode("");
        return;
      }

      let discountAmount = 0;
      if (promoData.discount_type === "percentage") {
        discountAmount = (subtotal * promoData.discount_value) / 100;
      } else if (promoData.discount_type === "fixed") {
        discountAmount = promoData.discount_value;
      }

      setPromoState({
        validPromo: {
          code: promoData.code,
          discount_type: promoData.discount_type,
          discount_value: promoData.discount_value,
        },
        discountAmount,
      });
      showToast(`Mã giảm giá ${promoData.code} đã được áp dụng! Giảm ${discountAmount.toLocaleString()}đ`, "success");
      setPromoCode("");
    } catch (error) {
      console.error("Lỗi khi áp dụng mã giảm giá:", error);
      showToast("Đã xảy ra lỗi khi áp dụng mã giảm giá!", "danger");
      setPromoCode("");
    }
  };

  const removePromoCode = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmRemove = () => {
    setPromoState({ validPromo: null, discountAmount: 0 });
    setPromoCode("");
    setShowConfirmModal(false);
    showToast("Mã giảm giá đã được xóa!", "success");
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      showToast("Vui lòng đăng nhập để đặt hàng!", "warning");
      return;
    }

    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
      showToast("Vui lòng điền đầy đủ thông tin giao hàng!", "warning");
      return;
    }

    try {
      const shippingFee = shippingInfo.method === "Express" ? 15000 : 0;
      const finalTotal = subtotal - promoState.discountAmount + shippingFee;

      const orderData = {
        customer_id: user.uid,
        order_date: new Date().toISOString(),
        total_amount: finalTotal,
        status: "Pending",
        order_details: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        promotion_code: promoState.validPromo ? promoState.validPromo.code : null,
        shipping_method: shippingInfo.method,
        shipping_address: shippingInfo.address,
        receiver_name: shippingInfo.fullName,
        phone_number: shippingInfo.phone,
        shipping_fee: shippingFee,
      };

      const orderRef = await addDoc(collection(db, "orders"), orderData);

      if (promoState.validPromo) {
        await addDoc(collection(db, "promo_usages"), {
          user_id: user.uid,
          promo_code: promoState.validPromo.code,
          order_id: orderRef.id,
          used_at: new Date().toISOString(),
        });
      }

      // Xóa giỏ hàng
      const itemsCollection = collection(db, "carts", user.uid, "items");
      const itemsSnapshot = await getDocs(itemsCollection);
      const deletePromises = itemsSnapshot.docs.map((itemDoc) =>
        deleteDoc(doc(db, "carts", user.uid, "items", itemDoc.id))
      );
      await Promise.all(deletePromises);

      // Xóa mã giảm giá
      setPromoState({ validPromo: null, discountAmount: 0 });
      setCartItems([]);
      setSubtotal(0);
      showToast("Đơn hàng đã được đặt thành công!", "success");
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error);
      showToast("Đã xảy ra lỗi khi đặt hàng!", "danger");
    }
  };

  if (loading) return <div className="checkout-container">Đang tải...</div>;

  if (error) {
    return (
      <div className="checkout-container">
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  const shippingFee = shippingInfo.method === "Express" ? 15000 : 0;
  const totalWithShipping = subtotal - promoState.discountAmount + shippingFee;

  return (
    <div className="checkout-container">
      <div className="checkout-grid">
        <div className="shipping-form">
          <h2>Thông tin giao hàng</h2>
          <Form onSubmit={handlePlaceOrder}>
            <Form.Group className="mb-3">
              <Form.Label>Họ và tên người nhận</Form.Label>
              <Form.Control
                type="text"
                required
                value={shippingInfo.fullName}
                onChange={(e) =>
                  setShippingInfo({ ...shippingInfo, fullName: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control
                type="tel"
                required
                value={shippingInfo.phone}
                onChange={(e) =>
                  setShippingInfo({ ...shippingInfo, phone: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Địa chỉ</Form.Label>
              <Form.Control
                type="text"
                required
                value={shippingInfo.address}
                onChange={(e) =>
                  setShippingInfo({ ...shippingInfo, address: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phương thức vận chuyển</Form.Label>
              <Form.Select
                value={shippingInfo.method}
                onChange={(e) =>
                  setShippingInfo({ ...shippingInfo, method: e.target.value })
                }
              >
                <option value="Standard">Standard (Miễn phí)</option>
                <option value="Express">Express (+15.000đ)</option>
              </Form.Select>
            </Form.Group>
            <div className="coupon-section">
              <Form.Control
                type="text"
                placeholder="Mã giảm giá"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={promoState.validPromo !== null}
              />
              {promoState.validPromo ? (
                <Button
                  variant="danger"
                  onClick={removePromoCode}
                  className="remove-coupon-button"
                >
                  Xóa
                </Button>
              ) : (
                <Button
                  variant="danger"
                  onClick={() => applyPromoCode()}
                  className="apply-coupon-button"
                >
                  Áp dụng
                </Button>
              )}
              {promoState.validPromo && (
                <Alert variant="success" className="mt-2">
                  Mã {promoState.validPromo.code} được áp dụng: Giảm {promoState.discountAmount.toLocaleString()}đ (
                  {promoState.validPromo.discount_type === "percentage"
                    ? `${promoState.validPromo.discount_value}%`
                    : `${promoState.validPromo.discount_value.toLocaleString()}đ`})
                </Alert>
              )}
              {validPromos.length > 0 && !promoState.validPromo && (
                <div className="promo-suggestions">
                  <p>Mã giảm giá có sẵn:</p>
                  {validPromos.map((promo) => (
                    <div key={promo.id} className="promo-suggestion-item">
                      <span>
                        {promo.code} - Giảm{" "}
                        {promo.discount_type === "percentage"
                          ? `${promo.discount_value}%`
                          : `${promo.discount_value.toLocaleString()}đ`}{" "}
                        (Đơn tối thiểu: {promo.min_order_amount.toLocaleString()}đ, Còn lại: {promo.remainingUses} lần)
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setPromoCode(promo.code);
                          applyPromoCode();
                        }}
                        className="apply-suggestion-btn"
                      >
                        Áp dụng
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button variant="danger" type="submit" className="place-order-btn">
              Đặt hàng
            </Button>
          </Form>
        </div>

        <div className="order-summary">
          <h2>Order Summary</h2>
          <Table borderless>
            <tbody>
              <tr className="summary-line">
                <td>Tạm tính:</td>
                <td>{subtotal.toLocaleString()}đ</td>
              </tr>
              <tr className="summary-line">
                <td>Giảm giá:</td>
                <td>-{promoState.discountAmount.toLocaleString()}đ</td>
              </tr>
              <tr className="summary-line">
                <td>Phí vận chuyển:</td>
                <td>{shippingFee.toLocaleString()}đ</td>
              </tr>
              <tr className="summary-line total">
                <td><strong>Tổng:</strong></td>
                <td><strong>{totalWithShipping.toLocaleString()}đ</strong></td>
              </tr>
            </tbody>
          </Table>

          <h3 className="cart-items-title">Sản phẩm trong giỏ hàng</h3>
          {cartItems.length === 0 ? (
            <Alert variant="info">Giỏ hàng của bạn đang trống.</Alert>
          ) : (
            <Table striped bordered>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id} className="cart-item">
                    <td>
                      <div className="cart-item-image">
                        {item.product?.image && (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="product-image"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/80";
                            }}
                          />
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="cart-item-details">
                        <div>
                          <strong>{item.product?.name || "Sản phẩm không xác định"}</strong>
                        </div>
                        <div>Giá: {item.product?.price.toLocaleString()}đ</div>
                        <div>Số lượng: {item.quantity}</div>
                        <div>
                          Tổng: {((item.product?.price || 0) * item.quantity).toLocaleString()}đ
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </div>

      {/* Toast Container để hiển thị thông báo */}
      <ToastContainer position="top-end" className="p-3">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            onClose={() => removeToast(toast.id)}
            show={true}
            delay={3000}
            autohide
            bg={toast.variant}
          >
            <Toast.Header>
              <strong className="me-auto">
                {toast.variant === "success" ? "Thành công" : toast.variant === "danger" ? "Lỗi" : "Cảnh báo"}
              </strong>
            </Toast.Header>
            <Toast.Body>{toast.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>

      {/* Bootstrap Modal để xác nhận xóa mã giảm giá */}
      <div className={`modal fade ${showConfirmModal ? "show d-block" : ""}`} tabIndex="-1" style={{ backgroundColor: showConfirmModal ? "rgba(0,0,0,0.5)" : "transparent" }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Xác nhận xóa mã giảm giá</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowConfirmModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              Bạn có muốn xóa mã giảm giá {promoState.validPromo?.code} không?
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmRemove}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;