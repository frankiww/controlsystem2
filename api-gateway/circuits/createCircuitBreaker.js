const axios = require('axios');
const CircuitBreaker = require('opossum');

const circuitOptions = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 3000
};

function createCircuitBreaker(serviceName) {
  const breaker = new CircuitBreaker(async (url, options = {}) => {
    try {
      const response = await axios({
        url,
        ...options,
        validateStatus: () => true //s => (s >= 200 && s < 300) || s === 404
      });
      return response.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return err.response.data;
      }
      throw err;
    }
  }, circuitOptions);

  breaker.fallback(() => ({ error: `${serviceName} service temporarily unavailable` }));

  breaker.on('open', () => console.log(`${serviceName} circuit opened`));
  breaker.on('close', () => console.log(`${serviceName} circuit closed`));
  breaker.on('halfOpen', () => console.log(`${serviceName} circuit half-open`));

  return breaker;
}

module.exports = createCircuitBreaker;
