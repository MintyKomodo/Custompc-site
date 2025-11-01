/**
 * Script to get your Square Location ID
 * Run this in Node.js to find your location ID
 */

const https = require('https');

// Your production access token
const ACCESS_TOKEN = 'EAAAl9-n6xL-VukQrSJWp3hJCvxWres3IgFnf2nFLEENmUC-aHrC3OQh9OlvcM76';

function getLocations() {
    const options = {
        hostname: 'connect.squareup.com',
        path: '/v2/locations',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Square-Version': '2023-10-18',
            'Content-Type': 'application/json'
        }
    };

    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                
                if (response.locations && response.locations.length > 0) {
                    console.log('✅ Found your Square locations:');
                    console.log('=====================================');
                    
                    response.locations.forEach((location, index) => {
                        console.log(`Location ${index + 1}:`);
                        console.log(`  ID: ${location.id}`);
                        console.log(`  Name: ${location.name}`);
                        console.log(`  Status: ${location.status}`);
                        console.log(`  Type: ${location.type}`);
                        if (location.address) {
                            console.log(`  Address: ${location.address.address_line_1 || ''} ${location.address.locality || ''}`);
                        }
                        console.log('---');
                    });
                    
                    // Get the main location (usually the first active one)
                    const mainLocation = response.locations.find(loc => loc.status === 'ACTIVE') || response.locations[0];
                    
                    console.log('🎯 Use this Location ID in your config:');
                    console.log(`Location ID: ${mainLocation.id}`);
                    console.log('');
                    console.log('Copy this ID and update your square-config.js file');
                    
                } else {
                    console.log('❌ No locations found. Make sure your Square account is set up properly.');
                }
            } catch (error) {
                console.error('❌ Error parsing response:', error);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request error:', error);
    });

    req.end();
}

console.log('🔍 Fetching your Square locations...');
getLocations();