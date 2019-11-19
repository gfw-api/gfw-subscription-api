const chai = require('chai');
const nock = require('nock');
const config = require('config');
const moment = require('moment');
const Subscription = require('models/subscription');
const Statistic = require('models/statistic');
const fs = require('fs');
const path = require('path');
const redis = require('redis');
const taskConfig = require('../../../config/cron.json');
const { getTestServer } = require('./utils/test-server');

const { createSubscription } = require('./utils/helpers');
const { ROLES } = require('./utils/test.constants');

const AlertQueue = require('../../src/queues/alert.queue');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();
chai.use(require('chai-datetime'));

const CHANNEL = config.get('apiGateway.queueName');
const redisClient = redis.createClient({ url: config.get('redis.url') });
redisClient.subscribe(CHANNEL);

describe('AlertQueue ', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
        if (config.get('settings.loadCron') && config.get('settings.loadCron') !== 'false') {
            throw Error(`Running the test suite with cron enabled is not supported. You can disable cron by setting the LOAD_CRON env variable to false.`);
        }

        await getTestServer();

        await Subscription.deleteMany({}).exec();
        await Statistic.deleteMany({}).exec();
    });

    it('Test viirs-active-fires message received with actual data triggers emails being queued and a statistic being collected', async () => {

        const initialStatistics = await Statistic.find().exec();
        initialStatistics.should.be.an('array').and.length(0);

        const subscriptionOne = await new Subscription(createSubscription(ROLES.USER.id, 'viirs-active-fires')).save();

        const task = taskConfig.find((e) => e.dataset === 'viirs-active-fires');

        const beginDate = moment().subtract(task.gap.value, task.gap.measure).subtract(task.periodicity.value, task.periodicity.measure).toDate();
        const endDate = moment().subtract(task.gap.value, task.gap.measure).toDate();

        nock(process.env.CT_URL)
            .get('/v1/viirs-active-fires/')
            .query({
                period: `${moment(beginDate).format('YYYY-MM-DD')},${moment(endDate).format('YYYY-MM-DD')}`,
                geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw'
            })
            .once()
            .reply(200, JSON.parse(fs.readFileSync(path.join(__dirname, 'resources', 'viirs-active-fires-response.json'))));

        nock(process.env.CT_URL)
            .get('/v1/viirs-active-fires/')
            .query({
                period: `${moment(beginDate).format('YYYY-MM-DD')},${moment(endDate).format('YYYY-MM-DD')}`,
                geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw',
                forSubscription: true
            })
            .once()
            .reply(200, {
                data: []
            });

        nock(`https://${process.env.CARTODB_USER}.cartodb.com`)
            .post('/api/v1/map', `{"version":"1.3.0","layers":[{"type":"http","options":{"urlTemplate":"http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png","subdomains":["a","b","c"]}},{"type":"mapnik","options":{"cartocss_version":"2.1.1","cartocss":"#layer { marker-fill: #FFCC00; marker-width: 1.5; marker-line-color: #FFF; marker-line-width: 1; marker-line-opacity: 1; marker-opacity: 0.9; marker-comp-op: multiply; marker-type: ellipse; marker-placement: point; marker-allow-overlap: true; marker-clip: false; marker-multi-policy: largest;} #layer[zoom>6]{ marker-width: 3; } #layer[zoom>8]{ marker-width: 6; } #layer[zoom>11]{ marker-width: 13; } #layer[zoom>12]{ marker-width: 25; } #layer[zoom>13]{ marker-width: 50; } #layer[zoom>14]{ marker-width: 100; } #layer[zoom>15]{ marker-width: 200; } #layer[zoom>16]{ marker-width: 400; } #layer[zoom>17]{ marker-width: 800; }","sql":"SELECT the_geom_webmercator, 'vnp14imgtdl_nrt_global_7d' as tablename, 'vnp14imgtdl_nrt_global_7d' AS layer, acq_time, COALESCE(to_char(acq_date, 'DD Mon, YYYY')) as acq_date, confidence, bright_ti4 brightness, longitude, latitude FROM vnp14imgtdl_nrt_global_7d WHERE acq_date >= '${moment(beginDate).format('YYYY-MM-DD')}' AND confidence != 'low'"}},{"type":"mapnik","options":{"cartocss_version":"2.1.1","cartocss":"#layer{polygon-opacity: 0; line-color: #A2BC28; line-width: 3; line-opacity: 1;}","sql":"SELECT ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON('{\\"type\\":\\"Polygon\\",\\"coordinates\\":[[[-56.80497166099991,-22.425827288999876],[-56.817045236999945,-22.482535483999882],[-56.85328547199998,-22.463761627999883],[-56.83759920499995,-22.41092532299985],[-56.83483518899993,-22.413073965999914],[-56.832400797999924,-22.41543968799989],[-56.82911534399989,-22.42040937799989],[-56.81942114499998,-22.42550003099992],[-56.81439037899986,-22.42586786899991],[-56.81113715299989,-22.42564125899988],[-56.810228355999925,-22.425840631999918],[-56.80497166099991,-22.425827288999876]]]}'),4326),3857) AS the_geom_webmercator"}},{"type":"http","options":{"urlTemplate":"http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png","subdomains":["a","b","c"]}}]}`)
            .reply(200, {
                layergroupid: '9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320',
                metadata: {
                    layers: [
                        {
                            type: 'http',
                            id: 'http-layer0',
                            meta: {
                                stats: {}
                            },
                            tilejson: {
                                raster: {
                                    tilejson: '2.2.0',
                                    tiles: [
                                        'https://cartocdn-gusc-a.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/http-layer0/{z}/{x}/{y}.png',
                                        'https://cartocdn-gusc-b.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/http-layer0/{z}/{x}/{y}.png',
                                        'https://cartocdn-gusc-c.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/http-layer0/{z}/{x}/{y}.png',
                                        'https://cartocdn-gusc-d.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/http-layer0/{z}/{x}/{y}.png'
                                    ]
                                }
                            }
                        },
                        {
                            type: 'mapnik',
                            id: 'layer0',
                            meta: {
                                // eslint-disable-next-line max-len
                                cartocss: '#layer { marker-fill: #FFCC00; marker-width: 1.5; marker-line-color: #FFF; marker-line-width: 1; marker-line-opacity: 1; marker-opacity: 0.9; marker-comp-op: multiply; marker-type: ellipse; marker-placement: point; marker-allow-overlap: true; marker-clip: false; marker-multi-policy: largest;} #layer[zoom>6]{ marker-width: 3; } #layer[zoom>8]{ marker-width: 6; } #layer[zoom>11]{ marker-width: 13; } #layer[zoom>12]{ marker-width: 25; } #layer[zoom>13]{ marker-width: 50; } #layer[zoom>14]{ marker-width: 100; } #layer[zoom>15]{ marker-width: 200; } #layer[zoom>16]{ marker-width: 400; } #layer[zoom>17]{ marker-width: 800; }',
                                stats: {
                                    estimatedFeatureCount: 40766
                                },
                                cartocss_meta: {
                                    rules: []
                                }
                            },
                            tilejson: {
                                vector: {
                                    tilejson: '2.2.0',
                                    tiles: [
                                        'https://cartocdn-gusc-a.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/layer0/{z}/{x}/{y}.mvt',
                                        'https://cartocdn-gusc-b.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/layer0/{z}/{x}/{y}.mvt',
                                        'https://cartocdn-gusc-c.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/layer0/{z}/{x}/{y}.mvt',
                                        'https://cartocdn-gusc-d.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/layer0/{z}/{x}/{y}.mvt'
                                    ]
                                },
                                raster: {
                                    tilejson: '2.2.0',
                                    tiles: [
                                        'https://cartocdn-gusc-a.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/layer0/{z}/{x}/{y}.png',
                                        'https://cartocdn-gusc-b.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/layer0/{z}/{x}/{y}.png',
                                        'https://cartocdn-gusc-c.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/layer0/{z}/{x}/{y}.png',
                                        'https://cartocdn-gusc-d.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/layer0/{z}/{x}/{y}.png'
                                    ]
                                }
                            }
                        },
                        {
                            type: 'mapnik',
                            id: 'layer1',
                            meta: {
                                cartocss: '#layer{polygon-opacity: 0; line-color: #A2BC28; line-width: 3; line-opacity: 1;}',
                                stats: {
                                    estimatedFeatureCount: 1
                                },
                                cartocss_meta: {
                                    rules: []
                                }
                            },
                            tilejson: {
                                vector: {
                                    tilejson: '2.2.0',
                                    tiles: [
                                        'https://cartocdn-gusc-a.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/layer1/{z}/{x}/{y}.mvt',
                                        'https://cartocdn-gusc-b.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/layer1/{z}/{x}/{y}.mvt',
                                        'https://cartocdn-gusc-c.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/layer1/{z}/{x}/{y}.mvt',
                                        'https://cartocdn-gusc-d.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/layer1/{z}/{x}/{y}.mvt'
                                    ]
                                },
                                raster: {
                                    tilejson: '2.2.0',
                                    tiles: [
                                        'https://cartocdn-gusc-a.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/layer1/{z}/{x}/{y}.png',
                                        'https://cartocdn-gusc-b.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/layer1/{z}/{x}/{y}.png',
                                        'https://cartocdn-gusc-c.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/layer1/{z}/{x}/{y}.png',
                                        'https://cartocdn-gusc-d.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/layer1/{z}/{x}/{y}.png'
                                    ]
                                }
                            }
                        },
                        {
                            type: 'http',
                            id: 'http-layer1',
                            meta: {
                                stats: {}
                            },
                            tilejson: {
                                raster: {
                                    tilejson: '2.2.0',
                                    tiles: [
                                        'https://cartocdn-gusc-a.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/http-layer1/{z}/{x}/{y}.png',
                                        'https://cartocdn-gusc-b.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/http-layer1/{z}/{x}/{y}.png',
                                        'https://cartocdn-gusc-c.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/http-layer1/{z}/{x}/{y}.png',
                                        'https://cartocdn-gusc-d.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/http-layer1/{z}/{x}/{y}.png'
                                    ]
                                }
                            }
                        }
                    ],
                    dataviews: {},
                    analyses: [],
                    tilejson: {
                        vector: {
                            tilejson: '2.2.0',
                            tiles: [
                                'https://cartocdn-gusc-a.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/{z}/{x}/{y}.mvt',
                                'https://cartocdn-gusc-b.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/{z}/{x}/{y}.mvt',
                                'https://cartocdn-gusc-c.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/{z}/{x}/{y}.mvt',
                                'https://cartocdn-gusc-d.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/{z}/{x}/{y}.mvt'
                            ]
                        },
                        raster: {
                            tilejson: '2.2.0',
                            tiles: [
                                'https://cartocdn-gusc-a.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/{z}/{x}/{y}.png',
                                'https://cartocdn-gusc-b.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/{z}/{x}/{y}.png',
                                'https://cartocdn-gusc-c.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/{z}/{x}/{y}.png',
                                'https://cartocdn-gusc-d.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/{z}/{x}/{y}.png'
                            ]
                        }
                    },
                    url: {
                        vector: {
                            urlTemplate: 'https://cartocdn-gusc-{s}.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/{z}/{x}/{y}.mvt',
                            subdomains: [
                                'a',
                                'b',
                                'c',
                                'd'
                            ]
                        },
                        raster: {
                            urlTemplate: 'https://cartocdn-gusc-{s}.global.ssl.fastly.net/wri-01/api/v1/map/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/{z}/{x}/{y}.png',
                            subdomains: [
                                'a',
                                'b',
                                'c',
                                'd'
                            ]
                        }
                    }
                },
                cdn_url: {
                    templates: {
                        http: {
                            subdomains: [
                                '0',
                                '1',
                                '2',
                                '3'
                            ],
                            url: 'http://{s}.gusc.cartocdn.com'
                        },
                        https: {
                            subdomains: [
                                'a',
                                'b',
                                'c',
                                'd'
                            ],
                            url: 'https://cartocdn-gusc-{s}.global.ssl.fastly.net'
                        }
                    },
                    http: 'gusc.cartocdn.com',
                    https: 'cartocdn-gusc.global.ssl.fastly.net'
                },
                last_updated: '2019-04-17T01:51:20.320Z'
            });

        nock(`https://${process.env.CARTODB_USER}.cartodb.com`)
            .get('/api/v2/sql')
            .query({
                format: 'json',
                // eslint-disable-next-line max-len
                q: 'SELECT ST_AsGeojson(ST_Expand(ST_Extent(ST_SetSRID(ST_GeomFromGeoJSON(\'{"type":"Polygon","coordinates":[[[-56.80497166099991,-22.425827288999876],[-56.817045236999945,-22.482535483999882],[-56.85328547199998,-22.463761627999883],[-56.83759920499995,-22.41092532299985],[-56.83483518899993,-22.413073965999914],[-56.832400797999924,-22.41543968799989],[-56.82911534399989,-22.42040937799989],[-56.81942114499998,-22.42550003099992],[-56.81439037899986,-22.42586786899991],[-56.81113715299989,-22.42564125899988],[-56.810228355999925,-22.425840631999918],[-56.80497166099991,-22.425827288999876]]]}\'),4326)),1)) AS bbox'
            })
            .reply(200, {
                rows: [
                    {
                        // eslint-disable-next-line max-len
                        bbox: '{"type":"Polygon","coordinates":[[[-57.853285472,-23.4825354839999],[-57.853285472,-21.4109253229999],[-55.8049716609999,-21.4109253229999],[-55.8049716609999,-23.4825354839999],[-57.853285472,-23.4825354839999]]]}'
                    }
                ],
                time: 0.001,
                fields: {
                    bbox: {
                        type: 'string'
                    }
                },
                total_rows: 1
            });

        nock(process.env.CT_URL)
            .get('/v1/geostore/agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw')
            .twice()
            .reply(200, {
                data: {
                    type: 'geoStore',
                    id: 'bbbdfae884a8038d78477f0b75c44ffc',
                    attributes: {
                        geojson: {
                            features: [
                                {
                                    type: 'Feature',
                                    geometry: {
                                        type: 'Polygon',
                                        coordinates: [
                                            [
                                                [
                                                    -56.80497166099991,
                                                    -22.425827288999876
                                                ],
                                                [
                                                    -56.817045236999945,
                                                    -22.482535483999882
                                                ],
                                                [
                                                    -56.85328547199998,
                                                    -22.463761627999883
                                                ],
                                                [
                                                    -56.83759920499995,
                                                    -22.41092532299985
                                                ],
                                                [
                                                    -56.83483518899993,
                                                    -22.413073965999914
                                                ],
                                                [
                                                    -56.832400797999924,
                                                    -22.41543968799989
                                                ],
                                                [
                                                    -56.82911534399989,
                                                    -22.42040937799989
                                                ],
                                                [
                                                    -56.81942114499998,
                                                    -22.42550003099992
                                                ],
                                                [
                                                    -56.81439037899986,
                                                    -22.42586786899991
                                                ],
                                                [
                                                    -56.81113715299989,
                                                    -22.42564125899988
                                                ],
                                                [
                                                    -56.810228355999925,
                                                    -22.425840631999918
                                                ],
                                                [
                                                    -56.80497166099991,
                                                    -22.425827288999876
                                                ]
                                            ]
                                        ]
                                    }
                                }
                            ],
                            crs: {},
                            type: 'FeatureCollection'
                        },
                        hash: 'bbbdfae884a8038d78477f0b75c44ffc',
                        provider: {},
                        areaHa: 2288.11071592866,
                        bbox: [
                            -56.85328547199998,
                            -22.482535483999882,
                            -56.80497166099991,
                            -22.41092532299985
                        ],
                        lock: false,
                        info: {
                            use: {}
                        }
                    }
                }
            });


        nock(`http://${process.env.CARTODB_USER}.cartodb.com`)
            .get('/api/v1/map/static/bbox/9aa067dff99aeffd442b4e0dd1cbcdd5:1555465880320/-57.853285472,-23.4825354839999,-55.8049716609999,-21.4109253229999/700/450.png')
            .reply(200, fs.readFileSync(path.join(__dirname, 'resources', 'subscription-map-tile.png')));

        process.on('unhandledRejection', (error) => {
            should.fail(error);
        });

        redisClient.on('message', (channel, message) => {
            const jsonMessage = JSON.parse(message);

            jsonMessage.should.have.property('template');


            switch (jsonMessage.template) {

                case 'fires-notification-en':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');

                    jsonMessage.data.should.have.property('alert_count').and.equal(3578);
                    jsonMessage.data.should.have.property('alert_date_begin').and.equal(moment(beginDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_date_end').and.equal(moment(endDate).format('YYYY-MM-DD'));
                    jsonMessage.data.should.have.property('alert_link').and.equal(`http://staging.globalforestwatch.org/map/3/0/0/ALL/grayscale/viirs_fires_alerts?begin=${moment(beginDate).format('YYYY-MM-DD')}&end=${moment(endDate).format('YYYY-MM-DD')}&fit_to_geom=true&geostore=agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw`);
                    jsonMessage.data.should.have.property('alert_name').and.equal(subscriptionOne.name);
                    jsonMessage.data.should.have.property('layerSlug').and.equal('viirs-active-fires');
                    // TODO: mock s3 upload so map_image has the actual thumbnail url
                    jsonMessage.data.should.have.property('map_image').and.equal(null);
                    jsonMessage.data.should.have.property('selected_area').and.equal('Custom Area');
                    jsonMessage.data.should.have.property('subscriptions_url').and.equal('http://staging.globalforestwatch.org/my_gfw/subscriptions');
                    jsonMessage.data.should.have.property('unsubscribe_url').and.equal(`http://${process.env.HOST_IP}:9000/subscriptions/${subscriptionOne.id}/unsubscribe?redirect=true`);
                    jsonMessage.data.should.have.property('value').and.equal(3578);

                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object').and.have.property('address').and.have.property('email').and.equal('subscription-recipient@vizzuality.com');
                    break;
                case 'subscriptions-stats':
                    jsonMessage.should.have.property('sender').and.equal('gfw');
                    jsonMessage.should.have.property('data').and.be.a('object');

                    jsonMessage.data.should.have.property('counter').and.equal(1);
                    jsonMessage.data.should.have.property('dataset').and.equal('viirs-active-fires');
                    jsonMessage.data.should.have.property('users').and.be.an('array').and.length(1);

                    jsonMessage.data.users[0].should.have.property('userId').and.equal(subscriptionOne.userId);
                    jsonMessage.data.users[0].should.have.property('subscriptionId').and.equal(subscriptionOne.id);
                    jsonMessage.data.users[0].should.have.property('email').and.equal(subscriptionOne.resource.content);

                    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
                    jsonMessage.recipients[0].should.be.an('object').and.have.property('address').and.have.property('email').and.equal('info@vizzuality.com');
                    break;
                default:
                    should.fail('Unsupported message type: ', jsonMessage.template);
                    break;

            }
        });

        await AlertQueue.processMessage(null, JSON.stringify({
            layer_slug: 'viirs-active-fires',
            begin_date: beginDate,
            end_date: endDate
        }));

        const finalStatistics = await Statistic.find().exec();
        finalStatistics.should.be.an('array').and.length(1);

        const statistic = finalStatistics[0];
        statistic.should.have.property('slug').and.equal('viirs-active-fires');
        statistic.should.have.property('createdAt').and.be.a('date');
    });


    afterEach(() => {
        redisClient.removeAllListeners('message');
        process.removeAllListeners('unhandledRejection');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

    after(async () => {
        await Subscription.deleteMany({}).exec();
        await Statistic.deleteMany({}).exec();
    });
});
