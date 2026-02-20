@echo off
echo Attempting to open Port 8080 for Spring Boot Backend...
netsh advfirewall firewall add rule name="Allow Spring Boot 8080" dir=in action=allow protocol=TCP localport=8080
if %errorlevel% neq 0 (
    echo.
    echo FAILED: Please run this script as Administrator!
    echo Right-click this file and select 'Run as administrator'.
    pause
    exit /b
)
echo.
echo SUCCESS: Port 8080 is now open. Backend should be reachable.
pause
