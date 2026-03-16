const https = require('https'); // Add the https module
const path = require('path');
const fs = require('fs');
const app = require('./app');

const key_path = path.join(__dirname, "../certs/vmukti.key")
const pem_path = path.join(__dirname, "../certs/vmukti.pem")

// Load SSL/TLS certificates
const privateKey = fs.readFileSync(key_path, 'utf8'); // Use absolute paths
const certificate = fs.readFileSync(pem_path, 'utf8'); // Use absolute paths
// const passphrase = 'ambicam'; // Remove or handle securely, NEVER hardcode in production
const credentials = { key: privateKey, cert: certificate }; // Remove passphrase if not needed

// Create an HTTPS server
const httpsServer = https.createServer(credentials, app);
const port = process.env.PORT || 5000;

httpsServer.listen(port, () => {
    console.log(`Ambicam-App server is running on port ${port} using HTTPS`);
});

