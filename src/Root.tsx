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
