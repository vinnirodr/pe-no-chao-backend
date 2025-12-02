const axios = require("axios");

class FactChecker {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.model = "gpt-5.1"; 
    }

    async verify(text) {
        if (!this.apiKey) {
            console.warn("⚠️ OPENAI_API_KEY faltando. Usando fallback.");
            return this.fakeResponse(text);
        }

        try {
            console.log(`🔍 Fact-checking usando GPT: "${text}"`);

            const response = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                    model: this.model,
                    messages: [
                        {
                            role: "system",
                            content:
                                "Você é um verificador de fatos profissional e extremamente rigoroso. " +
                                "Antes de emitir qualquer veredito, você analisa conhecimento consolidado, consenso científico e fatos amplamente documentados. " +
                                "Seu trabalho NÃO é inventar fontes: você só pode citar fontes realmente existentes.\n\n" +

                                "Você sempre retorna APENAS um JSON no formato:\n" +
                                "{\n" +
                                '  "veredito": "VERDADEIRO" | "FALSO" | "SUSPEITO",\n' +
                                '  "explicacao": "texto simples e direto",\n' +
                                '  "confidence": número entre 0 e 1,\n' +
                                '  "fontes": [ { "nome": "string", "url": "string" } ]\n' +
                                "}\n\n" +

                                "Se não houver fontes confiáveis, deixe a lista vazia e marque como SUSPEITO."
                        },
                        {
                            role: "user",
                            content:
                                `Verifique a veracidade da afirmação abaixo.\n` +
                                `Afirmação: "${text}"\n\n` +
                                "Retorne SOMENTE o JSON sem explicações adicionais."
                        }
                    ],
                    max_tokens: 300
                },
                {
                    headers: {
                        "Authorization": `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const raw = response.data?.choices?.[0]?.message?.content?.trim() || "";
            let parsed;

            try {
                parsed = JSON.parse(raw);
            } catch (err) {
                console.warn("⚠️ JSON inválido do GPT:", raw);

                parsed = {
                    veredito: "SUSPEITO",
                    explicacao: "Não foi possível determinar a veracidade dessa afirmação.",
                    confidence: 0.4,
                    fontes: []
                };
            }

            return {
                text,
                verified: parsed.veredito === "VERDADEIRO",
                veredito: parsed.veredito,
                explicacao: parsed.explicacao,
                confidence: parsed.confidence ?? 0.4,
                fontes: parsed.fontes ?? []
            };

        } catch (err) {
            console.error("❌ Erro no FactCheck GPT:", err.message);
            return this.fakeResponse(text);
        }
    }

    fakeResponse(text) {
        return {
            text,
            verified: false,
            veredito: "SUSPEITO",
            explicacao: "Não foi possível verificar essa afirmação agora.",
            confidence: 0.1,
            fontes: []
        };
    }
}

module.exports = FactChecker;
