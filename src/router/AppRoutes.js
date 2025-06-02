import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import ProductDetail from "../pages/ProductDetail";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import Contact from "../pages/Contact";
import About from "../pages/About";
import AdminDashboard from "../pages/admin/AdminDashboard";
import Promotions from "../pages/admin/Promotions";
import ProtectedRoute from "../components/ProtectedRoute";
import Products from "../pages/Products";

const AppRoutes = ({ user }) => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          // <ProtectedRoute user={user}>
            <Home />
          // </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          // <ProtectedRoute user={user}>
            <Products />
          // </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          // <ProtectedRoute user={user}>
            <ProductDetail />
          // </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/contact"
        element={
          <ProtectedRoute user={user}>
            <Contact />
          </ProtectedRoute>
        }
      />
      <Route
        path="/about"
        element={
          // <ProtectedRoute user={user}>
            <About />
        // </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute user={user}>
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute user={user}>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute user={user}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute user={user} requireAdmin={true}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/promotions"
        element={
          <ProtectedRoute user={user} requireAdmin={true}>
            <Promotions />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;