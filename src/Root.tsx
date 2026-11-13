import React from 'react';
import {Composition} from 'remotion';
import {PovScene} from './pov/PovScene';
import {LowPolySheet} from './pov/sheets/LowPolySheet';
import {FpvSheet} from './pov/sheets/FpvSheet';
import {CastSheet, UniformSheet, GarmentSheet, GestureSheet} from './pov/sheets/CastSheet';
import {PhoneTest, NpcPhoneTest} from './pov/sheets/PhoneTest';
import {WindowTest} from './pov/sheets/WindowTest';
import {MrtLookdev, MrtCast, MrtPov, MrtHairSheet, CASES as MRT_CASES} from './pov/sheets/MetroLookdev';
import {SetTour, TOUR} from './pov/sheets/SetTour';
import './pov/ui/fonts';
import {AbsurdEp1, TOTAL as ABSURD1_TOTAL} from './episodes/AbsurdEp1/Episode';
import {AbsurdEp2, TOTAL as ABSURD2_TOTAL} from './episodes/AbsurdEp2/Episode';
import {AbsurdEp3, TOTAL as ABSURD3_TOTAL} from './episodes/AbsurdEp3/Episode';
import {AbsurdEp4, TOTAL as ABSURD4_TOTAL} from './episodes/AbsurdEp4/Episode';
import {AbsurdEp5, TOTAL as ABSURD5_TOTAL} from './episodes/AbsurdEp5/Episode';
import {AbsurdEp6, TOTAL as ABSURD6_TOTAL} from './episodes/AbsurdEp6/Episode';
import {AbsurdEp7, TOTAL as ABSURD7_TOTAL} from './episodes/AbsurdEp7/Episode';
import {AbsurdEp8, TOTAL as ABSURD8_TOTAL} from './episodes/AbsurdEp8/Episode';
import {AbsurdEp8B} from './episodes/AbsurdEp8B/Episode';
import {AbsurdEp9, TOTAL as ABSURD9_TOTAL} from './episodes/AbsurdEp9/Episode';
import {AbsurdEp9Look, LOOK_TOTAL as ABSURD9_LOOK} from './episodes/AbsurdEp9/Look';
import {AbsurdEp10, TOTAL as ABSURD10_TOTAL} from './episodes/AbsurdEp10/Episode';
import {AbsurdEp11, TOTAL as ABSURD11_TOTAL} from './episodes/AbsurdEp11/Episode';
import {AbsurdEp12, TOTAL as ABSURD12_TOTAL} from './episodes/AbsurdEp12/Episode';
import {AbsurdEp10Look, LOOK_TOTAL as ABSURD10_LOOK} from './episodes/AbsurdEp10/Look';
import {LifeKitProps, PROPS_TOTAL} from './episodes/lifekit/PropsLook';
import {AbsurdEp13Look, LOOK13_TOTAL} from './episodes/AbsurdEp13/Look';
import {AbsurdEp13, TOTAL as ABSURD13_TOTAL} from './episodes/AbsurdEp13/Episode';
import {AbsurdEp14, TOTAL as ABSURD14_TOTAL} from './episodes/AbsurdEp14/Episode';
import {AbsurdEp15, TOTAL as ABSURD15_TOTAL, BLUR_SUB as ABSURD15_SUB} from './episodes/AbsurdEp15/Episode';
import {LifeKitDemo, DEMO_TOTAL} from './episodes/lifekit/Demo';
import {qualitySchema} from './pov/ui/quality';

export const Root: React.FC = () => (
  <>
    {/* absurd-cases EP1 — ยุงทำร้ายร่างกาย (narrator format, third-person cuts) */}
    <Composition id="AbsurdEp1" component={AbsurdEp1} durationInFrames={ABSURD1_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    {/* absurd-cases EP2 — คดีช็อตไม่เลือกหน้า */}
    <Composition id="AbsurdEp2" component={AbsurdEp2} durationInFrames={ABSURD2_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    {/* absurd-cases EP3 — คดีบุกรุกปอด */}
    <Composition id="AbsurdEp3" component={AbsurdEp3} durationInFrames={ABSURD3_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    {/* absurd-cases EP4 — คดีกลิ่นเดือดร้อน */}
    <Composition id="AbsurdEp4" component={AbsurdEp4} durationInFrames={ABSURD4_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    <Composition id="AbsurdEp5" component={AbsurdEp5} durationInFrames={ABSURD5_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    <Composition id="AbsurdEp6" component={AbsurdEp6} durationInFrames={ABSURD6_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    <Composition id="AbsurdEp7" component={AbsurdEp7} durationInFrames={ABSURD7_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    <Composition id="AbsurdEp8B" component={AbsurdEp8B} durationInFrames={ABSURD8_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="AbsurdEp9" component={AbsurdEp9} durationInFrames={ABSURD9_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    <Composition id="AbsurdEp9Look" component={AbsurdEp9Look} durationInFrames={ABSURD9_LOOK} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    <Composition id="AbsurdEp10" component={AbsurdEp10} durationInFrames={ABSURD10_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    <Composition id="AbsurdEp11" component={AbsurdEp11} durationInFrames={ABSURD11_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    <Composition id="AbsurdEp12" component={AbsurdEp12} durationInFrames={ABSURD12_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    {/* lifekit: living-world props + demo reel (not episodes) */}
    <Composition id="LifeKitProps" component={LifeKitProps} durationInFrames={PROPS_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    <Composition id="AbsurdEp13Look" component={AbsurdEp13Look} durationInFrames={LOOK13_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    <Composition id="AbsurdEp13" component={AbsurdEp13} durationInFrames={ABSURD13_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    <Composition id="AbsurdEp14" component={AbsurdEp14} durationInFrames={ABSURD14_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    <Composition id="AbsurdEp15" component={AbsurdEp15} durationInFrames={ABSURD15_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    <Composition id="AbsurdEp15Blur" component={AbsurdEp15} durationInFrames={ABSURD15_TOTAL * ABSURD15_SUB} fps={30 * ABSURD15_SUB} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    <Composition id="LifeKitDemo" component={LifeKitDemo} durationInFrames={DEMO_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    <Composition id="AbsurdEp10Look" component={AbsurdEp10Look} durationInFrames={ABSURD10_LOOK} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    <Composition id="AbsurdEp8" component={AbsurdEp8} durationInFrames={ABSURD8_TOTAL} fps={30} width={1080} height={1920} schema={qualitySchema} defaultProps={{quality: 'fast' as const}} />
    {/* demo shot: eye-level POV in the living office, toon cast on mocap, viewer's hand with a mug */}
    <Composition id="OfficePOV" component={PovScene} durationInFrames={240} fps={30} width={1080} height={1920} />
    {/* model sheets */}
    <Composition id="ToonSheet" component={LowPolySheet} durationInFrames={60} fps={30} width={1920} height={1080} />
    <Composition id="FpvSheet" component={FpvSheet} durationInFrames={30} fps={30} width={1920} height={1080} />
    {/* cast library (school), garments, five-finger gestures, phone grips */}
    <Composition id="CastSheet" component={CastSheet} durationInFrames={60} fps={30} width={1920} height={1080} />
    <Composition id="UniformSheet" component={UniformSheet} durationInFrames={60} fps={30} width={1080} height={1920} />
    <Composition id="GarmentSheet" component={GarmentSheet} durationInFrames={60} fps={30} width={1920} height={1080} />
    <Composition id="GestureSheet" component={GestureSheet} durationInFrames={10} fps={30} width={1920} height={1080} />
    <Composition id="PhoneTest" component={PhoneTest} durationInFrames={3} fps={30} width={1080} height={1920} />
    <Composition id="NpcPhoneTest" component={NpcPhoneTest} durationInFrames={4} fps={30} width={1080} height={1080} />
    {/* sets: one frame per set/state */}
    <Composition id="SetTour" component={SetTour} durationInFrames={TOUR.length} fps={30} width={1080} height={1920} />
    <Composition id="WindowTest" component={WindowTest} durationInFrames={2700} fps={30} width={1080} height={1920} />
    {/* metro set lookdev (train car, tunnel, platform, street) + metro cast */}
    <Composition id="MrtLookdev" component={MrtLookdev} durationInFrames={MRT_CASES.length} fps={30} width={1080} height={1920} />
    <Composition id="MrtCast" component={MrtCast} durationInFrames={60} fps={30} width={1920} height={1080} />
    <Composition id="MrtHair" component={MrtHairSheet} durationInFrames={2} fps={30} width={1920} height={1080} />
    <Composition id="MrtPov" component={MrtPov} durationInFrames={3} fps={30} width={1080} height={1920} />
  </>
);
