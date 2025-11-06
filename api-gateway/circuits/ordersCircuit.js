const createCircuitBreaker = require('./createCircuitBreaker');
const ordersCircuit = createCircuitBreaker('Orders');
module.exports = ordersCircuit;