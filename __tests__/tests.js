const app = require("..");
const supertest = require("supertest");
const results = require("./results.json");
const { expect } = require("@jest/globals");
const { initDb, closeDb } = require("../dbConfig");

//ensure database is initialized before running tests
beforeAll(async () => {
  await initDb((err, db) => {
    if (db) console.log("Database ready for tests.");
  });
});

afterAll(async () => await closeDb());

describe("test /search route", () => {
  it("GET /search no query string", async () => {
    let response = await supertest(app).get("/search").expect(400);

    expect(response.body.status).toEqual(400);
    expect(response.body.message).toBe("Bad Request");
  });

  it("GET /search level1 topic (List the chemical elements which make up)", async () => {
    let response = await supertest(app)
      .get("/search?q=Cell%20Structure%20and%20Organisation")
      .expect(200);

    expect(response.body).toStrictEqual(
      results["Cell Structure and Organisation"]
    );
  });

  it("GET /search level2 topic (List the chemical elements which make up)", async () => {
    let response = await supertest(app)
      .get("/search?q=List%20the%20chemical%20elements%20which%20make%20up")
      .expect(200);

    expect(response.body).toStrictEqual(
      results["List the chemical elements which make up"]
    );
  });

  it("GET /search level3 topic (Cytoplasm)", async () => {
    let response = await supertest(app).get("/search?q=Cytoplasm").expect(200);

    expect(response.body).toStrictEqual(results.cytoplasm);
  });

  it("GET bad route", async () => {
    let response = await supertest(app).get("/bad").expect(404);

    expect(response.body.status).toEqual(404);
    expect(response.body.message).toBe("Not Found");
  });
});
