const config = require('./config.js');
const os = require('os');

class Metrics {
    constructor() {
        this.totalRequests = 0;
        this.methods = {
            GET: 0,
            POST: 0,
            DELETE: 0,
            PUT: 0,
        };
        this.pizzaData = {
            numSold: 0,
            totalRevenue: 0,
            creationLatency: [],
            creationFailures: 0,
        };
        this.authAttempts = {
            successful: 0,
            failed: 0,
        };
        this.activeUsers = new Set();
    }

    sendMetricsPeriodically (rate) {
        this.intervalId = setInterval(() => {
            this.sendMetrics('osMetric', 'cpu_percentage', this.getCpuUsagePercentage());
            this.sendMetrics('osMetric', 'memory_percentage', this.getMemoryUsagePercentage());

            this.sendMetrics('httpMetric', 'all_http_methods', this.totalRequests);
            this.sendMetrics('httpMetric', 'get_http_method', this.methods.GET);
            this.sendMetrics('httpMetric', 'post_http_method', this.methods.POST);
            this.sendMetrics('httpMetric', 'delete_http_method', this.methods.DELETE);
            this.sendMetrics('httpMetric', 'put_http_method', this.methods.PUT);

            this.sendMetrics('pizzaMetric', 'pizza_sold', this.pizzaData.numSold);
            this.sendMetrics('pizzaMetric', 'pizza_revenue', this.pizzaData.totalRevenue);
            this.sendMetrics('pizzaMetric', 'pizza_avg_latency', this.getAveragePizzaCreationLatency());
            this.sendMetrics('pizzaMetric', 'pizza_creation_failures', this.pizzaData.creationFailures);

            this.sendMetrics('authMetric', 'auth_success', this.authAttempts.successful);
            this.sendMetrics('authMetric', 'auth_failed', this.authAttempts.failed);

            this.sendMetrics('userMetric', 'active_users', this.activeUsers.size);
        }, rate).unref()
    }

    trackAuthAttempts(success) {
        if (success) {
            this.authAttempts.successful++;
        } else {
            this.authAttempts.failed++;
        }
    }

    stopSendingMetrics() {
        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = null
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

    orderFailure() {
        this.pizzaData.creationFailures++
    }

    reportLatency(latency) {
        this.pizzaData.creationLatency.push(latency)
    }

    reportPrice(price) {
        this.pizzaData.totalRevenue += price
    }

    reportNumSold(numSold) {
        this.pizzaData.numSold += numSold
    }

    getAveragePizzaCreationLatency() {
        const totalLatency = this.pizzaData.creationLatency.reduce((acc, val) => acc + val, 0);
        return this.pizzaData.creationLatency.length
            ? (totalLatency / this.pizzaData.creationLatency.length).toFixed(2)
            : 0;
    }

    getCpuUsagePercentage() {
        const cpuUsage = os.loadavg()[0] / os.cpus().length;
        return (cpuUsage * 100).toFixed(2);
    }

    getMemoryUsagePercentage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = (usedMemory / totalMemory) * 100;
        return memoryUsage.toFixed(2);
    }

    nowString() {
        return (Math.floor(Date.now()) * 1000000).toString();
      }

    sendMetrics(metricPrefix, metricName, metricValue) {
        const metric = `${metricPrefix},source=${config.metrics.source} ${metricName}=${metricValue} ${this.nowString()}`;
        // console.table({PREFIX: metricPrefix, NAME: metricName, VALUE: metricValue})
        // console.table({URL: config.metrics.url, UserID: config.metrics.userId, APIKEY: config.metrics.apiKey})

        // console.log(metric)

        fetch(`${config.metrics.url}`, {
            method: 'POST',
            body: metric,
            headers: {
                Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}`,
            },
        })
            .then((res) => {
                if (!res.ok) {
                    console.error('Failed');
                } else {
                    // console.log(`Pushed ${metric}`);
                }
            })
            .catch((error) => {
                console.error('Error pushing metric: ', error);
            });
    }
}

const metrics = new Metrics();
module.exports = metrics;
