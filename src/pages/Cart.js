import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { Table, Button, Alert } from "react-bootstrap";
import "../assets/styles/cart.css";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      if (!user) {
        setError("Vui lòng đăng nhập để xem giỏ hàng");
        setLoading(false);
        return;
      }

      try {
        // Lấy danh sách sản phẩm trong giỏ hàng
        const itemsCollection = collection(db, "carts", user.uid, "items");
        const itemsSnapshot = await getDocs(itemsCollection);
        
        if (itemsSnapshot.empty) {
          setCartItems([]);
          setLoading(false);
          return;
        }

        // Lấy thông tin chi tiết của từng sản phẩm
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
                id: productDoc.id
              }
            });
          }
        }

        setCartItems(items);
      } catch (error) {
        console.error("Lỗi khi lấy giỏ hàng:", error);
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
        quantity: newQuantity
      });

      setCartItems(cartItems.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng:", error);
      setError("Có lỗi xảy ra khi cập nhật số lượng");
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, "carts", user.uid, "items", itemId));
      setCartItems(cartItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
      setError("Có lỗi xảy ra khi xóa sản phẩm");
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => 
      total + (item.product?.price || 0) * item.quantity, 0
    );
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
    <div className="cart-container">
      <h2>Giỏ hàng của bạn</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      
      {cartItems.length === 0 ? (
        <Alert variant="info">
          Giỏ hàng của bạn đang trống. <Button variant="link" onClick={() => navigate("/")}>Tiếp tục mua sắm</Button>
        </Alert>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Giá</th>
                <th>Số lượng</th>
                <th>Tổng</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="product-info">
                      {item.product?.image && (
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          className="product-image"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/80"; // Ảnh mặc định nếu load lỗi
                          }}
                        />
                      )}
                      <div className="product-details">
                        <h5>{item.product?.name || "Sản phẩm không xác định"}</h5>
                        <p className="text-muted">{item.product?.description || "Không có mô tả"}</p>
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
                      <span className="quantity">{item.quantity}</span>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </td>
                  <td>{((item.product?.price || 0) * item.quantity).toLocaleString()}đ</td>
                  <td>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Xóa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="cart-summary">
            <h4>Tổng cộng: {calculateTotal().toLocaleString()}đ</h4>
            <Button 
              variant="primary" 
              onClick={() => navigate("/checkout")}
            >
              Thanh toán
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;