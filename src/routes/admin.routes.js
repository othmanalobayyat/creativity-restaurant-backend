// src/routes/admin.routes.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminOnly");
const { adminDashboard } = require("../controllers/adminDashboard.controller");
const {
  adminToggleProductActive,
} = require("../controllers/adminProducts.controller");

// Orders
const {
  adminListOrders,
  adminUpdateOrderStatus,
} = require("../controllers/adminOrders.controller");

// Products
const {
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminListProducts, // ✅ NEW
  adminGetProductById, // ✅ NEW (اختياري بس مفيد)
} = require("../controllers/adminProducts.controller");

// Categories
const {
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminListCategories, // ✅ NEW
  adminGetCategoryById, // ✅ NEW (اختياري)
} = require("../controllers/adminCategories.controller");

// Orders
router.get("/admin/orders", auth, adminOnly, adminListOrders);
router.put("/admin/orders/:id/status", auth, adminOnly, adminUpdateOrderStatus);

// Products
router.get("/admin/products", auth, adminOnly, adminListProducts); // ✅
router.get("/admin/products/:id", auth, adminOnly, adminGetProductById); // ✅
router.post("/admin/products", auth, adminOnly, adminCreateProduct);
router.put("/admin/products/:id", auth, adminOnly, adminUpdateProduct);
router.put(
  "/admin/products/:id/toggle-active",
  auth,
  adminOnly,
  adminToggleProductActive,
);
router.delete("/admin/products/:id", auth, adminOnly, adminDeleteProduct);

// Categories
router.get("/admin/categories", auth, adminOnly, adminListCategories); // ✅
router.get("/admin/categories/:id", auth, adminOnly, adminGetCategoryById); // ✅
router.post("/admin/categories", auth, adminOnly, adminCreateCategory);
router.put("/admin/categories/:id", auth, adminOnly, adminUpdateCategory);
router.delete("/admin/categories/:id", auth, adminOnly, adminDeleteCategory);

// Dashboard
router.get("/admin/dashboard", auth, adminOnly, adminDashboard);

module.exports = router;
