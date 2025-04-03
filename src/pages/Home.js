import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import ProductCard from "../components/ProductCard";
import "../assets/styles/home.css";
import HomeBanner from "../assets/images/home.png";
import PlayStation from "../assets/images/playstation.png";
import { MDBCarousel, MDBCarouselItem, MDBCarouselCaption } from 'mdb-react-ui-kit';

const Home = () => {
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);

  // Lấy dữ liệu từ Firestore
  const fetchProducts = async () => {
    try {
      // Lấy sản phẩm cho Flash Sales (có thể lọc theo điều kiện, ví dụ: giá giảm)
      const flashSaleQuery = query(
        collection(db, "products"),
        where("is_deleted", "==", false),
        where("is_active", "==", true)
      );
      const flashSaleSnapshot = await getDocs(flashSaleQuery);
      const flashSaleData = flashSaleSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFlashSaleProducts(flashSaleData.slice(0, 5)); // Lấy 5 sản phẩm đầu tiên

      // Lấy sản phẩm mới (có thể lọc theo created_at mới nhất)
      const newArrivalQuery = query(
        collection(db, "products"),
        where("is_deleted", "==", false),
        where("is_active", "==", true)
      );
      const newArrivalSnapshot = await getDocs(newArrivalQuery);
      const newArrivalData = newArrivalSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNewArrivals(newArrivalData.slice(0, 1)); // Lấy 1 sản phẩm mới nhất
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="home-container">

      {/* Carousel Section */}
      <MDBCarousel showIndicators showControls fade>
        <MDBCarouselItem itemId={1}>
          <img
            src={HomeBanner}
            className="d-block w-100"
            alt="First Slide"
          />
          <MDBCarouselCaption>
            <h5>IPHONE 14 PROMAX</h5>
            <p>Đẳng Cấp Làm Nên Thương Hiệu</p>
          </MDBCarouselCaption>
        </MDBCarouselItem>

        <MDBCarouselItem itemId={2}>
          <img
            src="https://mdbootstrap.com/img/Photos/Slides/img%20(22).jpg"
            className="d-block w-100"
            alt="Second Slide"
          />
          <MDBCarouselCaption>
            <h5>Màn Hình AMOLED THIÊN HÀ</h5>
            <p>Tận Hưởng Từng Phút Giây Sống Động</p>
          </MDBCarouselCaption>
        </MDBCarouselItem>

        <MDBCarouselItem itemId={3}>
          <img
            src="https://mdbootstrap.com/img/Photos/Slides/img%20(23).jpg"
            className="d-block w-100"
            alt="Third Slide"
          />
          <MDBCarouselCaption>
            <h5>ENJOY A DAY</h5>
            <p>Thư Giãn Với Dế Yêu Của Bạn</p>
          </MDBCarouselCaption>
        </MDBCarouselItem>
      </MDBCarousel>

      {/* Flash Sales Section */}
      <section className="flash-sales">
        <div className="section-header">
          <h2 className="section-title">Flash Sales</h2>
          <div className="timer">
            <span>23</span>:<span>19</span>:<span>52</span>
          </div>
        </div>
        <div className="products-grid">
          {flashSaleProducts.length > 0 ? (
            flashSaleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <p>No products available for Flash Sales.</p>
          )}
        </div>
      </section>

      {/* New Arrival Section */}
      <section className="new-arrival">
        <div className="section-header">
          <h2 className="section-title">New Arrivals</h2>
          <Link to="/new-arrivals" className="view-all">
            View All
          </Link>
        </div>
        <div className="arrival-grid">
          {newArrivals.length > 0 ? (
            newArrivals.map((product) => (
              <div key={product.id} className="arrival-item">
                <img
                  src={product.image_url || PlayStation}
                  alt={product.name}
                  className="arrival-image playstation-image"
                />
                <div className="arrival-content">
                  <h3 className="arrival-title">{product.name}</h3>
                  <p className="arrival-desc">Experience next-gen gaming</p>
                  <Link to={`/product/${product.id}`} className="arrival-btn">
                    Learn More
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p>No new arrivals available.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
