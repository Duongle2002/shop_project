import React, { useState } from 'react';
import { db } from '../config/firebase'; // Import Firestore từ file firebase.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Import các hàm cần thiết từ Firestore
import '../assets/styles/contact.css'; // Import CSS cho component này
const Contact = () => {
  // State để quản lý dữ liệu form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  // State để hiển thị thông báo trạng thái
  const [status, setStatus] = useState('');

  // Hàm xử lý khi người dùng nhập dữ liệu vào form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Hàm xử lý khi người dùng nhấn nút "Send Message"
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Thêm dữ liệu form vào collection 'messages' trong Firestore
      await addDoc(collection(db, 'messages'), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        timestamp: serverTimestamp() // Thêm thời gian gửi
      });

      // Thông báo thành công
      setStatus('Message sent successfully!');
      console.log('Form submitted:', formData);

      // Reset form sau khi gửi thành công
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      // Thông báo lỗi nếu có
      setStatus('Failed to send message. Please try again.');
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="container contact-container">
      {/* Phần thông tin liên hệ bên trái */}
      <div className="contact-info">
        <div className="contact-method">
          <span className="icon">📞</span>
          <h3>Call To Us</h3>
          <p>We are available 24/7, 7 days a week.</p>
          <p>Phone: +8801611112222</p>
        </div>
        <hr />
        <div className="contact-method">
          <span className="icon">✉️</span>
          <h3>Write To Us</h3>
          <p>Fill out our form and we will contact you within 24 hours.</p>
          <p>Emails: customer@exclusive.com</p>
          <p>Emails: support@exclusive.com</p>
        </div>
      </div>

      {/* Phần form bên phải */}
      <div className="contact-form">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              name="name"
              placeholder="Your Name *"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email *"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Your Phone *"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            rows="5"
          />
          <button type="submit">Send Message</button>
        </form>
        {/* Hiển thị thông báo trạng thái */}
        {status && <p style={{ color: status.includes('Failed') ? 'red' : 'green', marginTop: '10px' }}>{status}</p>}
      </div>
    </div>
  );
};

export default Contact;