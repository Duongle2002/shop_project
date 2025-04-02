import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Thêm Firebase Storage

const firebaseConfig = {
  apiKey: "AIzaSyCzgVti1qa_LCs5BDaQjL5fAHS3hq1wX4A",
  authDomain: "reactjs032025.firebaseapp.com",
  projectId: "reactjs032025",
  storageBucket: "reactjs032025.firebasestorage.app",
  messagingSenderId: "273138571552",
  appId: "1:273138571552:web:d183af1a64c233579f1f45",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Khởi tạo Storage
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, googleProvider };