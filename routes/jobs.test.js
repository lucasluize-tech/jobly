"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** POST /jobs 
requires user token.
*/

describe("POST /jobs", function () {
  const newJob = {
    title: "Best Job EVER",
    salary: 300000,
    equity: 0.9999,
    companyHandle: "c1"
  };
  
  test("ok for users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
        job: { ...newJob,
              id: expect.any(Number),
              equity: "0.9999" }
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: 10000,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          salary: "not-a-number",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});
/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("get all jobs", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            jobs: [{
                id: expect.any(Number),
                title: "j1",
                salary: 100000,
                equity: "0.05",
                companyHandle: "c1"
            },
            {
                id: expect.any(Number),
                title: "j2",
                salary: 150000,
                equity: "0",
                companyHandle: "c2"
            }]
        })
    })
    
    test("get job filtered by minSalary", async function () {
        const resp = await request(app).get('/jobs?minSalary=150000')
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "j2",
                    salary: 150000,
                    equity: "0",
                    companyHandle: "c2"
                }
            ]})
    })
    
    test("get job filtered by title", async function () {
        let title = `j`
        const resp = await request(app).get(`/jobs?title=${title}`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({
            jobs: [{
                id: expect.any(Number),
                title: "j1",
                salary: 100000,
                equity: "0.05",
                companyHandle: "c1"
            },
            {
                id: expect.any(Number),
                title: "j2",
                salary: 150000,
                equity: "0",
                companyHandle: "c2"
            }]
        })
    })
    
    test('get job with equity filter', async function () {
        const resp = await request(app).get(`/jobs?hasEquity=true`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({ jobs: [
            {
                id: expect.any(Number),
                title: "j1",
                salary: 100000,
                equity: "0.05",
                companyHandle: "c1"
            }]
        })
    })  
    
    test('get job with equity filter', async function () {
        const resp = await request(app).get(`/jobs?hasEquity=false`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({ jobs: [
            {
                id: expect.any(Number),
                title: "j2",
                salary: 150000,
                equity: "0",
                companyHandle: "c2"
            }]
        })
    })
    
    test('get job with wrong filters', async function () {
        const resp = await request(app).get('/jobs?maxSalary=1000000')
        expect(resp.statusCode).toBe(400)
        expect(resp.body.error).toEqual({
            message : "Filters allowed are : title, minSalary and hasEquity",
            status: 400
        })
    })
    
    test('minSalary out of the scope', async function (){
        const resp = await request(app).get('/jobs?minSalary=1000000')
        expect(resp.statusCode).toBe(404)
    })
    test('title does not exist', async function (){
        const resp = await request(app).get('/jobs?title=theonlyoneisthisone')
        expect(resp.statusCode).toBe(404)
    })
    test('hasEquity not true or false', async function (){
        const resp = await request(app).get('/jobs?hasEquity=anything')
        expect(resp.statusCode).toBe(400)
    })
})