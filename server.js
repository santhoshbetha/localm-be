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
const db = require('./db');
const auth = require('./middleware/auth')

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
    res.send("Welcome to LocalM")
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

function createSearchQuery(cols) {
  var query = ['SELECT userid, shortid, firstname, age, educationlevel, community FROM users where gender !='];
  query.push('$1');

  // Create another array storing each set command
  // and assigning a number value for parameterized query
  var set = [];
  let j = 1;
  Object.keys(cols).forEach(function (key, i) {
    if (cols[key] != 'All') {
      set.push('AND ' + key + ' = ($' + (j + 1) + ')');
      j = j + 1;
    }
  });
  query.push(set.join(' '));

  // Add the AND age BETWEEN $X AND $Y
  query.push('AND age BETWEEN ' + '($' + (j + 1) + ')' + ' AND ' +  '($' + (j + 2) + ')');
  
  // Add earth_distance check
  query.push(' AND earth_distance(ll_to_earth (' + '($' + (j + 3) + ')' + ',' + '($' + (j + 4) + ')' +'), ll_to_earth (latitude, longitude)) < ' + '($' + (j + 5) + ')');

  // Return a complete query string
  return query.join(' ');
}

//Search
app.post('/api/v1/search/:userid', auth, async (req, res, next) => {
  console.log('search userid:', req.params.userid)
  if (isNaN(Number(req.params.userid)) || isEmpty(req.params.userid)) {
    return res.status(500).json(
      {message: "Error: " + "Search error"}
    );
  }

  //console.log("search data:", req.body.searchdata)
  try {
    //GET the user gender /longitude /latitude
    const results1 = await db.query('SELECT gender, latitude, longitude FROM users where userid = $1', [req.params.userid]);
    const gender = results1.rows[0].gender;
    const lat = results1.rows[0].latitude;
    const long = results1.rows[0].longitude;

    var cols = {
                religion: req.body.searchdata?.religion,
                language: req.body.searchdata?.language,
                educationlevel: req.body.searchdata?.educationlevel,
                jobstatus: req.body.searchdata?.jobstatus == true ? 't' : 'f',
               }

    var query1 = createSearchQuery(cols);

    var colValues = Object.keys(cols).map(function (key) {
      if (cols[key] != 'All') {
        return cols[key];
      }
    }).filter(function (val) {
      if (!isEmpty(val)) {
        return val || val == false;
      } 
    });
    colValues.push(req.body.searchdata?.agefrom)
    colValues.push(req.body.searchdata?.ageto)
    colValues = [gender, ...colValues, lat, long, req.body.searchdata?.searchdistance];  //prepend gender

    console.log("query1:", query1)
    console.log("colValues:", colValues)
    const results = await db.query(query1 , colValues);

   /* const results = await db.query('SELECT userid, firstname, age, educationlevel, community FROM users where gender != $1 \
                  AND religion = $2 AND language = $3 AND educationlevel = $4 AND jobstatus = $5 \
                  AND age BETWEEN $6 AND $7', 
                  [
                    gender,
                    req.body.searchdata?.religion,
                    req.body.searchdata?.language,
                    req.body.searchdata?.educationlevel,
                    req.body.searchdata?.jobstatus == true ? 't' : 'f',
                    req.body.searchdata?.agefrom,
                    req.body.searchdata?.ageto
                  ]);*/
     // console.log("results:", results)
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
  var query = ['SELECT userid, shortid, firstname, age, educationlevel, community FROM users'];
  
  // Add the WHERE
  query.push('where shortid IN (' );
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

app.get('/api/v1/getshortlist/:userid', auth, async (req, res, next) => {
  console.log('getshortlist', req.params.userid)

  if (isNaN(Number(req.params.userid)) ) {
    console.log("inside null check")
    return res.status(500).json(
      {message: "Error: " + "Get users error"}
    );
  }

  try {
    let results2 = []
    results2 = await db.query('SELECT shortlist FROM users WHERE userid = $1', [Number(req.params.userid)]);
    const shortlistuserids = results2?.rows[0].shortlist;
    /*console.log({shortlistuserids}, typeof({shortlistuserids}))
    console.log( ...shortlistuserids.join(',').split(' '))
    console.log({...shortlistuserids.join(',').split(' ')}[0])
    console.log(Object.values(shortlistuserids), typeof(Object.values(shortlistuserids)))
    console.log("here",  Array.from(shortlistuserids))
    console.log("here 2",   [shortlistuserids.join(',')])*/

   /* const results = await db.query('SELECT userid, firstname, age, educationlevel, community FROM users where userid IN ($1,$2, $3) \
                           ',   [ shortlistuserids[0], shortlistuserids[1], shortlistuserids[2] ]
                         );*/
    if (results2.rows[0].shortlist == null || shortlistuserids?.length == 2) {
      return res.status(200).json({
               status: "success",
               length: 0,
               data: {
                 userdata: []
               }
             })
    }
    const shortlistuseridslist = shortlistuserids.replace('{', '').replace('}', '').split(',');
    var query1 = createqueryString(shortlistuseridslist);
    //console.log("query:", query1)
 
    // Turn req.body into an array of values
    var colValues = Object.keys(shortlistuseridslist).map(function (key) {
      if (!isEmpty(shortlistuseridslist[key]) ) {
        return shortlistuseridslist[key];
      }
    }).filter(function (val) {
      if (!isEmpty(val) ) {
        return val;
      }
    });   
    
    const results = await db.query(query1, colValues);
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

// get user profile
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
    results = await db.query('select firstname, age, educationlevel, jobstatus, city, state, language, religion, community, \
       phonenumber, email, bio, showphone, showinstagram, showfacebook, showcommunity, \
       facebook, instagram from users where users.userid = $1', [userid]);
      //console.log("get user profile debug 2 ")
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
  console.log("POST to SHORTLIST:", req.params.userid, req.body.shortidtoadd)

  if (isNaN(Number(req.params.userid))) {
    console.log("remove from list")
    return res.status(500).json(
      {message: "Error: " + "Get users error"}
    );
  }

  const count = await db.query("SELECT count(shortlist) from users where userid = $1" , [req.params.userid])

  console.log('count', count.rows[0].count)

  if (count.rows[0].count == 0) {
    const results = await db.query("UPDATE users SET shortlist=$1::SHORTKEY[] where userid = $2",
                 [[`${req.body.shortidtoadd}`], req.params.userid]);
  } else {
    const results = await db.query("UPDATE users SET shortlist = ARRAY_APPEND(shortlist, $1) WHERE userid = $2",
                 [`${req.body.shortidtoadd}`, req.params.userid ]);
  }
  res.status(201).json({
      status: "success"
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
                 [`${req.body.shortidtoremove}`, req.params.userid ]);
 // }

  res.status(201).json({
      status: "success"
  })
})

function isNumber(n) { 
  return !isNaN(parseFloat(n)) && !isNaN(n - 0) 
}

const digits = (num, count = 0) => {
  if(num){
     return digits(Math.floor(num / 10), ++count);
  };
  return count;
};

//Profile Search ${url}/query/${searchtext}
app.get('/api/v1/query', auth, async (req, res, next) => {
  console.log('query:', req.query.search)
  var result;
  try {
    if (isNumber(req.query.search)) {
      //phone number
      if (digits(Number(req.query.search)) == 10) {
        result = await db.query('SELECT userid, shortid, firstname \
                 FROM users WHERE phonenumber = $1', [Number(req.query.search)]);
      //user id
      } else {
        result = await db.query('SELECT userid, shortid, firstname \
                 FROM users WHERE userid = $1', [Number(req.query.search)]);
      }
    } else {
      // email
      //const city = req.query.search.toLowerCase()
      result = await db.query('SELECT userid, shortid, firstname \
                     FROM users WHERE email = $1', [req.query.search]);
    }
    console.log("search result", result.rows.length)
    return res.status(200).json({
      status: "success",
      length: result.rows.length,
      data: {
        userdata: result.rows
      }
    })
  } catch (error) {
    res.status(500).json(
      {message: "Error: " + "query error"}
    );
    winston.error(error.message);
  }
})

  
//server listening
const port = process.env.PORT || 8000
app.listen(port , () => {
  console.log(`server running on port ${port}`)
});

module.exports = app;

