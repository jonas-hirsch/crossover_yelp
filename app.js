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
      const formatted_restaurants_result = raw_restaurants_result.rows.map(
        (x) => {
          let formattedX = x;
          parsedAddress = JSON.parse(x.address);
          formattedX.address = parsedAddress;
          parsedCuisine = JSON.parse(x.cuisine);
          formattedX.cuisine = parsedCuisine;
          parsedTags = JSON.parse(x.tags);
          formattedX.tags = parsedTags;
          return formattedX;
        }
      );
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

  const getAllRestaurantsInCity = {
    text: `
    SELECT * FROM restaurants WHERE city_name=$1;
    `,
    values: [city.toLowerCase()],
  };
  db.query(getAllRestaurantsInCity)
    .then((data) => {
      console.log({ by_city_first_result: data.rows[0] });
      let formattedRows = [];
      for (const rowIdx in data.rows) {
        const unformattedRow = data.rows[rowIdx];
        let formattedRow = unformattedRow;
        formattedRow.address = JSON.parse(unformattedRow.address);
        formattedRow.cuisine = JSON.parse(unformattedRow.cuisine);
        formattedRow.tags = JSON.parse(unformattedRow.tags);
        formattedRows.push(formattedRow);
      }
      res.send(formattedRows);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.get("/restaurants/:city", async (req, res) => {
  const city = req.params.city;

  const getAllRestaurantsInCity = {
    text: `
    SELECT * FROM restaurants WHERE city_name=$1;
    `,
    values: [city.toLowerCase()],
  };
  db.query(getAllRestaurantsInCity)
    .then((data) => {
      console.log({ by_city_first_result: data.rows[0] });
      let formattedRows = [];
      for (const rowIdx in data.rows) {
        const unformattedRow = data.rows[rowIdx];
        let formattedRow = unformattedRow;
        formattedRow.address = JSON.parse(unformattedRow.address);
        formattedRow.cuisine = JSON.parse(unformattedRow.cuisine);
        formattedRow.tags = JSON.parse(unformattedRow.tags);
        formattedRows.push(formattedRow);
      }
      res.send(formattedRows);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.get("/:city/:tags", async (req, res) => {
  try {
    console.log(`Called /:city/:tags`);
    const city = req.params.city;
    const tags = req.params.tags;
    console.log(`with tags: ${tags}`);
    console.log({city : city});
    console.log({tags : tags});
    let filterTags = [];
    let multiTag = false;
    let splitTags = null;
    try {
      splitTags = tags.split("&");
      console.log(`Split tags parameters by & sign: ${JSON.stringify(splitTags)}`);
      if (splitTags.length >= 2) {
        multiTag = true;
      }
    } catch (e) {
      console.log(e);
    }

    if (!multiTag) {
      filterTags.push(tags);
    } else {
      filterTags = splitTags;
    }
      //TODO:multiple tags querying database for restaurants
      //first select by city for one rows result
      const getAllRestaurantsInCity = {
        text: `
      SELECT * FROM restaurants WHERE city_name=$1;
      `,
        values: [city.toLowerCase()],
      };
      db.query(getAllRestaurantsInCity)
        .then((data) => {
          //console.log({ by_city_first_result: data.rows[0] });
          //console.log({all_restaurants_by_city : data.rows});
          const filteredRestaurantsByTags = data.rows.map((oneRestaurantsByCityRow) => {
            console.log(`Mapping one city-filtered restaurant result row.`)
            const allTagsCurrentRowUnformatted = JSON.parse(oneRestaurantsByCityRow.cuisine).concat(
              JSON.parse(oneRestaurantsByCityRow.tags)
            );
            const allTagsCurrentRow = allTagsCurrentRowUnformatted.map((oneTagElement) => {
              return oneTagElement.toLowerCase();
            })
            let allFilterTagsMatched = true;
            for (const tagIdx in filterTags) {
              console.log(`Checking if ${JSON.stringify(allTagsCurrentRow)} contains ${JSON.stringify(filterTags[tagIdx].toLowerCase())}`)
              if (
                !allTagsCurrentRow.includes(filterTags[tagIdx].toLowerCase())
              ) {
                allFilterTagsMatched = false;
              }
              console.log(`Restaurant still valid?${allFilterTagsMatched}`);
            }
            if (allFilterTagsMatched) {
              console.log(`All filters matched correctly. Filters:${JSON.stringify(filterTags)}`)
              let formattedRestaurantByCityRow = oneRestaurantsByCityRow;
              formattedRestaurantByCityRow.address = JSON.parse(oneRestaurantsByCityRow.address);
              formattedRestaurantByCityRow.cuisine = JSON.parse(oneRestaurantsByCityRow.cuisine);
              formattedRestaurantByCityRow.tags = JSON.parse(oneRestaurantsByCityRow.tags);
              return oneRestaurantsByCityRow;
            }
          });
          console.log(`Returning filtered by city and tags: ${filteredRestaurantsByTags}`);
          res.send(filteredRestaurantsByTags);
        });

      /**
        //then select for each tag by tag_name from tag_to_restaurant
        for (tag_idx in splitTags){
          const currentTag = splitTags[tag_idx];
          const getRestaurantIdsForTag = {
            text: `
            SELECT * FROM tag_to_restaurant WHERE tag_name=$1;
            `,
            values: [currentTag.toLowerCase()],
          };
          db.query(getRestaurantIdsForTag)
          .then((data) => {
            tagsTables.push(data.rows);
          })
        }
        for (const table_idx in tagsTables) {
          const tagRestaurantRelationsForOneTag = tagsTables[table_idx];
          const oneRestaurantId = tagRestaurantRelationsForOneTag.restaurant_id;
          if (tagsTables.length >= 2){
            
          } else {
            validRestaurantIds.push(oneRestaurantId);
          }
        }
        */

    /**
    .then((data) => { 
    console.log({by_city_first_result : data.rows[0]})
    let formattedRows = [];
    for (const rowIdx in data.rows){
      const unformattedRow = data.rows[rowIdx]
      let formattedRow = unformattedRow;
      formattedRow.address = JSON.parse(unformattedRow.address);
      formattedRow.cuisine = JSON.parse(unformattedRow.cuisine);
      formattedRow.tags = JSON.parse(unformattedRow.tags);
      formattedRows.push(formattedRow);
    }
    res.send(formattedRows);
    */
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});


app.get("/restaurants/:city/:tags", async (req, res) => {
  try {
    console.log(`Called /:city/:tags`);
    const city = req.params.city;
    const tags = req.params.tags;
    console.log(`with tags: ${tags}`);
    console.log({city : city});
    console.log({tags : tags});
    let filterTags = [];
    let multiTag = false;
    let splitTags = null;
    try {
      splitTags = tags.split("&");
      console.log(`Split tags parameters by & sign: ${JSON.stringify(splitTags)}`);
      if (splitTags.length >= 2) {
        multiTag = true;
      }
    } catch (e) {
      console.log(e);
    }

    if (!multiTag) {
      filterTags.push(tags);
    } else {
      filterTags = splitTags;
    }
      //TODO:multiple tags querying database for restaurants
      //first select by city for one rows result
      const getAllRestaurantsInCity = {
        text: `
      SELECT * FROM restaurants WHERE city_name=$1;
      `,
        values: [city.toLowerCase()],
      };
      db.query(getAllRestaurantsInCity)
        .then((data) => {
          //console.log({ by_city_first_result: data.rows[0] });
          //console.log({all_restaurants_by_city : data.rows});
          const filteredRestaurantsByTags = data.rows.map((oneRestaurantsByCityRow) => {
            console.log(`Mapping one city-filtered restaurant result row.`)
            const allTagsCurrentRowUnformatted = JSON.parse(oneRestaurantsByCityRow.cuisine).concat(
              JSON.parse(oneRestaurantsByCityRow.tags)
            );
            const allTagsCurrentRow = allTagsCurrentRowUnformatted.map((oneTagElement) => {
              return oneTagElement.toLowerCase();
            })
            let allFilterTagsMatched = true;
            for (const tagIdx in filterTags) {
              console.log(`Checking if ${JSON.stringify(allTagsCurrentRow)} contains ${JSON.stringify(filterTags[tagIdx].toLowerCase())}`)
              if (
                !allTagsCurrentRow.includes(filterTags[tagIdx].toLowerCase())
              ) {
                allFilterTagsMatched = false;
              }
              console.log(`Restaurant still valid?${allFilterTagsMatched}`);
            }
            if (allFilterTagsMatched) {
              console.log(`All filters matched correctly. Filters:${JSON.stringify(filterTags)}`)
              let formattedRestaurantByCityRow = oneRestaurantsByCityRow;
              formattedRestaurantByCityRow.address = JSON.parse(oneRestaurantsByCityRow.address);
              formattedRestaurantByCityRow.cuisine = JSON.parse(oneRestaurantsByCityRow.cuisine);
              formattedRestaurantByCityRow.tags = JSON.parse(oneRestaurantsByCityRow.tags);
              return oneRestaurantsByCityRow;
            }
          });
          console.log(`Returning filtered by city and tags: ${filteredRestaurantsByTags}`);
          res.send(filteredRestaurantsByTags);
        });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.post("/restaurants", async (req, res) => {
  try {
    console.log({ req_body : req.body});
    const {
      restaurant_name,
      avg_rating,
      address,
      price,
      cuisine,
      tags,
    } = req.body;
    const formatted_address = JSON.stringify(address);
    const formatted_cuisine = JSON.stringify(cuisine);
    const formatted_tags = JSON.stringify(tags);

    const city_name = address.city;

    const newRestaurant = {
      text: `
  INSERT INTO restaurants (restaurant_name, avg_rating, city_name, address, price, cuisine, tags)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING *`,
      values: [
        restaurant_name,
        avg_rating,
        city_name,
        formatted_address,
        price,
        formatted_cuisine,
        formatted_tags,
      ],
    };

    db.query(newRestaurant.text, newRestaurant.values)
      .then((dbres) => {
        //console.log({ restaurant_entry: dbres.rows[0] });
        const created_restaurant_id = dbres.rows[0].restaurant_id;
        let tags_list = tags.concat(cuisine);
        /**
        for (const t in tags_list) {
          const newTagRestaurantRelation = {
            text: `
        INSERT INTO tag_to_restaurant (tag_name, restaurant_id)
        VALUES ($1, $2)
        RETURNING *`,
            values: [tags_list[t].toLowerCase(), created_restaurant_id],
          };
          db.query(
            newTagRestaurantRelation.text,
            newTagRestaurantRelation.values
          )
            .then((relres) => {
              //console.log({ tag_to_restaurant_entry: relres.rows[0] });
            })
            .catch((err) => {
              console.log(err.stack);
              res.sendStatus(500);
            });
        }
        */

        res.send({created: dbres.rows[0]});
      })
      .catch((dberr) => {
        console.log(dberr.stack);
        res.sendStatus(500);
      });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

module.exports = app;
