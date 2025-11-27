const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1/analyses';

const sampleText = "O desemprego caiu 2%. Logo, a economia está melhorando.";

async function testIntegration() {
    console.log("Testing Full Integration Flow...");
    console.log(`Input: "${sampleText}"`);

    try {
        const res = await axios.post(API_URL, { text: sampleText });

        console.log("\n--- Analysis Result ---");
        console.log("ID:", res.data.id);
        console.log("Assessment:", res.data.assessment);
        console.log("Logic Valid:", res.data.logic.isValid);
        console.log("Premises Verified:", res.data.fact_check.map(f => `${f.premise_text}: ${f.verified}`));

        if (res.data.id && res.data.assessment) {
            console.log("\nSUCCESS: Flow completed and saved to DB.");
        } else {
            console.log("\nFAIL: Missing ID or Assessment.");
        }

    } catch (error) {
        console.error("\nERROR:", error.message);
        if (error.response) {
            console.error("Response:", error.response.data);
        }
        console.log("\nNote: This test requires the full Docker environment (Backend + NLP + Postgres) to be running.");
    }
}

testIntegration();
