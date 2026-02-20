// 🔧 FLEXIBLE API CONFIGURATION
// For web development (same computer): use localhost
// For mobile testing (phone/tablet): use your computer's IP address

// To find your IP: Run 'ipconfig' in terminal and look for IPv4 Address
const NETWORK_IP = "10.11.212.172"; // Latest Wi-Fi IP detected from ipconfig

// Automatically detect if running on web or mobile
const isWeb = typeof window !== 'undefined' && window.location.hostname === 'localhost';

const BASE_URL = isWeb
    ? "http://localhost:8090"  // Use for web development
    : `http://${NETWORK_IP}:8090`;  // Use for mobile testing

export default BASE_URL;
