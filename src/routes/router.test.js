const request = require('supertest');
const app = require('../service.js');
const { Role, DB }  = require('../database/database.js');
const metrics = require('../metrics.js')

async function createAdminUser() {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = randomName();
    user.email = user.name + '@admin.com';
    const res = await DB.addUser(user);
    user.id = res.id
    return user;
}

function randomName() {
    return Math.random().toString(36).substring(2, 12)
}
describe('Diner User Tests', () => {
    const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
    let testUserAuthToken;

    beforeAll(async () => {
        testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
        const registerRes = await request(app).post('/api/auth').send(testUser);
        testUserAuthToken = registerRes.body.token;
    });
    
    
    test('login', async () => {
        const loginRes = await request(app).put('/api/auth').send(testUser);
        expect(loginRes.status).toBe(200);
        expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
        
        let user  = { ...testUser, roles: [{ role: 'diner' }] };
        user = Object.keys(user).filter(objKey => objKey !== 'password').reduce((newObj, key) => {
            newObj[key] = user[key]
            return newObj
        }, {})
        expect(loginRes.body.user).toMatchObject(user);
    });
    test('get menu returns menu', async () => {
        const menuRes = await request(app).get('/api/order/menu')
        expect(menuRes.status).toBe(200)
    })
    test('get orders', async () => {
        const ordersRes = await request(app).get('/api/order').set('Authorization', `Bearer ${testUserAuthToken}`)
        expect(ordersRes.status).toBe(200)
        expect(ordersRes.body.orders).toEqual([])
    })
    test('get all franchises', async () => {
        const franchiseRes = await request(app).get('/api/franchise')
        expect(franchiseRes.status).toBe(200)
    })

    afterEach(() => {
        metrics.stopSendingMetrics()
    })
})



describe('Admin User Tests', () => {
    let adminAuthToken
    let adminEmail
    let adminUser
    beforeAll(async () => {
        adminUser = await createAdminUser();
        
        // Login as admin user
        const loginRes = await request(app).put('/api/auth').send({
            email: adminUser.email,
            password: 'toomanysecrets'
        });
        expect(loginRes.status).toBe(200)
        adminAuthToken = loginRes.body.token
        adminEmail = adminUser.email
    })

    test('update user', async () => {
        const updatedUser = {
            email: adminEmail,
            password: 'moarSecrets',
        }
        const updateRequest = await request(app).put(`/api/auth/${adminUser.id}`).set('Authorization', `Bearer ${adminAuthToken}`).send(updatedUser)
        expect(updateRequest.status).toBe(200)
    })

    test('add menu item', async () => {
        const menuItem = {
            title: randomName(),
            description: randomName(),
            image: randomName(),
            price: Math.random().toFixed(2)
        }
        const menuRes = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${adminAuthToken}`).send(menuItem);
    
        const filtered = (obj, menuItem) => {
            const menuKeys = Object.keys(menuItem);
            let matchCount = 0;
    
            for (let key of menuKeys) {
                if (obj[key] === menuItem[key]) {
                    matchCount++;
                }
            }
            return matchCount >= 3;
        };

        const acutual = menuRes.body.find(item => filtered(item, menuItem))
    
        expect(menuRes.statusCode).toBe(200);
        expect(acutual.title).toBe(menuItem.title);
    })

    test('create franchise', async () => {
        const franchiseObj = {
            admins: [
                {
                    email: adminEmail
                }
            ],
            name: randomName()
        }
        const franchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminAuthToken}`).send(franchiseObj)

        expect(franchiseRes.statusCode).toBe(200)
        expect(franchiseRes.body.name).toBe(franchiseObj.name)
    })


    test('delete franchise', async () => {
        const franchiseObj = {
            admins: [
                {
                    email: adminEmail
                }
            ],
            name: randomName()
        }
        const franchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminAuthToken}`).send(franchiseObj)
        const franchiseId = franchiseRes.body.id
        const deleteRes = await request(app).delete(`/api/franchise/${franchiseId}`).set('Authorization', `Bearer ${adminAuthToken}`)
        expect(deleteRes.status).toBe(200)
        expect(deleteRes.body.message).toBe("franchise deleted")
    })

    test('create store in franchise', async () => {
        const franchiseObj = {
            admins: [
                {
                    email: adminEmail
                }
            ],
            name: randomName()
        }
        const franchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminAuthToken}`).send(franchiseObj)
        const franchiseId = franchiseRes.body.id
        const storeObj = {
            name: randomName()
        }
        const storeRes = await request(app).post(`/api/franchise/${franchiseId}/store`).set('Authorization', `Bearer ${adminAuthToken}`).send(storeObj)
        expect(storeRes.status).toBe(200)
    })

    test('create order', async () => {
        const franchiseObj = {
            admins: [
                {
                    email: adminEmail
                }
            ],
            name: randomName()
        }
        const franchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminAuthToken}`).send(franchiseObj)
        const franchiseId = franchiseRes.body.id
        const storeObj = {
            name: randomName()
        }
        const storeRes = await request(app).post(`/api/franchise/${franchiseId}/store`).set('Authorization', `Bearer ${adminAuthToken}`).send(storeObj)
        const storeId = storeRes.body.id
        const order = {
            franchiseId: franchiseId,
            storeId: storeId,
            items: [
                {
                    menuId: 1,
                    description: randomName(),
                    price: Math.random()
                }
            ]
        }

        const orderRes = await request(app).post('/api/order').set('Authorization', `Bearer ${adminAuthToken}`).send(order)
        expect(orderRes.status).toBe(200)
    })

    test('create store in franchise UNAUTHORIZED', async () => {
        const franchiseObj = {
            admins: [
                {
                    email: adminEmail
                }
            ],
            name: randomName()
        }
        const franchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminAuthToken}`).send(franchiseObj)
        const franchiseId = franchiseRes.body.id
        const storeRes = await request(app).post(`/api/franchise/${franchiseId}/store`)
        expect(storeRes.status).not.toBe(200)
    })

    test('delete store in franchise', async () => {
        const franchiseObj = {
            admins: [
                {
                    email: adminEmail
                }
            ],
            name: randomName()
        }
        const franchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminAuthToken}`).send(franchiseObj)
        const franchiseId = franchiseRes.body.id
        const storeObj = {
            name: randomName()
        }
        const storeRes = await request(app).post(`/api/franchise/${franchiseId}/store`).set('Authorization', `Bearer ${adminAuthToken}`).send(storeObj)
        const storeId = storeRes.body.id
        const deleteRes = await request(app).delete(`/api/franchise/${franchiseId}/store/${storeId}`).set('Authorization', `Bearer ${adminAuthToken}`)
        expect(deleteRes.status).toBe(200)
        expect(deleteRes.body.message).toBe('store deleted')
    })

    test('get franchise by userid', async () => {
        const franchiseObj = {
            admins: [
                {
                    email: adminEmail
                }
            ],
            name: randomName()
        }
        const franchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminAuthToken}`).send(franchiseObj)
        const adminId = franchiseRes.body.admins[0].id
        const franchisedRes = await request(app).get(`/api/franchise/${adminId}`).set('Authorization', `Bearer ${adminAuthToken}`)
        expect(franchisedRes.status).toBe(200)
    })

    afterEach(() => {
        metrics.stopSendingMetrics()
    })
})

describe('Metric Tests', () => {

    beforeAll(() => {
        jest.useFakeTimers(); 
    });

    beforeEach(() => {

        metrics.totalRequests = 0;
        metrics.methods = {
            GET: 0,
            POST: 0,
            DELETE: 0,
            PUT: 0,
        };
        metrics.pizzaData = {
            numSold: 0,
            totalRevenue: 0,
            creationLatency: [],
            creationFailures: 0,
        };
        metrics.authAttempts = {
            successful: 0,
            failed: 0,
        };
        metrics.activeUsers = new Set();

        global.fetch = jest.fn();
    });

    test('trackAuthAttemps should increment correctly', () => {
        metrics.trackAuthAttempts(true);
        metrics.trackAuthAttempts(false);

        expect(metrics.authAttempts.successful).toBe(1);
        expect(metrics.authAttempts.failed).toBe(1);
    });

    test('addActiveUser and removeActiveUser adds and removes user', () => {
        metrics.addActiveUser(1);

        expect(metrics.activeUsers.size).toBe(1);

        metrics.removeActiveUser(1);

        expect(metrics.activeUsers.size).toBe(0);
    });

    test('incrementRequests increments successfuly', () => {
        metrics.incrementRequests('GET');

        expect(metrics.totalRequests).toBe(1);
        expect(metrics.methods.GET).toBe(1);
    });

    test('trackPizzaSale handles correctly', () => {
        metrics.trackPizzaSale(10, null, true);
        
        expect(metrics.pizzaData.numSold).toBe(1);
        expect(metrics.pizzaData.totalRevenue).toBe(10);
        expect(metrics.pizzaData.creationLatency.length).toBe(0);
        expect(metrics.pizzaData.creationFailures).toBe(0);

        metrics.trackPizzaSale(10, 0.1, false);

        expect(metrics.pizzaData.numSold).toBe(2);
        expect(metrics.pizzaData.totalRevenue).toBe(20);
        expect(metrics.pizzaData.creationLatency.length).toBe(1);
        expect(metrics.pizzaData.creationFailures).toBe(1);
    });

    test('getAveragePizzaCreationLatency gives correct average', () => {
        metrics.pizzaData.creationLatency = [];
        expect(metrics.getAveragePizzaCreationLatency()).toBe(0);

        metrics.trackPizzaSale(10, 0.1, false);

        expect(metrics.getAveragePizzaCreationLatency()).toBe('0.10');
    });

    test('getCpuUsagePercentageIsNotNull', () => {
        const cpuUsagePercentage = metrics.getCpuUsagePercentage();
        expect(cpuUsagePercentage).not.toBeNull();
    });

    test('getMemoryUsagePercentageIsNotNull', () => {
        const memoryUsage = metrics.getMemoryUsagePercentage();
        expect(memoryUsage).not.toBeNull();
    });

    test('fetch should send metrics', async () => {
        const metricPrefix = 'httpMetric';
        const metricName = 'total_requests';
        const metricValue = 100;

        global.fetch.mockResolvedValue({ status: 200 });

        await metrics.sendMetrics(metricPrefix, metricName, metricValue);

        expect(global.fetch).toHaveBeenCalled()
    });

    test('fetch should handle errors', async () => {
        global.fetch.mockRejectedValue(new Error('Network Error'));

        const metricPrefix = 'httpMetric';
        const metricName = 'total_requests';
        const metricValue = 100;

        await metrics.sendMetrics(metricPrefix, metricName, metricValue);

        expect(global.fetch).toHaveBeenCalled();
    });

    afterEach(() => {
        metrics.stopSendingMetrics()
        global.fetch.mockRestore();
        jest.clearAllTimers(); // Clear all timers
    });
});
