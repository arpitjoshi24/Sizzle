const express = require("express");
const router = express.Router();

const {
    register,
    login,
    getProfile
} = require("./auth.controller");

const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");

router.post("/login", login);

router.post(
    "/register",
    authenticate,
    authorize("ADMIN"),
    register
);

router.get(
    "/profile",
    authenticate,
    getProfile
);

module.exports = router;