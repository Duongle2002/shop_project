import React from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const AdminLayout = () => {
  const { t } = useTranslation();

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/admin">{t('admin.dashboard')}</Navbar.Brand>
          <Navbar.Toggle aria-controls="admin-navbar-nav" />
          <Navbar.Collapse id="admin-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/admin/categories">{t('admin.categories.title')}</Nav.Link>
              <Nav.Link as={Link} to="/admin/products">{t('admin.products.title')}</Nav.Link>
              <Nav.Link as={Link} to="/admin/orders">{t('admin.orders.title')}</Nav.Link>
              <Nav.Link as={Link} to="/admin/customers">{t('admin.customers.title')}</Nav.Link>
              <Nav.Link as={Link} to="/admin/reviews">{t('admin.reviews.title')}</Nav.Link>
              <Nav.Link as={Link} to="/admin/promotions">{t('admin.promotions.title')}</Nav.Link>
            </Nav>
            <div className="d-flex align-items-center">
              <LanguageSwitcher />
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="mt-4">
        <Outlet />
      </Container>
    </>
  );
};

export default AdminLayout; 