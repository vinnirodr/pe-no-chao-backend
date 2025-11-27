const axios = require('axios');
const redis = require('redis');

class FactChecker {
    constructor() {
        this.redisClient = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        this.redisClient.on('error', (err) => console.error('Redis Client Error', err));
        this.redisClient.connect().catch(console.error);
    }

    async verify(premiseText) {
        // 1. Check Cache
        const cacheKey = `factcheck:${premiseText}`;
        try {
            const cached = await this.redisClient.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {
            console.warn("Redis cache error:", e);
        }

        // 2. Check Sources in Parallel
        const results = await Promise.all([
            this._checkIBGE(premiseText),
            this._checkWikidata(premiseText)
        ]);

        // 3. Aggregate Results
        const sources = results.filter(r => r !== null);
        const isVerified = sources.some(s => s.confidence > 0.7);

        const response = {
            premise_text: premiseText,
            verified: isVerified,
            status: isVerified ? "VERIFIED" : "UNVERIFIED",
            sources: sources,
            overall_confidence: sources.length > 0 ? Math.max(...sources.map(s => s.confidence)) : 0,
            cached: false,
            last_verified: new Date().toISOString()
        };

        // 4. Save to Cache (TTL 24h)
        try {
            await this.redisClient.set(cacheKey, JSON.stringify({ ...response, cached: true }), {
                EX: 86400
            });
        } catch (e) {
            console.warn("Redis set error:", e);
        }

        return response;
    }

    async _checkIBGE(text) {
        try {
            // Search IBGE News API for keywords
            // Simple keyword extraction (naive)
            const keywords = text.split(' ').filter(w => w.length > 4).join(' ');
            const url = `http://servicodados.ibge.gov.br/api/v3/noticias/?busca=${encodeURIComponent(keywords)}`;

            const res = await axios.get(url, { timeout: 5000 });
            if (res.data.items && res.data.items.length > 0) {
                const topItem = res.data.items[0];
                return {
                    name: "IBGE Notícias",
                    url: topItem.link,
                    data: topItem.titulo,
                    confidence: 0.8 // High confidence if IBGE has a matching news item
                };
            }
        } catch (e) {
            console.error("IBGE API Error:", e.message);
        }
        return null;
    }

    async _checkWikidata(text) {
        try {
            // Very basic SPARQL to find items with label matching text
            // In reality, we'd need entity linking. 
            // For MVP, let's just search for the main noun.
            const keywords = text.split(' ').filter(w => w.length > 5);
            if (keywords.length === 0) return null;

            const keyword = keywords[0]; // Take first significant word
            const sparql = `
        SELECT ?item ?itemLabel ?itemDescription WHERE {
          ?item ?label "${keyword}"@pt.
          SERVICE wikibase:label { bd:serviceParam wikibase:language "pt". }
        } LIMIT 1
      `;
            const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;

            const res = await axios.get(url, { timeout: 5000 });
            if (res.data.results.bindings.length > 0) {
                const item = res.data.results.bindings[0];
                return {
                    name: "Wikidata",
                    url: item.item.value,
                    data: item.itemDescription ? item.itemDescription.value : item.itemLabel.value,
                    confidence: 0.6
                };
            }
        } catch (e) {
            console.error("Wikidata API Error:", e.message);
        }
        return null;
    }
}

module.exports = FactChecker;
