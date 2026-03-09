require("dotenv").config(); 
const app = require("./app"); // Path fixed to look in the same folder
const connectDB = require("./configs/db");
const cors = require('cors');

// Initialize database connection
connectDB();

const PORT = process.env.PORT || 8000;

app.use(cors({
    origin: ["https://your-frontend-domain.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});