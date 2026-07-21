const fs = require("fs");
const path = require("path");
const solc = require("solc");

const contractPath = path.join(__dirname, "..", "contracts", "GensoMultisig.sol");
const source = fs.readFileSync(contractPath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "GensoMultisig.sol": {
      content: source,
    },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  let hasError = false;
  for (const err of output.errors) {
    console.log(err.severity.toUpperCase() + ": " + err.formattedMessage);
    if (err.severity === "error") hasError = true;
  }
  if (hasError) process.exit(1);
}

const contract = output.contracts["GensoMultisig.sol"]["GensoMultisig"];
const abi = contract.abi;
const bytecode = "0x" + contract.evm.bytecode.object;

const outDir = path.join(__dirname, "..", "src", "contracts");
fs.mkdirSync(outDir, { recursive: true });

const tsContent =
  "// このファイルは自動生成されています。scripts/compile.cjs を参照してください。\n" +
  "export const GensoMultisigAbi = " +
  JSON.stringify(abi, null, 2) +
  " as const;\n\n" +
  "export const GensoMultisigBytecode = \"" +
  bytecode +
  "\" as const;\n";

fs.writeFileSync(path.join(outDir, "GensoMultisig.ts"), tsContent);
console.log("Compiled. Bytecode length:", bytecode.length);
