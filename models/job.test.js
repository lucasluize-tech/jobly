"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
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
        expect(jobs).toEqual(newJob);

        const result = await db.query(
            `SELECT id, title, salary, equity, companyHandle
           FROM jobs
           WHERE title = $1`, [newJob.title]);
    
        expect(result.rows).toEqual([
            {
                id: 3,
                title: "Best Job EVER",
                salary: 300000,
                equity: 0.9999,
                companyHandle: "c1"
            },
        ]);
    });
});

/************************************** findAll */

describe("findAll", function () {
    
    test("works", async function (){
        let jobs = await Jobs.findAll();
        expect(jobs).toEqual([
            {
                id: 1,
                title: "j1",
                salary: 100000,
                equity: 0.05,
                companyHandle: "c1"
            },
            {
                id: 2,
                title: "j2",
                salary: 90000,
                equity: 0,
                companyHandle: "c2"
            }
        ]);
    })
})

/************************************** get */

describe("get", function () {
    
    test("works", async function () {
        let job = await Jobs.get('c1')
        expect(job).toEqual([{
            id: 1,
            title: "j1",
            salary: 100000,
            equity: 0.05,
            companyHandle: "c1"
        }]);
    });
    
    test("Did not find jobs for this company", async function () {
        try {
            await Job.get('c3')
            fail();
        } catch (error) {
            expect(error).toBeInstanceOf(NotFoundError)
            
        };
    });
})

/************************************** update */

describe("update", function (){
    
    test("works", async function () {
        let update = await Job.update(1, {
            salary: 150000,
            equity: 0.06
        })
        expect(update).toEqual({
            id: 1,
            title: 'j1',
            salary: 150000,
            equity: 0.06,
            companyHandle: 'c1'
        })
    });
    
    test("null fields", async function (){
         let update = await Job.update(1, {
            salary: null,
            equity: null,
        })
        expect(update).toEqual({
            id: 1,
            title: 'j1',
            salary: null,
            equity: null,
            companyHandle: 'c1'
        })
    });
    
    test("job not found", async function () {
        try {
            await Jobs.update("nope", {
                salary: 150000,
                equity: 0.06
            });
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
})

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Jobs.remove(1);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Company.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});



