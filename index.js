const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');

const TruthTableGenerator = require('./logic/TruthTableGenerator');
const FactChecker = require('./services/FactChecker');
const { pool, initDb } = require('./db');

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Services
const generator = new TruthTableGenerator();
const factChecker = new FactChecker();

// NLP endpoint (Python API ou outro serviço)
const NLP_API_URL = process.env.NLP_API_URL || 'http://localhost:5000';

// Inicializa o banco
initDb();

/* -----------------------------------------------------------
   💬 Veredito baseado nas fontes do Perplexity (campo factual)
------------------------------------------------------------- */
function gerarVereditoFontes(nlpData) {
    if (!nlpData || !nlpData.factual) {
        return 'As fontes consultadas não foram suficientes para determinar verdade ou falsidade.';
    }

    if (nlpData.factual === 'falso') {
        return 'De acordo com as fontes consultadas (Perplexity), a conclusão é falsa.';
    }

    if (nlpData.factual === 'verdadeiro') {
        return 'De acordo com as fontes consultadas (Perplexity), a conclusão é verdadeira.';
    }

    return 'Não foi possível determinar a veracidade da conclusão com base nas fontes consultadas.';
}

/* -----------------------------------------------------------
   🔵 Health check
------------------------------------------------------------- */
app.get('/', (req, res) => {
    res.json({ message: 'Pé no Chão Backend API is running!' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* -----------------------------------------------------------
   🔍 Validação lógica pura
------------------------------------------------------------- */
app.post('/api/v1/validate-logic', (req, res) => {
    const { premises, conclusion } = req.body;

    if (!premises || !conclusion) {
        return res.status(400).json({ error: 'Missing premises or conclusion' });
    }

    const result = generator.validate(premises, conclusion);
    res.json(result);
});

/* -----------------------------------------------------------
   🔎 Fact-check individual de uma premissa
------------------------------------------------------------- */
app.post('/api/v1/fact-check', async (req, res) => {
    const { premise } = req.body;

    if (!premise) {
        return res.status(400).json({ error: 'Missing premise text' });
    }

    try {
        const result = await factChecker.verify(premise);
        res.json(result);
    } catch (error) {
        console.error('Fact-check Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

/* -----------------------------------------------------------
   🧠 Análise completa (NLP + lógica + fact-check + veredito)
------------------------------------------------------------- */
app.post('/api/v1/analyses', async (req, res) => {
    const { text } = req.body;

    if (!text || text.length < 10) {
        return res.status(400).json({ error: 'Text must be at least 10 characters long' });
    }

    try {
        console.log(`Analyzing text: ${text.substring(0, 80)}...`);

        /* -----------------------
           1. NLP Extraction
        ------------------------ */
        let nlpData;

        try {
            const nlpRes = await axios.post(`${NLP_API_URL}/analyze`, { text });
            nlpData = nlpRes.data;
        } catch (e) {
            console.warn('⚠ NLP API não respondeu — usando fallback simples.', e.message);

            // Fallback básico para não quebrar a API caso o serviço NLP esteja fora
            nlpData = {
                premises: [{ text }],
                conclusion: { text: 'Conclusão não identificada automaticamente (fallback).' },
                logical_structure: 'desconhecido',
                factual: 'inconclusivo'
            };
        }

        // Garantir que premissas exista e seja array
        if (!Array.isArray(nlpData.premises) || nlpData.premises.length === 0) {
            nlpData.premises = [{ text }];
        }

        /* -----------------------
           2. Logic Validation
        ------------------------ */
        const logicResult = generator.validate(
            nlpData.premises.map(p => p.text),
            nlpData.conclusion ? nlpData.conclusion.text : 'Unknown'
        );

        /* -----------------------
           3. Fact Checking (paralelo)
        ------------------------ */
        const factCheckResults = await Promise.all(
            nlpData.premises.map(p => factChecker.verify(p.text))
        );

        /* -----------------------
           4. Overall Assessment
        ------------------------ */
        const allPremisesVerified = factCheckResults.every(r => r.verified);
        let assessment = 'SUSPEITO';

        if (logicResult.isValid && allPremisesVerified) {
            assessment = 'CONFIÁVEL';
        } else if (!logicResult.isValid && allPremisesVerified) {
            assessment = 'SUSPEITO (Salto Lógico)';
        } else if (!allPremisesVerified) {
            assessment = 'INCONCLUSIVO / FALSO';
        }

        /* -----------------------
           4.5 Veredito com base nas fontes (Perplexity)
        ------------------------ */
        const vereditoFontes = gerarVereditoFontes(nlpData);

        /* -----------------------
           5. Persistência em banco
        ------------------------ */
        const insertQuery = `
            INSERT INTO analyses (
                input_text,
                premises,
                conclusion,
                validity,
                result_type,
                fact_check_results,
                overall_assessment
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, created_at
        `;

        const dbRes = await pool.query(insertQuery, [
            text,
            JSON.stringify(nlpData.premises),
            JSON.stringify(nlpData.conclusion),
            logicResult.isValid,
            nlpData.logical_structure || null,
            JSON.stringify(factCheckResults),
            assessment
        ]);

        /* -----------------------
           6. Resposta final da API
        ------------------------ */
        res.json({
            id: dbRes.rows[0].id,
            created_at: dbRes.rows[0].created_at,
            input: text,
            nlp: nlpData,
            logic: logicResult,
            fact_check: factCheckResults,
            assessment,
            veredito_fontes: vereditoFontes
        });

    } catch (error) {
        console.error('Analysis Error:', error.message);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error.message
        });
    }
});

/* -----------------------------------------------------------
   📊 Últimas análises
------------------------------------------------------------- */
app.get('/api/v1/analyses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM analyses ORDER BY created_at DESC LIMIT 10');
        res.json(result.rows);
    } catch (error) {
        console.error('DB Error (/analyses):', error.message);
        res.status(500).json({ error: 'Database Error' });
    }
});

/* -----------------------------------------------------------
   📈 Estatísticas
------------------------------------------------------------- */
app.get('/api/v1/stats', async (req, res) => {
    try {
        const totalRes = await pool.query('SELECT COUNT(*) FROM analyses');
        const suspectRes = await pool.query(
            "SELECT COUNT(*) FROM analyses WHERE overall_assessment LIKE '%SUSPEITO%'"
        );

        res.json({
            total: Number(totalRes.rows[0].count),
            suspect: Number(suspectRes.rows[0].count)
        });
    } catch (error) {
        console.error('DB Error (/stats):', error.message);
        res.status(500).json({ error: 'Database Error' });
    }
});

/* -----------------------------------------------------------
   🚀 Start Server
------------------------------------------------------------- */
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
