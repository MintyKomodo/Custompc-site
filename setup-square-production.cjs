/**
 * Square Production Setup Script
 * This script helps you configure your Square integration for production
 */

const fs = require('fs');
const https = require('https');

// Your credentials
const PRODUCTION_APP_ID = 'sq0idp-nn3XY5fKUDQwQwU8pWqhPw';
const PRODUCTION_ACCESS_TOKEN = 'EAAAl9-n6xL-VukQrSJWp3hJCvxWres3IgFnf2nFLEENmUC-aHrC3OQh9OlvcM76';

console.log('🚀 Setting up Square Production Integration...\n');

// Step 1: Get Location ID
function getLocationId() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'connect.squareup.com',
            path: '/v2/locations',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${PRODUCTION_ACCESS_TOKEN}`,
                'Square-Version': '2023-10-18',
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.locations && response.locations.length > 0) {
                        const mainLocation = response.locations.find(loc => loc.status === 'ACTIVE') || response.locations[0];
                        resolve(mainLocation.id);
                    } else {
                        reject('No locations found');
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Step 2: Update configuration files
async function updateConfig() {
    try {
        console.log('📍 Getting your Square location ID...');
        const locationId = await getLocationId();
        console.log(`✅ Found Location ID: ${locationId}\n`);

        // Update square-config.js
        console.log('📝 Updating square-config.js...');
        let configContent = fs.readFileSync('square-config.js', 'utf8');
        
        configContent = configContent.replace(
            'YOUR_PRODUCTION_LOCATION_ID', 
            locationId
        );
        
        fs.writeFileSync('square-config.js', configContent);
        console.log('✅ Updated square-config.js with your location ID\n');

        // Create environment file for backend
        console.log('📝 Creating .env file for backend...');
        const envContent = `# Square Production Configuration
SQUARE_ACCESS_TOKEN=${PRODUCTION_ACCESS_TOKEN}
SQUARE_APPLICATION_ID=${PRODUCTION_APP_ID}
SQUARE_LOCATION_ID=${locationId}
NODE_ENV=production
PORT=3000

# Security
SESSION_SECRET=your-session-secret-here-change-this
`;

        fs.writeFileSync('.env', envContent);
        console.log('✅ Created .env file with your credentials\n');

        // Create package.json if it doesn't exist
        if (!fs.existsSync('package.json')) {
            console.log('📦 Creating package.json...');
            const packageJson = {
                "name": "custompc-payment-backend",
                "version": "1.0.0",
                "description": "Square payment backend for CustomPC.tech",
                "main": "square-backend-example.js",
                "scripts": {
                    "start": "node square-backend-example.js",
                    "dev": "nodemon square-backend-example.js"
                },
                "dependencies": {
                    "express": "^4.18.2",
                    "squareup": "^29.0.0",
                    "dotenv": "^16.3.1",
                    "cors": "^2.8.5"
                },
                "devDependencies": {
                    "nodemon": "^3.0.1"
                }
            };
            
            fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
            console.log('✅ Created package.json\n');
        }

        // Test the connection
        console.log('🧪 Testing Square connection...');
        await testConnection(locationId);

        console.log('🎉 Setup Complete! Next steps:');
        console.log('1. Run: npm install');
        console.log('2. Run: npm start');
        console.log('3. Test your payment system at: http://localhost:3000');
        console.log('4. Your payment page should now work with real Square payments!');

    } catch (error) {
        console.error('❌ Setup failed:', error);
        console.log('\nTroubleshooting:');
        console.log('1. Make sure your Square credentials are correct');
        console.log('2. Check that your Square account is fully activated');
        console.log('3. Verify you have the necessary permissions');
    }
}

// Step 3: Test connection
function testConnection(locationId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'connect.squareup.com',
            path: `/v2/locations/${locationId}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${PRODUCTION_ACCESS_TOKEN}`,
                'Square-Version': '2023-10-18'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Square connection test successful!\n');
                    resolve();
                } else {
                    reject(`Connection test failed: ${res.statusCode}`);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Run setup
updateConfig();