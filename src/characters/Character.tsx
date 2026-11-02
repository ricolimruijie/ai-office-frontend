import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { LoopOnce, LoopRepeat, type AnimationAction, type Group, type Mesh } from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { AgentConfig } from "../../shared/agents";
import { WALK_SPEED } from "../../shared/layout";
import { sceneState, setAnchor } from "../scene/sceneState";
import { useOfficeStore } from "../state/officeStore";
import { stepMotion, type RobotMotion } from "./motion";

const FADE = 0.25;
const CHAR_SCALE = 0.55;   // the pack models are about 3.3 units tall
const TAG_HEIGHT = 2.1;
const modelUrl = (model: string) => `/models/characters/${model}.glb`;

const easeAngle = (cur: number, target: number, k: number) => {
  let d = ((target - cur + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return cur + d * k;
};

interface Props { agent: AgentConfig; motion: RobotMotion }

/* A rigged, animated person from the Quaternius character pack. The clip follows what the character is doing
   (sitting, walking, carrying a letter, standing). Everything is read each frame, so it never re-renders. */
export function Character({ agent, motion }: Props) {
  const gltf = useGLTF(modelUrl(agent.look.model));
  const body = useMemo(() => {
    const c = cloneSkinned(gltf.scene) as Group;
    c.traverse(o => { if ((o as Mesh).isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    return c;
  }, [gltf.scene]);
  const root = useRef<Group>(null);
  const holder = useRef<Group>(null);
  const { actions } = useAnimations(gltf.animations, holder);
  const current = useRef<string>("");
  const select = useOfficeStore(s => s.select);

  useEffect(() => {
    sceneState.walkers.set(agent.id, motion);
    return () => { sceneState.walkers.delete(agent.id); };
  }, [agent.id, motion]);

  const play = (name: string, once: boolean) => {
    if (current.current === name) return;
    const next: AnimationAction | null | undefined = actions[name];
    if (!next) return;
    const prev = actions[current.current];
    next.reset();
    next.setLoop(once ? LoopOnce : LoopRepeat, once ? 1 : Infinity);
    next.clampWhenFinished = true;
    next.fadeIn(FADE).play();
    prev?.fadeOut(FADE);
    current.current = name;
  };

  useFrame((_, rawDt) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(rawDt, 0.1);
    const a = useOfficeStore.getState().agents[agent.id];
    const walking = stepMotion(motion, dt, WALK_SPEED * motion.speedMul) || motion.pose === "walking";

    if (walking) play(motion.carry ? "Walk_Carry" : motion.speedMul > 1.3 ? "Run" : "Walk", false);
    else if (motion.pose === "seated") play("SitDown", true);
    else play("Idle", false);

    const since = (performance.now() - a.statusSince) / 1000;
    const hop = a.status === "done" && since < 1.3 && motion.pose === "seated" ? Math.abs(Math.sin(since * 7)) * 0.04 : 0;
    g.position.set(motion.x, motion.y + hop, motion.z);
    g.rotation.y = easeAngle(g.rotation.y, motion.heading, 1 - Math.exp(-13 * dt));
    setAnchor(agent.id, motion.x, motion.y + TAG_HEIGHT, motion.z);
  });

  return (
    <group ref={root} position={[motion.x, motion.y, motion.z]} onClick={e => { e.stopPropagation(); select(agent.id); }}>
      <group ref={holder} scale={CHAR_SCALE} rotation={[0, Math.PI, 0]}><primitive object={body} /></group>
    </group>
  );
}

export const preloadCharacters = (agents: AgentConfig[]) => agents.forEach(a => useGLTF.preload(modelUrl(a.look.model)));
