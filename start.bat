@echo off
chcp 65001 > nul
echo ===================================================
echo   Quality Circle 분임조 평가 대시보드 실행 중...
echo ===================================================
echo.

cd /d "%~dp0"
echo 현재 위치: %CD%
echo.

echo 개발 서버를 시작합니다 (http://localhost:5173)...
echo 종료하려면 이 창을 닫거나 Ctrl+C를 누르세요.
echo.

npm run dev
pause
