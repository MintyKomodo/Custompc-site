/**
 * Square Payment Configuration
 * Centralized configuration for Square integration
 */

class SquareConfig {
    constructor() {
        // Detect environment
        this.environment = this.detectEnvironment();
        
        // Set configuration based on environment
        this.config = this.getConfig();
    }

    detectEnvironment() {
        // Force production mode since you have production credentials
        // You can change this back to 'sandbox' for testing
        return 'production';
        
        // Original logic (commented out):
        // if (window.location.hostname === 'localhost' || 
        //     window.location.hostname === '127.0.0.1' ||
        //     window.location.hostname.includes('dev') ||
        //     window.location.search.includes('sandbox=true')) {
        //     return 'sandbox';
        // }
        // return 'production';
    }

    getConfig() {
        const configs = {
            sandbox: {
                applicationId: 'sandbox-sq0idb-G9gb7bgmLJetrPtT_Whjo',
                locationId: 'LJR87MYZ8ZZC9',
                sdkUrl: 'https://sandbox.web.squarecdn.com/v1/square.js',
                apiBaseUrl: '/api', // Your backend API base URL
                environment: 'sandbox'
            },
            production: {
                applicationId: 'sq0idp-nn3XY5fKUDQwQwU8pWqhPw',
                locationId: 'LJR87MYZ8ZZC9', // You'll need to get this from Square Dashboard
                sdkUrl: 'https://web.squarecdn.com/v1/square.js',
                apiBaseUrl: '/api', // Your production backend API base URL
                environment: 'production'
            }
        };

        return configs[this.environment];
    }

    getApplicationId() {
        return this.config.applicationId;
    }

    getLocationId() {
        return this.config.locationId;
    }

    getSdkUrl() {
        return this.config.sdkUrl;
    }

    getApiBaseUrl() {
        return this.config.apiBaseUrl;
    }

    getEnvironment() {
        return this.config.environment;
    }

    isProduction() {
        return this.environment === 'production';
    }

    isSandbox() {
        return this.environment === 'sandbox';
    }

    // Validate configuration
    isValid() {
        const required = ['applicationId', 'locationId', 'sdkUrl', 'apiBaseUrl'];
        return required.every(key => this.config[key] && this.config[key] !== 'YOUR_PRODUCTION_APPLICATION_ID');
    }

    // Get configuration status for admin display
    getStatus() {
        return {
            environment: this.environment,
            isValid: this.isValid(),
            applicationId: this.config.applicationId,
            locationId: this.config.locationId,
            sdkUrl: this.config.sdkUrl,
            apiBaseUrl: this.config.apiBaseUrl
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SquareConfig;
} else {
    window.SquareConfig = SquareConfig;
}