@echo off
REM MOXT — génère l'APK Android production (site embarqué + Supabase)
cd /d "%~dp0.."
echo.
echo === MOXT Capacitor PRODUCTION ===
echo.
call npm run web:cap:prod:sync
if errorlevel 1 exit /b 1
echo.
echo === Ouvrir Android Studio ===
call npm run web:cap:open:android
echo.
echo Dans Android Studio : Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
echo.
