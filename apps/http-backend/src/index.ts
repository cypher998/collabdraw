import express from "express"
const app = express();
app.use(express.json());
import auth from "./middleware"
import { CreateUserSchema, RoomSchema, UserSigninSchema } from "@repo/common/types";

app.post('/signup' , (req,res)=>{
    const inputs=CreateUserSchema.safeParse(req.body)
    
})
app.post('/signin' , (req,res)=>{
   const inputs= UserSigninSchema.safeParse(req.body);


})
app.post('/create-room',auth , (req,res)=>{
const inputs= RoomSchema.safeParse(req.body);
})

app.listen(3002);