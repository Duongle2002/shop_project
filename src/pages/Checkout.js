import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, getDoc, doc, query, where, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../config/firebase";
import "../assets/styles/checkout.css";

const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    method: "Standard",
  });
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    const user = auth.currentUser;
    if (!user) return;
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
  };

  const fetchOrderHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(
      collection(db, "orders"),
      where("customer_id", "==", user.uid),
      orderBy("order_date", "desc"),
      limit(3)
    );
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setOrderHistory(orders);
  };

  useEffect(() => {
    const init = async () => {
      await fetchCart();
      await fetchOrderHistory();
      setLoading(false);
    };
    init();
  }, []);

  const applyPromoCode = () => {
    if (promoCode === "DISCOUNT10") {
      setDiscount(subtotal * 0.1);
      alert("Mã giảm giá đã được áp dụng!");
    } else {
      alert("Mã giảm giá không hợp lệ");
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const shippingFee = shippingInfo.method === "Express" ? 15000 : 0;
    const finalTotal = subtotal - discount + shippingFee;

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
      promotion_code: promoCode || null,
      shipping_method: shippingInfo.method,
      shipping_address: shippingInfo.address,
      receiver_name: shippingInfo.fullName,
      phone_number: shippingInfo.phone,
      shipping_fee: shippingFee,
    };

    await addDoc(collection(db, "orders"), orderData);
    await fetchOrderHistory();
    alert("Đơn hàng đã được đặt thành công!");
  };

  if (loading) return <p>Loading...</p>;

  const shippingFee = shippingInfo.method === "Express" ? 15000 : 0;
  const totalWithShipping = subtotal - discount + shippingFee;

  return (
    <div className="checkout-container">
      <div className="checkout-grid">
        <div className="shipping-form">
          <h2>Thông tin giao hàng</h2>
          <form onSubmit={handlePlaceOrder}>
            <label>Họ và tên người nhận:</label>
            <input
              type="text"
              required
              value={shippingInfo.fullName}
              onChange={(e) =>
                setShippingInfo({ ...shippingInfo, fullName: e.target.value })
              }
            />
            <label>Số điện thoại:</label>
            <input
              type="tel"
              required
              value={shippingInfo.phone}
              onChange={(e) =>
                setShippingInfo({ ...shippingInfo, phone: e.target.value })
              }
            />
            <label>Địa chỉ:</label>
            <input
              type="text"
              required
              value={shippingInfo.address}
              onChange={(e) =>
                setShippingInfo({ ...shippingInfo, address: e.target.value })
              }
            />
            <label>Phương thức vận chuyển:</label>
            <select
              value={shippingInfo.method}
              onChange={(e) =>
                setShippingInfo({ ...shippingInfo, method: e.target.value })
              }
            >
              <option value="Standard">Standard (Miễn phí)</option>
              <option value="Express">Express (+15.000đ)</option>
            </select>
            <label>Mã giảm giá:</label>
            <div className="promo-input">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
              />
              <button type="button" onClick={applyPromoCode}>
                Áp dụng
              </button>
            </div>
            <button className="place-order-btn" type="submit">
              Đặt hàng
            </button>
          </form>
        </div>

        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-line">
            <span>Tạm tính:</span>
            <span>{subtotal.toLocaleString()}đ</span>
          </div>
          <div className="summary-line">
            <span>Giảm giá:</span>
            <span>-{discount.toLocaleString()}đ</span>
          </div>
          <div className="summary-line">
            <span>Phí vận chuyển:</span>
            <span>{shippingFee.toLocaleString()}đ</span>
          </div>
          <div className="summary-line total">
            <strong>Tổng:</strong>
            <strong>{totalWithShipping.toLocaleString()}đ</strong>
          </div>

          <h3 className="order-history-title">3 đơn hàng gần nhất</h3>
          {orderHistory.map((order) => (
            <div key={order.id} className="order-item">
              <div>
                <strong>Mã đơn:</strong> {order.id}
              </div>
              <div>
                <strong>Ngày:</strong> {new Date(order.order_date).toLocaleString()}
              </div>
              <div>
                <strong>Tổng tiền:</strong> {order.total_amount.toLocaleString()}đ
              </div>
              <div>
                <strong>Trạng thái:</strong> {order.status}
              </div>
              <hr />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
