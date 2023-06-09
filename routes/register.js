const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const express = require("express");
const db = require('../db');
const winston = require("winston");

//export const routerRegister = express.Router();
routerRegister = express.Router();

function calcAge(dateString) {
  var birthday = +new Date(dateString);
  return ~~((Date.now() - birthday) / (31557600000));
}

routerRegister.post('/', async (req, res) => {
  console.log("REGISTER POST", req.body.email)
   /* const schema = Joi.object({
        firstname: Joi.string().min(6).max(15).required(),
        lastname: Joi.string().min(3).max(15).required(),
        email: Joi.string().min(10).max(50).email().required(),
        password: Joi.string().min(6).max(1024).required()
    })*/

 //   const { error } = schema.validate(req.body)
  //  if(error) return  res.status(400).send(error.details[0].message)  //400 - client error
  //  console.log("POST REGISTER SAN HERE")
    try {
         //user exists?
        /*let user = await User.findOne({email: req.body.email});*/
        //SELECT COUNT(*) FROM address WHERE address_id = 100;
       // const results = await db.query('COUNT(*) FROM users WHERE email = $1', [req.body.email]);
        const userExists = await db.query('SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 or phonenumber = $2)', 
            [
              req.body.email,
              req.body.phonenumber
            ]);
            
        console.log("userExists :", userExists.rows[0].exists)
        if (userExists.rows[0].exists) {
          return res.status(400).send("User with that email already exists");
        }
                
        //Create new user
        const { gender, educationlevel, jobstatus, city, state, 
                language, religion, community, 
                phonenumber, email, password
              } = req.body;

    //    console.log("req.body", req.body)
        let firstname = req.body.firstName
        let lastname = req.body.lastName

        //Hash the password 
        const salt = await bcrypt.genSalt(10);

        const passwordb = await bcrypt.hash(password, salt);

        const dateofcreation = (new Date()).toISOString().substring(0, 10).toString();
        const dateofbirth = req.body.dob;
        
        const age = calcAge(dateofbirth.toString())
        console.log("dateofbirth: ", dateofbirth, "age: ", age)
        //await user.save();
        const user = await db.query("INSERT INTO users (userid, firstname, lastname, dateofbirth, age, gender, educationlevel, jobstatus, city, state, language, \
          religion, community, phonenumber, email, password, dateofcreation) \
          VALUES (nextval('user_seq'), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING userid",
          [ 
            firstname,
            lastname,
            dateofbirth,
            age,
            gender,
            educationlevel,
            jobstatus,
            city,
            state,
            language,
            religion,
            community,
            phonenumber,
            email,
            passwordb,
            dateofcreation
          ]);
        
        const secretKey = process.env.LOCALM_SECRET_KEY

        const token = jwt.sign({ _id: user.rows[0].userid, firstname: firstname, email: email}, secretKey);

        //res.send(token)  //token is printed here  which is used for auth in middle ware
        res.status(200).json({
          status: "success",
          token: token,
        })

    } catch(error) {
      console.log("Register Err", error)
      res.status(500).json(
        {message: error.message}
      );
      winston.error(error.message);
    }
});
module.exports = routerRegister
