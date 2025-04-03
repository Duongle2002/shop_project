import React from "react";
import { FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

const About = () => {
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      maxWidth: "1000px",
      margin: "0 auto",
      padding: "20px",
    },
    section: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      marginBottom: "30px",
    },
    textSection: {
      width: "50%",
      textAlign: "left",
    },
    heading: {
      fontSize: "28px",
      fontWeight: "bold",
      marginBottom: "15px",
    },
    paragraph: {
      fontSize: "16px",
      color: "#555",
      lineHeight: "1.5",
      marginBottom: "10px",
    },
    imageSection: {
      width: "50%",
      display: "flex",
      justifyContent: "center",
    },
    image: {
      maxWidth: "100%",
      height: "auto",
      borderRadius: "8px",
      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    },
    statsContainer: {
      display: "flex",
      justifyContent: "space-between",
      width: "100%",
    },
    statCard: (highlight = false) => ({
      width: "23%",
      padding: "20px",
      textAlign: "center",
      borderRadius: "8px",
      backgroundColor: highlight ? "#E74C3C" : "#fff",
      color: highlight ? "#fff" : "#333",
      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
      border: highlight ? "none" : "1px solid #ddd",
    }),
    icon: {
      fontSize: "30px",
      marginBottom: "10px",
    },
    statNumber: {
      fontSize: "22px",
      fontWeight: "bold",
    },
    statText: {
      fontSize: "14px",
    },
    teamContainer: {
      display: "flex",
      justifyContent: "space-between",
      width: "100%",
      marginTop: "40px",
    },
    teamCard: {
      width: "30%",
      textAlign: "center",
      borderRadius: "8px",
      padding: "15px",
      backgroundColor: "#fff",
      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    },
    teamImage: {
      width: "100%",
      borderRadius: "8px",
    },
    teamName: {
      fontSize: "18px",
      fontWeight: "bold",
      margin: "10px 0 5px",
    },
    teamPosition: {
      fontSize: "14px",
      color: "#777",
    },
    socialIcons: {
      display: "flex",
      justifyContent: "center",
      gap: "10px",
      marginTop: "10px",
    },
    serviceContainer: {
      display: "flex",
      justifyContent: "space-between",
      width: "100%",
      marginTop: "40px",
    },
    serviceCard: {
      width: "30%",
      textAlign: "center",
      borderRadius: "8px",
      padding: "20px",
      backgroundColor: "#fff",
      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    },
    serviceIcon: {
      fontSize: "30px",
      marginBottom: "10px",
    },
    serviceTitle: {
      fontSize: "16px",
      fontWeight: "bold",
    },
    serviceText: {
      fontSize: "14px",
      color: "#777",
    },
  };

  return (
    <div style={styles.container}>
      {/* Phần giới thiệu */}
      <div style={styles.section}>
        <div style={styles.textSection}>
          <h2 style={styles.heading}>Our Story</h2>
          <p style={styles.paragraph}>
            Launched in 2015, Exclusive is South Asia’s premier online shopping
            marketplace with an active presence in Bangladesh. Supported by a wide range of
            tailored marketing, data and service solutions, Exclusive has 10,500 sellers
            and 300 brands and serves 3 million customers across the region.
          </p>
          <p style={styles.paragraph}>
            Exclusive has more than 1 Million products to offer, growing at a very fast
            rate. Exclusive offers a diverse assortment in categories ranging from consumer.
          </p>
        </div>
        <div style={styles.imageSection}>
          <img src="/Side_Image.png" alt="Shopping" style={styles.image} />
        </div>
      </div>

      {/* Phần thống kê */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard()}>
          <div style={styles.icon}>🏪</div>
          <div style={styles.statNumber}>10.5k</div>
          <div style={styles.statText}>Sellers active on our site</div>
        </div>

        <div style={styles.statCard(true)}>
          <div style={styles.icon}>💰</div>
          <div style={styles.statNumber}>33k</div>
          <div style={styles.statText}>Monthly Product Sale</div>
        </div>

        <div style={styles.statCard()}>
          <div style={styles.icon}>🛍️</div>
          <div style={styles.statNumber}>45.5k</div>
          <div style={styles.statText}>Customers active on our site</div>
        </div>

        <div style={styles.statCard()}>
          <div style={styles.icon}>💵</div>
          <div style={styles.statNumber}>25k</div>
          <div style={styles.statText}>Annual gross sale in our site</div>
        </div>
      </div>

      {/* Phần Team Members */}
      <div style={styles.teamContainer}>
        {["1.png", "2.png", "3.png"].map((img, index) => (
          <div style={styles.teamCard} key={index}>
            <img src={`/${img}`} alt="Team Member" style={styles.teamImage} />
            <div style={styles.teamName}>
              {["Tom Cruise", "Emma Watson", "Will Smith"][index]}
            </div>
            <div style={styles.teamPosition}>
              {["Founder & Chairman", "Managing Director", "Product Designer"][index]}
            </div>
            {/* Thêm Icon mạng xã hội */}
            <div style={styles.socialIcons}>
              <FaTwitter size={20} color="#1DA1F2" />
              <FaInstagram size={20} color="#C13584" />
              <FaLinkedin size={20} color="#0077B5" />
            </div>
          </div>
        ))}
      </div>

      {/* Phần Dịch Vụ */}
      <div style={styles.serviceContainer}>
        <div style={styles.serviceCard}>
          <div style={styles.serviceIcon}>🚚</div>
          <div style={styles.serviceTitle}>FREE AND FAST DELIVERY</div>
          <div style={styles.serviceText}>Free delivery for all orders over $140</div>
        </div>

        <div style={styles.serviceCard}>
          <div style={styles.serviceIcon}>📞</div>
          <div style={styles.serviceTitle}>24/7 CUSTOMER SERVICE</div>
          <div style={styles.serviceText}>Friendly 24/7 customer support</div>
        </div>

        <div style={styles.serviceCard}>
          <div style={styles.serviceIcon}>💰</div>
          <div style={styles.serviceTitle}>MONEY BACK GUARANTEE</div>
          <div style={styles.serviceText}>We return money within 30 days</div>
        </div>
      </div>
    </div>
  );
};

export default About;
