import { client } from "../db.js";
import { ObjectId } from "bson";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()
export function addUser(data) {
     return client
        .db("User")
        .collection("user-credential")
        .insertOne(data)
}
export function getUser(email) {
    return client
        .db("User")
        .collection("user-credential")
        .findOne({email:email})

}


export function getAll() {
     return client
        .db("User")
        .collection("user-credential")
        .find()
        .toArray()
}
export function generateToken(id) {
    return jwt.sign(
    { id },
    process.env.SECRET_KEY,
        { expiresIn: "30d" }
    )
}