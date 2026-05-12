const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const crypto = require("crypto");

const app = express();

app.use(express.json({ limit: "1mb" }));

app.post("/run", async (req, res) => {
    const code = req.body.code;

    console.log("Run called on port 3000");
    if (!code) {
        return res.status(400).json({
            error: "No code provided"
        });
    }

    const id = crypto.randomUUID();

    const dir = path.join("/tmp", id);

    fs.mkdirSync(dir, { recursive: true });

    const javaFile = path.join(dir, "Main.java");

    fs.writeFileSync(javaFile, code);

    const command = `
        cd ${dir} &&
        javac Main.java &&
        timeout 5s java -Xmx64m Main.java
    `;

    exec(command, (error, stdout, stderr) => {

        fs.rmSync(dir, {
            recursive: true,
            force: true
        });

        if (error) {
            return res.json({
                success: false,
                stderr
            });
        }

        res.json({
            success: true,
            stdout,
            stderr
        });
    });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
