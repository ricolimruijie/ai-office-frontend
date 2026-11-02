/* Which character from the Quaternius pack to use. Files live in public/models/characters/<model>.glb (see scripts/optimize-assets.sh). */
export type CharacterModel = "Suit_Female" | "Doctor_Female_Young" | "Casual2_Female" | "Casual_Male" | "Casual3_Female" | "Worker_Male";
export type DeskStyle = "executive" | "lab" | "writer" | "backend" | "frontend" | "qa";

/* How a character looks in the 3D home. */
export interface Look {
  model: CharacterModel;
}

export interface AgentConfig {
  id: string;
  /** Personal name. Also the @mention handle, e.g. @nika. */
  name: string;
  /** Job position, e.g. "Product Manager". Also works as a mention, e.g. @productmanager. */
  position: string;
  /** One-line description of what the agent does. */
  role: string;
  color: string;
  tasks: string[];
  /** Which division (room) the agent sits in. Matches an id in divisions.json. */
  division: string;
  /** Appearance of the 3D character. */
  look: Look;
  /** Layout and style of the agent's gaming workstation. */
  desk: DeskStyle;
}

/* A division gets its own room. Level 0 is the ground floor, level 1 is the upper floor (reached by the staircase). */
export interface DivisionConfig {
  id: string;
  name: string;
  level: number;
  theme: "executive" | "library" | "lab" | "developers" | "meeting";
  /** A shared room that nobody sits in permanently, like the meeting room. It exists even with no agents assigned. */
  shared?: boolean;
}
