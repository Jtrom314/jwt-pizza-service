const config = require('./config.js');
const os = require('os')

class Metrics {
    constructor() {
        /**
         * Metrics needed:
         * 
         * 1. HTTP requests by method/minute                ✔
         * 2. Active Users                                  ✔
         * 3. Authetiication attempts/minute                ✔
         *      i. Successful                               ✔
         *      ii. Failed                                  ✔
         * 4. CPU usage percentage                          ✔
         * 5. Memory usage percentage                       ✔
         * 6. Pizzas                                        ✔
         *      i. Sold/minute                              ✔
         *      ii. Revenue/minute                          ✔
         *      iii. Creation latency                       ✔
         *      iv. Creation failures                       ✔
         */
        this.totalRequests = 0
        this.methods = {
            GET: 0,
            POST: 0,
            DELETE: 0,
            PUT: 0
        }
        this.pizzaData = {
            numSold: 0,
            totalRevenue: 0,
            creationLatency: [],
            creationFailures: 0
        }
        this.authAttemps = {
            successful: 0,
            failed: 0
        }
        this.activeUsers = new Set()

        const timer = setInterval(() => {
            this.sendMetrics('osMetric', 'cpu_percentage', this.getCpuUsagePercentage())
            this.sendMetrics('osMetric', 'memory_percentage', this.getMemoryUsagePercentage())

            this.sendMetrics('httpMetric', 'all_http_methods', this.totalRequests)
            this.sendMetrics('httpMetric', 'get_http_method', this.methods.GET)
            this.sendMetrics('httpMetric', 'post_http_method', this.methods.POST),
            this.sendMetrics('httpMetric', 'delete_http_method', this.methods.DELETE)
            this.sendMetrics('httpMetric', 'put_http_method', this.methods.PUT)

            this.sendMetrics('pizzaMetric', 'pizza_sold', this.pizzaData.numSold)
            this.sendMetrics('pizzaMetric', 'pizza_revenue', this.pizzaData.totalRevenue)
            this.sendMetrics('pizzaMetric', 'pizza_avg_latency', this.getAveragePizzaCreationLatency())
            this.sendMetrics('pizzaMetric', 'pizza_creation_failures', this.pizzaData.creationFailures)

            this.sendMetrics('authMetric', 'auth_success', this.authAttemps.successful)
            this.sendMetrics('authMetric', 'auth_failed', this.authAttemps.failed)

            this.sendMetrics('userMetric', 'active_users', this.activeUsers.size)
        , 10000})

        timer.unref()
    }
    trackAuthAttemps(success) {
        if (success) {
            this.authAttemps.successful++
        } else {
            this.authAttemps.failed++
        }
    }

    addActiveUser(userId) {
        this.activeUsers.add(userId)
    }

    removeActiveUser(userId) {
        this.activeUsers.delete(userId)
    }

    incrementRequests(method) {
        this.totalRequests ++
        if (this.methods[method] !== undefined) {
            this.methods[method]++;
          }
    }

    trackPizzaSale(price, latency, success) {
        this.pizzaData.numSold ++
        this.pizzaData.totalRevenue += price
        if (latency !== null) {
            this.pizzaData.creationLatency.push(latency)
        }
        if (!success) {
            this.pizzaData.creationFailures++
        }
    }

    getAveragePizzaCreationLatency() {
        const totalLatency = this.pizzaData.creationLatency = this.creationLatency.reduce((acc, val) => acc + val, 0)
        return this.pizzaData.creationLatency.length ? (totalLatency / this.pizzaData.creationLatency.length).toFixed(2) : 0
    }

    getCpuUsagePercentage() {
        const cpuUsage = os.loadavg()[0] / os.cpus().length
        return cpuUsage.toFixed(2) * 100
    }

    getMemoryUsagePercentage() {
        const totalMemory = os.totalmem()
        const freeMemory = os.freemem()
        const usedMemory = totalMemory - freeMemory
        const memoryUsage = (usedMemory / totalMemory) * 100
        return memoryUsage.toFixed(2)
    }

    sendMetrics(metricPrefix, httpMethod, metricName, metricValue) {
        const metric = `${metricPrefix},source=${config.source},method=${httpMethod} ${metricName}=${metricValue}`

        fetch(`${config.url}`, {
            method: 'POST',
            body: metric,
            headers: {
                Authorization: `Bearer ${config.userId}:${config.apiKey}`
            }
        })
            .then((res) => {
                if (!res.ok) {
                    console.error('Failed')
                } else {
                    console.log(`Pushed ${metric}`)
                }
            })
            .catch((error) => {
                console.error('Error pusshing metric: ', error)
            })
    }
}

const metrics = new Metrics()
module.exports = metrics