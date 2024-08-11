const config = require('./config.js');

class Logger { 
    /**
     * Required Logging:
     * 
     * 1. HTTP requests
     *      i.      HTTP method, path, status code
     *      ii.     If the request has an authorization header
     *      iii.    Request body
     *      iv.     Response body
     * 2. Database requests
     *      i.      SQL queries
     * 3. Factory service requests
     *      i.      Pizza was created with the given parameters
     *      ii.     Factory responsed with such and such values
     * 4. Any unhandled exceptions
     * *** Sanitize all log entries so that they do not contain any confidential infromation ***
     *
     */
    statusLevels = {
        info: 'info',
        warn: 'warn',
        error: 'error'
    }

    logTypes = {
        http: 'http',
        database: 'db',
        factory: 'factory',
        exception: 'exception'
    }

    httpLogger = (req, res) => {
        let send = res.send
        res.send = (resBody) => {
            const logData = {
                authorized: !!req.headers.authorization,
                path: req.path,
                method: req.method,
                statusCode: res.statusCode,
                reqBody: JSON.stringify(req.body),
                resBody: JSON.stringify(resBody)
            }

            const level = this.statusToLogLevel(res.statusCode)
            this.log(level, this.logTypes.http, logData)
            res.send = send
            return res.send(resBody)
        }
    }

    databaseLogger = (query) => {
        this.log(this.statusLevels.info, this.logTypes.database, query)
    }

    factoryLogger = (payload) => {
        this.log(this.statusLevels.info, this.logTypes.factory, payload)
    }

    exceptionLogger = (payload) => {
        this.log(this.statusLevels.error, this.logTypes.exception, payload)
    }

    log(level, type, logData) {
        const labels = { component: config.source, level, type }
        const values = [this.nowString(), this.sanitize(type, logData)]
        const logEvent = { streams: [{ stream: labels, values: [values] }] }

        this.sendLog(logEvent)
    }

    statusToLogLevel(statusCode) {
        if (statusCode >= 500) return this.statusLevels.error
        if (statusCode >= 400) return this.statusLevels.warn
        return this.statusLevels.info
    }

    nowString() {
        return (Math.floor(Date.now()) * 1000000).toString()
    }

    sanitize(type, logData) {
        switch (type) {
            case this.logTypes.http:
            case this.logTypes.database:
            case this.logTypes.factory:
            case this.logTypes.exception:
            default:
                logData = JSON.stringify(logData)
                return logData.replace(/\\"password\\":\s*\\"[^"]*\\"/g, '\\"password\\": \\"*****\\"')
                                
        }
    }

    sendLog(event) {
        // console.log(event)
        const body = JSON.stringify(event)
        fetch(`${config.logging.url}`, {
            method: 'POST',
            body: body,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.logging.userId}:${config.logging.apiKey}`
            }
        }).then((res) => {
            if (!res.ok) console.log('Failed to send log')
        }).catch(() => {
    })
    }
}

module.exports = new Logger()
