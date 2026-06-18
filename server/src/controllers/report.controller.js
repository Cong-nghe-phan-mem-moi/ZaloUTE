const ReportService = require("../services/report.service");

class ReportController {
  static async createReport(req, res) {
    try {
      const report = await ReportService.createReport(req.user.userId, req.body);

      return res.status(201).json({
        success: true,
        message: "Report submitted",
        data: report,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Unable to submit report",
      });
    }
  }
}

module.exports = ReportController;
