# 🚨 CRITICAL: FIX SERVER CONNECTION

It looks like your **Windows Firewall** or **Antivirus (McAfee)** is blocking the connection to your backend server.

Even though the server is running on port 8080, your computer acts like a fortress and stops your phone from talking to it.

## 🛠️ OPTION 1: If using a REAL PHONE (Required Step)

1.  **Find the file:** `allow_backend_firewall.bat` in your project folder.
2.  **Right-Click** it.
3.  Select **"Run as Administrator"**.
    -   (This is mandatory. Just double-clicking won't work).
4.  After running it, restart the app on your phone.

---

## 🛠️ OPTION 2: If using ANDROID EMULATOR (Easier)

If you are using the emulator on your PC, you don't need the firewall rule. You just need to change the IP setting.

1.  Open `SmartParkingSpot_Frontend/constants/api.ts`
2.  Change this line:
    ```typescript
    const NETWORK_IP = "10.67.158.86";
    ```
    to:
    ```typescript
    const NETWORK_IP = "10.0.2.2";
    ```
3.  Reload the app (Press `R` twice).

---

## 🔍 HACK: Quick Test

If you want to know if it's working:
1.  Open Chrome on your phone.
2.  Go to: `http://10.67.158.86:8080/api/auth/health` (or just `/`)
3.  If it loads (even an error page), the connection is fixed.
4.  If it says "Site can't be reached", the Firewall is still blocking it.
