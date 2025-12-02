require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const TruthTableGenerator = require('./logic/TruthTableGenerator');
const analyzeWithGPT = require('./utils/gptAnalyzer');
const evaluateReliability = require('./utils/gptNewsReliability');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

const generator = new TruthTableGenerator();

/* -----------------------------------------------------------
   🔵 Health
------------------------------------------------------------- */
app.get('/', (req, res) => {
    res.json({ message: 'Pé no Chão Backend API is running — no DB mode!' });
});

/* -----------------------------------------------------------
   🔍 Validação Lógica
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
   🧠 Análise completa (GPT + lógica formal)
------------------------------------------------------------- */
app.post('/api/v1/analyses', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Missing text' });
    }

    try {
        // 1. GPT extrai premissas, conclusão e formalização
        const gptData = await analyzeWithGPT(text);

        const formalPremises = gptData.premises.map(p => p.formal);
        const formalConclusion = gptData.conclusion?.formal || null;

        // 2. Lógica formal
        let logicResult = {
            isValid: false,
            explanation: "Sem conclusão — não é possível testar validade lógica.",
            steps: []
        };

        if (formalConclusion !== null) {
            const validation = generator.validate(formalPremises, formalConclusion);

            logicResult = {
                ...validation,
                explanation: validation.isValid
                    ? "A conclusão decorre necessariamente das premissas."
                    : "Existe pelo menos um caso possível onde as premissas são verdadeiras e a conclusão é falsa."
            };
        }

        // 3. Confiabilidade factual
        const newsReliability = await Promise.all(
            gptData.premises.map(p => evaluateReliability(p.natural))
        );

        const meanReliability =
            newsReliability.reduce((acc, item) => acc + (item.nota_confiabilidade || 0), 0) /
            (newsReliability.length || 1);

        // 4. Veredito final (NOVA REGRA)
        let verdict = "";
        let verdictExplanation = "";

        if (!logicResult.isValid) {
            verdict = "ARGUMENTO INVÁLIDO";
            verdictExplanation = "A estrutura lógica não garante a conclusão.";
        }
        else if (logicResult.isValid && meanReliability >= 0.70) {
            verdict = "CONFIÁVEL";
            verdictExplanation = "Estrutura lógica válida + conteúdo factual confiável.";
        }
        else if (logicResult.isValid && meanReliability >= 0.40) {
            verdict = "VÁLIDO, MAS FATO SUSPEITO";
            verdictExplanation = "A estrutura lógica está correta, mas as premissas possuem confiabilidade parcial.";
        }
        else if (logicResult.isValid && meanReliability < 0.40) {
            verdict = "LÓGICO, MAS CONTEÚDO FALSO";
            verdictExplanation = "A lógica do argumento é válida, porém as premissas têm baixa confiabilidade factual.";
        }

        // 5. Resposta final
        res.json({
            input: text,
            gpt: gptData,
            propositions: gptData.propositions,
            logic: logicResult,
            noticias: newsReliability,
            confiabilidade_media: meanReliability,
            verdict,
            verdictExplanation
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Analysis error', details: err.message });
    }
});

/* -----------------------------------------------------------
   🚀 Start server
------------------------------------------------------------- */
app.listen(port, () => {
    console.log(`Server running on port ${port} (NO DB MODE)`);
});
