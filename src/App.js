import React, { useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import AppRoutes from "./router/AppRoutes";
import NavigationBar from "./components/Navbar";
import Footer from "./components/Footer";
import { auth } from "./config/firebase";
import { initAuthSync } from "./hooks/authSync";
import "./App.css"; // Thêm file CSS cho spinner

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuthSync();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Current user:", currentUser);
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Nếu đang loading, hiển thị spinner
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Router>
      <NavigationBar user={user} />
      <AppRoutes user={user} />
      <Footer />
    </Router>
  );
};

export default App;