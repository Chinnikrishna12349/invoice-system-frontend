@echo off
echo Cleaning up ports 3006 and 8080...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3006 ^| findstr LISTENING') do (
    echo Killing process %%a on port 3006...
    taskkill /F /PID %%a
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    echo Killing process %%a on port 8080...
    taskkill /F /PID %%a
)

echo Ports are now clear!
pause
