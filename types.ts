
export interface FieldMetadata {
  id: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'float' | 'price' | 'logic' | 'enum' | 'file' | 'sound';
  description: string;
  example: string;
  options?: string[];
  defaultValue?: string | number | boolean;
}

export interface SectionMetadata {
  id: string;
  title: string;
  description: string;
  fields: FieldMetadata[];
  isMulti?: boolean;
}

export interface ModInfoData {
  title: string;
  description: string;
  tags: string;
  minVersion: string;
  id: string;
  requiredMods: string;
  requiredModsMessage: string;
}

export interface UnitData {
  id: string;
  filename: string;
  [sectionId: string]: any;
}

export interface ModData {
  // Legacy support for single unit if needed, but refactored to Project
  [sectionId: string]: any;
}

export enum ActiveView {
  CORE = 'core',
  GRAPHICS = 'graphics',
  ATTACK = 'attack',
  MOVEMENT = 'movement',
  AI = 'ai',
  TURRETS = 'turrets',
  PROJECTILES = 'projectiles',
  ACTIONS = 'actions',
  ANIMATIONS = 'animations',
  CAN_BUILD = 'canBuilds',
  LEGS = 'legs',
  ATTACHMENTS = 'attachments',
  EFFECTS = 'effects',
  PLACEMENT_RULES = 'placementRules',
  RESOURCES = 'resources',
  DECALS = 'decals',
  MOD_INFO = 'mod_info'
}
