"""Lets the render watcher run any repo command (it only launches Blender): Blender runs this file, which shells out.
usage (one-line .job): cmd_job.py -- <command line, run from the repo root>   — prints SHOT DONE when the command exits 0"""
import sys, os, subprocess
argv = sys.argv[sys.argv.index('--') + 1:]
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cmd = ' '.join(argv); print('CMD', cmd, flush=True)
r = subprocess.run(cmd, cwd=root, shell=True)
print('CMD EXIT', r.returncode)
if r.returncode == 0: print('SHOT DONE')
