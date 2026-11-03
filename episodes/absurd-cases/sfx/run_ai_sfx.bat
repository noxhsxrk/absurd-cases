@echo off
cd /d "%~dp0"
title AI SFX (AudioLDM2) - absurd-cases
set LOG=setup_log.txt
echo === setup %date% %time% === > %LOG%
set PY=
where py >nul 2>nul && set PY=py -3
if not defined PY where python >nul 2>nul && set PY=python
if not defined PY (echo Python 3 not found. Install from python.org then run again. >> %LOG% & type %LOG% & pause & exit /b 1)
if not exist .venv\Scripts\python.exe (%PY% -m venv .venv >> %LOG% 2>&1)
set VPY=.venv\Scripts\python.exe
%VPY% -m pip install --upgrade pip >> %LOG% 2>&1
%VPY% -c "import torch,sys; sys.exit(0 if torch.cuda.is_available() else 1)" >nul 2>nul || %VPY% -m pip install torch --index-url https://download.pytorch.org/whl/cu124 >> %LOG% 2>&1
%VPY% -m pip install diffusers==0.31.0 transformers==4.46.3 accelerate scipy >> %LOG% 2>&1
echo === setup done, generating === >> %LOG%
%VPY% gen_sfx.py
echo === finished (see gen_log.txt) === >> %LOG%
pause
