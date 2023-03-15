var express = require('express');
var dotenv = require('dotenv');
var cors = require('cors');
const winston = require("winston");
const routerRegister = require("./routes/register");
const routerLogin = require("./routes/login");
const Joi = require("joi");
const fs = require('fs');

const userprofile = require("./routes/userprofile");
const formData = require('express-form-data');
const routerImage = require("./routes/imageupload");
const db = require('./db')

//env config
dotenv.config()
var app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1/register", routerRegister);
app.use("/api/v1/login", routerLogin);
app.use(formData.parse())
app.use("/api/v1/imageupload", routerImage);
app.use("/api/v1/user/userprofile", userprofile);

//Get method
app.get('/', (req, res, next) => {
    
    const secretKey = process.env.LOCALM_SECRET_KEY
        console.log("secretKey",secretKey)
        res.send("Welcome to LocalM new", secretKey)
})

function isNull(value) {
  console.log(value == null)
  console.log(typeof value === "string")
  console.log(value.trim().length === 0)
  return (value == null || (typeof value === "string" && value.trim().length === 0));
}

function isEmpty(val){
  return (val === undefined || val == null || val.length <= 0) ? true : false;
}

//Search
app.get('/api/v1/search/:userid', async (req, res, next) => {
  console.log('search', req.params.userid)
  if (isNaN(Number(req.params.userid))) {
    console.log("inside null check search")
    return res.status(500).json(
      {message: "Error: " + "Get users error"}
    );
  }
  
  try {
      //GET the user gender
    const results1 = await db.query('SELECT gender FROM users where userid = $1', [req.params.userid]);
    const gender = results1.rows[0].gender;
    console.log(gender)

    const results = await db.query('SELECT userid, firstname, age, educationlevel, community FROM users where gender != $1', [gender]);
      //console.log("search data ", results)

      res.status(200).json({
        status: "success",
        length: results.rows.length,
        data: {
          userdata: results.rows
        }
    })
  } catch (error) {
    res.status(500).json(
      {message: "Error: " + "Get users error"}
    );
    winston.error(error.message);
  }
});

function createqueryString (cols) {
  // Setup static beginning of query
  var query = ['SELECT userid, firstname, age, educationlevel, community FROM users'];
  
  // Add the WHERE
  query.push('where userid IN (' );
  // Create another array storing each set command
  // and assigning a number value for parameterized query
  var set = [];

  Object.keys(cols).forEach(function (key, i) {
    //console.log(cols[key])
    if (cols[key] != '') {
      set.push('$' + (i + 1));
    }
  });
  query.push(set.join(', '));

  query.push(' )');

  // Return a complete query string
  return query.join(' ');
}

app.get('/api/v1/getshortlist/:userid', async (req, res, next) => {
  console.log('getshortlist', req.params.userid)

  if (isNaN(Number(req.params.userid)) ) {
    console.log("inside null check")
    return res.status(500).json(
      {message: "Error: " + "Get users error"}
    );
  }
  console.log("after null check")

  try {

    const results2 = await db.query('SELECT shortlist FROM users WHERE userid = $1', [req.params.userid]);

    const shortlistuserids = results2.rows[0].shortlist;
    console.log("shortlistuserids: ",shortlistuserids.length)
    /*console.log({shortlistuserids}, typeof({shortlistuserids}))
    console.log( ...shortlistuserids.join(',').split(' '))
    console.log({...shortlistuserids.join(',').split(' ')}[0])
    console.log(Object.values(shortlistuserids), typeof(Object.values(shortlistuserids)))
    console.log("here",  Array.from(shortlistuserids))
    console.log("here 2",   [shortlistuserids.join(',')])*/

    
   /* const results = await db.query('SELECT userid, firstname, age, educationlevel, community FROM users where userid IN ($1,$2, $3) \
                           ',   [ shortlistuserids[0], shortlistuserids[1], shortlistuserids[2] ]
                         );*/

    if (shortlistuserids.length == 0) {
      return res.status(200).json({
               status: "success",
               length: 0,
               data: {
                 userdata: []
               }
             })
    }
    var query1 = createqueryString(shortlistuserids);
    console.log("query:", query1)
 
    // Turn req.body into an array of values
    var colValues = Object.keys(shortlistuserids).map(function (key) {
      if (!isEmpty(shortlistuserids[key]) ) {
        return shortlistuserids[key];
      }
    }).filter(function (val) {
      if (!isEmpty(val) ) {
        return val;
      }
    });    

    console.log("colValues:", colValues)
    
    const results = await db.query(query1, colValues);
    // /  console.log("search data ", results)
      return res.status(200).json({
               status: "success",
               length: results.rows.length,
               data: {
                 userdata: results.rows
               }
             })
  } catch (error) {
    res.status(500).json(
      {message: "Error: " + "Get users error"}
    );
    winston.error(error.message);
  }
});

// get customer profile
app.get('/api/v1/user/:userid', async (req, res) => {
  let userid = req.params.userid
  if (isNaN(Number(req.params.userid))) {
    console.log("remove from list")
    return res.status(500).json(
      {message: "Error: " + "Get users error"}
    );
  }
  console.log("get user")
  try {
    results = await db.query('select firstname, age, educationlevel, jobstatus, city, state, language, religion, community, phonenumber, email, bio, \
     facebook, instagram from users where users.userid = $1', [userid]);
      //console.log("get customer profile debug 2 ")
      res.status(200).json({
        status: "success",
        length: results.rows.length,
        data: {
          userdata: results.rows
        }
    })
  } catch (error) {
    res.status(500).json(
      {message: "Error: " + "Get users error"}
    );
    winston.error(error.message);
  }
})

//https://www.commandprompt.com/education/postgresql-array_append-function-with-examples/#:~:text=Conclusion-,Postgres%20provides%20an%20ARRAY_APPEND()%20function%20that%20is%20used%20to,the%20end%20of%20the%20array.
//https://github.com/brianc/node-postgres/issues/2268
// add userid to shortlist
app.patch('/api/v1/user/:userid/addtoshortlist', async (req, res) => {
  console.log("POST to SHORTLIST:", req.params.userid, req.body.useridtoadd)

  if (isNaN(Number(req.params.userid))) {
    console.log("remove from list")
    return res.status(500).json(
      {message: "Error: " + "Get users error"}
    );
  }

  const count = await db.query("SELECT count(shortlist) from users where userid = $1" , [req.params.userid])

  console.log('count', count.rows[0].count)

  if (count.rows[0].count == 0) {
    const results = await db.query("UPDATE users SET shortlist=$1::INT[] where userid = $2",
                 [[`${req.body.useridtoadd}`], req.params.userid]);
  } else {
    const results = await db.query("UPDATE users SET shortlist = ARRAY_APPEND(shortlist, $1) WHERE userid = $2",
                 [`${req.body.useridtoadd}`, req.params.userid ]);
  }

           // console.log("resuls", results)

  res.status(201).json({
      status: "success",
    // // data: {
       //   restaurant: results.rows[0],
    //  }
  })
})

app.patch('/api/v1/user/:userid/removefromshortlist', async (req, res) => {
  console.log("REMOVE FROM SHORTLIST:", req.params.userid, req.body)

  if (isNaN(Number(req.params.userid))) {
    console.log("remove from list")
    return res.status(500).json(
      {message: "Error: " + "Get users error"}
    );
  }

 // const count = await db.query("SELECT count(shortlist) from users where userid = $1" , [req.params.userid])

 // console.log('count', count.rows[0].count)

 // if (count.rows[0].count == 0) {
  //  const results = await db.query("UPDATE users SET shortlist=$1::INT[] where userid = $2",
  //               [[`${req.body.useridtoremove}`], req.params.userid ]);
//  } else {
    const results = await db.query("UPDATE users SET shortlist = ARRAY_REMOVE(shortlist, $1) WHERE userid = $2",
                 [`${req.body.useridtoremove}`, req.params.userid ]);
 // }

  res.status(201).json({
      status: "success",
    // // data: {
       //   restaurant: results.rows[0],
    //  }
  })
})
  
//server listening
const port = process.env.PORT || 8000
app.listen(port , () => {
  console.log(`server running on port ${port}`)
});

module.exports = app;

