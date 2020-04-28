const LAYERS = [{
    name: 'loss',
    slug: 'umd-loss-gain',
    subscription: true,
    datasetId: 'eab9655f-dd37-4bb3-b223-4c5df166564c',
    layerId: 'dce8004f-4d0f-4c2d-ae4b-dcf55e14035f'
}, {
    // no longer on flagship
    name: 'imazon',
    slug: 'imazon-alerts',
    subscription: true
}, {
    name: 'terrailoss',
    slug: 'terrai-alerts',
    subscription: true,
    datasetId: '68c81bc5-171c-4425-9836-d45659f0ed23',
    layerId: '50a76478-9f6e-4315-874a-611d10a50338'
}, {
    name: 'prodes',
    slug: 'prodes-loss',
    subscription: true,
    datasetId: 'a481466d-de8a-450c-b792-271901d20d3b',
    layerId: 'b3529b7f-8fdd-4d10-a6eb-71c6effcbcd5'
}, {
    // no longer on flagship
    name: 'guyra',
    slug: 'guira-loss',
    subscription: true
}, {
    name: 'viirs_fires_alerts',
    slug: 'viirs-active-fires',
    subscription: true,
    datasetId: '1d3ccf9b-102e-4c0b-b2ea-2abcc712e194',
    layerId: '93e33932-3959-4201-b8c8-6ec0b32596e0'
}, {
    name: 'umd_as_it_happens',
    slug: 'glad-alerts',
    subscription: true,
    datasetId: 'bfd1d211-8106-4393-86c3-9e1ab2ee1b9b',
    layerId: '8e4a527d-1bcd-4a12-82b0-5a108ffec452'
}, {
    name: 'umd_as_it_happens_per',
    slug: 'glad-alerts',
    subscription: true,
    datasetId: 'bfd1d211-8106-4393-86c3-9e1ab2ee1b9b',
    layerId: '8e4a527d-1bcd-4a12-82b0-5a108ffec452'
}, {
    name: 'umd_as_it_happens_cog',
    slug: 'glad-alerts',
    subscription: true,
    datasetId: 'bfd1d211-8106-4393-86c3-9e1ab2ee1b9b',
    layerId: '8e4a527d-1bcd-4a12-82b0-5a108ffec452'
}, {
    name: 'umd_as_it_happens_idn',
    slug: 'glad-alerts',
    subscription: true,
    datasetId: 'bfd1d211-8106-4393-86c3-9e1ab2ee1b9b',
    layerId: '8e4a527d-1bcd-4a12-82b0-5a108ffec452'
}, {
    // depreciated
    name: 'story',
    slug: 'story',
    subscription: true
}, {
    // no longer on flagship
    name: 'forma-alerts',
    slug: 'forma-alerts',
    subscription: true
}, {
    // no longer on flagship
    name: 'forma250GFW',
    slug: 'forma250GFW',
    subscription: true
}];

class Layer {

    static async findBySlug(slug) {
        for (let i = 0, { length } = LAYERS; i < length; i++) {
            if (LAYERS[i].slug === slug) {
                return LAYERS[i];
            }
        }
        return null;
    }

}

module.exports = Layer;
