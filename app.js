const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
require("dotenv").config();
const cors = require("cors");
const db = require("./database/client");

const app = express();
app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

app.get("/restaurants", (req, res) => {
  // SPL INJECTION!!! Ben is gonna do it!
  db.query("SELECT * FROM restaurants")
    .then((raw_restaurants_result) => {
      const formatted_restaurants_result = raw_restaurants_result.rows.map(x => {
        let formattedX = x;
        parsedAddress = JSON.parse(x.address);
        formattedX.address = parsedAddress;
        parsedCuisine = JSON.parse(x.cuisine);
        formattedX.cuisine = parsedCuisine;
        parsedTags = JSON.parse(x.tags);
        formattedX.tags = parsedTags;
        return formattedX})
      // for each row format cuisine & tags encode from JSON
      console.log(formatted_restaurants_result);
      res.send(formatted_restaurants_result);
    })
    .catch((e) => {
      console.log(e);
      res.sendStatus(500);
    });
}); // cool! i dont give a shit...elephant is cool...  wearing a mask in a CROWDED train doesnt allow for a conversation. ^^
//lol... theres a vs code chat btw...though this is fun as well weeeeeee
app.get("/:city", async (req, res) => {
  const city = req.params.city;

  const getAllRestaurantsInLocation = {
    text: `
    SELECT * FROM locations WHERE city=$1;
    `,
    values: [city],
  };
  db.query(getAllRestaurantsInLocation)
    .then((data) => res.send(data.rows))
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.get("/:city/:tags", async (req, res) => {
  const city = req.params.city;
  const tags = req.params.tags;
  let multiTag = false;
  try {
    const splitTags = tags.split(",");
    if (splitTags.lenght >= 2) {
      multiTag = true;
    }
  } catch (e) {
    console.log(e);
  }

  if (multiTag) {
    //TODO:multiple tags querying database for restaurants
  } else {
    //TODO:single tags querying database for restaurants
  }
});

app.post("/restaurants", async (req, res) => {
  try{
  console.log(req.body);
  const { restaurant_name, avg_rating, address, price, cuisine, tags } =
    req.body;
  const formatted_address = JSON.stringify(address);
  const formatted_cuisine = JSON.stringify(cuisine);
  const formatted_tags = JSON.stringify(tags);

  const newRestaurant = {
    text: `
  INSERT INTO restaurants (restaurant_name, avg_rating, address, price, cuisine, tags)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING *`,
    values: [
      restaurant_name,
      avg_rating,
      formatted_address,
      price,
      formatted_cuisine,
      formatted_tags,
    ],
  };

  db.query(newRestaurant.text, newRestaurant.values)
    .then((dbres) => {
      console.log(dbres.rows[0]);
      res.sendStatus(201);
    })
    .catch((dberr) => {
      console.log(dberr.stack);
      res.sendStatus(500);
    });
  } catch (e){
    console.log(e)
    res.sendStatus(500);
  }
});

module.exports = app;
