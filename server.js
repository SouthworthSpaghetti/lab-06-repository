'use-strict'
require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

const superagent = require('superagent');


// let newArr = [];

const pg = require('pg');//POSTGRES
const client = new pg.Client(process.env.DATABASE_URL);

const PORT = process.env.PORT || 3001;
const GEOCODE_API_KEY = process.env.GEOCODING;
const DARKSKY_API_KEY = process.env.DARKSKY;
const YELP_API_KEY = process.env.YELP;
const THEMOVIEDB_API_KEY = process.env.THEMOVIEDB;
const EVENTFUL_API_KEY = process.env.EVENTFUL;
const TRAILS_API_KEY = process.env.TRAILS;

app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/movies', movieHandler);
// app.get('/events', partyHandler);
app.get('/trails', hikeHandler);
app.get('/yelp', reviewsHandler);

function locationHandler(request, response) {
  // console.log(request.query);
  let city = request.query.city;
  // let geoData = require('./data/geo.json');
  const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json`;
  // console.log(url);

  //if//!check SQL//FEB20

  let SQL = 'SELECT * FROM city WHERE search_query LIKE ($1) LIMIT 1;';
  let safeValue = [city];
  let newArr = [];
  client.query(SQL, safeValue)
    .then(results => {
      console.log(results.rows, SQL);
      newArr = results.rows;
      // let dataBaseResults = checkDatabase(city);
      if (!newArr.length) {//results needs some sort of length check
        // console.log("?>?>?>?>", newArr);
        console.log("/./././.");
        superagent.get(url)
          .then(data => {
            const geoData = data.body[0];
            let dataObj = new City(city, geoData);

            response.send(dataObj);
          })
          .catch(() => {
            console.error('There was an error on dataBaseResults');
          });
      } else {
        // console.log("*&*&*&*&", newArr);
        response.send(newArr[0]);
      }
    })
    .catch((error) => console.error('error: ', error));
}

function weatherHandler(request, response) {
  let reqData = request.query;
  // let geoData = require('./data/geo.json');
  const url = `https://api.darksky.net/forecast/${DARKSKY_API_KEY}/${reqData.latitude},${reqData.longitude}`;
  // const url = `https://api.darksky.net/forecast/${DARKSKY_API_KEY}/${mapCoordinates}`;
  // console.log(url);

  superagent.get(url)
    .then(tempData => {
      const weatherData = tempData.body.daily.data;
      let dataObj = weatherData.map(day => new Sky(day));
      response.send(dataObj);
    })
    .catch(() => {
      console.error('There was an error upon rendering weather');
    });
  }
  
  function movieHandler(request, response) {
    // console.log("9898989898", request.query);
    let reqData = request.query;
    // // // let geoData = require('./data/geo.json');
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${THEMOVIEDB_API_KEY}&language=en-US&page=1&include_adult=false&query=${reqData.search_query}`;
    // console.log(url);
    
    superagent.get(url)
    .then(movieObj => {
      // console.log("POPOPOPOP", movieObj.body.results[0]);
      const movieData = movieObj.body.results[0];
      let dataObj = [];
      dataObj.push(new Movie(movieData));
      // console.log('ererere', dataObj)
      // let dataObj = movieData.map(movie => new Movie(movie));//FEB21
      response.send(dataObj);
    })
    .catch(() => {
      // console.error('There was an error', request, response);
    });
}

function reviewsHandler(request, response) {
  // console.log("9898989898", request.query);
  let reqData = request.query;
  // // // let geoData = require('./data/geo.json');
  const url = `https://api.yelp.com/v3/businesses/search?location=${reqData.search_query}`;
  console.log(url);

  superagent.get(url)
    .set('Authorization', `Bearer ${YELP_API_KEY}`)
    .then(yelpObj => {
      console.log("POPOPOPOP", yelpObj.body);
    //   const resultsData = movieObj.body.results[0];
      let dataObj = yelpObj.body.businesses.map(resultsData => {
        return new Review(resultsData);
      });
    //   console.log('ererere', dataObj)
    //   // let dataObj = movieData.map(movie => new Movie(movie));//FEB21
      response.send(dataObj);
    })
    .catch(() => {
      console.error('There was an error with Yelp');
    });
}

// function partyHandler(request, response) {
//   // console.log(request.query);
//   let reqData = request.query;
//   // // let geoData = require('./data/geo.json');
//   const url = `http://api.eventful.com/json/events/search?app_key=${EVENTFUL_API_KEY}&where=${reqData.latitude},${reqData.longitude}&within=25`;
//   console.log(url);

//   superagent.get(url)
//     .then(eventful => {
//       const eventData = JSON.parse(eventful.body);
//       let dataObj = eventData.map(day => new Party(day.events.event[0]));
//       response.send(dataObj);
//     })
//     .catch(() => {
//       // console.error('There was an error', request, response);
//     });
// }

function hikeHandler(request, response) {
  let reqData = request.query;
  const url = `https://www.hikingproject.com/data/get-trails?lat=${reqData.latitude}&lon=${reqData.longitude}&maxDistance=10&key=${TRAILS_API_KEY}`;

  superagent.get(url)
    .then(hikeful => {
      let dataObj = hikeful.body.trails.map(trail => new Trail(trail));
      response.send(dataObj);
    })
    .catch(() => {
      console.error('error');
    })
}

// app.get('/weather', (request, response) => {
//   try {
//     // console.log(request.query);
//     // let city = request.query.city;
//     let tempData = require('./data/darksky.json');
//     // let dateObj = new Date();
//     // let date = dateObj.toDateString();
//     let tempObj = tempData.daily.data;
//     // let dataObj = [];
//     // tempObj.forEach(day => {
//     //   dataObj.push(new Sky(day));
//     // });
//     let dataObj = tempObj.map(day => new Sky(day));
//     response.send(dataObj);
//   } catch (err) {
//     console.log(err);
//   }
// });

function City(city, obj) {
  this.search_query = city;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;

  this.insertData();
  //save data in database//FEB20 with prototype
}

City.prototype.insertData = function () {//FEB20 with prototype
  let SQL = 'INSERT INTO city (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';
  let safeValues = [this.search_query, this.formatted_query, this.latitude, this.longitude];
  client.query(SQL, safeValues);
}

function Sky(obj) {
  // console.log("/./././." + obj.summary);
  this.forecast = obj.summary;
  this.time = new Date(obj.time * 1000).toDateString();
}

function Movie(obj){
  this.title = obj.title;
  this.overview = obj.overview;
  this.average_votes = obj.vote_average;
  this.total_votes = obj.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500/${obj.poster_path}`;
  this.popularity = obj.popularity;
  this.released_on = obj.release_date;
  
  // console.log("12345678", this);

}

function Review(obj){
  this.name = obj.name,
  this.image_url = obj.image_url,
  this.price = obj.price,
  this.rating = obj.rating,
  this.url = obj.url
}

function Party(obj) {
  this.link = obj.venue_url;
  this.name = obj.title;
  this.event_date = obj.start_time;
  this.summary = obj.description;
  // console.log("/././././" + this);
}

function Trail(obj) {
  this.name = obj.name;
  this.location = obj.location;
  this.length = obj.length;
  this.stars = obj.stars;
  this.star_votes = obj.starVotes;
  this.summary = obj.summary;
  this.trail_url = obj.url;
  this.conditions = obj.conditionStatus;
  this.condition_date = obj.conditionDate.slice(0, 10);
  this.condition_time = obj.conditionDate.slice(11, 19);
}

app.listen(PORT, () => {
  console.log(`${PORT}`);
})

// let checkDatabase = function (city) {
//   let SQL = 'SELECT * FROM city WHERE search_query LIKE ($1) LIMIT 1;';
//   let safeValue = [city];
//   // let newArr = [];
//   client.query(SQL, safeValue)
//     .then(results => {
//       console.log(results.rows, SQL);
//       newArr = results.rows;
//     })
//     .catch((error) => console.error('error: ', error));
//     // console.log("99999999", newArr);
//     return newArr;
// }

client.connect().then(app.listen(PORT, () => console.log(`listening on ${PORT}`)));