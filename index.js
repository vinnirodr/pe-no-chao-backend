const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const axios = require("axios");

const TruthTableGenerator = require("./logic/TruthTableGenerator");
const FactChecker = require("./services/FactChecker");

const app = express();
const port = process.env.PORT || 3001;

// Simple in-memory store so the frontend can display stats without a database
const analysesStore = [];

/* -----------------------------------------------------------
   ⭐ CORS SEM FALHA — AGORA FUNCIONA 100%
------------------------------------------------------------- */
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); 
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

/* -----------------------------------------------------------
   🔧 Middlewares
------------------------------------------------------------- */
app.use(express.json());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors()); // não prejudica nada agora
app.use(morgan("dev"));

/* -----------------------------------------------------------
   🧠 Services
------------------------------------------------------------- */
const generator = new TruthTableGenerator();
const factChecker = new FactChecker();

/* -----------------------------------------------------------
   🔌 NLP endpoint
------------------------------------------------------------- */
const NLP_API_URL = process.env.NLP_API_URL || "http://localhost:5000";

/* -----------------------------------------------------------
   🔵 Health check
------------------------------------------------------------- */
app.get(["/", "/health"], (req, res) => {
    res.json({ status: "ok" });
});

/* -----------------------------------------------------------
   🔍 Validação lógica pura
------------------------------------------------------------- */
app.post("/api/v1/validate-logic", (req, res) => {
    const { premises, conclusion } = req.body;

    if (!premises || !conclusion) {
        return res.status(400).json({ error: "Missing premises or conclusion" });
    }

    const result = generator.validate(premises, conclusion);
    res.json(result);
});

/* -----------------------------------------------------------
   🔎 Fact-check individual de uma premissa
------------------------------------------------------------- */
app.post("/api/v1/fact-check", async (req, res) => {
    const { premise } = req.body;

    if (!premise) {
        return res.status(400).json({ error: "Missing premise text" });
    }

    try {
        const result = await factChecker.verify(premise);
        res.json(result);
    } catch (error) {
        console.error("Fact-check Error:", error.message);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

/* -----------------------------------------------------------
   🧠 Análise completa (NLP + lógica + fact-check)
------------------------------------------------------------- */
app.post("/api/v1/analyses", async (req, res) => {
    const { text } = req.body;

    if (!text || text.length < 10) {
        return res.status(400).json({ error: "Text must be at least 10 characters long" });
    }

    try {
        console.log(`Analyzing text: ${text.substring(0, 80)}...`);

        // NLP extraction
        let nlpData;
        try {
            const nlpRes = await axios.post(`${NLP_API_URL}/analyze`, { text });
            nlpData = nlpRes.data;
        } catch (e) {
            console.warn("⚠ NLP API não respondeu — usando fallback simples.", e.message);
            nlpData = {
                premises: [{ text }],
                conclusion: { text: "Conclusão não identificada automaticamente (fallback)." },
                logical_structure: "desconhecido",
                factual: "inconclusivo"
            };
        }

        if (!Array.isArray(nlpData.premises) || nlpData.premises.length === 0) {
            nlpData.premises = [{ text }];
        }

        // Logic validation
        const logicResult = generator.validate(
            nlpData.premises.map(p => p.text),
            nlpData.conclusion ? nlpData.conclusion.text : "Unknown"
        );

        // Fact checking
        const factCheckResults = await Promise.all(
            nlpData.premises.map(p => factChecker.verify(p.text))
        );

        // Normalize response for the frontend expectations
        const factCheckResponse = factCheckResults.map((result, index) => ({
            ...result,
            premise_index: index,
            premise_text: result.text
        }));

        // Overall assessment
        const allPremisesVerified = factCheckResponse.every(r => r.verified);
        let assessment = "SUSPEITO";

        if (logicResult.isValid && allPremisesVerified) {
            assessment = "CONFIÁVEL";
        } else if (!logicResult.isValid && allPremisesVerified) {
            assessment = "SUSPEITO (Salto Lógico)";
        } else if (!allPremisesVerified) {
            assessment = "INCONCLUSIVO / FALSO";
        }

        const analysisRecord = {
            id: analysesStore.length + 1,
            input: text,
            nlp: nlpData,
            logic: logicResult,
            fact_check: factCheckResponse,
            assessment,
            created_at: new Date().toISOString()
        };

        analysesStore.push(analysisRecord);

        // Final response
        res.json(analysisRecord);

    } catch (error) {
        console.error("Analysis Error:", error.message);
        res.status(500).json({
            error: "Internal Server Error",
            details: error.message
        });
    }
});

/* -----------------------------------------------------------
   📊 Simple stats for frontend dashboard
------------------------------------------------------------- */
app.get("/api/v1/stats", (req, res) => {
    const total = analysesStore.length;
    const suspect = analysesStore.filter(a => a.assessment.includes("SUSPEITO") || a.assessment.includes("INCONCLUSIVO")).length;

    res.json({ total, suspect });
});

/* -----------------------------------------------------------
   🚀 Start Server
------------------------------------------------------------- */
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
