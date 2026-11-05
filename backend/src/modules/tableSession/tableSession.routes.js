
const express = require("express");
const router = express.Router();

const {
  createTableSession,
  getCurrentSession,
  closeTableSession,
} = require("./tableSession.controller");

// Customer guest routes: no staff authentication required.
router.post("/", createTableSession);
router.get("/current", getCurrentSession);
router.patch("/close", closeTableSession);

module.exports = router;
