@echo off
cd /d "%~dp0"
set "SITE_URL=https://scadawatt.com"
set "SITE_INDEXABLE=1"
call npm.cmd start
