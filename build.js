import fs from "fs";

// Read JSON
const members = JSON.parse(fs.readFileSync("./members.json", "utf8"));

// Convert to JS module
const jsContent = `export const members = ${JSON.stringify(members, null, 2)};`;

// Write to memberData.js (for your frontend)
fs.writeFileSync("memberData.js", jsContent);

console.log("✅ memberData.js created successfully!");
