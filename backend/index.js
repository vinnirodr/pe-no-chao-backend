const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

const TruthTableGenerator = require('./logic/TruthTableGenerator');
const FactChecker = require('./services/FactChecker');
const generator = new TruthTableGenerator();
const factChecker = new FactChecker();

app.get('/', (req, res) => {
    res.json({ message: 'Pé no Chão Backend API is running!' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/v1/validate-logic', (req, res) => {
    const { premises, conclusion } = req.body;
    if (!premises || !conclusion) {
        return res.status(400).json({ error: 'Missing premises or conclusion' });
    }

    const result = generator.validate(premises, conclusion);
    res.json(result);
});

app.post('/api/v1/fact-check', async (req, res) => {
    const { premise } = req.body;
    if (!premise) {
        return res.status(400).json({ error: 'Missing premise text' });
    }

    const result = await factChecker.verify(premise);
    res.json(result);
});

const { pool, initDb } = require('./db');
const axios = require('axios');

// Initialize DB on startup
initDb();

const NLP_API_URL = process.env.NLP_API_URL || 'http://localhost:5000';

app.post('/api/v1/analyses', async (req, res) => {
    const { text } = req.body;

    if (!text || text.length < 10) {
        return res.status(400).json({ error: 'Text must be at least 10 characters long' });
    }

    try {
        // 1. NLP Extraction
        console.log(`Analyzing: ${text.substring(0, 50)}...`);
        const nlpRes = await axios.post(`${NLP_API_URL}/analyze`, { text });
        const nlpData = nlpRes.data;

        // 2. Logic Validation
        const logicResult = generator.validate(
            nlpData.premises.map(p => p.text),
            nlpData.conclusion ? nlpData.conclusion.text : "Unknown"
        );

        // 3. Fact Checking (Parallel)
        const factCheckPromises = nlpData.premises.map(p => factChecker.verify(p.text));
        const factCheckResults = await Promise.all(factCheckPromises);

        // 4. Overall Assessment
        let assessment = "SUSPEITO";
        const allPremisesVerified = factCheckResults.every(r => r.verified);

        if (logicResult.isValid && allPremisesVerified) {
            assessment = "CONFIÁVEL";
        } else if (!logicResult.isValid && allPremisesVerified) {
            assessment = "SUSPEITO (Salto Lógico)";
        } else if (!allPremisesVerified) {
            assessment = "INCONCLUSIVO / FALSO";
        }

        const result = {
            input: text,
            nlp: nlpData,
            logic: logicResult,
            fact_check: factCheckResults,
            assessment
        };

        // 5. Save to DB
        const insertQuery = `
      INSERT INTO analyses (input_text, premises, conclusion, validity, result_type, fact_check_results, overall_assessment)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at
    `;

        const dbRes = await pool.query(insertQuery, [
            text,
            JSON.stringify(nlpData.premises),
            JSON.stringify(nlpData.conclusion),
            logicResult.isValid,
            nlpData.logical_structure,
            JSON.stringify(factCheckResults),
            assessment
        ]);

        res.json({
            id: dbRes.rows[0].id,
            ...result,
            created_at: dbRes.rows[0].created_at
        });

    } catch (error) {
        console.error("Analysis Error:", error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.get('/api/v1/analyses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM analyses ORDER BY created_at DESC LIMIT 10');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Database Error' });
    }
});

app.get('/api/v1/stats', async (req, res) => {
    try {
        const totalRes = await pool.query('SELECT COUNT(*) FROM analyses');
        const suspectRes = await pool.query("SELECT COUNT(*) FROM analyses WHERE overall_assessment LIKE '%SUSPEITO%'");

        res.json({
            total: parseInt(totalRes.rows[0].count),
            suspect: parseInt(suspectRes.rows[0].count)
        });
    } catch (error) {
        res.status(500).json({ error: 'Database Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
