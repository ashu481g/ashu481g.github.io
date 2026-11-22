@echo off
cd /d "%~dp0"
echo.
echo  Teleprompter Studio is running at http://localhost:8000
echo  Keep this window open while you record. Close it to stop.
echo.
start "" cmd /c "timeout /t 2 >nul & start http://localhost:8000"
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 8000
) else (
  py -m http.server 8000
)
pause
