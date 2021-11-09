"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobFilterSchema = require("../schemas/jobFilter.json")
const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * Jobs should be { title, salary, equity, companyHandle  }
 *
 * Returns { id, title, salary, equity, companyHandle  }
 *
 * Authorization required: ADMIN login
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [{ id, title, salary, equity, companyHandle }, ...]
 *
 * Can filter on provided search filters:
 * - title
 * - minSalary
 * - hasEquity(if true, equity > 0 , false alljobs.)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    // check for query parameters
    if (Object.values(req.query).length > 0) {
      const validator = jsonschema.validate(req.query, jobFilterSchema);
      
      // validate parameters passed.
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(`Filters allowed are : title, minSalary and hasEquity`);
        
      // if valid use filters to get jobs  
      } else {
        const jobs = await Job.find(req.query)
        return res.json({ jobs })
      }
      
    // if no query parameters provided get all jobs
    }else {
      const jobs = await Job.findAll();
      return res.json({ jobs });
    }
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { job }
 *
 *  jobs are [{ id, title, salary, equity, companyHandle}, ...]
 *   
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const jobs = await Job.get(req.params.handle);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: ADMIN login
 */

router.patch("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { msg : deleted }
 *
 * Authorization: ADMIN login
 */

router.delete("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    await Job.remove(req.params.id);
    return res.json({ msg: "deleted" });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
