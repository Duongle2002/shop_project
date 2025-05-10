import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase"; 
import '../assets/styles/home.css';
import HomeBanner from '../assets/images/home.png'; 
import PlayStation from '../assets/images/playstation.png';
import phoneIcon from "../assets/icons/phone.png";
import computerIcon from "../assets/icons/Computer.png";
import smartWatchIcon from "../assets/icons/SmartWatch.png";
import gamepad from "../assets/icons/Gamepad.png";
import headphone from "../assets/icons/Headphone.png";

const categoryData = [
  { name: "Phones", icon: phoneIcon },
  { name: "Computers", icon: computerIcon },
  { name: "SmartWatch", icon: smartWatchIcon },
  { name: "HeadPhone", icon: headphone },
  { name: "GamePad", icon: gamepad },
];

// 👉 FlashSales Component
const FlashSales = () => {
  const endTime = new Date().getTime() + 3600 * 1000;
  const [timeLeft, setTimeLeft] = useState(endTime - new Date().getTime());
  const [products, setProducts] = useState([]);

  const fetchFlashSaleProducts = async () => {
    try {
      const productsQuery = query(
        collection(db, "flash_sales"),
        where("is_deleted", "==", false),
        where("is_active", "==", true),
      );
      console.log("Bắt đầu fetch dữ liệu từ Firestore...");
      const productsSnapshot = await getDocs(productsQuery);
      console.log("Số document tìm thấy:", productsSnapshot.size);
      console.log("Dữ liệu thô:", productsSnapshot.docs.map(doc => doc.data()));
      const productsData = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Dữ liệu đã xử lý:", productsData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching flash sale products:", error);
    }
  };
  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance <= 0) {
        clearInterval(timer);
        setTimeLeft(0);
      } else {
        setTimeLeft(distance);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  // Fetch products effect
  useEffect(() => {
    fetchFlashSaleProducts();
  }, []);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return { hours, minutes, seconds };
  };

  const { hours, minutes, seconds } = formatTime(timeLeft);

  return (
    <section className="flash-sales">
      <div className="section-header">
        <h2 className="section-title">Flash Sales</h2>
        <div className="timer">
          <span>{hours}</span>:<span>{minutes}</span>:<span>{seconds}</span>
        </div>
      </div>
      <div className="products-grid">
        {products.length > 0 ? (
          products.map((product) => (
            <div className="product-card" key={product.id}>
              <img 
                src={product.imageUrl} // Sử dụng imageUrl từ Firestore
                alt={product.name} 
                className="product-image" 
              />
              <h3 className="product-title">{product.name}</h3>
              <div className="price">
                <span className="current">${product.discountedPrice || product.price}</span>
                {product.originalPrice && (
                  <span className="original">${product.originalPrice}</span>
                )}
              </div>
              <div className="rating">{product.rating || '★★★★☆'}</div>
              
              <button className="add-to-cart"><a href='/products'>Shop Now !</a></button>
            </div>
          ))
        ) : (
          <p>No flash sale products available.</p>
        )}
      </div>
      <div className="button-view">
        <button>VIEW ALL PRODUCTS</button>
      </div>
    </section>
  );
};

// 👉 Home Page Component
const Home = () => {
  return (
    <div className="home-container">
      {/* Banner */}
      <div className="simple-carousel">
        <div className="carousel-item active">
          <img
            src={HomeBanner} 
            className="d-block w-100"
            alt="Iphone 14 Pro Max"
          />
        </div>
      </div>
      {/* Categories */}
      <section className="categories">
        <div className="category-list">
          {categoryData.map((category) => (
            <button key={category.name} className="category-item">
              <img src={category.icon} alt={category.name} className="category-icon" />
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {/* Flash Sales */}
      <FlashSales />

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
              {/* <Link to="/product/playstation-5" className="arrival-btn">Learn More</Link> */}
            </div>
          </div>
        </div>
        {/* <div className="button-view">
          <button>VIEW ALL ARRIVALS</button>
        </div> */}
      </section>
    </div>
  );
};

export default Home;