#!/usr/bin/env node

// Custom lint-staged script for Angular
// This script ignores the file arguments passed by lint-staged
// and runs the full project linting instead

const { execSync } = require("child_process");

try {
  // Run Angular linting for the entire project
  execSync("ng lint asociacion-deportes --fix", { stdio: "inherit" });
  console.log("✅ Angular linting passed");
} catch (error) {
  console.error("❌ Angular linting failed");
  process.exit(1);
}
