@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo 분임조 평가 및 집계 시스템을 시작합니다...
call npm run dev
