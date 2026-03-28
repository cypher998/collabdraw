import { NextFunction, Request, Response } from "express";
import Jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
declare global {
  namespace Express {
    interface Request {
      userId?: string; // Add your custom property here, make it optional if needed
      // You can also add other custom properties here
    }
  }
}
export default function auth(req:Request,res:Response,next:NextFunction){

    const token=req.headers["authorization"]??""
    if(!token){return}

    const decoded= Jwt.verify(token as string ,JWT_SECRET!) as { userId: string }

    if(decoded){
        
        req.userId=decoded.userId
        next();
    }
    else{
        return res.status(403).json({message:'unauthorized'})
    }

}