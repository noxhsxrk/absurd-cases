@echo off
cd /d "%~dp0"
title EP3 prep: Whisper + AI SFX
.venv\Scripts\python.exe transcribe_ep3.py
type transcribe_ep3_log.txt
.venv\Scripts\python.exe gen_sfx_ep3.py
echo === EP3 PREP FINISHED ===
echo === EP3 PREP FINISHED === >> gen_log.txt
pause
