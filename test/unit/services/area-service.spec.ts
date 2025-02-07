import { expect } from 'chai';
import nock from 'nock';
import config from 'config';
import logger from 'logger';
import AreaService from 'services/areaService'
import { createMockArea } from '../../e2e/utils/mock';
import { getUUID } from '../../e2e/utils/helpers';
import { ADMIN0_ISO, ADMIN2_ADMIN } from '../utils/test-constants';
import { getTestServer } from '../../e2e/utils/test-server';

describe('AreaService', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
        
        await getTestServer();
    
    });

    afterEach(() => {
        process.removeAllListeners('unhandledRejection');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

    describe('getUserArea', () => {
        it('should fetch area data and return attributes using nock mock', async () => {
            const areaId = getUUID();
            const iso = { country: 'KE', region: 'Kiambu', subregion: 'Thika' };

            createMockArea(areaId, iso);

            const area = await AreaService.getUserArea(areaId);

            logger.info(`area ${area}`)

            expect(area).to.include({
                name: "Kiambu, Kenya",
                application: "gfw",
                userid: "testuser"
            });
            expect(area.iso).to.deep.include(iso);
        });
    });

    describe('getIsoParams', () => {
        it('should return ISO parameters when area contains iso data', () => {
            const result = AreaService.getIsoParams(ADMIN0_ISO);
            logger.info(`result`)
            logger.info(`${Object.keys(result)}`)
            expect(result).to.deep.include(ADMIN0_ISO.iso);
        });

        it('should return admin-based ISO parameters when area contains admin data', () => {
            const expected = {
                country: 'KEN',
                region: '15',
                subregion: '1',
                source: {
                    provider: 'gadm',
                    version: '3.6'
                }};
            const result = AreaService.getIsoParams(ADMIN2_ADMIN);

            expect(result).to.deep.include(expected);
        });

        it('should return an empty object when area has no iso or admin data', () => {
            const result = AreaService.getIsoParams({});
            expect(result).to.deep.equal({});
        });
    });

    describe('getGeostoreSource', () => {
        it('should return "gfw" when the area has provider gadm and version 4.1', () => {
            const result = AreaService.getGeostoreSource(ADMIN0_ISO);

            expect(result).to.equal('gfw');
        });

        it('should return "rw" when the area does not match the gadm provider and version', () => {
            const result = AreaService.getGeostoreSource(ADMIN2_ADMIN);

            expect(result).to.equal('rw');
        });

        it('should return "rw" when iso data is missing', () => {
            const area = {};
            const result = AreaService.getGeostoreSource(area);

            expect(result).to.equal('rw');
        });
    });
});
