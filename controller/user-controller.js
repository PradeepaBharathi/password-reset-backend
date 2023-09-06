import {client} from "../db.js";
import { ObjectId } from "bson"; 
import jwt from "jsonwebtoken";

export function addUser(data){
    return client
    .db("userData")
    .collection("users")
    .insertOne(data)
}

export function getUser(data){
    return client
    .db("userData")
    .collection("users")
    .findOne(data)
} 

export function getUserByID(id){
    return client
    .db("userData")
    .collection("users")
    .findOne({_id: new ObjectId(id)})
} 

export function resetPassword(id, data){
    return client
    .db("userData")
    .collection("users")
    .findOneAndUpdate({_id: new ObjectId(id)}, {$set:data})
}

export function forgotPassword(email, data){
    return client
    .db("userData")
    .collection("users")
    .findOneAndUpdate({email:email}, {$set:data})
}

export function generateToken(id,secret){
    return jwt.sign(
        {id},
        secret,
        {expiresIn:"10m"}
    )
}