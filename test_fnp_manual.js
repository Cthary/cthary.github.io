import run from "./src/scripts/w40k.js";
import fs from "fs";

// Test the feel no pain implementation with user's configuration
const testData = JSON.parse(fs.readFileSync("test_fnp.json", "utf8"));

console.log("Testing Feel No Pain with user configuration...");
console.log("Attacker: Death Company Chainsword vs Defender: Canis Rex (feel no pain 6)");

const results = run(testData);
console.log("\nResults:", JSON.stringify(results, null, 2));

// Clean up
fs.unlinkSync("test_fnp.json");
console.log("\nTest completed successfully!");
