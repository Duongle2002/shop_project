import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import {
  Table,
  Button,
  Form,
  Modal,
  Pagination,
  Tabs,
  Tab,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { auth, db } from "../../config/firebase";
import axios from "axios";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../../assets/styles/productManagement.css"

// Component quản lý sản phẩm, cung cấp giao diện CRUD cho sản phẩm
const ProductManagement = () => {
  // Khởi tạo các trạng thái (state) để quản lý dữ liệu và giao diện
  const [products, setProducts] = useState([]); // Danh sách sản phẩm đang hoạt động
  const [deletedProducts, setDeletedProducts] = useState([]); // Danh sách sản phẩm đã bị xóa
  const [categories, setCategories] = useState([]); // Danh sách danh mục sản phẩm
  const [sellers, setSellers] = useState([]); // Danh sách người bán (admin hoặc seller)
  const [searchTerm, setSearchTerm] = useState(""); // Chuỗi tìm kiếm để lọc sản phẩm
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    category_id: "",
    seller_id: "",
    image_url: "",
    description: "",
    is_active: true,
  }); // Thông tin sản phẩm mới
  const [editingProduct, setEditingProduct] = useState(null); // Sản phẩm đang được chỉnh sửa
  const [showModal, setShowModal] = useState(false); // Trạng thái hiển thị modal chỉnh sửa
  const [imagePreview, setImagePreview] = useState(null); // URL bản xem trước ảnh
  const [imageFile, setImageFile] = useState(null); // File ảnh được chọn để tải lên
  const [isUploading, setIsUploading] = useState(false); // Trạng thái đang tải ảnh
  const [isLoading, setIsLoading] = useState(true); // Trạng thái đang tải dữ liệu
  const [page, setPage] = useState(1); // Trang hiện tại cho sản phẩm hoạt động
  const [deletedPage, setDeletedPage] = useState(1); // Trang hiện tại cho sản phẩm đã xóa
  const itemsPerPage = 5; // Số lượng sản phẩm mỗi trang

  // Cấu hình Cloudinary để tải ảnh
  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/duuzl8vye/image/upload";
  const UPLOAD_PRESET = "shop_project";

  // Cấu hình toolbar cho ReactQuill (trình soạn thảo văn bản giàu)
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  // Hàm tải dữ liệu từ Firestore (sản phẩm, danh mục, người bán)
  const fetchData = async () => {
    try {
      setIsLoading(true); // Bắt đầu trạng thái tải dữ liệu
      // Lấy danh sách sản phẩm từ Firestore
      const productSnapshot = await getDocs(collection(db, "products"));
      const allProducts = productSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Lọc sản phẩm hoạt động và đã xóa
      setProducts(allProducts.filter((product) => !product.is_deleted));
      setDeletedProducts(allProducts.filter((product) => product.is_deleted));

      // Lấy danh sách danh mục từ Firestore
      const categorySnapshot = await getDocs(collection(db, "categories"));
      setCategories(categorySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      // Lấy danh sách người dùng và lọc admin/seller
      const userSnapshot = await getDocs(collection(db, "users"));
      const allUsers = userSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSellers(allUsers.filter((user) => user.role === "admin" || user.role === "seller"));
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      alert("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setIsLoading(false); // Kết thúc trạng thái tải dữ liệu
    }
  };

  // Gọi fetchData khi component được gắn kết
  useEffect(() => {
    fetchData();
  }, []);

  // Hàm tải ảnh lên Cloudinary
  const uploadImageToCloudinary = async (file) => {
    if (!file) return null; // Không có file thì trả về null
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      setIsUploading(true); // Bắt đầu trạng thái tải ảnh
      const response = await axios.post(CLOUDINARY_URL, formData);
      return response.data.secure_url; // Trả về URL ảnh từ Cloudinary
    } catch (error) {
      console.error("Lỗi khi tải ảnh lên Cloudinary:", error.response?.data || error.message);
      alert("Không thể tải ảnh lên Cloudinary.");
      return null;
    } finally {
      setIsUploading(false); // Kết thúc trạng thái tải ảnh
    }
  };

  // Xử lý khi chọn ảnh cho sản phẩm mới
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result); // Tạo bản xem trước ảnh
      reader.readAsDataURL(file);
      setImageFile(file); // Lưu file ảnh
    }
  };

  // Xử lý khi chọn ảnh cho sản phẩm đang chỉnh sửa
  const handleEditImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result); // Tạo bản xem trước ảnh
      reader.readAsDataURL(file);

      const imageUrl = await uploadImageToCloudinary(file); // Tải ảnh lên Cloudinary
      if (imageUrl) {
        setEditingProduct({ ...editingProduct, image_url: imageUrl }); // Cập nhật URL ảnh
      }
    }
  };

  // Hàm thêm sản phẩm mới
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      if (isUploading) {
        alert("Ảnh đang được tải lên. Vui lòng đợi.");
        return;
      }

      let finalImageUrl = newProduct.image_url;
      if (imageFile) {
        finalImageUrl = await uploadImageToCloudinary(imageFile); // Tải ảnh lên Cloudinary
        if (!finalImageUrl) {
          alert("Tải ảnh thất bại. Sản phẩm không được thêm.");
          return;
        }
      }

      // Thêm sản phẩm vào Firestore
      const productRef = await addDoc(collection(db, "products"), {
        ...newProduct,
        price: parseFloat(newProduct.price), // Chuyển giá thành số thực
        stock: parseInt(newProduct.stock), // Chuyển số lượng thành số nguyên
        image_url: finalImageUrl || "",
        description: newProduct.description || "",
        created_at: new Date().toISOString(),
        is_active: newProduct.is_active,
        is_deleted: false,
      });
      // Ghi log thay đổi tồn kho
      await addDoc(collection(db, "inventory_logs"), {
        product_id: productRef.id,
        change_amount: parseInt(newProduct.stock),
        reason: "Khởi tạo tồn kho",
        change_date: new Date().toISOString(),
        user_id: auth.currentUser.uid,
      });
      await fetchData(); // Làm mới danh sách sản phẩm
      // Đặt lại form
      setNewProduct({
        name: "",
        price: "",
        stock: "",
        category_id: "",
        seller_id: "",
        image_url: "",
        description: "",
        is_active: true,
      });
      setImagePreview(null);
      setImageFile(null);
      alert("Thêm sản phẩm thành công!");
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm:", error);
      alert("Thêm sản phẩm thất bại.");
    }
  };

  // Hàm chỉnh sửa sản phẩm
  const handleEditProduct = async () => {
    try {
      if (isUploading) {
        alert("Ảnh đang được tải lên. Vui lòng đợi.");
        return;
      }

      let finalImageUrl = editingProduct.image_url;
      if (imageFile) {
        finalImageUrl = await uploadImageToCloudinary(imageFile); // Tải ảnh mới
        if (!finalImageUrl) {
          alert("Tải ảnh thất bại. Sản phẩm không được cập nhật.");
          return;
        }
      }

      // Lấy sản phẩm cũ để so sánh
      const oldProduct = products.find((p) => p.id === editingProduct.id);
      // Cập nhật sản phẩm trong Firestore
      await updateDoc(doc(db, "products", editingProduct.id), {
        ...editingProduct,
        image_url: finalImageUrl || editingProduct.image_url,
        description: editingProduct.description || "",
      });
      // Ghi log nếu số lượng tồn kho thay đổi
      if (editingProduct.stock !== oldProduct.stock) {
        await addDoc(collection(db, "inventory_logs"), {
          product_id: editingProduct.id,
          change_amount: editingProduct.stock - oldProduct.stock,
          reason: "Cập nhật tồn kho",
          change_date: new Date().toISOString(),
          user_id: auth.currentUser.uid,
        });
      }
      await fetchData(); // Làm mới danh sách sản phẩm
      setShowModal(false); // Đóng modal
      setImagePreview(null);
      setImageFile(null);
      alert("Cập nhật sản phẩm thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật sản phẩm:", error);
      alert("Cập nhật sản phẩm thất bại.");
    }
  };

  // Hàm đánh dấu sản phẩm là đã xóa (xóa mềm)
  const handleDeleteProduct = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn đánh dấu sản phẩm này là đã xóa?")) {
      try {
        await updateDoc(doc(db, "products", id), {
          is_deleted: true,
        });
        await fetchData(); // Làm mới danh sách
        alert("Đánh dấu sản phẩm là đã xóa thành công!");
      } catch (error) {
        console.error("Lỗi khi đánh dấu sản phẩm là đã xóa:", error);
        alert("Xóa sản phẩm thất bại.");
      }
    }
  };

  // Hàm khôi phục sản phẩm đã xóa
  const handleRestoreProduct = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục sản phẩm này?")) {
      try {
        await updateDoc(doc(db, "products", id), {
          is_deleted: false,
        });
        await fetchData(); // Làm mới danh sách
        alert("Khôi phục sản phẩm thành công!");
      } catch (error) {
        console.error("Lỗi khi khôi phục sản phẩm:", error);
        alert("Khôi phục sản phẩm thất bại.");
      }
    }
  };

  // Lọc sản phẩm theo chuỗi tìm kiếm
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.replace(/<[^>]+>/g, "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Lọc sản phẩm đã xóa theo chuỗi tìm kiếm
  const filteredDeletedProducts = deletedProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.replace(/<[^>]+>/g, "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Hàm phân trang danh sách sản phẩm
  const paginate = (items, currentPage) =>
    items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Hiển thị spinner khi đang tải dữ liệu
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // Giao diện chính của component
  return (
    <div className="container my-5">
      <h3>Quản lý sản phẩm</h3>
      {/* Ô tìm kiếm sản phẩm */}
      <Form.Control
        type="text"
        placeholder="Tìm kiếm theo tên hoặc mô tả"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-3"
        style={{ maxWidth: "300px" }}
      />
      {/* Form thêm sản phẩm mới */}
      <Form onSubmit={handleAddProduct} className="mb-4">
        <div className="row">
          <div className="col-md-2">
            <Form.Control
              type="text"
              placeholder="Tên sản phẩm"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              required
            />
          </div>
          <div className="col-md-2">
            <Form.Control
              type="number"
              placeholder="Giá"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              required
            />
          </div>
          <div className="col-md-2">
            <Form.Control
              type="number"
              placeholder="Số lượng"
              value={newProduct.stock}
              onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
              required
            />
          </div>
          <div className="col-md-2">
            <Form.Select
              value={newProduct.category_id}
              onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
            >
              <option value="">Chọn danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-2">
            <Form.Select
              value={newProduct.seller_id}
              onChange={(e) => setNewProduct({ ...newProduct, seller_id: e.target.value })}
            >
              <option value="">Chọn người bán</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.username}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-2">
            <Form.Control
              type="text"
              placeholder="URL ảnh (hoặc tải lên bên dưới)"
              value={newProduct.image_url}
              onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
            />
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-2"
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Xem trước"
                style={{ width: "100px", marginTop: "10px" }}
              />
            )}
          </div>
          <div className="col-md-4">
            <Form.Label>Mô tả</Form.Label>
            <ReactQuill
              value={newProduct.description}
              onChange={(value) => setNewProduct({ ...newProduct, description: value })}
              modules={quillModules}
              style={{ height: "100px", marginBottom: "40px" }}
            />
          </div>
          <div className="col-md-2">
            <Form.Check
              type="checkbox"
              label="Hoạt động"
              checked={newProduct.is_active}
              onChange={(e) => setNewProduct({ ...newProduct, is_active: e.target.checked })}
            />
          </div>
          <div className="col-md-2">
            <Button type="submit" variant="success" disabled={isUploading}>
              {isUploading ? (
                <div className="button-spinner"></div>
              ) : (
                "Thêm sản phẩm"
              )}
            </Button>
          </div>
        </div>
      </Form>

      {/* Tabs để hiển thị sản phẩm hoạt động và đã xóa */}
      <Tabs defaultActiveKey="active" id="product-tabs" className="mb-3">
        <Tab eventKey="active" title="Sản phẩm đang hoạt động">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Giá</th>
                <th>Số lượng</th>
                <th>Danh mục</th>
                <th>Người bán</th>
                <th>Hình ảnh</th>
                <th>Mô tả</th>
                <th>Hoạt động</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginate(filteredProducts, page).map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>${product.price}</td>
                  <td>{product.stock}</td>
                  <td>
                    {categories.find((cat) => cat.id === product.category_id)?.name || "N/A"}
                  </td>
                  <td>
                    {sellers.find((seller) => seller.id === product.seller_id)?.username || "N/A"}
                  </td>
                  <td>
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{ width: "50px" }}
                      />
                    )}
                  </td>
                  <td>
                    {product.description?.length > 50 ? (
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Tooltip>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: product.description,
                              }}
                            />
                          </Tooltip>
                        }
                      >
                        <span>
                          {product.description.replace(/<[^>]+>/g, "").slice(0, 50)}...
                        </span>
                      </OverlayTrigger>
                    ) : (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: product.description || "Không có mô tả",
                        }}
                      />
                    )}
                  </td>
                  <td>{product.is_active ? "Có" : "Không"}</td>
                  <td>
                    <Button
                      variant="warning"
                      className="me-2"
                      onClick={() => {
                        setEditingProduct(product);
                        setImagePreview(product.image_url);
                        setShowModal(true);
                      }}
                    >
                      Chỉnh sửa
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Xóa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {/* Phân trang cho sản phẩm hoạt động */}
          <Pagination>
            <Pagination.Prev disabled={page === 1} onClick={() => setPage(page - 1)} />
            <Pagination.Next
              disabled={page * itemsPerPage >= filteredProducts.length}
              onClick={() => setPage(page + 1)}
            />
          </Pagination>
        </Tab>

        <Tab eventKey="deleted" title="Sản phẩm đã xóa">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Giá</th>
                <th>Số lượng</th>
                <th>Danh mục</th>
                <th>Người bán</th>
                <th>Hình ảnh</th>
                <th>Mô tả</th>
                <th>Hoạt động</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginate(filteredDeletedProducts, deletedPage).map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>${product.price}</td>
                  <td>{product.stock}</td>
                  <td>
                    {categories.find((cat) => cat.id === product.category_id)?.name || "N/A"}
                  </td>
                  <td>
                    {sellers.find((seller) => seller.id === product.seller_id)?.username || "N/A"}
                  </td>
                  <td>
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{ width: "50px" }}
                      />
                    )}
                  </td>
                  <td>
                    {product.description?.length > 50 ? (
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Tooltip>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: product.description,
                              }}
                            />
                          </Tooltip>
                        }
                      >
                        <span>
                          {product.description.replace(/<[^>]+>/g, "").slice(0, 50)}...
                        </span>
                      </OverlayTrigger>
                    ) : (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: product.description || "Không có mô tả",
                        }}
                      />
                    )}
                  </td>
                  <td>{product.is_active ? "Có" : "Không"}</td>
                  <td>
                    <Button
                      variant="success"
                      onClick={() => handleRestoreProduct(product.id)}
                    >
                      Khôi phục
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {/* Phân trang cho sản phẩm đã xóa */}
          <Pagination>
            <Pagination.Prev
              disabled={deletedPage === 1}
              onClick={() => setDeletedPage(deletedPage - 1)}
            />
            <Pagination.Next
              disabled={deletedPage * itemsPerPage >= filteredDeletedProducts.length}
              onClick={() => setDeletedPage(deletedPage + 1)}
            />
          </Pagination>
        </Tab>
      </Tabs>

      {/* Modal chỉnh sửa sản phẩm */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa sản phẩm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingProduct && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Tên</Form.Label>
                <Form.Control
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Giá</Form.Label>
                <Form.Control
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: parseFloat(e.target.value),
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Số lượng</Form.Label>
                <Form.Control
                  type="number"
                  value={editingProduct.stock}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      stock: parseInt(e.target.value),
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Danh mục</Form.Label>
                <Form.Select
                  value={editingProduct.category_id}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      category_id: e.target.value,
                    })
                  }
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Người bán</Form.Label>
                <Form.Select
                  value={editingProduct.seller_id}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      seller_id: e.target.value,
                    })
                  }
                >
                  <option value="">Chọn người bán</option>
                  {sellers.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.username}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>URL ảnh (hoặc tải lên bên dưới)</Form.Label>
                <Form.Control
                  type="text"
                  value={editingProduct.image_url}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      image_url: e.target.value,
                    })
                  }
                />
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="mt-2"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Xem trước"
                    style={{ width: "100px", marginTop: "10px" }}
                  />
                )}
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mô tả</Form.Label>
                <ReactQuill
                  value={editingProduct.description || ""}
                  onChange={(value) =>
                    setEditingProduct({ ...editingProduct, description: value })
                  }
                  modules={quillModules}
                  style={{ height: "100px", marginBottom: "40px" }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Hoạt động"
                  checked={editingProduct.is_active}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      is_active: e.target.checked,
                    })
                  }
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={handleEditProduct}
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="button-spinner"></div>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProductManagement;