const { MongoClient, ServerApiVersion } = require("mongodb");

require("dotenv").config();

const uri = process.env.DB_STRING;

let _db;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const initDb = async (callback) => {
  if (_db) {
    console.log("Databse is already initiated");
    return callback(null, _db);
  }

  try {
    await client.connect();
    _db = client.db("pncl");
    callback(null, _db);
  } catch (error) {
    callback(error);
  }
};

const closeDb = async () => {
  try {
    if (_db) await client.close();
  } catch (error) {
    console.log(error);
  }
};

const getDb = () => {
  if (!_db) {
    throw Error("Database not initiated");
  }
  return _db;
};

module.exports = { initDb, getDb, closeDb };
