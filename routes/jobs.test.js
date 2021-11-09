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
            ]
        })
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

/************************************** PATCH /jobs */

describe('/PATCH', function () {
    test("works", async function(){
        let job = await db.query(`
                SELECT id, company_handle AS "companyHandle" FROM jobs LIMIT 1`)
        console.log(job.rows[0].id)
        const resp = await request(app).patch(`/jobs/${job.rows[0].id}`)
        .send({
            title: "Patch works",
        })
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({job:{
            id: expect.any(Number),
            title: "Patch works",
            salary: expect.any(Number),
            equity: expect.any(String),
            companyHandle: `${job.rows[0].companyHandle}`
        }})
    })
    
    test("Unauthorized code and Message", async function (){
        let job = await db.query(`
                SELECT id, company_handle AS "companyHandle" FROM jobs LIMIT 1`)
        const resp = await request(app).patch(`/jobs/${job.rows[0].id}`)
        .send({
            title: "Patch works",
            salary : null,
            equity: null
        })
        expect(resp.statusCode).toBe(401)
        expect(resp.body.error.message).toEqual("Unauthorized")
    })
})

/************************************** DELETE /jobs */

describe("DELETE /jobs", function(){
    test("works", async function(){
        let job = await db.query(`
                SELECT id FROM jobs LIMIT 1`)
        const resp = await request(app).delete(`/jobs/${job.rows[0].id}`)
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({
            msg: "deleted"
        })
    })
    
    test("Unauthorized code and Message", async function(){
        let job = await db.query(`
                SELECT id FROM jobs LIMIT 1`)
        const resp = await request(app).delete(`/jobs/${job.rows[0].id}`)
        
        expect(resp.statusCode).toBe(401)
        expect(resp.body.error.message).toEqual("Unauthorized")
    })
})