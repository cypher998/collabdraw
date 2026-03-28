import { WebSocketServer } from "ws";
import { JWT_SECRET } from "@repo/backend-common/config";
import Jwt, { decode, JwtPayload } from "jsonwebtoken";
const wss =new WebSocketServer({port:8080});

wss.on('connection',function connection(ws,request){
    
    const url=request.url;
    if (!url) return 
    const queryparams=new URLSearchParams(url.split('?')[1]);
    const token=queryparams.get('token')||"";
    if(!token) return;
        const decoded=Jwt.verify(token as string ,JWT_SECRET!) as JwtPayload
        if(!decoded ||decoded.userId) ws.close(); 
        ws.on('message' , function message(){
            console.log('ping');
        })
})