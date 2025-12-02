const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function analyzeWithGPT(text) {

    const prompt = `
Você é um analisador lógico formal. Dado o texto abaixo:

1. Extraia até 3 premissas.
2. Extraia a conclusão.
3. Identifique as proposições atômicas (P, Q, R…).
4. Converta cada frase em lógica proposicional:
   - "Se X então Y" → (P -> Q)
   - "X e Y" → (P ∧ Q)
   - "X ou Y" → (P ∨ Q)
   - "Não X" → ¬P
5. Retorne SOMENTE um JSON válido no formato:

{
  "premises": [
    { "label": "P1", "natural": "", "formal": "" },
    { "label": "P2", "natural": "", "formal": "" }
  ],
  "conclusion": { "label": "C", "natural": "", "formal": "" },

  "atoms": {
    "P": "",
    "Q": "",
    "R": ""
  }
}

NÃO explique nada. NÃO escreva comentários.
NÃO invente fatos. Apenas transforme o texto em lógica proposicional.

Texto: ${text}
`;

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
    });

    const raw = response.choices[0].message.content.trim();

    return JSON.parse(raw);
}

module.exports = analyzeWithGPT;
