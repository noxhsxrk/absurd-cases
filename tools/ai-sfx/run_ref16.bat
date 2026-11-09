@echo off
cd /d "%~dp0"
title Whisper ref16
.venv\Scripts\python.exe transcribe_ref16.py
type ref\ref16_log.txt
pause
