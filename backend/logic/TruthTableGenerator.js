class TruthTableGenerator {
    /**
     * Validates if the Conclusion necessarily follows from the Premises.
     * Checks the implication: (P1 AND P2 AND ... Pn) -> Conclusion
     * 
     * @param {Array} premises - Array of premise objects or strings
     * @param {Object|string} conclusion - Conclusion object or string
     * @returns {Object} { isValid, truthTable, counterexamples }
     */
    validate(premises, conclusion) {
        const numPremises = premises.length;
        // We have N premises + 1 conclusion = N+1 variables
        // However, for the truth table of the implication (P1...Pn)->C, 
        // we treat each premise as an atomic variable and the conclusion as another.
        // Total variables = numPremises + 1

        const totalVars = numPremises + 1;
        const numRows = Math.pow(2, totalVars);
        const truthTable = [];
        const counterexamples = [];
        let isValid = true;

        for (let i = 0; i < numRows; i++) {
            // Generate truth values for this row
            // We map bits to variables: 
            // Bit 0: Conclusion
            // Bit 1..N: Premises

            const rowValues = {};
            let allPremisesTrue = true;

            // Extract values for premises
            for (let p = 0; p < numPremises; p++) {
                // Shift right by (p+1) because bit 0 is conclusion
                const val = (i >> (p + 1)) & 1;
                rowValues[`P${p + 1}`] = val === 1;
                if (val === 0) allPremisesTrue = false;
            }

            // Extract value for conclusion
            const conclusionVal = (i & 1) === 1;
            rowValues['C'] = conclusionVal;

            // Evaluate Implication: (P1 & ... & Pn) -> C
            // Implication is FALSE only if (True -> False)
            const implication = !(allPremisesTrue && !conclusionVal);

            const rowResult = {
                ...rowValues,
                'ALL_PREMISES': allPremisesTrue,
                'VALID': implication
            };

            truthTable.push(rowResult);

            if (!implication) {
                isValid = false;
                counterexamples.push({
                    scenario: Object.entries(rowValues)
                        .map(([k, v]) => `${k}=${v}`)
                        .join(', '),
                    explanation: "Premises are TRUE but Conclusion is FALSE."
                });
            }
        }

        return {
            isValid,
            truthTable,
            counterexamples,
            explanation: isValid
                ? "Valid argument structure."
                : "Invalid argument structure. It is possible for the premises to be true and the conclusion false."
        };
    }
}

module.exports = TruthTableGenerator;
