const { execSync } = require("child_process");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

console.log("");
console.log("========================================");
console.log(" Mu'jam - Web Build");
console.log("========================================");
console.log("");

try {
    console.log("Building web app with Vite...");
    console.log("");

    execSync("npx vite build", {
        cwd: projectRoot,
        stdio: "inherit"
    });

    console.log("");
    console.log("Web build completed successfully.");
    console.log("");

    console.log("Syncing Capacitor Android...");
    console.log("");

    execSync("npx cap sync android", {
        cwd: projectRoot,
        stdio: "inherit"
    });

    console.log("");
    console.log("========================================");
    console.log(" Mu'jam Android sync complete!");
    console.log("========================================");
    console.log("");

} catch (error) {

    console.error("");
    console.error("ERROR: Build or Capacitor sync failed.");
    console.error("");

    process.exit(1);
}