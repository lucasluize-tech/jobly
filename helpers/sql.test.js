const { sqlForPartialUpdate } = require('./sql')

const jsToSql = {
    firstName: "first_name",
    lastName: "last_name",
    isAdmin: "is_admin"
}

describe('partialUpdate', function(){
    
    const modifiedData = {
        firstName : "Angelino",
        lastName: "Louise",
        isAdmin: false
    }
    
    test('Should update partial data', ()=>{    
        const res = sqlForPartialUpdate(modifiedData, jsToSql) 
        expect(res.setCols).toEqual('"first_name"=$1, "last_name"=$2, "is_admin"=$3')
        expect(res.values).toEqual(["Angelino", "Louise", false])
    })
})