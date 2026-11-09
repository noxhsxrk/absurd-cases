@echo off
cd /d "%~dp0"
title EP8 test shot: shadow takes one more step
call run_blender.bat shot_shadowstep.py -- --mp4 --pct 100 --samples 64
type shot_shadowstep_log.txt | findstr /c:"stops at" /c:"SHOT DONE" /c:"Error"
