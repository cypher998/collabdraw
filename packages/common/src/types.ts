import {email, z}  from "zod"

export const CreateUserSchema=z.object({
    email:z.string().email(),
    password:z.string().min(6),
    name:z.string().min(8),

})

export const UserSigninSchema=z.object({         
    email:z.string().email(),
    password:z.string().min(6),
})
export const RoomSchema=z.object({         
    name:z.string()
})