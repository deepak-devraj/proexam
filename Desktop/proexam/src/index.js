require("dotenv").config(); 
const app = require("./app"); // Path fixed to look in the same folder
const connectDB = require("./configs/db");

// Initialize database connection
connectDB();

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});