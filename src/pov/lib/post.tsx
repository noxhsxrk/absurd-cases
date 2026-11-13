import React, {useMemo, useEffect} from 'react';
import * as THREE from 'three';
import {useThree, useFrame} from '@react-three/fiber';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/examples/jsm/postprocessing/GTAOPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';

/** Engine-style finish for a shot (ref6: contact shadows in every crease, bloom on lamps): ambient occlusion + bloom, passes that ship with three.
 *  Drop <Post /> inside a ThreeCanvas; it takes over rendering (useFrame priority 1). ao / bloom = 0 switches that pass off.
 *  Sprites and additive / see-through meshes are hidden while the AO pass draws its normals, so glows leave no dark squares. */
export const Post: React.FC<{ao?: number; aoRadius?: number; bloom?: number; threshold?: number; radius?: number}> = ({ao = 1, aoRadius = 0.35, bloom = 0.5, threshold = 0.82, radius = 0.5}) => {
  const {gl, scene, camera, size} = useThree();
  const fx = useMemo(() => {
    const w = Math.round(size.width * gl.getPixelRatio()), h = Math.round(size.height * gl.getPixelRatio());
    const composer = new EffectComposer(gl, new THREE.WebGLRenderTarget(w, h, {type: THREE.HalfFloatType, samples: 4}));
    composer.addPass(new RenderPass(scene, camera));
    const gtao = new GTAOPass(scene, camera, w, h); composer.addPass(gtao);
    // the AO pass draws the scene's normals with an override material: keep sprites and see-through, non-depth-writing meshes out of it
    const draw = gtao.render.bind(gtao);
    (gtao as any).render = (...a: any[]) => { const hidden: THREE.Object3D[] = [];
      scene.traverse((o: any) => { const m = o.material; if (o.visible && (o.isSprite || o.userData.noAO || (m && !Array.isArray(m) && m.transparent && !m.depthWrite))) { o.visible = false; hidden.push(o); } });
      (draw as any)(...a); hidden.forEach((o) => { o.visible = true; }); };
    const bl = new UnrealBloomPass(new THREE.Vector2(w, h), bloom, radius, threshold); composer.addPass(bl);
    composer.addPass(new OutputPass());
    return {composer, gtao, bl};
  }, [gl, scene, camera, size.width, size.height]);
  useEffect(() => () => fx.composer.dispose(), [fx]);
  fx.gtao.enabled = ao > 0; fx.gtao.blendIntensity = ao; fx.gtao.updateGtaoMaterial({radius: aoRadius, thickness: 1, distanceExponent: 1, scale: 1, samples: 16});
  fx.bl.enabled = bloom > 0; fx.bl.strength = bloom; fx.bl.threshold = threshold; fx.bl.radius = radius;
  useFrame(() => fx.composer.render(), 1);
  return null;
};
