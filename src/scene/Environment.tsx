import { useMemo } from "react";
import type { Layout } from "../../shared/layout";
import { Ball, Box, Cone, Cyl, TBox } from "./parts";
import { rng } from "./rng";
import { TEX } from "./textures";

function Pine({ x, z, s }: { x: number; z: number; s: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <Cyl rt={0.18} rb={0.26} h={1.6} pos={[0, 0.8, 0]} color="#4A3426" seg={6} />
      {[0, 1, 2, 3].map(i => <Cone key={i} r={1.9 - i * 0.38} h={2.2} pos={[0, 2.0 + i * 1.3, 0]} color={i % 2 ? "#1F4D33" : "#2A5E3D"} seg={8} />)}
    </group>
  );
}

function Oak({ x, z, s }: { x: number; z: number; s: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <Cyl rt={0.22} rb={0.34} h={2.4} pos={[0, 1.2, 0]} color="#5A4332" seg={6} />
      <Ball r={1.9} pos={[0, 3.6, 0]} color="#4F8A45" scale={[1.15, 0.95, 1.15]} seg={9} />
      <Ball r={1.3} pos={[1.1, 3.0, 0.4]} color="#5E9A50" seg={8} />
      <Ball r={1.2} pos={[-1.0, 3.2, -0.5]} color="#46783E" seg={8} />
    </group>
  );
}

function Bush({ x, z, s, tone }: { x: number; z: number; s: number; tone: number }) {
  const col = ["#3F7A3B", "#4B8A44", "#356B34"][tone % 3];
  return (
    <group position={[x, 0, z]} scale={s}>
      <Ball r={0.9} pos={[0, 0.65, 0]} color={col} scale={[1.2, 0.9, 1.2]} seg={8} />
      <Ball r={0.65} pos={[0.8, 0.5, 0.2]} color={col} seg={7} />
      <Ball r={0.6} pos={[-0.7, 0.45, -0.3]} color={col} seg={7} />
    </group>
  );
}

/* The grounds: a lawn, and a thick belt of bushes and trees all the way round the castle. Nothing else is outdoors. */
export function Environment({ layout }: { layout: Layout }) {
  const s = layout.site;
  const cx = (s.minX + s.maxX) / 2, cz = (s.minZ + s.maxZ) / 2;
  const items = useMemo(() => {
    const r = rng(21), out: { kind: "bush" | "oak" | "pine"; x: number; z: number; s: number; tone: number }[] = [];
    const x0 = s.minX - 7, x1 = s.maxX + 7, z0 = s.minZ - 6, z1 = s.maxZ + 9;   // inner edge of the belt
    const ring = (inset: number, step: number, kind: (i: number) => "bush" | "oak" | "pine", size: () => number) => {
      const a = x0 - inset, b = x1 + inset, c = z0 - inset, d = z1 + inset;
      const put = (x: number, z: number, i: number) => out.push({ kind: kind(i), x: x + (r() - 0.5) * 1.2, z: z + (r() - 0.5) * 1.2, s: size(), tone: Math.floor(r() * 3) });
      let i = 0;
      for (let x = a; x <= b; x += step) { put(x, c, i++); put(x, d, i++); }
      for (let z = c + step; z < d; z += step) { put(a, z, i++); put(b, z, i++); }
    };
    ring(0, 2.2, () => "bush", () => 1.0 + r() * 0.7);                       // hedge of bushes hugging the grounds
    ring(3.2, 3.4, i => (i % 3 === 0 ? "oak" : "bush"), () => 0.9 + r() * 0.6);
    ring(7, 4.6, i => (i % 2 ? "pine" : "oak"), () => 1.0 + r() * 0.8);       // trees behind
    ring(12, 6.5, () => "pine", () => 1.3 + r() * 1.0);
    return out;
  }, [s.minX, s.maxX, s.minZ, s.maxZ]);

  return (
    <group>
      <TBox size={[900, 0.2, 900]} pos={[cx, -0.16, cz]} tex={TEX.grass} tile={14} color="#9FC48A" cast={false} />
      <Box size={[s.maxX - s.minX + 14, 0.04, s.maxZ - s.minZ + 24]} pos={[cx, -0.05, cz + 4]} color="#8DB57A" cast={false} />
      {items.map((t, i) => t.kind === "bush" ? <Bush key={i} x={t.x} z={t.z} s={t.s} tone={t.tone} /> : t.kind === "oak" ? <Oak key={i} x={t.x} z={t.z} s={t.s} /> : <Pine key={i} x={t.x} z={t.z} s={t.s} />)}
    </group>
  );
}
