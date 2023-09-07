import express from "express"
import bcrypt from "bcryptjs"
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { addUser, forgotPassword, generateToken, getUser, getUserByID, resetPassword } from "../controller/user-controller.js";
const router = express.Router()

const transporter = nodemailer.createTransport({
  service: 'outlook',
  auth: {
    user: 'resetpasswordalert@outlook.com',
    pass: process.env.PASSWORD
  }
});

// check if user exists via mail / username
router.get("/getUser", async (req,res) => {
  try{
    console.log("get a user"); 
  
    const user = await getUser(req.body);
    
    if(!user){
      return res.status(404).json({message:"User does not exist"})
    }
    res.status(200).json({data:user})

  }
  catch(err){
    console.log(err);
      res.status(500).json({ message: "Internal server error" });
  }
})

// check if user exists via _id
router.get("/getUserId/:id", async (req,res) => {
  try{
    const {id} = req.params;
    console.log("get a user id");  
    const user = await getUserByID(id);

    if(!user){
      return res.status(404).json({message:"User does not exist"})
    }
    res.status(200).json({data:user})

  }
  catch(err){
    console.log(err);
      res.status(500).json({ message: "Internal server error" });
  }
})

// add new user - with email, username, password
router.post("/signup", async (req, res) => {
    try {
      //hashing user password. 
      console.log("adding user");
      const salt = await bcrypt.genSalt(10);
      const user = await getUser({email: req.body.email});
      //validating if user already exist
      if(!user){
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      const hashedUser = await { ...req.body, password: hashedPassword };
      const result = await addUser(hashedUser);
      // checking mongodb acknowledgement
      if(!result.acknowledged){
          return res.status(404).json({message:"Error uploading user information"})
      }
      return res.status(201).json({data:hashedUser.username});
      }
      res.status(400).json({message:"Email already exist"});
  
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // forgot password request, creates temporary token and emails reset link 
router.post("/forgot-password", async(req, res) => {
    try {
        //user exist validations
        const user = await getUser(req.body);
        if(!user){
            return res.status(404).json({message:"Invalid Email"})
        }
       
        const secret = process.env.SECRET_KEY + user._id;
        const token = generateToken(user._id, secret); 
        
        const link = `http://localhost:3000/authorize/${user._id}/${token}`;
        // const link = `https://resilient-puppy-b7932d.netlify.app/authorize?id=${user._id}&token=${token}`;
        const mailOptions = {
          from: 'resetpasswordalert@outlook.com',
          to: user.email,
          subject: 'Password reset link sent',
          text: `Click on the below link to reset your password. This password reset link is valid for 10 minutes after which link will be invalid. ${link}`
        };
        const result = await forgotPassword(user.email,{password:secret}) 
        if(!result.lastErrorObject.updatedExisting){
          return res.status(400).json({message:"Error setting verification"})
        }
        else{
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log("Email not sent",error);
              res.status(400).send({ message:"Error sending email", reset:result.lastErrorObject.updatedExisting}); 
            } else {
              console.log('Email sent: ' + info.response); 
              res.status(200).send({ result:result.lastErrorObject.updatedExisting}); 
            }
          });
        }
        
      } 
      catch(error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // verifying and authorizing token to allow reset password
    router.get("/forgot-password/authorize/:id/:token", async (req,res) => {
      try{
        const {id,token} = req.params; 
        //console.log(id, token);
        if(!id){
          return res.status(404).json({message:"User does not exist"})
        }
        if(!token){
          return res.status(404).json({message:"Invalid authorization"})
        }
        const user = await getUserByID(id);
        if(!user){
            return res.status(404).json({message:"Invalid Email"})
        }
        try{
          const decode = jwt.verify(token, user.password) 
        //console.log(decode); 
        if(decode.id){
          res.status(200).json({decode:decode})
        }
        }
        catch(err){
          console.log(err);
          res.status(500).json({ message: "Token error", error:err });
        }
        
      }
      catch(err){
         console.log(err);
          res.status(500).json({ message: "Internal server error" });
      }
    })


// Resetting password in DB
router.post('/reset-password/:id', async(req,res) => {      
  try{
    const {id} = req.params;
    const user = await getUserByID(id);
    const salt = await bcrypt.genSalt(10);
        if(!user){
            return res.status(404).json({message:"Invalid Email"})
        }
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const result = await resetPassword(id,{password: hashedPassword})
        if(!result.lastErrorObject.updatedExisting){
          return res.status(400).json({message:"Error resetting password"})
        }
        res.status(200).send({ result:result.lastErrorObject.updatedExisting, user:user}); 
  }
  catch(err){
    console.log(err);
     res.status(500).json({ message: "Internal server error" });
 }
})

//login to check credentials
router.post("/login", async(req, res) => {
  try {
    //user exist validations
    const user = await getUser({email: req.body.email});
    if(!user){
        return res.status(404).json({message:"Invalid Email"})
    }
    // validating password
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if(!validPassword){
        return res.status(400).json({message:"Invalid Password"})
    }
    //const token = generateToken(user._id);
    res.status(200).json({ data: user.username });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
export const user_router = router;