class FactChecker {
    async verify(text) {
        return {
            text,
            verified: true,
            confidence: 0.9
        };
    }
}

module.exports = FactChecker;
