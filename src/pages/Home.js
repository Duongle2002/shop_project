import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/home.css';
import HomeBanner from '../assets/images/home.png'; 
import ProductImage from '../assets/images/product-image.png';
import PlayStation from '../assets/images/playstation.png';

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Banner Section */}
      <div className="hero-banner">
        <div className="banner-content">
          <h1 className="banner-title">Limited Time Offer!!</h1>
          <p className="banner-subtitle">Grab your deal before it’s gone!</p>
          <img src={HomeBanner} alt="Banner" className="banner-image" />
          <Link to="/shop" className="banner-btn">Shop Now</Link>
        </div>
      </div>

      {/* Flash Sales Section */}
      <section className="flash-sales">
        <div className="section-header">
          <h2 className="section-title">Flash Sales</h2>
          <div className="timer">
            <span>23</span>:<span>19</span>:<span>52</span>
          </div>
        </div>
        <div className="products-grid">
          <div className="product-card">
            <img src={ProductImage} alt="Gaming Controller" className="product-image" />
            <h3 className="product-title">Gaming Controller</h3>
            <div className="price">
              <span className="current">$29.99</span>
              <span className="original">$49.99</span>
            </div>
            <div className="rating">★★★★☆</div>
            <button className="add-to-cart">Add to Cart</button>
          </div>
          <div className="product-card">
            <img src={ProductImage} alt="Gaming Controller" className="product-image" />
            <h3 className="product-title">Gaming Controller</h3>
            <div className="price">
              <span className="current">$29.99</span>
              <span className="original">$49.99</span>
            </div>
            <div className="rating">★★★★☆</div>
            <button className="add-to-cart">Add to Cart</button>
          </div>
          <div className="product-card">
            <img src={ProductImage} alt="Gaming Controller" className="product-image" />
            <h3 className="product-title">Gaming Controller</h3>
            <div className="price">
              <span className="current">$29.99</span>
              <span className="original">$49.99</span>
            </div>
            <div className="rating">★★★★☆</div>
            <button className="add-to-cart">Add to Cart</button>
          </div>
          <div className="product-card">
            <img src={ProductImage} alt="Gaming Controller" className="product-image" />
            <h3 className="product-title">Gaming Controller</h3>
            <div className="price">
              <span className="current">$29.99</span>
              <span className="original">$49.99</span>
            </div>
            <div className="rating">★★★★☆</div>
            <button className="add-to-cart">Add to Cart</button>
          </div>
          <div className="product-card">
            <img src={ProductImage} alt="Gaming Controller" className="product-image" />
            <h3 className="product-title">Gaming Controller</h3>
            <div className="price">
              <span className="current">$29.99</span>
              <span className="original">$49.99</span>
            </div>
            <div className="rating">★★★★☆</div>
            <button className="add-to-cart">Add to Cart</button>
          </div>
        </div>
      </section>

      {/* New Arrival */}
      <section className="new-arrival">
        <div className="section-header">
          <h2 className="section-title">New Arrivals</h2>
          <Link to="/new-arrivals" className="view-all">View All</Link>
        </div>
        <div className="arrival-grid">
          <div className="arrival-item">
            <img src={PlayStation} alt="PlayStation" className="arrival-image playstation-image" />
            <div className="arrival-content">
              <h3 className="arrival-title">PlayStation 5</h3>
              <p className="arrival-desc">Experience next-gen gaming</p>
              <Link to="/product/playstation-5" className="arrival-btn">Learn More</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;