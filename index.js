const express = require("express");
const createHttpError = require("http-errors");
const db = require("./dbConfig");
require("dotenv").config();

const app = express();

/*-----------------------Routes----------------------------- */

app.get("/search", async (req, res, next) => {
  let q = req.query.q;
  //if no query string found, send error
  if (!q) return next(createHttpError.BadRequest());

  try {
    let documents = await db
      .getDb()
      .collection("topics")
      .aggregate([
        //get the topic that matches query
        { $match: { text: q } },
        //get all the topics in the subtree
        {
          $graphLookup: {
            from: "topics",
            startWith: "$children",
            connectFromField: "children",
            connectToField: "_id",
            as: "subtree",
          },
        },
        //combine all the questionIds references from all the topics in subtree into a single de-duped array
        {
          $project: {
            questionRefs: {
              $reduce: {
                input: "$subtree.questionIds",
                initialValue: "$questionIds",
                in: { $setUnion: ["$$value", "$$this"] },
              },
            },
          },
        },
        //get all the question objects matching the questionIds references from topic subtree
        {
          $lookup: {
            from: "questions",
            localField: "questionRefs",
            foreignField: "_id",
            as: "questions",
          },
        },

        { $project: { _id: 0, questionNumbers: "$questions.questionNumber" } },
        { $limit: 1 },
      ]);
    let result = [];
    await documents.forEach((doc) => {
      //as we are only expecting atmost one document, we can sort it and send it to client
      result = doc.questionNumbers.sort((a, b) => a - b);
    });

    res.json(result);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

/*------------------------Error handling--------------------------------*/

app.use((req, res, next) => {
  // if requested route not found
  next(createHttpError.NotFound());
});

app.use((error, req, res, next) => {
  error.status = error.status || 500;
  res.status(error.status);
  res.send(error);
});

/*-----------------------DB and Server init-----------------------------*/

const port = process.env.PORT || 3000;

db.initDb((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Database connected!");
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  }
});

module.exports = app;
