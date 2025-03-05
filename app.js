import http from "http";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const PORT = 8000;
const filePath = "./data/links.json";

const serveFile = async(res,filePath,contentType)=>{
    try {
        const data = await fs.readFile(filePath);
        res.writeHead(200,{"Content-Type":contentType});
        res.end(data)
    } catch (error) {
        res.writeHead(404,{"Content-Type":"text/plain"});
        res.end("Page Not Found")
    }
}

const loadJson = async()=>{
    try {
        const data = await fs.readFile(filePath,"utf-8")
        return JSON.parse(data)
    }catch(error) {
        if(error.code === "ENOENT"){
           await fs.writeFile(filePath,JSON.stringify({}))
           return {};
        }
        throw error;
    }
    
}
const saveJson = async(links)=>{
    await fs.writeFile(filePath,JSON.stringify(links))
}

const server = http.createServer(async(req,res)=>{
    if(req.method === "GET"){
        if(req.url === "/"){
           return serveFile(res,path.join("public","index.html"),"text/html");
        }else if(req.url === "/styles.css"){
            return serveFile(res,path.join("public","styles.css"),"text/css");
        }else if(req.url === "/links"){
            const links= await loadJson();
            res.writeHead(200,{"content-type":"application/json"});
            return res.end(JSON.stringify(links))
        }else{
            const links=await loadJson();
            const shortCode= req.url.slice(1);
            if(links[shortCode]){
                res.writeHead(302,{location:links[shortCode]})
                return res.end();
            }
            res.writeHead(400,{"content-type":"text/plain"});
            return res.end("ShortCode URL is not present");
        }
    }else if(req.method === "POST" && req.url === "/shorten"){
        let body="";
        req.on("data",(chunks)=>{
            body+=chunks;
        });
        req.on("end",async()=>{
            const links = await loadJson();
            const {url,optionalUrl} = JSON.parse(body);

            if(!url){
                res.writeHead(400,{"content-type":"text/plain"});
                return res.end("Url is required")
            }

            const shortCode= optionalUrl || crypto.randomBytes(4).toString("hex");
            if(links[shortCode]){
                res.writeHead(400,{"content-type":"text/plain"});
                return res.end("ShortCode is already present");
            }
            links[shortCode] =url;
            await saveJson(links);

            res.writeHead(200,{"content-type":"text/plain"});
            return res.end(JSON.stringify({success:true,shortCode:shortCode}))

        })
    }
});

server.listen(PORT,console.log("Server is running on port 8000"))