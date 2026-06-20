const express = require("express");
const Sticker = require("../models/sticker.model");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const stickers = await Sticker.find({})
      .sort({ packName: 1, category: 1, createdAt: 1, _id: 1 })
      .lean();
    const packsByName = new Map();

    stickers.forEach((sticker) => {
      const packName = sticker.packName || sticker.category || "Default pack";
      if (!packsByName.has(packName)) {
        packsByName.set(packName, {
          name: packName,
          category: sticker.category || "",
          stickers: [],
        });
      }

      packsByName.get(packName).stickers.push(sticker);
    });

    return res.status(200).json({
      success: true,
      data: Array.from(packsByName.values()),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to load stickers",
    });
  }
});

module.exports = router;
