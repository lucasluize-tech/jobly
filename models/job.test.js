"use strict";

const db = require("../db.js");
const { NotFoundError } = require("../expressError");
const Jobs = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** create */

describe("create", function () {
  const newJob = {
    title: "Best Job EVER",
    salary: 300000,
    equity: 0.9999,
    companyHandle: "c1"
  };

    test("works", async function () {
        let jobs = await Jobs.create(newJob);
        expect(jobs).toEqual({
            id: expect.any(Number),
            title: "Best Job EVER",
            salary: 300000,
            equity: "0.9999",
            companyHandle: "c1"
            });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = $1`, [newJob.title]);
    
        expect(result.rows).toEqual([
            {
                id: expect.any(Number),
                title: "Best Job EVER",
                salary: 300000,
                equity: "0.9999",
                companyHandle: "c1"
            },
        ]);
    });
});

/************************************** findAll */

describe("findAll", function () {
    
    test("works", async function () {
        let jobs = await Jobs.findAll();
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "j1",
                salary: 100000,
                equity: "0.05",
                companyHandle: "c1"
            },
            {
                id: expect.any(Number),
                title: "j2",
                salary: 90000,
                equity: "0",
                companyHandle: "c2"
            }
        ]);
    })
});

/************************************** get */

describe("get", function () {
    
    test("works", async function () {
        let job = await Jobs.get('c1')
        expect(job).toEqual({
            id: expect.any(Number),
            title: "j1",
            salary: 100000,
            equity: "0.05",
            companyHandle: "c1"
        });
    });
    
    test("Did not find jobs for this company", async function () {
        try {
            await Jobs.get('c3')
            fail();
        } catch (error) {
            expect(error).toBeInstanceOf(NotFoundError)
            
        };
    });
});

/************************************** update */

describe("update", function () {
    
    test("works", async function () {
        const job = await db.query(`SELECT id
                               FROM jobs
                               LIMIT 1`) 
        
        let update = await Jobs.update(job.rows[0].id, {
            salary: 150000,
            equity: 0.06
        })
        expect(update).toEqual({
            id: expect.any(Number),
            title: 'j1',
            salary: 150000,
            equity: "0.06",
            companyHandle: 'c1'
        })
    });
    
    test("null fields", async function () {
        const job = await db.query(`SELECT id
                               FROM jobs
                               LIMIT 1`) 
        let update = await Jobs.update(job.rows[0].id, {
            salary: null,
            equity: null,
        })
        expect(update).toEqual({
            id: expect.any(Number),
            title: 'j1',
            salary: null,
            equity: null,
            companyHandle: 'c1'
        })
    });
    
    test("job not found", async function () {
        try {
            await Jobs.update(547123, {
                salary: 150000,
                equity: 0.06
            });
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    
  test("works", async function () {
    const job = await db.query(`SELECT id
                               FROM jobs
                               LIMIT 1`) 
    let allJobs = await db.query(`SELECT count(*) from jobs `)
    console.log(allJobs.rows)
    await Jobs.remove(job.rows[0].id);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1", [job.rows[0].id]);
    expect(res.rows.length).toEqual(0);
    expect(allJobs.rows[0].count).toEqual("2")
  });

  test("not found if no such company", async function () {
    try {
      await Jobs.remove(1892756);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});



