const createCircuitBreaker = require('./createCircuitBreaker');
const usersCircuit = createCircuitBreaker('Users');
module.exports = usersCircuit;