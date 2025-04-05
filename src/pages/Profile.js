import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase'; // Import auth và db từ firebase
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'; // Các hàm để cập nhật email và mật khẩu
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Firestore để lưu thông tin người dùng
import '../assets/styles/profile.css'; // File CSS để định dạng giao diện

const Profile = () => {
  const navigate = useNavigate();
  const user = auth.currentUser; // Lấy thông tin người dùng hiện tại

  // State để quản lý dữ liệu form
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lấy thông tin người dùng từ Firestore khi component được mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFormData(prev => ({
              ...prev,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              address: userData.address || ''
            }));
          }
        } catch (err) {
          setError('Failed to load user data.');
          console.error(err);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Hàm xử lý khi người dùng thay đổi dữ liệu trong form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Hàm xử lý khi người dùng nhấn "Save Changes"
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('You must be logged in to update your profile.');
      return;
    }

    try {
      // Kiểm tra mật khẩu mới và xác nhận mật khẩu
      if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
        setError('New password and confirm password do not match.');
        return;
      }

      // Nếu người dùng thay đổi email hoặc mật khẩu, cần reauthenticate
      if (formData.email !== user.email || formData.newPassword) {
        if (!formData.currentPassword) {
          setError('Please enter your current password to update email or password.');
          return;
        }

        // Reauthenticate người dùng
        const credential = EmailAuthProvider.credential(user.email, formData.currentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      // Cập nhật email nếu có thay đổi
      if (formData.email !== user.email) {
        await updateEmail(user, formData.email);
      }

      // Cập nhật mật khẩu nếu có thay đổi
      if (formData.newPassword) {
        await updatePassword(user, formData.newPassword);
      }

      // Lưu thông tin khác (firstName, lastName, address) vào Firestore
      await setDoc(doc(db, 'users', user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        email: formData.email
      }, { merge: true });

      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  // Hàm xử lý khi người dùng nhấn "Cancel"
  const handleCancel = () => {
    navigate('/'); // Chuyển hướng về trang chính hoặc trang trước đó
  };

  return (
    <div className="profile-container">
      {/* Sidebar bên trái */}
      <div className="sidebar">
        <h3>Manage My Account</h3>
        {/* <ul>
          <li className="active">My Profile</li>
          <li>Address Book</li>
          <li>My Payment Options</li>
          <li>My Orders</li>
          <li>My Returns</li>
          <li>My Cancellations</li>
          <li>My Wishlist</li>
        </ul> */}
      </div>

      {/* Form chỉnh sửa thông tin bên phải */}
      <div className="profile-form">
        <h2>Edit Your Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group ">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name"
                style={{ width: '90%' }}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                style={{ width: '90%' }}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                style={{ width: '90%' }}
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Address"
                style={{ width: '90%' }}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Password Changes</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="Current Password"
            />
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="New Password"
            />
            <input
              type="password"
              name="confirmNewPassword"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              placeholder="Confirm New Password"
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Save Changes
            </button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </div>
    </div>
  );
};

export default Profile;