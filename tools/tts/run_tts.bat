@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
title Gemini TTS - absurd-cases EP1
echo === absurd-cases EP1 : Gemini TTS ===
if "%GEMINI_API_KEY%"=="" set /p GEMINI_API_KEY=Paste your Google AI Studio API key, then press Enter: 
set PY=
where py >/dev/null 2>/dev/null && set PY=py -3
if not defined PY where python >/dev/null 2>/dev/null && set PY=python
if not defined PY (echo Python 3 not found. Install it from python.org and run this again. > tts_log.txt & type tts_log.txt & pause & exit /b 1)
echo --- audition (ep1-l003, ep1-l012 x 3 voices) --- > tts_log.txt
%PY% gemini_tts.py --audition Charon Schedar Iapetus >> tts_log.txt 2>&1
echo --- all lines, voice %1 --- >> tts_log.txt
if "%1"=="" (%PY% gemini_tts.py --voice Charon >> tts_log.txt 2>&1) else (%PY% gemini_tts.py --voice %1 >> tts_log.txt 2>&1)
echo DONE >> tts_log.txt
type tts_log.txt
pause
