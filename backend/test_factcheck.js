const FactChecker = require('./services/FactChecker');

// Mock Redis and Axios
jest.mock('redis', () => ({
    createClient: () => ({
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue(),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK')
    })
}));

jest.mock('axios');
const axios = require('axios');

describe('FactChecker', () => {
    let checker;

    beforeEach(() => {
        checker = new FactChecker();
    });

    test('should verify using IBGE when keyword matches', async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes('ibge')) {
                return Promise.resolve({
                    data: {
                        items: [{ titulo: 'Desemprego cai para 7.5%', link: 'http://ibge.gov.br/news' }]
                    }
                });
            }
            return Promise.resolve({ data: { results: { bindings: [] } } });
        });

        const result = await checker.verify('Desemprego no Brasil');
        expect(result.verified).toBe(true);
        expect(result.sources[0].name).toBe('IBGE Notícias');
    });

    test('should return unverified if no sources found', async () => {
        axios.get.mockResolvedValue({ data: { items: [], results: { bindings: [] } } });

        const result = await checker.verify('Unicornios existem');
        expect(result.verified).toBe(false);
    });
});
