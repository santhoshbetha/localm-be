const mongoose = require("mongoose");

require("dotenv").config();
/*import { 
  toLatLon, toLatitudeLongitude, headingDistanceTo, moveTo, insidePolygon 
} from 'geolocation-utils'*/

const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true, minlength: 3, maxlength: 30 },
  lastname: { type: String, required: true, minlength: 3, maxlength: 30 },
  age: Number,
  gender: String,
  educationlevel: String,
  jobStatus: Boolean,
  city: String,
  state: String,
  language: String,
  religion: String,
  community: String,
  phonenumber: String,
  //userImg: String,
  email: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 200,
    unique: true,
  },
  password: { type: String, required: true, minlength: 3, maxlength: 1024 },
  coordinates: {
    lat: Number, 
    long: Number
  },
  bio: String,
  facebook: String,
  twitter: String,
  instagram: String

});

const User = mongoose.model("User", userSchema);
exports.User = User;

//https://www.npmjs.com/package/geolocation-utils

//https://www.delftstack.com/howto/mongodb/mongodb-schema/
