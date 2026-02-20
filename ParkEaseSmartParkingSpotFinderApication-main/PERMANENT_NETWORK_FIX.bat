@echo off
:: CHECK FOR ADMIN PRIVILEGES
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] PLEASE RIGHT-CLICK AND "RUN AS ADMINISTRATOR"
    pause
    exit
)

echo [1/5] STOPPING ANY OLD BACKEND PROCESSES...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8090') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do taskkill /f /pid %%a >nul 2>&1

echo [2/5] REMOVING OLD FIREWALL RULES...
netsh advfirewall firewall delete rule name="ParkEase_Backend_8080" >nul 2>&1
netsh advfirewall firewall delete rule name="ParkEase_Backend_8090" >nul 2>&1

echo [3/5] ADDING PERMANENT PORT RULES (8090)...
netsh advfirewall firewall add rule name="ParkEase_Backend_8090" dir=in action=allow protocol=TCP localport=8090 profile=any edge=yes
netsh advfirewall firewall add rule name="ParkEase_Java_Global" dir=in action=allow program="any" profile=any

echo [4/5] ENSURING NETWORK IS PRIVATE (PERMISSIVE)...
powershell -Command "Get-NetConnectionProfile | Set-NetConnectionProfile -NetworkCategory Private"

echo [5/5] DETECTING LATEST IP...
ipconfig | findstr "IPv4 Address"

echo.
echo ======================================================
echo [PERMANENT FIX APPLIED]
echo 1. Port 8090 is now open globally.
echo 2. Network is set to Private.
echo 3. Java is allowed through the firewall.
echo.
echo NEXT STEP: Restart your backend (mvn spring-boot:run).
echo ======================================================
pause
