import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/home.css';
import HomeBanner from '../assets/images/home.png'; 
import ProductImage from '../assets/images/product-image.png';
import PlayStation from '../assets/images/playstation.png';
import { MDBCarousel, MDBCarouselItem, MDBCarouselCaption } from 'mdb-react-ui-kit';

import phoneIcon from "../assets/icons/phone.png";
import computerIcon from "../assets/icons/Computer.png";
import smartWatchIcon from "../assets/icons/SmartWatch.png";
import cameraIcon from "../assets/icons/Camera.png";
import gamepad from "../assets/icons/Gamepad.png";
import headphone from "../assets/icons/Headphone.png";
const categoryData = [
  { name: "Phones", icon: phoneIcon },
  { name: "Computers", icon: computerIcon },
  { name: "SmartWatch", icon: smartWatchIcon },
  { name: "HeadPhone", icon: headphone },
  { name: "GamePad", icon: gamepad },
];

const Home = () => {
  return (
    <div className="home-container">
      {/* Carousel Section */}
      <MDBCarousel showIndicators showControls fade>
        <MDBCarouselItem itemId={1}>
          <img src={HomeBanner} className="d-block w-100" alt="First Slide" />
          <MDBCarouselCaption>
            <h5>IPHONE 14 PROMAX</h5>
            <p>Đẳng Cấp Làm Nên Thương Hiệu</p>
          </MDBCarouselCaption>
        </MDBCarouselItem>
      </MDBCarousel>
      
      {/* Browse By Category */}
      <section className="categories">
        <h2 className="section-title">Browse By Category</h2>
        <div className="category-list">
          {categoryData.map((category) => (
            <button key={category.name} className="category-item">
              <img src={category.icon} alt={category.name} className="category-icon" />
              {category.name}
            </button>
          ))}
        </div>
      </section>
      <br />

      {/* Flash Sales Section */}
      <section className="flash-sales">
        <div className="section-header">
          <h2 className="section-title">Flash Sales</h2>
          <div className="timer">
            <span>23</span>:<span>19</span>:<span>52</span>
          </div>
        </div>
        <div className="products-grid">
          {[...Array(5)].map((_, index) => (
            <div className="product-card" key={index}>
              <img src={ProductImage} alt="Gaming Controller" className="product-image" />
              <h3 className="product-title">Gaming Controller</h3>
              <div className="price">
                <span className="current">$29.99</span>
                <span className="original">$49.99</span>
              </div>
              <div className="rating">★★★★☆</div>
              <button className="add-to-cart">Add to Cart</button>
            </div>
          ))}
        </div>
        <div className='button-view'><button >VIEW ALL PRODUCTS</button></div>
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
        <div className='button-view'><button >VIEW ALL ARRIVALS</button></div>
      </section>
      
    </div>
  );
};

export default Home;
