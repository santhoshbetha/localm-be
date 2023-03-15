const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user");
const Joi = require("joi");
const express = require("express");
const db = require('../db');
const winston = require("winston");

//export const routerLogin = express.Router();
const routerLogin = express.Router();

routerLogin.get('/', (req, res, next) => {
    res.send("Welcome to LocalM Login")
})

routerLogin.post('/', async (req, res) => {
  /*  const schema = Joi.object({
        email: Joi.string().min(10).max(50).email().required(),
        password: Joi.string().min(6).max(1024).required()
    })*/

   // const { error } = schema.validate(req.body)
   // if (error) return  res.status(400).send(error.details[0].message)  //400 - client error
   console.log("POST LOGIN SAN HERE")
    try {
       // console.log("here 1", req.body)
        //user exists?
        //let user = await User.findOne({email: req.body.email});

       let user = await db.query('SELECT userid, password FROM users where email = $1', [req.body.email]);
       console.log("POST LOGIN 2")
       // console.log("here 1.1", user)
        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password",
            });
        }
        console.log("POST LOGIN 3", user.rows[0].password)
        //  console.log("here 2")
        // validate password
        const validpassword = await bcrypt.compare(
            req.body.password, 
            user.rows[0].password
        );
        console.log("POST LOGIN 4" )
        if (!validpassword) {
            console.log("POST LOGIN INVALID" )
            //return res.status(400).send("Invalid email or password 2");
            return res.status(400).json({
                message: "Invalid email or password",
            });
        }
        console.log("POST LOGIN 5")
      //  console.log("here 3", { _id: user._id, firstname: user.firstname, email: user.email})

        const secretKey = process.env.LOCALM_SECRET_KEY
        const token = await jwt.sign({ _id: user.rows[0].userid, firstname: user.firstname, email: user.email}, secretKey);

        console.log("POST LOGIN 6")
        
        //   console.log("here 4",token)
        //res.send(token)  //token is printed here  which is used for auth in middle ware
        res.status(200).json({
            status: "success",
            token: token,
        })

        console.log("POST LOGIN 7")
    } catch(error) {
        res.status(500).json(
            {message: error.message}
          );
        winston.error(error.message);
    }
});

module.exports = routerLogin;