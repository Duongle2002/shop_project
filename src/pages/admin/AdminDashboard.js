import React, { useState } from "react";
import { Container, Row, Col, Nav, Navbar } from "react-bootstrap";
import ProductManagement from "./ProductManagement";
import CategoryManagement from "./CategoryManagement";
import CustomerManagement from "./CustomerManagement";
import OrderManagement from "./OrderManagement";
import CartManagement from "./CartManagement";
import Promotions from "./Promotions";
import UserManagement from "./UserManagement";
import ShippingManagement from "./ShippingManagement";
import InventoryLogManagement from "./InventoryLogManagement";
import ProductReviewManagement from "./ProductReviewManagement";
import MessageManagement from "./MessageManagement"; // Import component mới

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("products"); // Mặc định hiển thị Product Management

  // Hàm render nội dung dựa trên section được chọn
  const renderContent = () => {
    switch (activeSection) {
      case "products":
        return <ProductManagement />;
      case "categories":
        return <CategoryManagement />;
      case "customers":
        return <CustomerManagement />;
      case "orders":
        return <OrderManagement />;
      case "carts":
        return <CartManagement />;
      case "promotions":
        return <Promotions />;
      case "users":
        return <UserManagement />;
      case "shipping":
        return <ShippingManagement />;
      case "inventory-logs":
        return <InventoryLogManagement />;
      case "reviews":
        return <ProductReviewManagement />;
      case "messages": // Thêm case cho messages
        return <MessageManagement />;
      default:
        return <div>Chọn một mục từ menu để xem nội dung</div>;
    }
  };

  return (
    <>
    <style>
        {`
          .nav-link.active {
            background-color: #007bff;
            color: white !important;
            font-weight: bold;
            border-radius: 5px;
          }
          .nav-link {
            color: #333;
            transition: all 0.3s ease;
          }
          .nav-link:hover {
            background-color: #f8f9fa;
            color: #007bff;
          }
          .nav-link.border-bottom {
            border-bottom: 1px solid #dee2e6;
          }
          .nav-link.active.border-bottom {
            border-bottom: none;
          }
        `}
      </style>
    <>
      <Row>
        {/* Sidebar bên trái */}
        <Col md={2} lg={2} className="bg-light vh-100 p-3" style={{ position: "sticky", top: 0 }}>
          <h2 className="mb-4">Admin Dashboard</h2>
          <Nav className="flex-column">
            <Nav.Link
              eventKey="products"
              onClick={() => setActiveSection("products")}
              active={activeSection === "products"}
              className="border-bottom"
            >
              Product Management
            </Nav.Link>
            <Nav.Link
              eventKey="categories"
              onClick={() => setActiveSection("categories")}
              active={activeSection === "categories"}
              className="border-bottom"
            >
              Category Management
            </Nav.Link>
            <Nav.Link
              eventKey="customers"
              onClick={() => setActiveSection("customers")}
              active={activeSection === "customers"}
              className="border-bottom"
            >
              Customer Management
            </Nav.Link>
            <Nav.Link
              eventKey="orders"
              onClick={() => setActiveSection("orders")}
              active={activeSection === "orders"}
              className="border-bottom"
            >
              Order Management
            </Nav.Link>
            <Nav.Link
              eventKey="carts"
              onClick={() => setActiveSection("carts")}
              active={activeSection === "carts"}
              className="border-bottom"
            >
              Cart Management
            </Nav.Link>
            <Nav.Link
              eventKey="promotions"
              onClick={() => setActiveSection("promotions")}
              active={activeSection === "promotions"}
              className="border-bottom"
            >
              Promotion Management
            </Nav.Link>
            <Nav.Link
              eventKey="users"
              onClick={() => setActiveSection("users")}
              active={activeSection === "users"}
              className="border-bottom"
            >
              User Management
            </Nav.Link>
            <Nav.Link
              eventKey="shipping"
              onClick={() => setActiveSection("shipping")}
              active={activeSection === "shipping"}
              className="border-bottom"
            >
              Shipping Management
            </Nav.Link>
            <Nav.Link
              eventKey="inventory-logs"
              onClick={() => setActiveSection("inventory-logs")}
              active={activeSection === "inventory-logs"}
              className="border-bottom"
            >
              Inventory Log Management
            </Nav.Link>
            <Nav.Link
              eventKey="reviews"
              onClick={() => setActiveSection("reviews")}
              active={activeSection === "reviews"}
              className="border-bottom"
            >
              Product Review Management
            </Nav.Link>
            <Nav.Link
              eventKey="messages"
              onClick={() => setActiveSection("messages")}
              active={activeSection === "messages"}
              className="border-bottom"
            >
              Message Management
            </Nav.Link>
          </Nav>
        </Col>

        {/* Nội dung bên phải */}
        <Col md={10} lg={10} className="p-1">
          {renderContent()}
        </Col>
      </Row>
    </>
    </>
  );
};

export default AdminDashboard;