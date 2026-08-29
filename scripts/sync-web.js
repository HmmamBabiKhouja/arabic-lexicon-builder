const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");

const sourceDir = path.join(projectRoot, "src");
const wwwDir = path.join(projectRoot, "www");

console.log("");
console.log("========================================");
console.log(" Mu'jam - Web Build");
console.log("========================================");
console.log("");

// --------------------------------------------------
// Helper: copy directory recursively
// --------------------------------------------------

function copyDirectory(source, destination) {

    if (!fs.existsSync(source)) {
        return;
    }

    fs.mkdirSync(destination, {
        recursive: true
    });

    const entries = fs.readdirSync(
        source,
        {
            withFileTypes: true
        }
    );

    for (const entry of entries) {

        const sourcePath =
            path.join(source, entry.name);

        const destinationPath =
            path.join(destination, entry.name);

        if (entry.isDirectory()) {

            copyDirectory(
                sourcePath,
                destinationPath
            );

        } else {

            fs.copyFileSync(
                sourcePath,
                destinationPath
            );

        }

    }

}

// --------------------------------------------------
// Check source
// --------------------------------------------------

if (!fs.existsSync(sourceDir)) {

    console.error(
        "ERROR: src directory was not found."
    );

    process.exit(1);

}

// --------------------------------------------------
// Clean www
// --------------------------------------------------

console.log("Cleaning www...");

if (fs.existsSync(wwwDir)) {

    fs.rmSync(
        wwwDir,
        {
            recursive: true,
            force: true
        }
    );

}

fs.mkdirSync(
    wwwDir,
    {
        recursive: true
    }
);

// --------------------------------------------------
// Copy index.html
// --------------------------------------------------

const indexFile =
    path.join(
        projectRoot,
        "index.html"
    );

if (!fs.existsSync(indexFile)) {

    console.error(
        "ERROR: index.html was not found in project root."
    );

    process.exit(1);

}

console.log("Copying index.html...");

fs.copyFileSync(
    indexFile,
    path.join(
        wwwDir,
        "index.html"
    )
);

// --------------------------------------------------
// Copy manifest
// --------------------------------------------------

const manifestFile =
    path.join(
        projectRoot,
        "manifest.json"
    );

if (fs.existsSync(manifestFile)) {

    console.log("Copying manifest.json...");

    fs.copyFileSync(
        manifestFile,
        path.join(
            wwwDir,
            "manifest.json"
        )
    );

}

// --------------------------------------------------
// Copy src
// --------------------------------------------------

console.log("Copying src...");

copyDirectory(
    sourceDir,
    path.join(
        wwwDir,
        "src"
    )
);

console.log("");
console.log("Web files prepared successfully.");
console.log("");

// --------------------------------------------------
// Capacitor sync
// --------------------------------------------------

console.log("Running Capacitor sync...");
console.log("");

try {

    execSync(
        "npx cap sync android",
        {
            cwd: projectRoot,
            stdio: "inherit"
        }
    );

} catch (error) {

    console.error("");
    console.error(
        "ERROR: Capacitor sync failed."
    );

    process.exit(1);

}

console.log("");
console.log("========================================");
console.log(" Mu'jam Android sync complete!");
console.log("========================================");
console.log("");