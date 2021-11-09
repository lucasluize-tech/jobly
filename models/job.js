"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


class Jobs{
    
    /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * */
    
  static async create({ title, salary, equity, companyHandle }){
        const result = await db.query(`
                INSERT INTO jobs
                (title, salary, equity, company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
                [title, salary , equity, companyHandle])
        
        return result.rows[0]
        
    }
    
    /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {
    const jobs = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle as "companyHandle"
           FROM jobs`);
    return jobs.rows;
  }
  
  /** Given a  companyHandle, return data about jobs from that company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(companyHandle) {
    const jobsRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle as "companyHandle"
           FROM jobs
           WHERE company_handle = $1`,
        [companyHandle]);

    const jobs = jobsRes.rows[0];

    if (!jobs) throw new NotFoundError(`No job for company: ${companyHandle}`);

    return jobsRes.rows;
  }
  
  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data, {});
    
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
                                
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }
  
  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING title`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }
  
  /** Find all jobs that match query parameters.
  * Returns [{ id, title, salary, equity}, ...]
  * */
  
  static async find(params){
    const { title, minSalary, hasEquity } = params;
    
    if (title && minSalary) {
      const min = parseInt(minSalary)
      const res = await db.query(`
                SELECT id, title, salary, equity, company_handle AS "companyHandle"
                 FROM jobs
                WHERE salary >= $1  AND title=$2
                ORDER BY salary`, [min, title])
      if (res.rows.length === 0) {
        throw new NotFoundError(`No jobs with that minSalary: ${min} and equity`);
      }
      return res.rows
    
    } else if (title){
      let res =  await db.query(`
              SELECT id, title, salary, equity, company_handle AS "companyHandle"
              FROM jobs
              WHERE title ILIKE $1`,[`%${title}%`])
    if (res.rows.length === 0 ){
        throw new NotFoundError(`No jobs with that title: ${title}`);
      }
      return res.rows
    }
    
    else if (minSalary && hasEquity === 'true') {
      const min = parseInt(minSalary)
      const res = await db.query(`
                SELECT id, title, salary, equity, company_handle AS "companyHandle"
                 FROM jobs
                WHERE salary >= $1 AND equity > 0
                ORDER BY salary`, [min])
      if (res.rows.length === 0) {
        throw new NotFoundError(`No jobs with that minSalary: ${min} and equity`);
      }
      return res.rows
      
    }else if(minSalary){
      const min = parseInt(minSalary)
      const res = await db.query(`
                SELECT id, title, salary, equity, company_handle AS "companyHandle"
                FROM jobs
                WHERE salary >= $1
                ORDER BY salary`, [min])
      if (res.rows.length === 0 ){
        throw new NotFoundError(`No jobs with that minSalary: ${min}`);
      }
      return res.rows
    }
    
    else if(hasEquity === 'true'){
      const res = await db.query(`
                SELECT id, title, salary, equity, company_handle AS "companyHandle"
                FROM jobs
                WHERE equity > 0
                ORDER BY equity DESC`)
      
      return res.rows
      
    }else if(hasEquity === 'false'){
      const res = await db.query(`
                SELECT id, title, salary, equity, company_handle AS "companyHandle"
                FROM jobs
                WHERE equity=0 OR equity=null
                ORDER BY equity DESC`)
      
      return res.rows
      
    }else if (hasEquity !== 'true' || hasEquity !== 'false'){
      throw new BadRequestError(`hasEquity must be either true or false`)
    }
  }
}


module.exports = Jobs;

