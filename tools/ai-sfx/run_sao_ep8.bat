@echo off
cd /d "%~dp0"
echo installing / checking packages > sao_setup.txt
.venv\Scripts\python.exe -m pip install -q -U "diffusers>=0.32" "transformers>=4.45" accelerate torchsde soundfile librosa >> sao_setup.txt 2>&1
.venv\Scripts\python.exe gen_sao_ep8.py %*
