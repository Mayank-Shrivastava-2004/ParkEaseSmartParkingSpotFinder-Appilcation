// 🔧 FLEXIBLE API CONFIGURATION FOR REACT NATIVE
// Production (Railway): uses deployed backend URL
// Local Dev (mobile): uses local Wi-Fi IP

// Railway production backend URL
const RAILWAY_URL = "https://parkeasesmartparkingspotfinder-appilcation-production.up.railway.app";

// Local development IP - run 'ipconfig' to get latest
const LOCAL_IP = "10.22.120.172";
const LOCAL_URL = `http://${LOCAL_IP}:8080`;

// Use Railway URL for production, local for development
// To use local: comment out RAILWAY_URL line and uncomment LOCAL_URL
const BASE_URL = RAILWAY_URL;
// const BASE_URL = LOCAL_URL; // uncomment for local dev

export default BASE_URL;

