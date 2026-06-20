const express = require("express");
const ReportController = require("../controllers/report.controller");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/", ReportController.createReport);

module.exports = router;
