const area = {
    name: "Kiambu, Kenya",
    application: "gfw",
    geostore: "33b01a49bf9b56a8b56ce042a24f6567",
    wdpaid: null,
    userid: "testuser",
    createdAt: "2025-01-29T16:28:54.271Z",
    updatedAt: "2025-01-29T16:28:54.271Z",
    image: "",
    datasets: [],
    user: {},
    env: "production",
    tags: [],
    status: "saved",
    public: true,
    fireAerts: true,
    deforestationAlerts: true,
    deforestationAlertsType: "glad-all",
    webhookUrl: "",
    monthlySummary: false,
    subscriptionId: "testsub",
    email: "test.user@wri.org",
    language: "en",
    confirmed: false
}

const admin2Iso = {
    country: "KEN",
    region: '15',
    subregion: '1',
    source: {
        provider: "gadm",
        version: "3.6"
    }
}

const admin2Admin = {
    adm0: "KEN",
    adm1: '15',
    adm2: '1',
    source: {
        provider: "gadm",
        version: "3.6"
    }
}

const admin1Iso = {
    country: "KEN",
    region: '15',
    source: {
        provider: "gadm",
        version: "3.6"
    }
}

const admin0Iso = {
    country: "KEN",
    source: {
        provider: "gadm",
        version: "4.1"
    }
}

export const ADMIN2_ADMIN = { ...area, admin: admin2Admin }
export const ADMIN0_ISO = { ...area, iso: admin0Iso }
