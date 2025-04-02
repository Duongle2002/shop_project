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
      default:
        return <div>Chọn một mục từ menu để xem nội dung</div>;
    }
  };

  return (
    <Container>
      <Row>
        {/* Sidebar bên trái */}
        <Col md={3} lg={3} className="bg-light vh-100 p-3" style={{ position: "sticky", top: 0 }}>
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
          </Nav>
        </Col>

        {/* Nội dung bên phải */}
        <Col md={9} lg={9} className="p-3">
          {renderContent()}
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;