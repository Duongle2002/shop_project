import React, { useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import AppRoutes from "./router/AppRoutes";
import NavigationBar from "./components/Navbar";
import Footer from "./components/Footer";
import { auth } from "./config/firebase"; // Đảm bảo đường dẫn đúng đến file firebase.js
import { initAuthSync } from "./hooks/authSync";
import { LanguageProvider } from "./contexts/LanguageContext";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Thêm trạng thái loading

  useEffect(() => {
    // Khởi tạo đồng bộ người dùng
    initAuthSync();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Current user:", currentUser); // Kiểm tra user
      setUser(currentUser);
      setLoading(false); // Đặt loading thành false sau khi xác nhận trạng thái đăng nhập
    });
    return () => unsubscribe();
  }, []);

  // Nếu đang loading, hiển thị màn hình chờ
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <LanguageProvider>
      <Router>
        <NavigationBar user={user} />
        <AppRoutes user={user} />
        <Footer />
      </Router>
    </LanguageProvider>
  );
};

export default App;