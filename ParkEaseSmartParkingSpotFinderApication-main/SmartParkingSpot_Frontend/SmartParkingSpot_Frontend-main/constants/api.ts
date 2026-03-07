// 🔧 FLEXIBLE API CONFIGURATION FOR REACT NATIVE
// Production (Railway): uses EXPO_PUBLIC_API_URL environment variable
// Local Dev (mobile): uses local Wi-Fi IP
// Local Dev (emulator): uses localhost

// Railway production URL (set EXPO_PUBLIC_API_URL in Railway dashboard)
const RAILWAY_URL = process.env.EXPO_PUBLIC_API_URL;

// Local development IP - run 'ipconfig' to get latest
const LOCAL_IP = "10.22.120.172";
const LOCAL_URL = `http://${LOCAL_IP}:8080`;

// Auto-select: Railway URL if set, otherwise local
const BASE_URL = RAILWAY_URL || LOCAL_URL;

export default BASE_URL;

