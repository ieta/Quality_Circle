@echo off
chcp 65001 > nul
cd /d "%~dp0"

:: 1. 개발 서버가 이미 떠있는지 또는 새로 띄울지 실행
start /min cmd /c "npm run dev"

:: 2. 서버 준비 대기 (2초)
timeout /t 2 /nobreak > nul

:: 3. 브라우저로 화면 진입
start "" "http://localhost:5173"
