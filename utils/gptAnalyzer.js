const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function analyzeWithGPT(text) {
    const prompt = `
Você é um analisador lógico formal.

Receba o texto abaixo e retorne **APENAS JSON válido**, seguindo exatamente o formato:

{
  "premises": [
    { "label": "P", "natural": "", "formal": "", "type": "" }
  ],
  "conclusion": null,
  "propositions": {
    "P": { "natural": "", "formal": "", "type": "" }
  }
}

REGRAS IMPORTANTES:

1. Se o texto **não possuir estrutura argumentativa** (não contém "portanto", "logo", "então", "assim", "por conseguinte"), 
   então:
   - Use **apenas 1 proposição** (P).
   - "conclusion" deve ser **null**.
   - Não crie Q ou C.

2. Se houver estrutura de argumento, então:
   - Use até 3 premissas (P, Q, R).
   - Gere "conclusion" com o label "C".
   - Repita cada uma dentro de "propositions".

3. "natural" = frase literal extraída do texto.
4. "formal" = versão em lógica proposicional (ex: "P", "Q", "(P → Q)", "(P ∧ Q)").
5. "type" = classificar a proposição:
   - "simples"
   - "condicional"
   - "conjunção"
   - "disjunção"
   - "negação"
   - "bicondicional"
   - etc.
6. Não invente informação além do texto.
7. Retorne apenas JSON puro.

Texto:
${text}
`;

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
    });

    const raw = response.choices[0].message.content.trim();

    try {
        return JSON.parse(raw);
    } catch (err) {
        console.error("Erro ao parsear JSON do GPT:", raw);
        throw new Error("GPT returned invalid JSON");
    }
}

module.exports = analyzeWithGPT;
