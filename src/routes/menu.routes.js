// src/routes/menu.routes.js
const router = require("express").Router();
const {
  getCategories,
  getItems,
  getItemById,
} = require("../controllers/menu.controller");

router.get("/categories", getCategories);
router.get("/items", getItems);
router.get("/items/:id", getItemById);

module.exports = router;
