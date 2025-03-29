import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase"; // Đảm bảo đường dẫn đúng đến file firebase.js
const ProtectedRoute = ({ user, children, requireAdmin = false }) => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        console.log("User UID:", user.uid); // Kiểm tra UID
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            console.log("User data:", userDoc.data()); // Kiểm tra dữ liệu user
            setUserRole(userDoc.data().role);
          } else {
            console.log("User not found in Firestore");
            setUserRole("customer"); // Gán mặc định là customer nếu không tìm thấy
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole("customer"); // Gán mặc định nếu có lỗi
        }
      } else {
        console.log("No user logged in");
      }
      setLoading(false);
    };
    fetchUserRole();
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Nếu user chưa đăng nhập, chuyển hướng đến trang login
  if (!user) {
    console.log("Redirecting to login because user is not logged in");
    return <Navigate to="/login" replace />;
  }

  // Nếu user là admin và không ở trang admin, chuyển hướng đến trang admin
  if (userRole === "admin" && location.pathname !== "/admin" && location.pathname !== "/admin/promotions") {
    alert("Welcome Admin! Redirecting to Admin Dashboard...");
    return <Navigate to="/admin" replace />;
  }

  // Nếu route yêu cầu quyền admin và user không phải admin, chuyển hướng về trang chủ
  if (requireAdmin && userRole !== "admin") {
    console.log("Redirecting to / because user is not admin");
    return <Navigate to="/" replace />;
  }

  // Hiển thị nội dung của route
  return children;
};

export default ProtectedRoute;