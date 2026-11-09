@echo off
cd /d "%~dp0"
title EP4 v2 Whisper
.venv\Scripts\python.exe transcribe_ep4v2.py
echo === EP4V2 DONE ===
