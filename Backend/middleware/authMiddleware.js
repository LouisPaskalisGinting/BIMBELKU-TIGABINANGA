const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // ==================================================
    // MODE KHUSUS TESTING
    // ==================================================
    if (
      process.env.NODE_ENV === "test" &&
      req.headers["x-test-user-empty"] === "true"
    ) {
      req.user = {};
      return next();
    }

    const authHeader = req.headers.authorization;

    console.log("AUTH HEADER:", authHeader);

    if (!authHeader) {
      return res.status(401).json({
        message: "Token tidak ditemukan",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Format token tidak valid",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token tidak ditemukan",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret_bimbelku"
    );

    console.log("TOKEN VALID:", decoded);

    req.user = decoded;

    next();
  } catch (error) {
    console.error("AUTH ERROR:", error.message);

    return res.status(401).json({
      message: "Token tidak valid atau sudah expired",
    });
  }
};

module.exports = authMiddleware;
