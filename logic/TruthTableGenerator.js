const Parser = require("./Parser");

class TruthTableGenerator {
    constructor() {
        this.parser = new Parser();
    }

    /**
     * premisesFormal: array de strings tipo ["(P -> Q)", "P"]
     * conclusionFormal: string tipo "Q" — pode ser null
     */
    validate(premisesFormal, conclusionFormal) {
        if (!Array.isArray(premisesFormal) || premisesFormal.length === 0) {
            return {
                isValid: false,
                explanation: "Não há premissas suficientes para analisar a lógica.",
                atoms: [],
                truthTable: [],
                counterexamples: []
            };
        }

        // 🌟 NOVO: conclusão opcional
        if (!conclusionFormal) {
            return {
                isValid: false,
                explanation: "Sem conclusão — não é possível testar validade lógica.",
                atoms: [],
                truthTable: [],
                counterexamples: []
            };
        }

        // 1. Parse das fórmulas
        let premiseASTs, conclusionAST;
        try {
            premiseASTs = premisesFormal.map((f) => this.parser.parse(f));
            conclusionAST = this.parser.parse(conclusionFormal);
        } catch (err) {
            return {
                isValid: false,
                explanation: "Erro ao interpretar fórmulas lógicas.",
                atoms: [],
                truthTable: [],
                counterexamples: []
            };
        }

        // 2. Coletar variáveis proposicionais (átomos)
        const atomSet = new Set();
        for (const ast of [...premiseASTs, conclusionAST]) {
            this.collectAtoms(ast, atomSet);
        }
        const atoms = Array.from(atomSet).sort();

        // 3. Gerar tabela verdade completa
        const truthTable = [];
        const counterexamples = [];

        const totalRows = 1 << atoms.length; // 2^n combinações

        for (let mask = 0; mask < totalRows; mask++) {
            const assignment = {};

            atoms.forEach((name, i) => {
                assignment[name] = !!(mask & (1 << i));
            });

            const premiseValues = premiseASTs.map((ast) =>
                this.evaluate(ast, assignment)
            );

            const conclusionValue = this.evaluate(conclusionAST, assignment);
            const allPremisesTrue = premiseValues.every((v) => v === true);

            const validHere = !allPremisesTrue || conclusionValue === true;

            const row = {
                ...assignment,
                premises: premiseValues,
                conclusion: conclusionValue,
                ALL_PREMISES: allPremisesTrue,
                VALID: validHere,
            };

            truthTable.push(row);

            // Contraexemplo clássico: premissas verdadeiras + conclusão falsa
            if (allPremisesTrue && !conclusionValue) {
                counterexamples.push({
                    assignment: { ...assignment },
                    premises: premiseValues,
                    conclusion: conclusionValue,
                    explanation:
                        "Todas as premissas são verdadeiras, mas a conclusão é falsa neste cenário.",
                });
            }
        }

        // Resultado central
        const isValid = counterexamples.length === 0;

        // Explicação 👇
        let explanation = "";

        if (isValid) {
            explanation =
                "Argumento válido: em nenhuma combinação de valores as premissas são todas verdadeiras enquanto a conclusão é falsa.";
        } else {
            explanation =
                "Argumento inválido: existe pelo menos um cenário possível onde todas as premissas são verdadeiras e a conclusão é falsa.";
        }

        // 🌟 NOVO: retornar somente um contraexemplo resumido (didático)
        let example = null;
        if (counterexamples.length > 0) {
            example = {
                descricao: "Cenário que torna o argumento inválido:",
                valores: counterexamples[0].assignment,
                premissas: counterexamples[0].premises,
                conclusao: counterexamples[0].conclusion,
                explicacao:
                    "Neste cenário as premissas são verdadeiras, mas a conclusão é falsa — caracterizando invalidade lógica.",
            };
        }

        return {
            isValid,
            atoms,
            truthTable,
            counterexamples,
            example,
            explanation,
        };
    }

    collectAtoms(ast, set) {
        switch (ast.type) {
            case "var":
                set.add(ast.name);
                break;
            case "not":
                this.collectAtoms(ast.operand, set);
                break;
            case "and":
            case "or":
            case "imp":
            case "iff":
                this.collectAtoms(ast.left, set);
                this.collectAtoms(ast.right, set);
                break;
        }
    }

    evaluate(ast, env) {
        switch (ast.type) {
            case "var":
                return !!env[ast.name];

            case "not":
                return !this.evaluate(ast.operand, env);

            case "and":
                return (
                    this.evaluate(ast.left, env) &&
                    this.evaluate(ast.right, env)
                );

            case "or":
                return (
                    this.evaluate(ast.left, env) ||
                    this.evaluate(ast.right, env)
                );

            case "imp": {
                const left = this.evaluate(ast.left, env);
                const right = this.evaluate(ast.right, env);
                return !left || right; // ¬P ∨ Q
            }

            case "iff": {
                const left = this.evaluate(ast.left, env);
                const right = this.evaluate(ast.right, env);
                return left === right;
            }

            default:
                throw new Error(`Unknown AST node type: ${ast.type}`);
        }
    }
}

module.exports = TruthTableGenerator;
