import { WebSocketServer } from "ws";
import { JWT_SECRET } from "@repo/backend-common/config";
import Jwt, {  JwtPayload } from "jsonwebtoken";
const wss =new WebSocketServer({port:8080});
 function checker(token:string):string|null{
    const decoded=Jwt.verify(token,JWT_SECRET);

    if(typeof decoded ==="string") {return null}
    if(!decoded||!decoded.userId) return null


    return decoded.userId;
 }

wss.on('connection',function connection(ws,request){
    
    const url=request.url;
    if (!url) return 
    const queryparams=new URLSearchParams(url.split('?')[1]);
    const token=queryparams.get('token')||"";
    if(!token) return;
       const userId=checker(token)
       if(!userId) {ws.close()}
       
        ws.on('message' , function message(){
            console.log('ping');
        })
})