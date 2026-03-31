const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("pdf"), async (req, res) => {
    try {
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);

        res.json({ text: pdfData.text });
    } catch (err) {
        res.status(500).json({ error: "Error reading PDF" });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});

