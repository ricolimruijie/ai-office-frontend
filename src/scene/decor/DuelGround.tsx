import { useMemo } from "react";
import { DoubleSide } from "three";
import type { Layout } from "../../../shared/layout";
import { Ball, Box, Cyl } from "../parts";
import { C } from "../palette";
import { toonGradient } from "../toon";
import { Banner, Torch } from "./magic";

/* The duelling courtyard: a raised flagstone ring in the west forecourt where idle wizards practise spells.
   Its geometry mirrors `layout.duel`, so the duel activity spots (both ends of each pairing) stand on it. */

const TORCH_SPOTS: [number, number][] = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
const RUNE_COUNT = 8;

export function DuelGround({ layout }: { layout: Layout }) {
  const d = layout.duel;
  const runes = useMemo(() => {
    const r = (d?.ringR ?? 0) * 0.84;
    return Array.from({ length: RUNE_COUNT }, (_, i) => {
      const a = (i / RUNE_COUNT) * Math.PI * 2;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, rot: -a };
    });
  }, [d?.ringR]);
  if (!d) return null;

  const { halfW, halfD, ringR } = d;
  const hw = halfW - 0.25, hd = halfD - 0.25;

  return (
    <group position={[d.x, 0, d.z]}>
      {/* the raised platform and its kerb */}
      <Box size={[halfW * 2, 0.16, halfD * 2]} pos={[0, 0.08, 0]} color={C.stoneLight} />
      <Box size={[halfW * 2 - 0.7, 0.04, halfD * 2 - 0.7]} pos={[0, 0.18, 0]} color={C.stone} cast={false} />
      {[-1, 1].map(s => (
        <Box key={`n${s}`} size={[halfW * 2 + 0.2, 0.26, 0.5]} pos={[0, 0.13, s * hd]} color={C.stoneDark} />
      ))}
      {[-1, 1].map(s => (
        <Box key={`w${s}`} size={[0.5, 0.26, halfD * 2 - 0.6]} pos={[s * hw, 0.13, 0]} color={C.stoneDark} />
      ))}
      {/* a step up from the lawn on the approach side */}
      <Box size={[4.4, 0.09, 1.1]} pos={[0, 0.045, -halfD - 0.6]} color={C.stoneLight} cast={false} />

      {/* the rune ring the duel is fought inside */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.205, 0]}>
        <ringGeometry args={[ringR - 0.16, ringR, 64]} />
        <meshToonMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.35} gradientMap={toonGradient} side={DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.205, 0]}>
        <ringGeometry args={[0.6, 0.72, 40]} />
        <meshToonMaterial color={C.spell} emissive={C.spell} emissiveIntensity={0.5} gradientMap={toonGradient} side={DoubleSide} />
      </mesh>
      {runes.map((r, i) => (
        <Box key={i} size={[0.34, 0.02, 0.34]} pos={[r.x, 0.2, r.z]} rot={[0, r.rot, 0]}
          color={C.spell} emissive={C.spell} emissiveIntensity={0.45} cast={false} />
      ))}

      {/* four pillars mark the cardinal points of the ring */}
      {[[0, -1], [0, 1], [-1, 0], [1, 0]].map(([px, pz], i) => (
        <group key={`p${i}`} position={[px * (ringR + 0.55), 0, pz * (ringR + 0.55)]}>
          <Cyl rt={0.14} rb={0.19} h={1.0} pos={[0, 0.5, 0]} color={C.stone} seg={10} />
          <Ball r={0.14} pos={[0, 1.07, 0]} color={C.gold} seg={10} />
        </group>
      ))}

      {/* torches on posts at the corners, angled toward the ring */}
      {TORCH_SPOTS.map(([sx, sz], i) => {
        const x = sx * (halfW - 0.9), z = sz * (halfD - 0.9);
        return (
          <group key={`t${i}`} position={[x, 0, z]}>
            <Cyl rt={0.09} rb={0.12} h={1.45} pos={[0, 0.72, 0]} color={C.woodDark} seg={8} />
            <Torch pos={[0, 1.6, 0]} rotY={Math.atan2(-x, -z)} />
          </group>
        );
      })}

      {/* standards on the approach side, facing whoever comes down from the gate */}
      {[-1, 1].map(s => (
        <group key={`b${s}`} position={[s * 4.7, 0, -halfD + 0.35]}>
          <Cyl rt={0.07} rb={0.1} h={3.9} pos={[0, 1.95, 0]} color={C.woodDark} seg={8} />
          <Ball r={0.11} pos={[0, 3.95, 0]} color={C.gold} seg={10} />
          <Banner pos={[0, 2.35, 0.08]} rotY={0} color={s < 0 ? C.crimson : C.emerald} w={1.0} h={2.1} />
        </group>
      ))}

      {/* practice dummies along the east kerb */}
      {[-3.0, 3.0].map(z => (
        <group key={`d${z}`} position={[5.0, 0, z]}>
          <Cyl rt={0.36} rb={0.42} h={0.14} pos={[0, 0.07, 0]} color={C.stoneDark} seg={12} />
          <Cyl rt={0.08} rb={0.09} h={1.5} pos={[0, 0.82, 0]} color={C.wood} seg={8} />
          <Box size={[1.05, 0.1, 0.1]} pos={[0, 1.36, 0]} color={C.woodDark} />
          <Box size={[0.36, 0.5, 0.24]} pos={[0, 1.1, 0]} color="#8A6A4A" />
          <Ball r={0.17} pos={[0, 1.62, 0]} color="#C9A227" seg={10} />
          <Box size={[0.26, 0.18, 0.02]} pos={[0, 1.12, 0.13]} color="#7A2E3A" cast={false} />
        </group>
      ))}

      {/* low benches for the audience, on the west kerb */}
      {[-2.1, 2.1].map(z => (
        <group key={`s${z}`} position={[-5.05, 0, z]}>
          <Box size={[0.55, 0.12, 2.0]} pos={[0, 0.52, 0]} color={C.stoneLight} />
          {[-0.75, 0.75].map(dz => <Box key={dz} size={[0.42, 0.46, 0.18]} pos={[0, 0.23, dz]} color={C.stone} />)}
        </group>
      ))}
    </group>
  );
}
