const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const crypto = require("crypto");
const Redis = require("ioredis");

const app = express();
const redis = new Redis(process.env.REDIS_CONNECTION_STRING);
const PORT = process.env.PORT || 3000;


app.use(express.json({ limit: "1mb" }));

app.post("/run", async (req, res) => {
    const code = req.body.code;
    
    console.log(`Run called on port ${PORT}`);
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

    // javac Main.java && ...............  remove .java too for other mode...
    const command = `
        cd "${dir}" &&
        export LANG=C.UTF-8 &&
        export LC_ALL=C.UTF-8 &&
        timeout 15s java -Xmx256m -Dfile.encoding=UTF-8 Main.java
    `;

    exec(command, (error, stdout, stderr) => {

        fs.rmSync(dir, {
            recursive: true,
            force: true
        });

        if (error) {
            return res.json({
                success: false,
                error: error.message,
                error_code: error.code,
                error_signal: error.signal,
                stderr,
                stdout
            });
        }

        res.json({
            success: true,
            stdout,
            stderr
        });
    });
});

async function processCodeFromRedisContinously(){

    console.log("Worker Started");

    while(true){
        
        const [, data] = await redis.brpop("jobs", 0);

        const job = JSON.parse(data);

        console.log("Recieved Job from redis ID" + job.ID );
        
    }
    
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    processCodeFromRedisContinously()
});
