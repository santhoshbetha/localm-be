const express = require("express");
const fs = require('fs')
const AWS = require('aws-sdk');
const winston = require("winston");

const ID = 'AKIAWYIPHXDJSS2V77WA';
const SECRET = '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';
const BUCKET_NAME = 'localm';

const routerImage = express.Router();

//Access Key ID:AKIAWYIPHXDJSS2V77WA
//Secret Access Key: 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

const s3 = new AWS.S3({
  //   region: 'us-east-1',
    accessKeyId: ID,
    secretAccessKey: SECRET
});

const uploadFile =  async (userid, filename, path, type) => {
    // Read content from the file
    const fileContent = fs.readFileSync(path);

    // Setting up S3 upload parameters
    const params = {
        Bucket: BUCKET_NAME,
        Key: `${userid}/${filename}`, // File name you want to save as in S3
        Body: fileContent,
        //ACL: 'public-read',
        ContentType: type
    };

    // Uploading files to the bucket
    /*s3.upload(params, function(error, data) {
        if (error) {
            console.log('upload error', error)
            throw error;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
        return 3;
    });*/

    const uploadedImage = await s3.upload(params).promise()
    console.log(`File uploaded successfully. ${uploadedImage.Location}`);
    return uploadedImage.Location
};

routerImage.get('/', (req, res, next) => {
  res.send("Welcome to LocalM Image")
})

/*
routerImage.post('/', (req, res, next) => {
  console.log("POST image-upoad 1" )
  res.send("Welcome to LocalM Image POST")
})*/

routerImage.post('/:userid/:imageid',  (req, res, next) => {
    var re = /(?:\.([^.]+))?$/;
    let userid = req.params.userid
    let imageid = req.params.imageid
    console.log("here", userid, imageid)
    let imagename
    switch (imageid) {
      case '1':
        imagename = 'first'
        break;
      case '2':
        imagename = 'second'
        break;
      case '3':
        imagename = 'third'
        break;
      default:
        console.log(`Sorry, imageid invalid.`);
        break;
    }
    console.log("POST image-upoad ",  req.files )
    const values = Object.values(req.files)
    console.log("POST image-upoad values=", values )
    //const promises = values.map(image => cloudinary.uploader.upload(image.path))
    const promises = values.map( (image) => {
      var ext = re.exec(image.originalFilename)[1]; 
      let filename = imagename;// + '.' + ext;
      //console.log("filename", filename)
      let loc = uploadFile(userid, filename/*image.originalFilename*/, image.path, image.type)
      //console.log("k=", loc )
     // return loc;
    })
    console.log("promises=", promises)
 //   res.status(400);
    
    Promise
      .all(promises)
      .then(results => {
        console.log("POST image-upoad 3", promises)
        console.log('results p', results)
        res.json({ imges_url: results })  //.json converts data to JSON
       })
      .catch((error) => {
        winston.error(error.message);
        res.status(400).json(error)
      })
})
  
module.exports = routerImage;
  