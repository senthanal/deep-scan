const childProcess = require("node:child_process");
const fs = require("node:fs");

publish();

function publish() {
  console.log('Publishing scan-cli package...');
  if(!fs.existsSync('./dist/scan-cli')) {
    console.error('scan-cli package not found. Please run build script first.');
    process.exit(1);
  }
  const response = childProcess.spawnSync('npm', ['publish'], {
    cwd: './dist/scan-cli',
    shell: true,
    stdio: "pipe",
    encoding: "utf-8",
    env: process.env,
  });
  if (response.error) {
    console.error('Failed to publish scan-cli package:', response.error);
    process.exit(1);
  }
  console.log('scan-cli package published successfully!');
}
