@echo off
cd /d "%~dp0"
title Whisper word timings
.venv\Scripts\python.exe transcribe.py
type transcribe_log.txt
pause
