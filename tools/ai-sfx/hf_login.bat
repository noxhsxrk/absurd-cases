@echo off
cd /d "%~dp0"
title Hugging Face login (paste your Read token here; it stays on this PC)
echo Paste your Hugging Face READ token below and press Enter. Answer "n" if asked to add it as a git credential.
.venv\Scripts\python.exe -m pip install -q "huggingface_hub>=0.24"
.venv\Scripts\huggingface-cli.exe login
.venv\Scripts\python.exe -c "from huggingface_hub import whoami; print('logged in as', whoami()['name'])" > hf_login_check.txt 2>&1
type hf_login_check.txt
pause
