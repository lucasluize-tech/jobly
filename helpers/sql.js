const { BadRequestError } = require("../expressError");

/*
    This function will grab the data to be updated from the body request, and will only update needed columns.
    
    first parameter is the data to be updated, second parameter turns camelCase variables to the appropriate table name.
    
    e.g: data = {
  firstName: 'lucas',
  lastName: 'Luize',
  password: 'somepw',
  email: 'lucasluize@gmail.com',
  isAdmin: true
  
}
    and the right table names are -> const jsToSql = {
      firstName:"first_name", lastName: "last_name", isAdmin: "is_admin"
    }
    
sqlForPartialUpdate(data, jsToSql)
> {
  setCols: '"first_name"=$1, "last_name"=$2, "password"=$3, "email"=$4, "is_admin"=$5',
  values: [ 'lucas', 'Luize', 'somepw', 'lucasluize@gmail.com', true ]
}


*/ 

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
