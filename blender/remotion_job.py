"""Lets the render watcher run a Remotion render (it only knows how to launch Blender): Blender runs this file, which
shells out to the Remotion CLI from the repo root. usage (one-line .job): remotion_job.py -- <CompositionId> <out.mp4>"""
import sys, os, subprocess
argv = sys.argv[sys.argv.index('--') + 1:]; comp, out, extra = argv[0], argv[1], argv[2:]
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cmd = ['node', os.path.join('node_modules', '@remotion', 'cli', 'remotion-cli.js'), 'render', 'src/index.ts', comp, out, '--gl=angle', '--bundle-cache=false'] + extra
print('REMOTION', ' '.join(cmd), flush=True)
r = subprocess.run(cmd, cwd=root, shell=(os.name == 'nt'))
print('REMOTION EXIT', r.returncode)
if r.returncode == 0: print('SHOT DONE')
