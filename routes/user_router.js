import express from "express"
import bcrypt from "bcryptjs"

import { addUser, generateToken, getAll, getUser } from "../controller/user-controller.js"
const router = express.Router()

router.post("/signup", async(req, res) => {
    try {
        const data = req.body;
        const salt = await bcrypt.genSalt(10)
        const user = await getUser(req.body.email)
        console.log(salt)
        if (!user) {
            const hashedPassword = await bcrypt.hash(req.body.password, salt)
            console.log(hashedPassword)
            const hashedUser = await { ...req.body, password: hashedPassword }
            const result = await addUser(hashedUser)
            if (!result.acknowledged) {
                return res.status(404).json({message:"Error uploading information"})
            }
            return res.status(201).json({result,data:hashedUser});
        }
        res.status(400).json({message:"Email already exists"})
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"Internal Server Error"})
    }
})

router.post("/login", async(req, res) => {
    try {
        const user = await getUser(req.body.email)
        if (!user) {
             return res.status(400).json({message:"Invalid Credentials"})
        }
        const correctPassword = await bcrypt.compare(req.body.password, user.password)
        if (!correctPassword) {
             return res.status(400).json({message:"Invalid Email or password"})
        }
        const token = generateToken(user._id)
        console.log(token)
        res.send({data:user,token:token})
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"Internal Server Error"})
    }
})

router.get('/get-user', async (req, res) => {
   
    try {
        const studentData =  await getAll(req);
        // console.log(studentData)
    if(!studentData){
        return res.status(400).json({message:"no data availabe"})
    }
    res.status(200).json({data:studentData})
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"server error"})
    }
})

export const user_router = router;