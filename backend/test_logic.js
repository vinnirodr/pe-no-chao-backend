const TruthTableGenerator = require('./logic/TruthTableGenerator');

const generator = new TruthTableGenerator();

console.log("Running Truth Table Validator Tests...\n");

// Test Case 1: Simple Implication (P -> C)
// Note: In our atomic model, P -> C is NOT a tautology. 
// It is only valid if we assume the premise implies the conclusion, which we don't know yet.
// So we expect this to be INVALID (possible for P=True, C=False).
console.log("Test 1: P -> C (Atomic)");
const result1 = generator.validate(['P1'], 'C');
console.log(`Valid: ${result1.isValid}`);
console.log(`Counterexamples: ${result1.counterexamples.length}`);
if (!result1.isValid && result1.counterexamples.length > 0) {
    console.log("PASS: Correctly identified as invalid (non-sequitur).");
} else {
    console.log("FAIL: Should be invalid.");
}
console.log("-".repeat(20));

// Test Case 2: Tautology Check (Simulated)
// If we manually constructed a case where P -> C is always true (not possible with atomic strings input)
// But let's check the output structure.
console.log("Test 2: Output Structure");
if (result1.truthTable.length === 4) { // 2 vars => 4 rows
    console.log("PASS: Truth table has correct size (4 rows).");
} else {
    console.log(`FAIL: Truth table size ${result1.truthTable.length} (expected 4).`);
}

console.log("\nDone.");
