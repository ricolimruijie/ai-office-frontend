import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, DoubleSide, Group, Mesh, MeshBasicMaterial, PointLight, Quaternion, Vector3 } from "three";
import type { ActivitySpot, Layout } from "../../shared/layout";
import type { RobotMotion } from "../characters/motion";
import { useOfficeStore } from "../state/officeStore";

/* Spellfire over the duelling courtyard. Two wizards who share a ring trade hexes; a wizard who has the ring
   to themselves practises against the empty air. Everything is driven through refs, so nothing re-renders per frame. */

const TIP_H = 1.4;          // height of a wand tip above the platform
const TIP_FWD = 0.55;       // how far a wand reaches in front of its wizard
const CAST_PERIOD = 1.4;    // the ring alternates: one cast every this many seconds
const CAST_S = 0.35;        // time a bolt takes to cross the ring
const PRACTICE_PERIOD = 2.4;
const PRACTICE_S = 0.45;
const SPARKS = 6;

interface Pair { a: number; b: number }

export function DuelVfx({ layout, motions }: { layout: Layout; motions: RobotMotion[] }) {
  const pairs = useMemo(() => {
    const out: Pair[] = [];
    layout.spots.forEach((s, i) => {
      if (s.kind === "duel" && s.partner !== undefined && s.partner > i) out.push({ a: i, b: s.partner });
    });
    return out;
  }, [layout]);
  return <>{pairs.map((p, i) => <DuelPair key={`${p.a}-${p.b}`} layout={layout} motions={motions} pair={p} seed={i} />)}</>;
}

function DuelPair({ layout, motions, pair, seed }: { layout: Layout; motions: RobotMotion[]; pair: Pair; seed: number }) {
  const spotA = layout.spots[pair.a], spotB = layout.spots[pair.b];
  const beam = useRef<Mesh>(null), bolt = useRef<Mesh>(null), hit = useRef<Mesh>(null);
  const glow = useRef<PointLight>(null), sparks = useRef<Group>(null);
  const beamMat = useRef<MeshBasicMaterial>(null), boltMat = useRef<MeshBasicMaterial>(null), hitMat = useRef<MeshBasicMaterial>(null);
  const clock = useRef(0);
  const v = useMemo(() => ({
    ta: new Vector3(), tb: new Vector3(), tail: new Vector3(), dir: new Vector3(),
    up: new Vector3(0, 1, 0), q: new Quaternion(), c: new Color()
  }), []);

  const tip = (spot: ActivitySpot, out: Vector3) =>
    out.set(spot.x + Math.sin(spot.heading) * TIP_FWD, TIP_H, spot.z + Math.cos(spot.heading) * TIP_FWD);

  const colourOf = (motionIndex: number) => {
    const { order, agents } = useOfficeStore.getState();
    return agents[order[motionIndex]]?.cfg.color ?? "#FFFFFF";
  };

  useFrame((_, rawDt) => {
    clock.current += Math.min(rawDt, 0.1);
    const t = clock.current + seed * 0.37;
    const ai = motions.findIndex(m => m.spot === pair.a && m.pose === "activity" && m.activity === "duel");
    const bi = motions.findIndex(m => m.spot === pair.b && m.pose === "activity" && m.activity === "duel");

    let firing = false, prog = 0, colour = "#FFFFFF";
    let from: Vector3 | null = null, to: Vector3 | null = null;

    if (ai >= 0 && bi >= 0) {
      // Both wizards are in the ring: they take turns, one hex every CAST_PERIOD.
      const phase = t % CAST_PERIOD;
      if (phase < CAST_S) {
        const aCasts = Math.floor(t / CAST_PERIOD) % 2 === 0;
        prog = phase / CAST_S;
        firing = true;
        from = tip(aCasts ? spotA : spotB, v.ta);
        to = tip(aCasts ? spotB : spotA, v.tb);
        colour = colourOf(aCasts ? ai : bi);
      }
    } else if (ai >= 0 || bi >= 0) {
      // Alone in the ring: practise a single conjuring spell at the air in front of the wand.
      const phase = t % PRACTICE_PERIOD;
      if (phase < PRACTICE_S) {
        const solo = ai >= 0 ? spotA : spotB;
        prog = phase / PRACTICE_S;
        firing = true;
        from = tip(solo, v.ta);
        to = v.tb.set(from.x + Math.sin(solo.heading) * 2.4, TIP_H + 0.4, from.z + Math.cos(solo.heading) * 2.4);
        colour = colourOf(ai >= 0 ? ai : bi);
      }
    }

    if (beam.current) beam.current.visible = firing;
    if (bolt.current) bolt.current.visible = firing;
    if (hit.current) hit.current.visible = firing;
    if (sparks.current) sparks.current.visible = firing;
    if (!firing || !from || !to) {
      if (glow.current) glow.current.intensity = 0;
      return;
    }

    // The bolt flies flat toward its target with a short trail behind it.
    v.tail.lerpVectors(from, to, prog);
    v.dir.subVectors(v.tail, from);
    const len = v.dir.length() || 0.001;
    if (beam.current) {
      beam.current.position.copy(from).addScaledVector(v.dir, 0.5);
      beam.current.scale.set(1, len, 1);
      v.q.setFromUnitVectors(v.up, v.dir.normalize());
      beam.current.quaternion.copy(v.q);
    }
    if (bolt.current) bolt.current.position.copy(v.tail);
    v.c.set(colour);
    beamMat.current?.color.copy(v.c); boltMat.current?.color.copy(v.c); hitMat.current?.color.copy(v.c);
    if (beamMat.current) beamMat.current.opacity = 0.7 * (1 - prog * 0.35);

    // Impact: a shield flare on the target, a flash of light and a few sparks.
    if (hit.current) { hit.current.position.copy(to); hit.current.lookAt(from); hit.current.scale.setScalar(0.45 + prog * 1.1); }
    if (hitMat.current) hitMat.current.opacity = 0.9 * (1 - prog * 0.4);
    if (glow.current) {
      glow.current.position.copy(to);
      glow.current.color.copy(v.c);
      glow.current.intensity = 16 * prog;
    }
    const group = sparks.current, target = to;
    if (group) {
      const burst = 0.09 + prog * 1.15;
      group.children.forEach((child, i) => {
        const a = t * 9 + i * (Math.PI * 2 / SPARKS);
        child.position.set(target.x + Math.cos(a) * 0.42 * burst, target.y + Math.sin(a * 1.7) * 0.3 * burst, target.z + Math.sin(a) * 0.42 * burst);
        child.scale.setScalar(0.55 + prog * 0.9);
      });
    }
  });

  return (
    <>
      <mesh ref={beam} visible={false}>
        <cylinderGeometry args={[0.07, 0.05, 1, 6, 1, true]} />
        <meshBasicMaterial ref={beamMat} color="#FFFFFF" transparent opacity={0.7} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      <mesh ref={bolt} visible={false}>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshBasicMaterial ref={boltMat} color="#FFFFFF" depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      <mesh ref={hit} visible={false}>
        <ringGeometry args={[0.26, 0.46, 26]} />
        <meshBasicMaterial ref={hitMat} color="#FFFFFF" transparent opacity={0.9} side={DoubleSide} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      <group ref={sparks} visible={false}>
        {Array.from({ length: SPARKS }, (_, i) => (
          <mesh key={i}>
            <octahedronGeometry args={[0.075]} />
            <meshBasicMaterial color="#FFFFFF" depthWrite={false} blending={AdditiveBlending} />
          </mesh>
        ))}
      </group>
      <pointLight ref={glow} intensity={0} distance={7} decay={2} />
    </>
  );
}
