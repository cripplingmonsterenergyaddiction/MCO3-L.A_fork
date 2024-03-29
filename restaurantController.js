const express = require("express");
const { MongoClient } = require("mongodb");
const uri = "mongodb://127.0.0.1:27017/eggyDB";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function connectToDB() {
  try {
    const client = await MongoClient.connect(uri);
    return client.db("eggyDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

async function getData(collectionName, filter = {}) {
  try {
    const db = await connectToDB();
    const collection = db.collection(collectionName);
    return await collection.find(filter).toArray();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

module.exports = function (app) {
  // Function to load server data
  async function loadServer(req, res, data) {
    try {
      const db = await connectToDB();
      const [restaurants, comments] = await Promise.all([
        db.collection("restaurants").find({}).toArray(),
        db
          .collection("comments")
          .find({
            username: { $exists: true },
            content: { $exists: true },
            "overall-rating": { $exists: true },
          })
          .project({
            _id: 0,
            title: 0,
            "food-rating": 0,
            "service-rating": 0,
            "ambiance-rating": 0,
            date: 0,
            numLike: 0,
            numDislike: 0,
            ownerReplyStatus: 0,
          })
          .toArray(),
      ]);

      // Process comments for each restaurant
      const commentData = {};
      for (const resto of restaurants) {
        commentData[resto.restoName] = comments.filter(
          (comment) => comment.restoName === resto.restoName
        );
      }

      res.render("main", {
        layout: "index",
        title: "My Home page",
        restoData: restaurants.slice(0, 4),
        loginData: data,
        commentData,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Error fetching data");
    }
  }

  // Connect to MongoDB
  connectToDB().catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

  // Routes
  app.get("/", (req, res) => {
    loadServer(req, res, null);
  });

  app.post("/update-image", async (req, res) => {
    let i = Number(req.body.input);
    try {
      const db = await connectToDB();
      const images = await db
        .collection("restaurants")
        .find({ restoPic: { $exists: true }, restoName: { $exists: true } })
        .toArray();
      const image = images[i];
      resp.send({
        index: i,
        url: images[i].restoPic,
        title: images[i].restoName,
      });
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).send("Error fetching images");
    }
  });

  // Route to view establishments with optional filter by stars
  app.get("/restaurants", async (req, res) => {
    try {
      const { stars } = req.query;
      let filter = {};
      if (stars) {
        // Convert stars to an array of numbers if it's not already an array
        const starsArray = Array.isArray(stars) ? stars.map(Number) : [Number(stars)];
        filter = { main_rating: { $in: starsArray } };
      }
      const restaurants = await getData("restaurants", filter);
      const restaurant_row1 = restaurants.slice(0, 3);
      const restaurant_row2 = restaurants.slice(3, 6);
      const restaurant_row3 = restaurants.slice(6);
      res.render("view-establishment", {
        layout: "index",
        title: "View Establishments",
        restaurant_row1,
        restaurant_row2,
        restaurant_row3,
        loginData: null, // Assuming loginData is not needed here
      });
    } catch (error) {
      console.error("Error fetching establishments:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  

  // Route to create a new user
  app.post("/create-user", async (req, res) => {
    try {
      const client = await MongoClient.connect(uri);
      const dbo = client.db("eggyDB");
      const collName = dbo.collection("users");

      const userInfo = {
        email: req.body.user1,
        username: req.body.user2,
        password: req.body.pass,
        avatar_url: "./images/profile-pic.png",
      };

      await collName.insertOne(userInfo);
      await loadServer(req, res, null);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Route to login user
  app.post("/read-user", async (req, res) => {
    try {
      const client = await MongoClient.connect(uri);
      const dbo = client.db("eggyDB");
      const collName = dbo.collection("users");

      const searchQuery = {
        username: req.body.userlogin,
        password: req.body.passlogin,
      };

      const userInfo = await collName.findOne(searchQuery);
      if (userInfo) {
        searchQuery.avatar_url = userInfo.avatar_url;
        loginInfo = searchQuery;
        await loadServer(req, res, loginInfo);
      } else {
        loginInfo = null;
        await loadServer(req, res, null);
      }
    } catch (error) {
      console.error("Error reading user:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Route to logout user
  app.post("/logout-user", (req, res) => {
    loginInfo = null;
    loadServer(req, res, null);
  });
};

// // load homepage
// app.get("/", function (req, resp) {
//   loadServer(req, resp, null);
// });

// app.post("/update-image", function (req, resp) {
//   const size = 5;
//   let i = Number(req.body.input);

//   MongoClient.connect(uri)
//     .then((client) => {
//       const dbo = client.db("eggyDB"); // Get the database object
//       const collName = dbo.collection("restaurants"); // Get the collection
//       const cursor = collName.find({
//         restoPic: { $exists: true },
//         restoName: { $exists: true },
//       });

//       // let collName2 = dbo.collection("comments"); // Get the collection
//       // let cursor2 = collName2.find(
//       //   {
//       //     username: { $exists: true },
//       //     content: { $exists: true },
//       //     'overall-rating': { $exists: true }
//       //   },
//       //   {
//       //     projection: {
//       //       _id: 0,
//       //       title: 0,
//       //       'food-rating': 0,
//       //       'service-rating': 0,
//       //       'ambiance-rating': 0,
//       //       'date': 0,
//       //       numLike: 0,
//       //       numDislike: 0,
//       //       ownerReplyStatus: 0
//       //     }
//       //   }
//       // ); // Get the collection

//       console.log("connected to database");

//       Promise.all([cursor.toArray()])
//         .then(([images]) => {
//           // 'images' and 'comments' are arrays of documents from cursor and cursor2 respectively
//           // console.log("Images:", images);

//           // for (let j = 0; j < comments.length; j++){
//           //   switch(comments[j].restoName){
//           //     case "Chimmy" : chimmy.push(comments[j]); break;
//           //     case "Dimsum Treats" : dimsum_treats.push(comments[j]); break;
//           //     case "24 Chicken" : chicken24.push(comments[j]); break;
//           //     case "Tea Cup Zone" : tea_cup_zone.push(comments[j]); break;
//           //     case "Jus & Jerry's" : JJs.push(comments[j]); break;
//           //   }
//           // }

//           // switch (images[i].restoName){
//           //   case "Chimmy" : commentData = chimmy; break;
//           //   case "Dimsum Treats" : commentData = dimsum_treats; break;
//           //   case "24 Chicken" : commentData = chicken24; break;
//           //   case "Tea Cup Zone" : commentData = tea_cup_zone; break;
//           //   case "Jus & Jerry's" : commentData = JJs; break;
//           //     default: commentData = null;
//           // }

//           console.log("New Index: " + i);
//           // console.log("Picture: " + images[i].restoPic);
//           console.log("Title: " + images[i].restoName);

//           // console.log("Username: " + commentData[i].username);
//           // console.log("Length: " + commentData.length);

//           // console.log(commentData);

//           resp.send({
//             index: i,
//             url: images[i].restoPic,
//             title: images[i].restoName,
//           });
//         })
//         .catch((error) => {
//           console.error("Error converting cursor to array:", error);
//         });
//     })
//     .catch((error) => {
//       console.error("Error connecting to MongoDB:", error);
//     });
// });

// // sign up user
// app.post("/create-user", function (req, resp) {
//   let client = new MongoClient(uri);

//   let dbo = client.db("eggyDB"); // Get the database object
//   let collName = dbo.collection("users"); // Get the collection

//   console.log(req.body.user1);
//   console.log(req.body.user2);
//   console.log(req.body.pass);

//   const info = {
//     email: req.body.user1,
//     username: req.body.user2,
//     password: req.body.pass,
//     avatar_url: "./images/profile-pic.png",
//   };

//   collName
//     .insertOne(info)
//     .then(loadServer(req, resp, null))
//     .catch(function (err) {
//       console.error("Error creating user:", err);
//       resp.status(500).send("Internal Server Error");
//     });
// });

// // login user
// app.post("/read-user", function (req, resp) {
//   const client = new MongoClient(uri);

//   const dbo = client.db("eggyDB");
//   const collName = dbo.collection("users");

//   //contains log-in information
//   const searchQuery = {
//     username: req.body.userlogin,
//     password: req.body.passlogin,
//   };

//   collName
//     .findOne(searchQuery)
//     .then(function (val) {
//       console.log("Finding user");
//       console.log("Inside: " + JSON.stringify(val));

//       if (val != null) {
//         searchQuery.avatar_url = val.avatar_url;
//         loginInfo = searchQuery;
//         loadServer(req, resp, loginInfo);
//       } else {
//         loginInfo = null;
//         loadServer(req, resp, null);
//       }
//     })
//     .catch(function (error) {
//       console.error("Error:", error);
//       resp.status(500).send("Error occurred!");
//     })
//     .finally(() => {
//       // Close the MongoDB connection in the finally block to ensure it is closed even if there is an error.
//       client.close();
//     });
// });

// // logout user
// app.post("/logout-user", function (req, resp) {
//   loginInfo = null;
//   loadServer(req, resp, null);
// });

//   const createArray = (N) => {
//     return [...Array(N).keys()].map((i) => i + 1);
//   };

//   app.get("/24-chicken", function (req, resp) {
//     // Connect to MongoDB
//     MongoClient.connect(uri)
//       .then((client) => {
//         console.log("Connected to MongoDB");
//         const dbo = client.db("eggyDB"); // Get the database object
//         const collName = dbo.collection("comments"); // Get the collection
//         const cursor = collName.find({}); // Find all documents in the collection

//         const col2ndName = dbo.collection("restaurants");
//         const cursor2nd = col2ndName.find({});

//         Promise.all([cursor.toArray(), cursor2nd.toArray()])
//           .then(function ([comments, restaurants]) {
//             const createArrays = (comment) => {
//               comment["food-stars"] = createArray(comment["food-rating"]);
//               comment["service-stars"] = createArray(comment["service-rating"]);
//               comment["ambiance-stars"] = createArray(
//                 comment["ambiance-rating"]
//               );
//               comment["overall-stars"] = createArray(comment["overall-rating"]);
//             };
//             const createRestaurantArrays = (restaurant) => {
//               restaurant["rating-stars"] = createArray(
//                 restaurant["main_rating"]
//               );
//             };

//             comments.forEach(createArrays);
//             restaurants.forEach(createRestaurantArrays);
//             console.log(comments[0]);
//             console.log(restaurants);
//             console.log("Length Here");
//             console.log(restaurants.length);
//             console.log("Data fetched successfully");

//             // Split the displayRestos array into two arrays
//             resp.render("estb-review", {
//               layout: "estb-review-layout",
//               title: "Review",
//               commentData: comments,
//               restoData: [restaurants[0]],
//             });
//           })
//           .catch(function (error) {
//             console.error("Error fetching data:", error);
//             resp.status(500).send("Error fetching data");
//           })
//           .finally(() => {
//             client.close(); // Close the MongoDB client after fetching data
//           });
//       })
//       .catch((err) => {
//         console.error("Error connecting to MongoDB:", err);
//         resp.status(500).send("Error connecting to MongoDB");
//       });
//   });

//   app.get("/tea-cup", function (req, resp) {
//     // Connect to MongoDB
//     MongoClient.connect(uri)
//       .then((client) => {
//         console.log("Connected to MongoDB");
//         const dbo = client.db("eggyDB"); // Get the database object
//         const collName = dbo.collection("comments"); // Get the collection
//         const cursor = collName.find({}); // Find all documents in the collection

//         const col2ndName = dbo.collection("restaurants");
//         const cursor2nd = col2ndName.find({});

//         Promise.all([cursor.toArray(), cursor2nd.toArray()])
//           .then(function ([comments, restaurants]) {
//             const createArrays = (comment) => {
//               comment["food-stars"] = createArray(comment["food-rating"]);
//               comment["service-stars"] = createArray(comment["service-rating"]);
//               comment["ambiance-stars"] = createArray(
//                 comment["ambiance-rating"]
//               );
//               comment["overall-stars"] = createArray(comment["overall-rating"]);
//             };
//             const createRestaurantArrays = (restaurant) => {
//               restaurant["rating-stars"] = createArray(
//                 restaurant["main_rating"]
//               );
//             };

//             comments.forEach(createArrays);
//             restaurants.forEach(createRestaurantArrays);
//             console.log(comments[0]);
//             console.log(restaurants);
//             console.log("Data fetched successfully");

//             // Split the displayRestos array into two arrays
//             resp.render("estb-review", {
//               layout: "estb-review-layout",
//               title: "Review",
//               commentData: comments,
//               restoData: [restaurants[1]],
//             });
//           })
//           .catch(function (error) {
//             console.error("Error fetching data:", error);
//             resp.status(500).send("Error fetching data");
//           })
//           .finally(() => {
//             client.close(); // Close the MongoDB client after fetching data
//           });
//       })
//       .catch((err) => {
//         console.error("Error connecting to MongoDB:", err);
//         resp.status(500).send("Error connecting to MongoDB");
//       });
//   });

  // app.get("/chimmy", function (req, resp) {
  //   // Connect to MongoDB
  //   MongoClient.connect(uri)
  //     .then((client) => {
  //       console.log("Connected to MongoDB");
  //       const dbo = client.db("eggyDB"); // Get the database object
  //       const collName = dbo.collection("comments"); // Get the collection
  //       const cursor = collName.find({}); // Find all documents in the collection

  //       const col2ndName = dbo.collection("restaurants");
  //       const cursor2nd = col2ndName.find({});

  //       Promise.all([cursor.toArray(), cursor2nd.toArray()])
  //         .then(function ([comments, restaurants]) {
  //           const createArrays = (comment) => {
  //             comment["food-stars"] = createArray(comment["food-rating"]);
  //             comment["service-stars"] = createArray(comment["service-rating"]);
  //             comment["ambiance-stars"] = createArray(
  //               comment["ambiance-rating"]
  //             );
  //             comment["overall-stars"] = createArray(comment["overall-rating"]);
  //           };
  //           const createRestaurantArrays = (restaurant) => {
  //             restaurant["rating-stars"] = createArray(
  //               restaurant["main_rating"]
  //             );
  //           };

  //           comments.forEach(createArrays);
  //           restaurants.forEach(createRestaurantArrays);
  //           console.log(comments[0]);
  //           console.log(restaurants);
  //           console.log("Data fetched successfully");

  //           // Split the displayRestos array into two arrays
  //           resp.render("estb-review", {
  //             layout: "estb-review-layout",
  //             title: "Review",
  //             commentData: comments,
  //             restoData: [restaurants[2]],
  //           });
  //         })
  //         .catch(function (error) {
  //           console.error("Error fetching data:", error);
  //           resp.status(500).send("Error fetching data");
  //         })
  //         .finally(() => {
  //           client.close(); // Close the MongoDB client after fetching data
  //         });
  //     })
  //     .catch((err) => {
  //       console.error("Error connecting to MongoDB:", err);
  //       resp.status(500).send("Error connecting to MongoDB");
  //     });
  // });

  // app.get("/j&j", function (req, resp) {
  //   // Connect to MongoDB
  //   MongoClient.connect(uri)
  //     .then((client) => {
  //       console.log("Connected to MongoDB");
  //       const dbo = client.db("eggyDB"); // Get the database object
  //       const collName = dbo.collection("comments"); // Get the collection
  //       const cursor = collName.find({}); // Find all documents in the collection

  //       const col2ndName = dbo.collection("restaurants");
  //       const cursor2nd = col2ndName.find({});

  //       Promise.all([cursor.toArray(), cursor2nd.toArray()])
  //         .then(function ([comments, restaurants]) {
  //           const createArrays = (comment) => {
  //             comment["food-stars"] = createArray(comment["food-rating"]);
  //             comment["service-stars"] = createArray(comment["service-rating"]);
  //             comment["ambiance-stars"] = createArray(
  //               comment["ambiance-rating"]
  //             );
  //             comment["overall-stars"] = createArray(comment["overall-rating"]);
  //           };
  //           const createRestaurantArrays = (restaurant) => {
  //             restaurant["rating-stars"] = createArray(
  //               restaurant["main_rating"]
  //             );
  //           };

  //           comments.forEach(createArrays);
  //           restaurants.forEach(createRestaurantArrays);
  //           console.log(comments[0]);
  //           console.log(restaurants);
  //           console.log("Data fetched successfully");

  //           // Split the displayRestos array into two arrays
  //           resp.render("estb-review", {
  //             layout: "estb-review-layout",
  //             title: "Review",
  //             commentData: comments,
  //             restoData: [restaurants[3]],
  //           });
  //         })
  //         .catch(function (error) {
  //           console.error("Error fetching data:", error);
  //           resp.status(500).send("Error fetching data");
  //         })
  //         .finally(() => {
  //           client.close(); // Close the MongoDB client after fetching data
  //         });
  //     })
  //     .catch((err) => {
  //       console.error("Error connecting to MongoDB:", err);
  //       resp.status(500).send("Error connecting to MongoDB");
  //     });
  // });

//   app.get("/dimsum-treats", function (req, resp) {
//     // Connect to MongoDB
//     MongoClient.connect(uri)
//       .then((client) => {
//         console.log("Connected to MongoDB");
//         const dbo = client.db("eggyDB"); // Get the database object
//         const collName = dbo.collection("comments"); // Get the collection
//         const cursor = collName.find({}); // Find all documents in the collection

//         const col2ndName = dbo.collection("restaurants");
//         const cursor2nd = col2ndName.find({});

//         Promise.all([cursor.toArray(), cursor2nd.toArray()])
//           .then(function ([comments, restaurants]) {
//             const createArrays = (comment) => {
//               comment["food-stars"] = createArray(comment["food-rating"]);
//               comment["service-stars"] = createArray(comment["service-rating"]);
//               comment["ambiance-stars"] = createArray(
//                 comment["ambiance-rating"]
//               );
//               comment["overall-stars"] = createArray(comment["overall-rating"]);
//             };
//             const createRestaurantArrays = (restaurant) => {
//               restaurant["rating-stars"] = createArray(
//                 restaurant["main_rating"]
//               );
//             };

//             comments.forEach(createArrays);
//             restaurants.forEach(createRestaurantArrays);
//             console.log(comments[0]);
//             console.log(restaurants);
//             console.log("Data fetched successfully");

//             // Split the displayRestos array into two arrays
//             resp.render("estb-review", {
//               layout: "estb-review-layout",
//               title: "Review",
//               commentData: comments,
//               restoData: [restaurants[4]],
//             });
//           })
//           .catch(function (error) {
//             console.error("Error fetching data:", error);
//             resp.status(500).send("Error fetching data");
//           })
//           .finally(() => {
//             client.close(); // Close the MongoDB client after fetching data
//           });
//       })
//       .catch((err) => {
//         console.error("Error connecting to MongoDB:", err);
//         resp.status(500).send("Error connecting to MongoDB");
//       });
//   });

//   app.get("/big-boss", function (req, resp) {
//     // Connect to MongoDB
//     MongoClient.connect(uri)
//       .then((client) => {
//         console.log("Connected to MongoDB");
//         const dbo = client.db("eggyDB"); // Get the database object
//         const collName = dbo.collection("comments"); // Get the collection
//         const cursor = collName.find({}); // Find all documents in the collection

//         const col2ndName = dbo.collection("restaurants");
//         const cursor2nd = col2ndName.find({});

//         Promise.all([cursor.toArray(), cursor2nd.toArray()])
//           .then(function ([comments, restaurants]) {
//             const createArrays = (comment) => {
//               comment["food-stars"] = createArray(comment["food-rating"]);
//               comment["service-stars"] = createArray(comment["service-rating"]);
//               comment["ambiance-stars"] = createArray(
//                 comment["ambiance-rating"]
//               );
//               comment["overall-stars"] = createArray(comment["overall-rating"]);
//             };
//             const createRestaurantArrays = (restaurant) => {
//               restaurant["rating-stars"] = createArray(
//                 restaurant["main_rating"]
//               );
//             };

//             comments.forEach(createArrays);
//             restaurants.forEach(createRestaurantArrays);
//             console.log(comments[0]);
//             console.log(restaurants);
//             console.log("Data fetched successfully");

//             // Split the displayRestos array into two arrays
//             resp.render("estb-review", {
//               layout: "estb-review-layout",
//               title: "Review",
//               commentData: comments,
//               restoData: [restaurants[5]],
//             });
//           })
//           .catch(function (error) {
//             console.error("Error fetching data:", error);
//             resp.status(500).send("Error fetching data");
//           })
//           .finally(() => {
//             client.close(); // Close the MongoDB client after fetching data
//           });
//       })
//       .catch((err) => {
//         console.error("Error connecting to MongoDB:", err);
//         resp.status(500).send("Error connecting to MongoDB");
//       });
//   });

//   app.get("/toribox", function (req, resp) {
//     // Connect to MongoDB
//     MongoClient.connect(uri)
//       .then((client) => {
//         console.log("Connected to MongoDB");
//         const dbo = client.db("eggyDB"); // Get the database object
//         const collName = dbo.collection("comments"); // Get the collection
//         const cursor = collName.find({}); // Find all documents in the collection

//         const col2ndName = dbo.collection("restaurants");
//         const cursor2nd = col2ndName.find({});

//         Promise.all([cursor.toArray(), cursor2nd.toArray()])
//           .then(function ([comments, restaurants]) {
//             const createArrays = (comment) => {
//               comment["food-stars"] = createArray(comment["food-rating"]);
//               comment["service-stars"] = createArray(comment["service-rating"]);
//               comment["ambiance-stars"] = createArray(
//                 comment["ambiance-rating"]
//               );
//               comment["overall-stars"] = createArray(comment["overall-rating"]);
//             };
//             const createRestaurantArrays = (restaurant) => {
//               restaurant["rating-stars"] = createArray(
//                 restaurant["main_rating"]
//               );
//             };

//             comments.forEach(createArrays);
//             restaurants.forEach(createRestaurantArrays);
//             console.log(comments[0]);
//             console.log(restaurants);
//             console.log("Data fetched successfully");

//             // Split the displayRestos array into two arrays
//             resp.render("estb-review", {
//               layout: "estb-review-layout",
//               title: "Review",
//               commentData: comments,
//               restoData: [restaurants[6]],
//             });
//           })
//           .catch(function (error) {
//             console.error("Error fetching data:", error);
//             resp.status(500).send("Error fetching data");
//           })
//           .finally(() => {
//             client.close(); // Close the MongoDB client after fetching data
//           });
//       })
//       .catch((err) => {
//         console.error("Error connecting to MongoDB:", err);
//         resp.status(500).send("Error connecting to MongoDB");
//       });
//   });

//   app.get("/userProfile", (req, resp) => {
//     const username = loginInfo.username;
//     MongoClient.connect(uri)
//       .then((client) => {
//         console.log("Connected to MongoDB");
//         const dbo = client.db("eggyDB"); // Get the database object
//         const collName = dbo.collection("comments"); // Get the collection
//         const cursor = collName.find({ name: username }); // Find all documents in the collection

//         const col2ndName = dbo.collection("users");
//         const cursor2nd = col2ndName.find({ username: username });

//         const col3rdName = dbo.collection("restaurants");
//         const cursor3rd = col3rdName.find({});

//         Promise.all([
//           cursor.toArray(),
//           cursor2nd.toArray(),
//           cursor3rd.toArray(),
//         ])
//           .then(function ([comments, users, restaurants]) {
//             const createArrays = (comment) => {
//               comment["food-stars"] = createArray(comment["food-rating"]);
//               comment["service-stars"] = createArray(comment["service-rating"]);
//               comment["ambiance-stars"] = createArray(
//                 comment["ambiance-rating"]
//               );
//               comment["overall-stars"] = createArray(comment["overall-rating"]);
//             };
//             const createRestaurantArrays = (restaurant) => {
//               restaurant["rating-stars"] = createArray(
//                 restaurant["main_rating"]
//               );
//             };
//             comments.forEach(createArrays);
//             restaurants.forEach(createRestaurantArrays);
//             console.log("These are the users");
//             console.log(users);

//             console.log("Data fetched successfully");

//             // Split the displayRestos array into two arrays
//             resp.render("user-profile", {
//               layout: "user-layout",
//               title: "User Profile",
//               commentData: comments,
//               userData: [users[0]],
//               restoData: restaurants,
//             });
//           })
//           .catch(function (error) {
//             console.error("Error fetching data:", error);
//             resp.status(500).send("Error fetching data");
//           })
//           .finally(() => {
//             client.close(); // Close the MongoDB client after fetching data
//           });
//       })
//       .catch((err) => {
//         console.error("Error connecting to MongoDB:", err);
//         resp.status(500).send("Error connecting to MongoDB");
//       });
//   });

// function truncateString(inputString) {
//   const maxLength = 152;
//   if (inputString.length <= maxLength) {
//     return inputString; // Return the original string if it's within the limit
//   } else {
//     return inputString.slice(0, maxLength) + "..."; // Truncate the string to the maximum length
//   }
// }

// /*
//   - make a function that splits the array of all comments into 5 restaurants namely,
//   - return value: a hashmap of reviews
//   - parameters:
//     @commentArray   - array to be sliced
//     @restaurant     - restaurant to filer the reviews
// */
// function splitReview(commentArray,restaurant){

//   let tempArray = [];

//   for (let i = 0; i < commentArray.length; i++){
//     if (commentArray[i] === restaurant){
//       tempArray.push(commentArray[i]);
//     }
//   }

//   return tempArray;
// }
