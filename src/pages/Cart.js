import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { Table, Button, Alert, Form } from "react-bootstrap";
import "../assets/styles/cart.css";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);

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
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [user]);

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
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, "carts", user.uid, "items", itemId));
      setCartItems(cartItems.filter((item) => item.id !== itemId));
    } catch (deleteError) {
      console.error("Lỗi khi xóa sản phẩm:", deleteError);
      setError("Có lỗi xảy ra khi xóa sản phẩm");
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + (item.product?.price || 0) * item.quantity,
      0
    );
  };

  const handleApplyCoupon = () => {
    // In a real application, you would validate the coupon code against a database
    if (couponCode === "DISCOUNT10" && !discountApplied) {
      alert("Mã giảm giá đã được áp dụng!");
      setDiscountApplied(true);
      // You would likely update the total here based on the discount
    } else if (discountApplied) {
      alert("Bạn đã áp dụng mã giảm giá rồi.");
    } else {
      alert("Mã giảm giá không hợp lệ.");
    }
    setCouponCode("");
  };

  const calculateTotal = () => {
    let total = calculateSubtotal();
    if (discountApplied) {
      total *= 0.9; // Example 10% discount
    }
    return total;
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
                  <th>Sản phẩm</th>
                  <th>Giá</th>
                  <th>Số lượng</th>
                  <th>Tổng</th>
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

            <div className="cart-actions-top">
              <Button variant="outline-secondary" onClick={() => navigate("/")}>
                Tiếp tục mua sắm
              </Button>
              <Button variant="primary" onClick={() => /* Handle update cart logic */ {}}>
                Cập nhật giỏ hàng
              </Button>
            </div>

            <div className="coupon-section">
              <Form.Control
                type="text"
                placeholder="Mã giảm giá"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <Button variant="danger" onClick={handleApplyCoupon} className="apply-coupon-button">
                Áp dụng
              </Button>
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
                <span>Free</span> {/* You can make this dynamic */}
              </div>
              {discountApplied && (
                <div className="summary-item discount">
                  <span>Discount (10%):</span>
                  <span>-{(calculateSubtotal() * 0.1).toLocaleString()}đ</span>
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
    </div>
  );
};

export default Cart;