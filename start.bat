@echo off
title Project Workbench

echo ============================================
echo          Project Workbench - Start
echo ============================================
echo.
echo Building project...
echo.

npm.cmd run build

if %ERRORLEVEL% neq 0 (
    echo.
    echo Build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Build successful!
echo.
echo Starting preview server...
echo.

npm.cmd run preview

pause