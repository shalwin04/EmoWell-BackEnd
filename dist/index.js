import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
// app.get("/", (req, res) => {
//     res.json({ message: "Hello, Nakama! TypeScript and Express are working!" });
// });
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
