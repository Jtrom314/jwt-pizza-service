// __mocks__/metrics.js

class MockMetrics {
    constructor() {
      this.totalRequests = 0;
      this.methods = { GET: 0, POST: 0, DELETE: 0, PUT: 0 };
      this.pizzaData = { numSold: 0, totalRevenue: 0, creationLatency: [], creationFailures: 0 };
      this.authAttempts = { successful: 0, failed: 0 };
      this.activeUsers = new Set();
    }
  
    trackAuthAttempts(success) {
      if (success) {
        this.authAttempts.successful++;
      } else {
        this.authAttempts.failed++;
      }
    }
  
    addActiveUser(userId) {
      this.activeUsers.add(userId);
    }
  
    removeActiveUser(userId) {
      this.activeUsers.delete(userId);
    }
  
    incrementRequests(method) {
      this.totalRequests++;
      if (this.methods[method] !== undefined) {
        this.methods[method]++;
      }
    }
  
    trackPizzaSale(price, latency, success) {
      this.pizzaData.numSold++;
      this.pizzaData.totalRevenue += price;
      if (latency !== null) {
        this.pizzaData.creationLatency.push(latency);
      }
      if (!success) {
        this.pizzaData.creationFailures++;
      }
    }
  
    getAveragePizzaCreationLatency() {
      const totalLatency = this.pizzaData.creationLatency.reduce((acc, val) => acc + val, 0);
      return this.pizzaData.creationLatency.length ? (totalLatency / this.pizzaData.creationLatency.length).toFixed(2) : 0;
    }
  
    getCpuUsagePercentage() {
      return (Math.random() * 100).toFixed(2); // Mocked value
    }
  
    getMemoryUsagePercentage() {
      return (Math.random() * 100).toFixed(2); // Mocked value
    }
  
    sendMetrics(metricPrefix, metricName, metricValue) {
      // Mock implementation that does nothing
      return {metricPrefix, metricName, metricValue}
    }
  }
  
  module.exports = new MockMetrics();
  