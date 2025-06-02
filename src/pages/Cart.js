import React, { useState, useEffect, useContext } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { Table, Button, Alert, Form, Toast, ToastContainer } from "react-bootstrap";
import { PromoContext } from "./PromoContext";
import "../assets/styles/cart.css";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [validPromos, setValidPromos] = useState([]);
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

  // Tính subtotal
  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + (item.product?.price || 0) * item.quantity,
      0
    );
  };

  // Lấy danh sách mã giảm giá hợp lệ
  const fetchValidPromos = async () => {
    try {
      const promoQuery = query(
        collection(db, "promotions"),
        where("is_active", "==", true)
      );
      const promoSnapshot = await getDocs(promoQuery);
      const currentDate = new Date();
      const user = auth.currentUser;
      const subtotal = calculateSubtotal();

      const validPromos = await Promise.all(
        promoSnapshot.docs.map(async (doc) => {
          const promo = { id: doc.id, ...doc.data() };
          const startDate = new Date(promo.start_date);
          const endDate = new Date(promo.end_date);

          // Kiểm tra số lần sử dụng mã
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
    const fetchCart = async () => {
      if (!user) {
        setError("Vui lòng đăng nhập để xem giỏ hàng");
        setLoading(false);
        return;
      }

      try {
        const itemsCollection = collection(db, "carts", user.uid, "items");
        const itemsSnapshot = await getDocs(itemsCollection);

        if (itemsSnapshot.empty) {
          setCartItems([]);
          setLoading(false);
          return;
        }

        const items = [];
        for (const itemDoc of itemsSnapshot.docs) {
          const itemData = itemDoc.data();
          const productDoc = await getDoc(doc(db, "products", itemData.product_id));

          if (productDoc.exists()) {
            const productData = productDoc.data();
            items.push({
              id: itemDoc.id,
              ...itemData,
              product: {
                ...productData,
                id: productDoc.id,
              },
            });
          }
        }

        setCartItems(items);
      } catch (fetchError) {
        console.error("Lỗi khi lấy giỏ hàng:", fetchError);
        setError("Có lỗi xảy ra khi lấy giỏ hàng");
        showToast("Có lỗi xảy ra khi lấy giỏ hàng", "danger");
      } finally {
        setLoading(false);
      }
    };

    const init = async () => {
      await fetchCart();
      await fetchValidPromos();
    };
    init();
  }, [user]);

  useEffect(() => {
    fetchValidPromos();
  }, [cartItems]);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      await updateDoc(doc(db, "carts", user.uid, "items", itemId), {
        quantity: newQuantity,
      });

      setCartItems(cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (updateError) {
      console.error("Lỗi khi cập nhật số lượng:", updateError);
      setError("Có lỗi xảy ra khi cập nhật số lượng");
      showToast("Có lỗi xảy ra khi cập nhật số lượng", "danger");
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, "carts", user.uid, "items", itemId));
      setCartItems(cartItems.filter((item) => item.id !== itemId));
    } catch (deleteError) {
      console.error("Lỗi khi xóa sản phẩm:", deleteError);
      setError("Có lỗi xảy ra khi xóa sản phẩm");
      showToast("Có lỗi xảy ra khi xóa sản phẩm", "danger");
    }
  };

  const handleUpdateCart = async () => {
    try {
      const promises = cartItems.map((item) =>
        updateDoc(doc(db, "carts", user.uid, "items", item.id), {
          quantity: item.quantity,
        })
      );
      await Promise.all(promises);
      showToast("Giỏ hàng đã được cập nhật!", "success");
    } catch (error) {
      console.error("Lỗi khi cập nhật giỏ hàng:", error);
      showToast("Có lỗi khi cập nhật giỏ hàng", "danger");
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) {
      showToast("Vui lòng nhập mã giảm giá!", "warning");
      return;
    }

    if (promoState.validPromo) {
      showToast("Bạn đã áp dụng mã giảm giá rồi. Vui lòng xóa mã hiện tại trước khi áp dụng mã mới.", "warning");
      return;
    }

    try {
      const promoQuery = query(
        collection(db, "promotions"),
        where("code", "==", couponCode)
      );
      const promoSnapshot = await getDocs(promoQuery);

      if (promoSnapshot.empty) {
        showToast("Mã giảm giá không hợp lệ!", "danger");
        setCouponCode("");
        return;
      }

      const promoData = promoSnapshot.docs[0].data();
      const currentDate = new Date();
      const startDate = new Date(promoData.start_date);
      const endDate = new Date(promoData.end_date);

      if (!promoData.is_active) {
        showToast("Mã giảm giá đã bị vô hiệu hóa!", "danger");
        setCouponCode("");
        return;
      }

      if (currentDate < startDate || currentDate > endDate) {
        showToast("Mã giảm giá đã hết hạn hoặc chưa bắt đầu!", "danger");
        setCouponCode("");
        return;
      }

      const subtotal = calculateSubtotal();
      if (subtotal < promoData.min_order_amount) {
        showToast(`Đơn hàng phải có giá trị tối thiểu ${promoData.min_order_amount.toLocaleString()}đ để áp dụng mã này!`, "danger");
        setCouponCode("");
        return;
      }

      const usageQuery = query(
        collection(db, "promo_usages"),
        where("user_id", "==", user.uid),
        where("promo_code", "==", couponCode)
      );
      const usageSnapshot = await getDocs(usageQuery);
      const usageCount = usageSnapshot.size;

      if (usageCount >= promoData.max_usage) {
        showToast(`Bạn đã sử dụng mã ${couponCode} tối đa ${promoData.max_usage} lần!`, "danger");
        setCouponCode("");
        return;
      }

      let discount = 0;
      if (promoData.discount_type === "percentage") {
        discount = (subtotal * promoData.discount_value) / 100;
      } else if (promoData.discount_type === "fixed") {
        discount = promoData.discount_value;
      }

      const promoToSave = {
        code: promoData.code,
        discount_type: promoData.discount_type,
        discount_value: promoData.discount_value,
      };
      setPromoState({
        validPromo: promoToSave,
        discountAmount: discount,
      });
      showToast(`Mã giảm giá ${promoData.code} đã được áp dụng! Giảm ${discount.toLocaleString()}đ`, "success");
      setCouponCode("");
    } catch (error) {
      console.error("Lỗi khi áp dụng mã giảm giá:", error);
      showToast("Đã xảy ra lỗi khi áp dụng mã giảm giá!", "danger");
      setCouponCode("");
    }
  };

  const removePromoCode = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmRemove = () => {
    setPromoState({ validPromo: null, discountAmount: 0 });
    setShowConfirmModal(false);
    showToast("Mã giảm giá đã được xóa!", "success");
  };

  const calculateTotal = () => {
    return calculateSubtotal() - promoState.discountAmount;
  };

  if (loading) {
    return <div className="cart-container">Đang tải giỏ hàng...</div>;
  }

  if (!user) {
    return (
      <div className="cart-container">
        <Alert variant="warning">
          Vui lòng <Button variant="link" onClick={() => navigate("/login")}>đăng nhập</Button> để xem giỏ hàng
        </Alert>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h2>Giỏ hàng của bạn</h2>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}

      {cartItems.length === 0 ? (
        <Alert variant="info">
          Giỏ hàng của bạn đang trống. <Button variant="link" onClick={() => navigate("/")}>Tiếp tục mua sắm</Button>
        </Alert>
      ) : (
        <div className="cart-grid">
          <div className="cart-items-section">
            <Table striped bordered responsive>
              <thead>
                <tr>
                  <th>Products</th>
                  <th>Value</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="product-row">
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
                        <div className="product-details">
                          <h6 className="product-name">{item.product?.name || "Sản phẩm không xác định"}</h6>
                        </div>
                      </div>
                    </td>
                    <td>{item.product?.price?.toLocaleString() || 0}đ</td>
                    <td>
                      <div className="quantity-controls">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <Form.Control
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value, 10);
                            if (!isNaN(newQuantity) && newQuantity > 0) {
                              handleUpdateQuantity(item.id, newQuantity);
                            }
                          }}
                          className="quantity-input"
                        />
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </td>
                    <td>
                      {((item.product?.price || 0) * item.quantity).toLocaleString()}đ
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="remove-item-button"
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="cart-actions-top d-flex justify-content-between">
              <Button variant="outline-secondary" onClick={() => navigate("/")}>
                Continue shopping
              </Button>
              <Button variant="primary" onClick={handleUpdateCart}>
                Update shopping cart
              </Button>
            </div>

            <div className="coupon-section">
              <Form.Control
                type="text"
                placeholder="Mã giảm giá"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
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
                  onClick={handleApplyCoupon}
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
                          setCouponCode(promo.code);
                          handleApplyCoupon();
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
          </div>

          <div className="cart-summary-section">
            <div className="cart-total-box">
              <h3>Cart Total</h3>
              <div className="summary-item">
                <span>Subtotal:</span>
                <span>{calculateSubtotal().toLocaleString()}đ</span>
              </div>
              <div className="summary-item">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              {promoState.validPromo && (
                <div className="summary-item discount">
                  <span>Discount ({promoState.validPromo.code}):</span>
                  <span>-{promoState.discountAmount.toLocaleString()}đ</span>
                </div>
              )}
              <div className="summary-item total">
                <span>Total:</span>
                <span>{calculateTotal().toLocaleString()}đ</span>
              </div>
              <Button variant="danger" onClick={() => navigate("/checkout")} className="checkout-button">
                Proceed to checkout
              </Button>
            </div>
          </div>
        </div>
      )}

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

export default Cart;