const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "Access Denied" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid Token" });
  }
};

exports.allowRoles = (...rolesAllowed) => {
  return (req, res, next) => {
    const userRole = req.user.roleId;
    if (!rolesAllowed.includes(userRole)) {
      return res
        .status(403)
        .json({ error: "Access forbidden: insufficient role" });
    }
    next();
  };
};
