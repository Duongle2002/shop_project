import React from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { Navbar, Nav, NavDropdown, Form, Button, Container, Dropdown, FormControl } from "react-bootstrap";
import { useLanguage } from "../contexts/LanguageContext";
import "../assets/styles/navbar.css";
import { FaSearch, FaHeart, FaShoppingCart } from "react-icons/fa";

const NavigationBar = ({ user }) => {
  const location = useLocation();
  const { currentLanguage, toggleLanguage, t } = useLanguage();

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
      <div className="bg-dark text-white text-center py-2">
        {t('navbar.promotion')}{" "}
        <strong>{t('navbar.shopNow')}</strong>
        <Dropdown align="end" className="d-inline ms-3">
          <Dropdown.Toggle variant="dark" id="dropdown-basic">
            {currentLanguage === 'en' ? 'English' : 'Tiếng Việt'}
          </Dropdown.Toggle>
          {/* <Dropdown.Menu>
            <Dropdown.Item onClick={() => toggleLanguage()}>
              {currentLanguage === 'en' ? 'Tiếng Việt' : 'English'}
            </Dropdown.Item>
          </Dropdown.Menu> */}
        </Dropdown>
      </div>

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
                {t('navbar.home')}
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/products"
                className={location.pathname === "/products" ? "fw-bold" : ""}
              >
                {t('navbar.products')}
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/contact"
                className={location.pathname === "/contact" ? "fw-bold" : ""}
              >
                {t('navbar.contact')}
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/about"
                className={location.pathname === "/about" ? "fw-bold" : ""}
              >
                {t('navbar.about')}
              </Nav.Link>
            </Nav>

            <div className="d-flex align-items-center">
              {/* <Form className="d-flex me-3">
                <FormControl
                  type="search"
                  placeholder={t('navbar.search')}
                  className="me-2"
                />
                <Button variant="outline-secondary">
                  <FaSearch />
                </Button>
              </Form> */}

              <Nav className="me-3">
                <Nav.Link as={Link} to="/wishlist" title={t('navbar.wishlist')}>
                  <FaHeart size={20} />
                </Nav.Link>
              </Nav>

              <Nav className="me-3">
                <Nav.Link as={Link} to="/cart" title={t('navbar.cart')}>
                  <FaShoppingCart size={20} />
                </Nav.Link>
              </Nav>

              {user ? (
                <Dropdown align="end" className="d-inline">
                  <Dropdown.Toggle variant="light" id="dropdown-account">
                    {user.email || t('navbar.account')}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item as={Link} to="/profile">
                      {t('navbar.manageAccount')}
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/orders">
                      {t('navbar.myOrder')}
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/contributions">
                      {t('navbar.myContributions')}
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/reviews">
                      {t('navbar.myReviews')}
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>{t('navbar.logout')}</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <Nav.Link
                  as={Link}
                  to="/register"
                  className={location.pathname === "/register" ? "fw-bold" : ""}
                >
                  {t('navbar.signUp')}
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