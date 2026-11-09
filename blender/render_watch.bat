@echo off
setlocal
rem Render watcher: leave this window open. Every 30 s it pulls the repo and renders any blender\queue\*.job
rem that has no renders\done\<job>.done yet. A .job file holds one line: <script.py> -- <args>
cd /d "%~dp0"
title absurd-cases render watcher - leave this window open
if not exist renders\done mkdir renders\done
echo Render watcher running. Leave this window open; close it to stop.
:loop
git -C .. pull --ff-only > renders\watch_pull.txt 2>&1
for %%J in (queue\*.job) do if not exist "renders\done\%%~nJ.done" call :run "%%~fJ" "%%~nJ"
echo idle %date% %time%> renders\watch_status.txt
timeout /t 30 /nobreak > nul
goto loop

:run
set "JOB=%~2"
set /p ARGS=<%1
for /f "tokens=1" %%S in ("%ARGS%") do set "SCRIPT=%%~nS"
echo rendering %JOB% since %date% %time%> renders\watch_status.txt
echo [%date% %time%] start %JOB%: %ARGS%
echo [%date% %time%] start %JOB%: %ARGS%>> renders\watch_history.txt
call run_blender.bat %ARGS%
copy /y "%SCRIPT%_log.txt" "renders\done\%JOB%.log" > nul
findstr /c:"SHOT DONE" "renders\done\%JOB%.log" > nul && (echo ok> "renders\done\%JOB%.done") || (echo failed> "renders\done\%JOB%.done")
echo [%date% %time%] end %JOB%
echo [%date% %time%] end %JOB%>> renders\watch_history.txt
exit /b
