import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, getDoc, query, orderBy, limit, startAfter } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../config/firebase";
import { Table, Button, Pagination, Alert } from "react-bootstrap";
// import "../../assets/styles/shippingManagement.css"; // Giả sử bạn có file CSS riêng

const ShippingManagement = () => {
  const [shippings, setShippings] = useState([]);
  const [page, setPage] = useState(1);
  const [lastDoc, setLastDoc] = useState(null); // Để phân trang Firestore
  const [totalDocs, setTotalDocs] = useState(0); // Tổng số tài liệu
  const itemsPerPage = 5;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchShippings = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!user) {
          setError("Vui lòng đăng nhập để tiếp tục");
          return;
        }

        // Kiểm tra quyền admin
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists() || userDoc.data().role !== "admin") {
          setError("Bạn cần có quyền admin để truy cập trang này");
          return;
        }

        // Đếm tổng số tài liệu
        const totalSnapshot = await getDocs(collection(db, "shippings"));
        setTotalDocs(totalSnapshot.size);

        // Truy vấn phân trang
        let shippingQuery = query(
          collection(db, "shippings"),
          orderBy("order_id"),
          limit(itemsPerPage)
        );

        if (page > 1 && lastDoc) {
          shippingQuery = query(
            collection(db, "shippings"),
            orderBy("order_id"),
            startAfter(lastDoc),
            limit(itemsPerPage)
          );
        }

        const snapshot = await getDocs(shippingQuery);
        const shippingData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setShippings(shippingData);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]); // Lưu tài liệu cuối cùng cho phân trang
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu vận chuyển:", error.message, error.code, error.stack);
        setError(`Đã xảy ra lỗi: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (user !== null && user !== undefined) {
      fetchShippings();
    }
  }, [user, page]);

  const handleUpdateShipping = async (shippingId, updatedData) => {
    try {
      await updateDoc(doc(db, "shippings", shippingId), updatedData);
      setShippings(
        shippings.map((s) =>
          s.id === shippingId ? { ...s, ...updatedData } : s
        )
      );
      alert("Cập nhật trạng thái vận chuyển thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật vận chuyển:", error.message, error.code, error.stack);
      setError(`Đã xảy ra lỗi: ${error.message}`);
    }
  };

  const totalPages = Math.ceil(totalDocs / itemsPerPage);

  if (loading) return <div className="loading">Đang tải...</div>;

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="container my-5">
      <h3>Quản lý vận chuyển</h3>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID Đơn hàng</th>
            <th>Phương thức vận chuyển</th>
            <th>Chi phí vận chuyển</th>
            <th>Địa chỉ giao hàng</th>
            <th>Trạng thái</th>
            <th>Mã theo dõi</th>
            <th>Ngày giao</th>
            <th>Ngày đến</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {shippings.map((shipping) => (
            <tr key={shipping.id}>
              <td>{shipping.order_id || "N/A"}</td>
              <td>{shipping.shipping_method || "Chưa xác định"}</td>
              <td>{shipping.shipping_cost ? `${shipping.shipping_cost.toLocaleString()}₫` : "Miễn phí"}</td>
              <td>{shipping.shipping_address || "N/A"}</td>
              <td>
                <span
                  className={`badge bg-${
                    shipping.status === "Delivered"
                      ? "success"
                      : shipping.status === "Shipped"
                      ? "warning"
                      : "secondary"
                  }`}
                >
                  {shipping.status === "Delivered"
                    ? "Đã giao"
                    : shipping.status === "Shipped"
                    ? "Đang giao"
                    : "Chưa giao"}
                </span>
              </td>
              <td>{shipping.tracking_number || "Chưa có"}</td>
              <td>
                {shipping.shipped_date
                  ? new Date(shipping.shipped_date).toLocaleDateString("vi-VN")
                  : "Chưa giao"}
              </td>
              <td>
                {shipping.delivered_date
                  ? new Date(shipping.delivered_date).toLocaleDateString("vi-VN")
                  : "Chưa đến"}
              </td>
              <td>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() =>
                    handleUpdateShipping(shipping.id, {
                      status: "Shipped",
                      tracking_number:
                        "TRK" + Math.random().toString(36).substr(2, 9),
                      shipped_date: new Date().toISOString(),
                    })
                  }
                  disabled={shipping.status === "Shipped" || shipping.status === "Delivered"}
                >
                  Đánh dấu đã giao
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  className="ms-2"
                  onClick={() =>
                    handleUpdateShipping(shipping.id, {
                      status: "Delivered",
                      delivered_date: new Date().toISOString(),
                    })
                  }
                  disabled={shipping.status === "Delivered"}
                >
                  Đánh dấu đã đến
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination>
        <Pagination.Prev
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        />
        {[...Array(totalPages).keys()].map((p) => (
          <Pagination.Item
            key={p + 1}
            active={p + 1 === page}
            onClick={() => setPage(p + 1)}
          >
            {p + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        />
      </Pagination>
    </div>
  );
};

export default ShippingManagement;