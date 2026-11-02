import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { chairPos, computeLayout } from "../../shared/layout";
import { Suspense } from "react";
import { Character, preloadCharacters } from "../characters/Character";
import { Familiars } from "../characters/Familiars";
import { LoungeBehavior } from "../characters/LoungeBehavior";
import { createMotion } from "../characters/motion";
import { AGENTS } from "../config/agents";
import { DIVISIONS } from "../config/divisions";
import { Desk } from "./desk/Desk";
import { DuelGround } from "./decor/DuelGround";
import { DuelVfx } from "./DuelVfx";
import { Lounge } from "./decor/Lounge";
import { RoomsDecor } from "./decor/Rooms";
import { RgbTicker } from "./desk/RgbTicker";
import { Building } from "./Building";
import { CameraRig } from "./CameraRig";
import { Environment } from "./Environment";
import { sceneState } from "./sceneState";
import { StairTower } from "./StairTower";
import { Lighting } from "./Lighting";
import { ModelRouter } from "./ModelRouter";
import { Pulses } from "./Pulses";
import { Roofs } from "./Roofs";
import { SelectionRing } from "./SelectionRing";
import { Sky } from "./Sky";
import { TagProjector } from "./TagProjector";

preloadCharacters(AGENTS);

export function OfficeCanvas() {
  const layout = useMemo(() => computeLayout(AGENTS, DIVISIONS), []);
  const motions = useMemo(() => layout.desks.map(d => { const c = chairPos(d); return createMotion(c.x, c.z, c.y); }), [layout]);

  return (
    <div id="stage">
      <Canvas shadows="percentage" flat dpr={[1, 1.75]} camera={{ fov: 35, near: 0.1, far: 700 }}
        onCreated={({ gl, camera, scene }) => { if (import.meta.env.DEV) Object.assign(window, { __gl: gl, __cam: camera, __scene: scene, __sceneState: sceneState }); }}>
        <fog attach="fog" args={["#BFC9E6", 120, 330]} />
        <Sky />
        <Lighting layout={layout} />
        <Environment layout={layout} />
        <Building layout={layout} />
        <RoomsDecor layout={layout} />
        {layout.lounge && <Lounge layout={layout} />}
        {layout.stairs && <StairTower layout={layout} />}
        <DuelGround layout={layout} />
        <Roofs layout={layout} />
        <RgbTicker />
        {AGENTS.map((a, i) => <Desk key={a.id} x={layout.desks[i].x} y={layout.desks[i].y} z={layout.desks[i].z} agentId={a.id} style={a.desk} />)}
        <Suspense fallback={null}>{AGENTS.map((a, i) => <Character key={a.id} agent={a} motion={motions[i]} />)}</Suspense>
        <ModelRouter layout={layout} />
        <SelectionRing />
        <Pulses layout={layout} />
        <Familiars layout={layout} motions={motions} />
        <DuelVfx layout={layout} motions={motions} />
        <LoungeBehavior layout={layout} motions={motions} />
        <CameraRig layout={layout} />
        <TagProjector />
      </Canvas>
    </div>
  );
}
