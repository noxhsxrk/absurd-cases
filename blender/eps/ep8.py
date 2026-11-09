"""EP8 คดีสะกดรอยตาม — Blender shots. Render one: blender -b -P eps/ep8.py -- --shot walk --mp4
Timing comes from public/absurd-cases/ep8/ep8_timeline.json (shot length + 20 frames of handle)."""
import bpy, sys, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, os.path.join(HERE, 'lib'))
from kit import *
import soi

TIMELINE = os.path.join(os.path.dirname(HERE), 'public', 'absurd-cases', 'ep8', 'ep8_timeline.json')
HOME_X = -4.2; LANE_Y = 1.85   # walk close to the wall: the shadow stands on the wall, only the feet touch the floor

def soi_day(seed=5, clear=(-8.0, 8.0)):
    soi.build(seed=seed, clear=clear); daylight()

def with_shadow(S, start, heading, moves, shadow_moves=None, **kw):
    """the man (casts no shadow of his own) + an invisible double that casts the shadow; by default the double copies him"""
    man = S.actor('nai', start, heading, moves, cast_shadow=False, **kw)
    shade = S.actor('shade', start, heading, shadow_moves or moves, shadow_only=True, **kw)
    return man, shade

# ---------------------------------------------------------------------------------------------------------------------
def shot_walk(S):
    """l001 'ชายคนนี้ กำลังเดินอยู่หน้าบ้าน' — wide: him and his ordinary shadow walking along the house front"""
    soi_day()
    man, shade = with_shadow(S, (HOME_X - 1.2, LANE_Y), EAST, [('walk', 1, 37)] * 3)
    man.blink([24])
    S.operator(follow=man, offset=(1.6, -4.4, 1.7), look=(1.2, 1.6, 1.0), lens=24)

def shot_look(S):
    """beat after l001: he stops, feels something, glances back over his shoulder. Shadow is still just a shadow."""
    soi_day()
    man, shade = with_shadow(S, (HOME_X, LANE_Y), EAST, [('stop', 22, 91), ('look_back', 'auto', 110)])
    man.face([(1, 'half'), (20, 'open'), (36, 'wide'), (52, 'half')])
    S.operator(follow=man, offset=(1.1, -2.4, 1.45), look=(0.25, 1.4, 1.2), lens=30, lag=(4, 14))

def shot_shadowStep(S):
    """l002 'แล้วเงา ก็แอบเดินตามเขาติดๆ' — locked-off frame: he walks on and out; his shadow stays on the wall a beat,
    then tiptoes after him. The camera barely drifts so the shadow is the only thing that moves on its own."""
    soi_day()
    x0 = HOME_X + 0.6
    man, shade = with_shadow(S, (x0, LANE_Y), EAST, [('walk', 1, 37)] * 3,
                             shadow_moves=[('idle', 1, 20), ('sneak', 'auto', 28), ('careful', 'auto', 53), ('careful', 1, 53)])
    man.blink([30])
    n = S.frames[1]
    S.operator(path=[(1, (x0 + 1.5, -3.6, 1.4), (x0 + 1.2, 1.8, 1.05)), (n, (x0 + 2.1, -3.6, 1.4), (x0 + 1.8, 1.8, 1.05))], lens=24)

SHOTS = {k[5:]: v for k, v in globals().items() if k.startswith('shot_')}
if __name__ == '__main__' or 'bpy' in sys.modules:
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    if '--shot' in argv: run(SHOTS, argv, TIMELINE)
