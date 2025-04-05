// src/utils/authSync.js
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../config/firebase";

const syncUserToFirestore = async (user) => {
  if (user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Nếu người dùng chưa tồn tại trong Firestore, tạo mới
        await setDoc(userRef, {
          id: user.uid,
          user_id: user.uid,
          email: user.email,
          username: user.displayName || user.email.split("@")[0],
          role: user.email === "admin@gmail.com" ? "admin" : "user",
          created_at: new Date().toISOString(),
          is_active: true
        });
        console.log("Tạo mới người dùng trong Firestore thành công");
      } else {
        // Nếu người dùng đã tồn tại, cập nhật thông tin
        const userData = userDoc.data();
        await setDoc(userRef, {
          ...userData,
          email: user.email,
          username: user.displayName || user.email.split("@")[0],
          is_active: true
        }, { merge: true });
        console.log("Cập nhật thông tin người dùng thành công");
      }
    } catch (error) {
      console.error("Lỗi khi đồng bộ người dùng:", error);
    }
  }
};

// Gọi hàm này khi ứng dụng khởi động
export const initAuthSync = () => {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      syncUserToFirestore(user);
    }
  });
};