import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Table, Button, Modal, Alert } from "react-bootstrap";
import { auth, db } from "../../config/firebase";
import "../../assets/styles/cartManagement.css";

// Component quản lý giỏ hàng, hiển thị và cho phép admin quản lý giỏ hàng của người dùng
const CartManagement = () => {
  // Khởi tạo các trạng thái (state) để quản lý dữ liệu và giao diện
  const [carts, setCarts] = useState([]); // Danh sách giỏ hàng
  const [users, setUsers] = useState([]); // Danh sách người dùng
  const [products, setProducts] = useState([]); // Danh sách sản phẩm
  const [selectedCart, setSelectedCart] = useState(null); // Giỏ hàng được chọn để xem chi tiết
  const [showModal, setShowModal] = useState(false); // Trạng thái hiển thị modal chi tiết
  const [loading, setLoading] = useState(true); // Trạng thái đang tải dữ liệu
  const [error, setError] = useState(null); // Lưu thông báo lỗi
  const [user] = useAuthState(auth); // Thông tin người dùng hiện tại từ Firebase Auth

  // Hàm lấy dữ liệu từ Firestore
  const fetchData = async () => {
    setLoading(true); // Bắt đầu trạng thái tải dữ liệu
    setError(null); // Xóa lỗi trước đó
    try {
      // Kiểm tra xem người dùng đã đăng nhập chưa
      if (!user) {
        setError("Vui lòng đăng nhập để tiếp tục");
        return;
      }

      // Kiểm tra quyền admin của người dùng
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
          user_id: userData.user_id || doc.id, // Đảm bảo có user_id
          ...userData,
          displayName: userData.username || userData.email?.split('@')[0] || "Người dùng không xác định", // Tên hiển thị mặc định
          email: userData.email || "Chưa có email" // Email mặc định
        };
      });
      setUsers(userData); // Cập nhật danh sách người dùng

      // Lấy danh sách sản phẩm từ Firestore
      const productSnapshot = await getDocs(collection(db, "products"));
      const productData = productSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(productData); // Cập nhật danh sách sản phẩm

      // Lấy danh sách giỏ hàng và các mục trong giỏ
      const cartSnapshot = await getDocs(collection(db, "carts"));
      const cartData = [];
      
      // Duyệt qua từng giỏ hàng để lấy thông tin chi tiết các mục
      for (const cartDoc of cartSnapshot.docs) {
        const itemsSnapshot = await getDocs(collection(db, "carts", cartDoc.id, "items"));
        const items = itemsSnapshot.docs.map((itemDoc) => ({
          id: itemDoc.id,
          ...itemDoc.data(),
        }));
        
        cartData.push({
          id: cartDoc.id,
          ...cartDoc.data(),
          items, // Thêm danh sách các mục vào giỏ hàng
        });
      }
      
      setCarts(cartData); // Cập nhật danh sách giỏ hàng
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
      setError(error.message); // Lưu lỗi để hiển thị
    } finally {
      setLoading(false); // Kết thúc trạng thái tải dữ liệu
    }
  };

  // Gọi fetchData khi component được gắn kết hoặc khi user thay đổi
  useEffect(() => {
    fetchData();
  }, [user]);

  // Hàm xóa một mục khỏi giỏ hàng
  const handleRemoveItem = async (cartId, itemId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng không?")) {
      try {
        // Xóa mục khỏi collection items trong giỏ hàng
        await deleteDoc(doc(db, "carts", cartId, "items", itemId));
        await fetchData(); // Làm mới danh sách giỏ hàng
      } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        setError(error.message); // Lưu lỗi để hiển thị
      }
    }
  };

  // Hàm xóa toàn bộ giỏ hàng
  const handleDeleteCart = async (cartId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa giỏ hàng này không?")) {
      try {
        // Lấy danh sách các mục trong giỏ hàng
        const itemsSnapshot = await getDocs(collection(db, "carts", cartId, "items"));
        // Tạo danh sách promise để xóa từng mục
        const deletePromises = itemsSnapshot.docs.map((itemDoc) =>
          deleteDoc(doc(db, "carts", cartId, "items", itemDoc.id))
        );
        await Promise.all(deletePromises); // Xóa tất cả các mục
        await deleteDoc(doc(db, "carts", cartId)); // Xóa giỏ hàng
        await fetchData(); // Làm mới danh sách giỏ hàng
        setShowModal(false); // Đóng modal
      } catch (error) {
        console.error("Lỗi khi xóa giỏ hàng:", error);
        setError(error.message); // Lưu lỗi để hiển thị
      }
    }
  };

  // Hàm hiển thị chi tiết giỏ hàng trong modal
  const handleViewCart = (cart) => {
    setSelectedCart(cart); // Lưu giỏ hàng được chọn
    setShowModal(true); // Mở modal
  };

  // Hiển thị spinner khi đang tải dữ liệu
  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  // Hiển thị thông báo lỗi nếu có
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  // Giao diện chính của component
  return (
    <div className="cart-management-container">
      <h3>Quản lý giỏ hàng</h3>
      {error && <Alert variant="danger">{error}</Alert>} {/* Hiển thị lỗi nếu có */}
      {/* Bảng hiển thị danh sách giỏ hàng */}
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
            // Tìm thông tin người dùng dựa trên user_id
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
                <td>{new Date(cart.created_at).toLocaleString()}</td> {/* Hiển thị thời gian tạo giỏ hàng */}
                <td>{cart.items.length}</td> {/* Số lượng mục trong giỏ hàng */}
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
              {/* Hiển thị thông tin người dùng trong modal */}
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
              {/* Bảng hiển thị các mục trong giỏ hàng */}
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
                    const product = products.find((p) => p.id === item.product_id); // Tìm sản phẩm tương ứng
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
                        <td>{item.quantity}</td> {/* Số lượng sản phẩm trong mục */}
                        <td>{product ? `$${product.price}` : "N/A"}</td> {/* Giá sản phẩm */}
                        <td>{new Date(item.added_at).toLocaleString()}</td> {/* Thời gian thêm vào giỏ */}
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