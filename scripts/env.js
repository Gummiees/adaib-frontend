const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv").config({ path: "src/.env" });

// Generate environment.ts content
const generateEnvFileContent = (isProduction) => {
  return `export const environment = {
  isProduction: ${isProduction},
  apiUrl: "${process.env.API_URL || ""}",
  secureStorageKey: "${process.env.SECURE_STORAGE_KEY || ""}",
  secureStorageSalt: "${process.env.SECURE_STORAGE_SALT || ""}",
};
`;
};

const writeEnvFile = (filePath, content) => {
  fs.writeFileSync(filePath, content);
  console.log(`Generated ${path.basename(filePath)}`);
};

const mainEnvContent = generateEnvFileContent(false);
const devEnvContent = generateEnvFileContent(false);
const productionEnvContent = generateEnvFileContent(true);

console.log("creating env file with dev env content", devEnvContent);

const envDir = path.join(__dirname, "..", "src", "environments");

if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

writeEnvFile(path.join(envDir, "environment.ts"), mainEnvContent);
writeEnvFile(path.join(envDir, "environment.development.ts"), devEnvContent);
writeEnvFile(
  path.join(envDir, "environment.production.ts"),
  productionEnvContent,
);
