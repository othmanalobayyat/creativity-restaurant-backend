// src/routes/admin.routes.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminOnly");

const { adminDashboard } = require("../controllers/adminDashboard.controller");

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
  adminListProducts,
  adminGetProductById,
  adminToggleProductActive,
} = require("../controllers/adminProducts.controller");

// Categories
const {
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminGetCategoryById,
} = require("../controllers/adminCategories.controller");

/* rarather than repeating auth and adminOnly for each route, 
we can apply it to all routes in this router using this line. 
This way, all routes defined below will require authentication 
and admin access.router.use(auth, adminOnly);*/
router.use("/admin", auth, adminOnly);

// Orders
router.get("/admin/orders", adminListOrders);
router.put("/admin/orders/:id/status", adminUpdateOrderStatus);

// Products
router.get("/admin/products", adminListProducts);
router.get("/admin/products/:id", adminGetProductById);
router.post("/admin/products", adminCreateProduct);
router.put("/admin/products/:id", adminUpdateProduct);
router.put("/admin/products/:id/toggle-active", adminToggleProductActive);
router.delete("/admin/products/:id", adminDeleteProduct);

// Categories
router.get("/admin/categories", adminListCategories);
router.get("/admin/categories/:id", adminGetCategoryById);
router.post("/admin/categories", adminCreateCategory);
router.put("/admin/categories/:id", adminUpdateCategory);
router.delete("/admin/categories/:id", adminDeleteCategory);

// Dashboard
router.get("/admin/dashboard", adminDashboard);

module.exports = router;
