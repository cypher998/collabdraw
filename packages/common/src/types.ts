import {z}  from "zod"

export const CreateUserSchema=z.object({
    username:z.string(),
    password:z.string().min(6),
    name:z.string(),

})

export const UserSigninSchema=z.object({         
    username:z.string(),
    password:z.string().min(6),
})
export const RoomSchema=z.object({         
    name:z.string(),
    roomId:z.string().min(6),
})