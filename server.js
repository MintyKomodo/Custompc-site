import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;
const BACKEND_PORT = 5001;

console.log('Initializing CustomPC.tech Local Server...');

// Start the backend server on a different port
// We use 'npm start' inside the backend folder
const backend = spawn('cmd.exe', ['/c', 'npm start'], {
    cwd: path.join(__dirname, 'backend'),
    env: { ...process.env, PORT: BACKEND_PORT },
    stdio: 'inherit'
});

backend.on('error', (err) => {
    console.error('Failed to start backend server:', err);
});

console.log(`Starting backend server on port ${BACKEND_PORT}...`);

// Serve static files from the root directory
// Explicitly serve builds.html for /builds request to avoid directory conflict
app.get('/builds', (req, res) => {
    res.sendFile(path.join(__dirname, 'builds.html'));
});

// Serve static files from the root directory with extension support
app.use(express.static(__dirname, { extensions: ['html'] }));

// Proxy API requests to the backend
app.use('/api', createProxyMiddleware({
    target: `http://localhost:${BACKEND_PORT}`,
    changeOrigin: true,
    ws: true,
    // Important: http-proxy-middleware v3 might handle path updates differently
    // but usually /api -> /api matching is default behavior if strictly configured.
}));

app.listen(PORT, (err) => {
    if (err) console.error(err);
    console.log(`\n==================================================`);
    console.log(`🚀 Website running at http://localhost:${PORT}`);
    console.log(`   - Static files served from root`);
    console.log(`   - API proxied to backend on port ${BACKEND_PORT}`);
    console.log(`==================================================\n`);
});

// Handle cleanup
process.on('SIGINT', () => {
    console.log('Stopping servers...');
    backend.kill();
    process.exit();
});
