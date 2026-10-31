import { WebSocketServer, WebSocket } from "ws";
import { JWT_SECRET } from "@repo/backend-common/config";
import Jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

type user = {
userId:string ;
rooms: string[];
ws: WebSocket;
};

const Users: user[] = [];

function checker(token: string): string | null {
  try{const decoded = Jwt.verify(token, JWT_SECRET);

  if (typeof decoded === "string") {
    return null;
  }
  if (!decoded || !decoded.userId) return null;

  return decoded.userId;
}catch(e){
    return null;
  }
}

wss.on("connection",  function connection(ws, request) {
  const url = request.url;
  if (!url) return;
  const queryparams = new URLSearchParams(url.split("?")[1]);
  const token = queryparams.get("token") || "";
  if (!token) return;
  const userId = checker(token);
  if (!userId) {
    ws.close();
    return 
  }
  Users.push({
    userId ,
    rooms:[],
    ws:ws

  })

  ws.on("message",async function message(data) {
    const parsed =JSON.parse(data as unknown as string)

    if(parsed.type==="join_room"){
        const user=Users.find(x=>x.ws===ws)
        user?.rooms.push(parsed.roomId);
    }
    if(parsed.type==="leave_room"){
        const user=Users.find(x=>x.ws===ws)
        if(!user) {return }

       user.rooms= user.rooms.filter(x=>x!==parsed.roomId);
    }
    if(parsed.type==="chat"){
        const roomid=parsed.roomId
        const message=parsed.message
        if(!roomid) {return }

        await prisma.chat.create({
            data:{
            roomId:roomid,
            message:message,
            userId
            }

        })

       Users.forEach(user=>{if(user.rooms.includes(roomid)){
        user.ws.send(JSON.stringify({
            type:"chat",
            message:message,
            roomid
        }))
       }})
    }






  });
});
