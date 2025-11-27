const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';
// NLP is internal to docker usually, but we can check if backend can reach it via the analysis endpoint

async function verifySystem() {
    console.log("🔍 Starting System Verification...\n");

    // 1. Check Backend Health
    try {
        const res = await axios.get(`${BACKEND_URL}/health`);
        console.log(`✅ Backend is UP: ${res.data.status}`);
    } catch (e) {
        console.error(`❌ Backend is DOWN: ${e.message}`);
        return;
    }

    // 2. Check Frontend (just availability)
    try {
        await axios.get(FRONTEND_URL);
        console.log(`✅ Frontend is UP (HTTP 200)`);
    } catch (e) {
        console.error(`❌ Frontend is unreachable: ${e.message}`);
    }

    // 3. Run Analysis (Tests NLP + Logic + FactCheck + DB)
    console.log("\n🧪 Running Test Analysis...");
    const sampleText = "O PIB cresceu 10% este ano. Logo, todos estão ricos.";

    try {
        const res = await axios.post(`${BACKEND_URL}/api/v1/analyses`, { text: sampleText });
        console.log(`✅ Analysis Completed!`);
        console.log(`   - ID: ${res.data.id}`);
        console.log(`   - Assessment: ${res.data.assessment}`);
        console.log(`   - Logic Valid: ${res.data.logic.isValid}`);
    } catch (e) {
        console.error(`❌ Analysis Failed: ${e.message}`);
        if (e.response) console.error(e.response.data);
    }

    // 4. Check Dashboard Stats
    console.log("\n📊 Checking Dashboard Stats...");
    try {
        const res = await axios.get(`${BACKEND_URL}/api/v1/stats`);
        console.log(`✅ Stats Retrieved: Total=${res.data.total}, Suspect=${res.data.suspect}`);
    } catch (e) {
        console.error(`❌ Stats Failed: ${e.message}`);
    }

    console.log("\n✨ Verification Finished!");
}

verifySystem();
