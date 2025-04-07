const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");

// const authRoutes = require("../src/routes/auth");
// const employeeRoutes = require("../src/routes/employee");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("HRMS backend running...");
});

// app.use("/api/auth", authRoutes);
// app.use("/api/employees", employeeRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
