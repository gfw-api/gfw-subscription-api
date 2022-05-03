const mockDataset = (id) => ({
    id,
    type: 'dataset',
    attributes: {
        name: 'Uncontrolled Public-Use Airports -- U.S.',
        slug: 'Uncontrolled-Public-Use-Airports-US_2',
        type: null,
        subtitle: null,
        application: ['rw'],
        dataPath: null,
        attributesPath: null,
        connectorType: 'rest',
        provider: 'featureservice',
        userId: '1a10d7c6e0a37126611fd7a7',
        connectorUrl: 'https://services.arcgis.com/uDTUpUPbk8X8mXwl/arcgis/rest/services/Public_Schools_in_Onondaga_County/FeatureServer/0?f=json',
        tableName: 'Public_Schools_in_Onondaga_County',
        status: 'pending',
        published: true,
        overwrite: false,
        verified: false,
        blockchain: {},
        mainDateField: null,
        subscribable: {
            dataset: {
                dataQuery: '{{begin}}'
            }
        },
        env: 'production',
        geoInfo: false,
        protected: false,
        legend: {
            date: [], region: [], country: [], nested: []
        },
        clonedHost: {},
        errorMessage: null,
        taskId: null,
        updatedAt: '2018-11-05T15:25:53.321Z',
        dataLastUpdated: null,
        widgetRelevantProps: [],
        layerRelevantProps: []
    }
});

const TEST_SUBSCRIPTIONS = [{
    params: {
        geostore: 'agpzfmdmdy1hcGlzchULEghHZW9zdG9yZRiAgIDIjJfRCAw',
    },
    application: 'gfw'
}, {
    params: {
        iso: {
            region: 'test',
        },
    },
    regions: {
        test: 0,
    },
    application: 'gfw'
}, {
    params: {
        iso: {
            country: 'test',
        },
    },
    countries: {
        test: 0,
    },
    application: 'gfw'
}, {
    params: {
        use: 0,
    },
    application: 'gfw'
}, {
    params: {
        wdpaid: 'test',
    },
    wdpas: {
        test: 0,
    },
    application: 'gfw'
}];

const MOCK_USER_IDS = [
    '41224d776a326fb40f000001',
    '41224d776a326fb40f000002',
    '41224d776a326fb40f000003',
    '41224d776a326fb40f000004',
    '41224d776a326fb40f000005',
    '41224d776a326fb40f000006'
];

const defaultAttributes = {
    email: 'test@example.com',
    createdAt: new Date(),
    sector: 'test',
    primaryResponsibilities: ['TEST'],
    country: 'test',
    state: 'test',
    city: 'test',
    howDoYouUse: 'test',
    signUpForTesting: true,
    language: 'en',
    fullName: 'Test Uset 1',
    oldId: '123',
    profileComplete: true,
};

const MOCK_USERS = [{
    id: MOCK_USER_IDS[0],
    type: 'user',
    attributes: defaultAttributes,
}, {
    id: MOCK_USER_IDS[1],
    type: 'user',
    attributes: defaultAttributes,
}, {
    id: MOCK_USER_IDS[2],
    type: 'user',
    attributes: defaultAttributes,
}, {
    id: MOCK_USER_IDS[3],
    type: 'user',
    attributes: defaultAttributes
}, {
    id: MOCK_USER_IDS[4],
    type: 'user',
    attributes: defaultAttributes
}, {
    id: MOCK_USER_IDS[5],
    type: 'user',
    attributes: defaultAttributes
}, {
    id: Math.random().toString(36).substring(7),
    type: 'user',
    attributes: defaultAttributes
}];

const MOCK_FILE = 'https://storage.googleapis.com/test123/test.txt';

const DEFAULT_DATASET = {
    country: 0,
    region: 0,
    use: 0,
    wdpa: 0,
    geostore: 0,
    countries: {},
    regions: {},
    wdpas: {},
    countryTop: { name: null, value: 0 },
    regionTop: { nameRegion: 'test', value: 1 },
    wdpaTop: { id: null, value: 0 },
};

const ROLES = {
    USER: {
        id: '1a10d7c6e0a37126611fd7a1',
        role: 'USER',
        provider: 'local',
        email: 'rootikaleks@gmail.com',
        extraUserData: {
            apps: [
                'rw',
                'gfw',
                'gfw-climate',
                'prep',
                'aqueduct',
                'forest-atlas',
                'data4sdgs'
            ]
        }
    },
    MANAGER: {
        id: '1a10d7c6e0a37126611fd7a2',
        role: 'MANAGER',
        provider: 'local',
        email: 'user@resourcewatch.org',
        extraUserData: {
            apps: [
                'rw',
                'gfw',
                'gfw-climate',
                'prep',
                'aqueduct',
                'forest-atlas',
                'data4sdgs'
            ]
        }
    },
    WRONG_ADMIN: {
        id: '1a10d7c6e0a37126611fd7a3',
        role: 'ADMIN',
        provider: 'local',
        email: 'user@resourcewatch.org',
        extraUserData: {
            apps: [
                'rw',
                'prep',
                'aqueduct',
                'forest-atlas',
                'data4sdgs'
            ]
        }
    },
    ADMIN: {
        id: '1a10d7c6e0a37126611fd7a4',
        role: 'ADMIN',
        provider: 'local',
        email: 'user@resourcewatch.org',
        extraUserData: {
            apps: [
                'rw',
                'gfw',
                'gfw-climate',
                'prep',
                'aqueduct',
                'forest-atlas',
                'data4sdgs'
            ]
        }
    },
    SUPERADMIN: {
        id: '1a10d7c6e0a37126601fd7a5',
        role: 'SUPERADMIN',
        provider: 'local',
        email: 'user@resourcewatch.org',
        name: 'test super admin',
        extraUserData: {
            apps: [
                'rw',
                'gfw',
                'gfw-climate',
                'prep',
                'aqueduct',
                'forest-atlas',
                'data4sdgs'
            ]
        }
    },
    MICROSERVICE: {
        id: 'microservice'
    }
};

const SUBSCRIPTION_TO_UPDATE = {
    name: `Subscription test`,
    datasets: [Math.random().toString(36).substring(7)],
    application: 'gfw',
    env: 'preproduction',
    confirmed: false,
    language: 'en',
    params: {
        use: 0,
    },
    resource: {
        content: 'subscription-recipienttest@resourcewatch.org',
        type: 'URL'
    }
};

module.exports = {
    ROLES,
    mockDataset,
    TEST_SUBSCRIPTIONS,
    MOCK_FILE,
    MOCK_USERS,
    MOCK_USER_IDS,
    DEFAULT_DATASET,
    SUBSCRIPTION_TO_UPDATE,
};
