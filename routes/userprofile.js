const express = require("express");
const winston = require("winston");
const router = express.Router();
const fs = require('fs')
const db = require('../db')
const auth = require('../middleware/auth')

//Search
router.get('/:userid/profiledata', auth, async (req, res, next) => {
  console.log('get profiledata', req.params.userid)
  try {
    results = await db.query('SELECT firstname, lastname, bio, email, phonenumber, instagram, facebook, longitude, shortlist, uuid \
                              FROM users \
                              WHERE userid = $1', [req.params.userid]);
     // console.log("profile data ", results)
      res.status(200).json({
        status: "success",
        length: results.rows.length,
        data: {
          profiledata: results.rows
        }
    })
  } catch (error) {
    res.status(500).json(
      {message: "Error: " + "Get profile data"}
    );
    winston.error(error.message);
  }
});

//router.post('/:username/geodata', async (req, res) => {
router.patch('/:userid/:geodata', async (req, res, next) => {
    if (req.params.geodata === 'editprofile' || req.params.geodata === 'editbio') {
      return next()
    }
    console.log("here", req.params)
    const [lat, long] = req.params.geodata.split(',')
    console.log('geo data save', lat, long, req.params.userid)
    try {
        //const user = await User.findById(req.params.userid);
        const userExists = await db.query('SELECT EXISTS(SELECT 1 FROM users WHERE userid = $1)', [req.params.userid]);

        if (!userExists.rows[0].exists) {
          //return res.status(404).send("User not found...");
          res.status(404).json({
            message: "User not found..",
          })
          return;
        }

        await db.query("UPDATE users SET latitude=$1, longitude=$2 where userid = $3",
        [
          lat,
          long,
          req.params.userid
        ]);

        res.status(200).json({
          status: "success"
        })
    } catch (error) {
        res.status(500).json(
          {message: "flag message patch Error"}
        );
        winston.error(error.message);
    }
});

//https://stackoverflow.com/questions/21759852/easier-way-to-update-data-with-node-postgres

function isEmpty(val){
  return (val === undefined || val == null || val.length <= 0) ? true : false;
}

function editProfileByID (id, cols) {
  // Setup static beginning of query
 // console.log("editProfileByID", cols)
  var query = ['UPDATE users'];
  query.push('SET');

  // Create another array storing each set command
  // and assigning a number value for parameterized query
  var set = [];
  let j = 0;
  Object.keys(cols).forEach(function (key, i) {
    if (!isEmpty(cols[key]) ) {                  //&& cols[key] == false cols[key] != '' 
      set.push(key + ' = ($' + (j + 1) + ')');
      j = j + 1;
    }
  });
  query.push(set.join(', '));

  // Add the WHERE statement to look up by id
  query.push('WHERE userid = ' + id );

  // Return a complete query string
  return query.join(' ');
}

router.patch('/:userid/editprofile', auth, async (req, res, next) => {
  if (req.params.editdata === 'editbio') {
    return next()
  }
 // console.log('edit profile', req.body.editdata)
  try {
    // Setup the query
    var query1 = editProfileByID(req.params.userid, req.body.editdata);
    //console.log("query1", query1)

    // Turn req.body into an array of values

    var colValues = Object.keys(req.body.editdata).map(function (key) {
      if (!isEmpty(req.body.editdata[key])) {
        return req.body.editdata[key];
      }
    })
    .filter(function (val) {
      if (!isEmpty(val)) {
        return val || val == false;
      } 
    });
  //  console.log("colValues", colValues)
    results = await db.query(query1, colValues);
    
    /*const result = await db.query("UPDATE users SET instagram = $1, facebook = $2, bio = $3 \
                     where userid = $4",
    [ 
      req.body.editdata.instagram, 
      req.body.editdata.facebook,
      req.body.editdata.bio,
      req.params.userid
    ]);*/
    //  console.log("debug 5")
    res.status(201).json({
      status: "success",
      message: "Edit data successful"
    })
  } catch (error) {
    res.status(500).json(
      {message: "Error: " + "Post edit data"}
    );
    winston.error(error.message);
  }
})

router.patch('/:userid/editbio', auth, async (req, res, next) => {
    console.log('edit bio', req.body.editdata)
   try {
     const result = await db.query("UPDATE users SET bio = $1 where userid = $2",
     [ 
       req.body.editdata.bio,
       req.params.userid
     ]);

     res.status(201).json({
       status: "success",
       message: "Edit bio successful"
     })
   } catch (error) {
     res.status(500).json(
       {message: "Error: " + "Post edit bio"}
     );
     winston.error(error.message);
   }
})

router.post('/:username/profiledata', async (req, res) => {
    console.log('profile data save')
});

module.exports = router;
  