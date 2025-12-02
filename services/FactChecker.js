const axios = require("axios");

class FactChecker {
    constructor() {
        this.apiKey = process.env.PERPLEXITY_API_KEY;
        this.model = "sonar-reasoning";
    }

    async verify(text) {
        if (!this.apiKey) {
            console.warn("⚠️ PERPLEXITY_API_KEY faltando. Usando fallback.");
            return this.fakeResponse(text);
        }

        try {
            console.log(`🔍 Fact-checking com fontes: "${text}"`);

            const response = await axios.post(
                "https://api.perplexity.ai/chat/completions",
                {
                    model: this.model,
                    messages: [
                        {
                            role: "system",
                            content:
                                "Você é um verificador de fatos profissional. Antes de responder, você SEMPRE pesquisa em fontes confiáveis como:\n" +
                                "- bases científicas (PubMed, SciELO, Nature, Science)\n" +
                                "- dados oficiais (OMS, ONU, IBGE, NASA, ministérios)\n" +
                                "- jornais consolidados (BBC, Reuters, NYT, Folha)\n\n" +
                                "Sua missão é:\n" +
                                "1. Pesquisar a veracidade da afirmação.\n" +
                                "2. Comparar as informações encontradas.\n" +
                                "3. Emitir um veredito: VERDADEIRO, FALSO ou SUSPEITO.\n" +
                                "4. Explicar de forma simples para o usuário.\n" +
                                "5. Listar TODAS as fontes consultadas em formato estruturado.\n\n" +
                                "⚠️ Você sempre retorna APENAS um JSON no formato:\n\n" +
                                "{\n" +
                                '  "veredito": "VERDADEIRO | FALSO | SUSPEITO",\n' +
                                '  "explicacao": "texto simples e direto",\n' +
                                '  "confidence": 0.0 a 1.0,\n' +
                                '  "fontes": [\n' +
                                '       { "nome": "Fonte", "url": "https://..." }\n' +
                                "  ]\n" +
                                "}\n\n" +
                                "⚠️ Se a pesquisa não encontrar fontes confiáveis, informe isso nas fontes."
                        },
                        {
                            role: "user",
                            content:
                                `Verifique a factualidade da seguinte afirmação:\n"${text}"\n\n` +
                                "Retorne APENAS o JSON sem comentários adicionais."
                        }
                    ],
                    max_tokens: 400
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
                console.warn("⚠️ JSON inválido recebido da Perplexity:", raw);
                parsed = {
                    veredito: "SUSPEITO",
                    explicacao: "Não consegui confirmar essa afirmação.",
                    confidence: 0.5,
                    fontes: []
                };
            }

            return {
                text,
                verified: parsed.veredito === "VERDADEIRO",
                veredito: parsed.veredito,
                explicacao: parsed.explicacao,
                confidence: parsed.confidence ?? 0.5,
                fontes: parsed.fontes ?? []
            };

        } catch (err) {
            console.error("❌ Erro na Perplexity:", err.message);
            return this.fakeResponse(text);
        }
    }

    fakeResponse(text) {
        return {
            text,
            verified: false,
            veredito: "SUSPEITO",
            explicacao:
                "Não foi possível verificar essa afirmação agora.",
            confidence: 0.1,
            fontes: []
        };
    }
}

module.exports = FactChecker;
