// 🔧 FLEXIBLE API CONFIGURATION FOR REACT NATIVE
// For mobile testing (phone/tablet): use your computer's IP address
// For Android emulator: use 10.0.2.2 (maps to host's localhost)
// For iOS simulator: use localhost

// To find your IP: Run 'ipconfig' in terminal and look for IPv4 Address
const NETWORK_IP = "10.11.212.172"; // Latest Wi-Fi IP detected from ipconfig

// For React Native, we use the network IP by default
const BASE_URL = `http://${NETWORK_IP}:8090`;

export default BASE_URL;

