@echo off
cd /d "%~dp0"
git pull --ff-only > pull_log.txt 2>&1
type pull_log.txt
