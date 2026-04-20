const astronomy = require('astronomy-engine');

const date = new Date();
const sunEqj = astronomy.GeoVector(astronomy.Body.Sun, date, true);
const sunEcliptic = astronomy.Ecliptic(sunEqj);

console.log("Sun:", sunEcliptic);

const moonEqj = astronomy.GeoVector(astronomy.Body.Moon, date, true);
const moonEcliptic = astronomy.Ecliptic(moonEqj);

console.log("Moon:", moonEcliptic);
