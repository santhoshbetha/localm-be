const haversine = require('haversine-distance')

//const a = { latitude: 37.8136, longitude: 144.9631 }
//const b = { latitude: 33.8650, longitude: 151.2094 }

const a = { latitude: 30.400070, longitude: -97.705230 } //folio
const b = { latitude: 33.974970, longitude: -84.075810 } //sugarloaf grove

console.log(haversine(a, b)) //  (in meters)

console.log(haversine(a, b)/1609.344) //  (in miles)

const a2 = { latitude: 51.3168, longitude:0.56  } //folio
const b2 = { latitude: 55.9533, longitude: -3.1883 } //sugarloaf grove

console.log("a2 to b2:",haversine(a2, b2)/1000) //  (in kilometers)