import React from "react";
import { Container, Navbar, Nav, Form, FormControl, Button, Dropdown } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { FaSearch, FaHeart, FaShoppingCart } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";

const NavigationBar = ({ user }) => {
  const location = useLocation();

  // Hàm xử lý đăng xuất
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully!");
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <>
      {/* Thanh thông báo khuyến mãi */}
      <div className="bg-dark text-white text-center py-2">
        Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%!{" "}
        <strong>ShopNow</strong>
        <Dropdown align="end" className="d-inline ms-3">
          <Dropdown.Toggle variant="dark" id="dropdown-basic">
            English
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item href="#">English</Dropdown.Item>
            <Dropdown.Item href="#">Vietnamese</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* Navbar chính */}
      <Navbar bg="light" expand="lg" className="shadow-sm py-3">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold fs-4">
            Exclusive
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav">
            <Nav className="mx-auto">
              <Nav.Link
                as={Link}
                to="/"
                className={location.pathname === "/" ? "fw-bold" : ""}
              >
                Home
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/products"
                className={location.pathname === "/products" ? "fw-bold" : ""}
              >
                Products
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/contact"
                className={location.pathname === "/contact" ? "fw-bold" : ""}
              >
                Contact
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/about"
                className={location.pathname === "/about" ? "fw-bold" : ""}
              >
                About
              </Nav.Link>
            </Nav>

            {/* Phần bên phải: Tìm kiếm, Tym, Cart, User */}
            <div className="d-flex align-items-center">
              {/* Thanh tìm kiếm */}
              <Form className="d-flex me-3">
                <FormControl
                  type="search"
                  placeholder="What are you looking for?"
                  className="me-2"
                />
                <Button variant="outline-secondary">
                  <FaSearch />
                </Button>
              </Form>

              {/* Biểu tượng Tym (Wishlist) */}
              <Nav className="me-3">
                <Nav.Link as={Link} to="/wishlist">
                  <FaHeart size={20} />
                </Nav.Link>
              </Nav>

              {/* Biểu tượng Cart */}
              <Nav className="me-3">
                <Nav.Link as={Link} to="/cart">
                  <FaShoppingCart size={20} />
                </Nav.Link>
              </Nav>

              {/* Dropdown tài khoản người dùng (hiển thị khi đã đăng nhập) */}
              {user ? (
                <Dropdown align="end" className="d-inline">
                  <Dropdown.Toggle variant="light" id="dropdown-account">
                    {user.email || "Account"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item as={Link} to="/profile">
                      Manage My Account
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/orders">
                      My Order
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/contributions">
                      My Contributions
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/reviews">
                      My Reviews
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <Nav.Link
                  as={Link}
                  to="/register"
                  className={location.pathname === "/register" ? "fw-bold" : ""}
                >
                  Sign Up
                </Nav.Link>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      
    </>
  );
};

export default NavigationBar;