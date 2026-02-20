@echo off
:: Check for administrative privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [SUCCESS] Running as Administrator.
) else (
    echo [ERROR] Please right-click this file and select "Run as Administrator".
    pause
    exit /b
)

echo [STEP 1] Opening Port 8080 in Windows Firewall...
netsh advfirewall firewall add rule name="ParkEase_Backend_8080" dir=in action=allow protocol=TCP localport=8080

echo [STEP 2] Setting Local Network to Private...
powershell -Command "Get-NetConnectionProfile | Set-NetConnectionProfile -NetworkCategory Private"

echo [STEP 3] Verifying Current IP Address...
ipconfig | findstr "IPv4 Address"

echo.
echo [DONE] Firewall rules applied and network set to Private.
echo Please restart your backend server now.
pause
