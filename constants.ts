
import { SectionMetadata } from './types';

export const MOD_INFO_SECTION: SectionMetadata = {
  id: 'mod_info',
  title: 'Mod Manifest',
  description: 'Configuration for mod-info.txt used by the game browser.',
  fields: [
    { id: 'title', label: 'Mod Title', type: 'string', description: 'Display name of the mod.', example: 'My Awesome Mod' },
    { id: 'description', label: 'Mod Description', type: 'string', description: 'Brief overview of what the mod does.', example: 'Adds new experimental units.' },
    { id: 'id', label: 'Internal ID', type: 'string', description: 'Unique ID for dependency tracking.', example: 'com.user.coolmod' },
    { id: 'tags', label: 'Tags', type: 'string', description: 'Comma separated tags (e.g. units, sample).', example: 'units, tank' },
    { id: 'minVersion', label: 'Min Version', type: 'string', description: 'Minimum game version required.', example: '1.15' },
    { id: 'requiredMods', label: 'Required Mods', type: 'string', description: 'List of mod IDs this depends on.', example: 'base-expansion' },
    { id: 'requiredModsMessage', label: 'Missing Dependency Message', type: 'string', description: 'Message shown if dependencies are missing.', example: 'Please install the Base Expansion mod.' }
  ]
};

export const MOD_SECTIONS: SectionMetadata[] = [
  {
    id: 'core',
    title: 'Core Unit Functions',
    description: 'Basic unit characteristics such as HP, price, and mass.',
    fields: [
      { id: 'name', label: 'Unit Name', type: 'string', description: 'Internal unit name for identification.', example: 'customTank1' },
      { id: 'maxHp', label: 'Max HP', type: 'number', description: 'Maximum health points.', example: '200' },
      { id: 'price', label: 'Price', type: 'price', description: 'Cost to build (credits, resources).', example: '500, gold=10' },
      { id: 'mass', label: 'Mass', type: 'number', description: 'Weight affects collisions.', example: '3000' },
      { id: 'radius', label: 'Selection Radius', type: 'number', description: 'Circular area for selection.', example: '20' },
      { id: 'techLevel', label: 'Tech Level', type: 'enum', options: ['1', '2', '3'], description: 'Tech tier of the unit.', example: '1' },
      { id: 'buildSpeed', label: 'Build Speed', type: 'string', description: 'Time to build (e.g. 3s or 0.01).', example: '3s' },
      { id: 'isBio', label: 'Is Biological?', type: 'boolean', description: 'Affects sounds and splats.', example: 'false' },
      { id: 'isBuilder', label: 'Is Builder?', type: 'boolean', description: 'Required for placing buildings.', example: 'false' },
      { id: 'soundOnAttackOrder', label: 'Attack Sound', type: 'sound', description: 'Played when unit is ordered to attack.', example: 'tankAttack.wav' },
      { id: 'soundOnMoveOrder', label: 'Move Sound', type: 'sound', description: 'Played when unit is ordered to move.', example: 'tankMove.wav' },
      { id: 'soundOnNewSelection', label: 'Select Sound', type: 'sound', description: 'Played when unit is selected.', example: 'tankSelect.wav' },
      { id: 'soundOnDeath', label: 'Death Sound', type: 'sound', description: 'Played when unit is destroyed.', example: 'explosion.wav' }
    ]
  },
  {
    id: 'graphics',
    title: 'Graphics & Visuals',
    description: 'Configuration for body sprites, shadows, and layers.',
    fields: [
      { id: 'image', label: 'Body Image', type: 'file', description: 'Path to unit body sprite.', example: 'body.png' },
      { id: 'total_frames', label: 'Total Frames', type: 'number', description: 'Number of frames for animation.', example: '1' },
      { id: 'image_wreak', label: 'Wreck Image', type: 'file', description: 'Image used when unit dies.', example: 'wreck.png' },
      { id: 'imageScale', label: 'Image Scale', type: 'float', description: 'Multiplier for image size.', example: '1.0' },
      { id: 'drawLayer', label: 'Draw Layer', type: 'enum', options: ['ground', 'ground2', 'air', 'top', 'underwater'], description: 'Rendering priority.', example: 'ground' },
      { id: 'teamColoringMode', label: 'Team Coloring', type: 'enum', options: ['pureGreen', 'hueAdd', 'hueShift', 'disabled'], description: 'Pixel treatment for team colors.', example: 'pureGreen' }
    ]
  },
  {
    id: 'attack',
    title: 'Attack Permissions',
    description: 'Global characteristics for how the unit targets enemies.',
    fields: [
      { id: 'canAttack', label: 'Can Attack?', type: 'boolean', description: 'Allow or disallow all attacks.', example: 'true' },
      { id: 'canAttackFlyingUnits', label: 'Attack Air?', type: 'boolean', description: 'Target flying units.', example: 'true' },
      { id: 'canAttackLandUnits', label: 'Attack Land?', type: 'boolean', description: 'Target ground units.', example: 'true' },
      { id: 'canAttackUnderwaterUnits', label: 'Attack Water?', type: 'boolean', description: 'Target underwater units.', example: 'false' },
      { id: 'maxAttackRange', label: 'Max Range', type: 'number', description: 'Maximum targeting distance.', example: '250' },
      { id: 'shootDelay', label: 'Shoot Delay', type: 'string', description: 'Interval between shots.', example: '50' }
    ]
  },
  {
    id: 'movement',
    title: 'Movement Characteristics',
    description: 'Speed, acceleration, and terrain types.',
    fields: [
      { id: 'movementType', label: 'Movement Type', type: 'enum', options: ['NONE', 'LAND', 'AIR', 'WATER', 'HOVER', 'BUILDING', 'OVER_CLIFF'], description: 'Terrain compatibility.', example: 'LAND' },
      { id: 'moveSpeed', label: 'Move Speed', type: 'float', description: 'Maximum movement velocity.', example: '1.2' },
      { id: 'moveAccelerationSpeed', label: 'Acceleration', type: 'float', description: 'Speed increase per frame.', example: '0.07' },
      { id: 'maxTurnSpeed', label: 'Turn Speed', type: 'float', description: 'Top rotation speed.', example: '4.0' },
      { id: 'targetHeight', label: 'Target Height', type: 'number', description: 'Operating altitude.', example: '0' }
    ]
  },
  {
    id: 'ai',
    title: 'AI Behavior',
    description: 'How computer-controlled teams use this unit.',
    fields: [
      { id: 'useAsBuilder', label: 'Use as Builder?', type: 'boolean', description: 'AI uses this to build structures.', example: 'false' },
      { id: 'useAsTransport', label: 'Use as Transport?', type: 'boolean', description: 'AI uses this to move units.', example: 'true' },
      { id: 'buildPriority', label: 'Build Priority', type: 'float', description: 'Likelihood of AI building this (0-1).', example: '0.8' },
      { id: 'maxGlobal', label: 'Max Global Limit', type: 'number', description: 'Maximum amount for AI per map.', example: '50' }
    ]
  }
];

export const MULTI_SECTIONS: SectionMetadata[] = [
  {
    id: 'turret',
    title: 'Turret',
    description: 'Turrets fire projectiles with different traits.',
    fields: [
      { id: 'id', label: 'Turret ID', type: 'string', description: 'Unique name for this turret.', example: 'gun1' },
      { id: 'x', label: 'X Position', type: 'number', description: 'Horizontal offset.', example: '0' },
      { id: 'y', label: 'Y Position', type: 'number', description: 'Vertical offset.', example: '0' },
      { id: 'projectile', label: 'Projectile ID', type: 'string', description: 'The projectile fired by this turret.', example: '1' },
      { id: 'turnSpeed', label: 'Turn Speed', type: 'float', description: 'Rotation speed.', example: '2.0' },
      { id: 'shoot_sound', label: 'Shoot Sound', type: 'sound', description: 'Sound played when firing.', example: 'cannon_fire.wav' },
      { id: 'shoot_sound_vol', label: 'Shoot Volume', type: 'float', description: 'Volume level (0-1).', example: '0.5' },
      { id: 'canShoot', label: 'Can Shoot?', type: 'boolean', description: 'If false, used for visuals/build.', example: 'true' },
      { id: 'invisible', label: 'Is Invisible?', type: 'boolean', description: 'Hide the turret sprite.', example: 'false' }
    ],
    isMulti: true
  },
  {
    id: 'projectile',
    title: 'Projectile',
    description: 'Defines the damage and flight behavior.',
    fields: [
      { id: 'id', label: 'Projectile ID', type: 'string', description: 'Unique identifier.', example: '1' },
      { id: 'directDamage', label: 'Direct Damage', type: 'number', description: 'Damage on hit.', example: '30' },
      { id: 'life', label: 'Life (Ticks)', type: 'number', description: 'Lifespan of projectile.', example: '200' },
      { id: 'speed', label: 'Speed', type: 'float', description: 'Flight velocity.', example: '5.0' },
      { id: 'image', label: 'Image', type: 'file', description: 'Projectile sprite.', example: 'bullet.png' },
      { id: 'areaDamage', label: 'Area Damage', type: 'number', description: 'Splash damage.', example: '0' },
      { id: 'areaRadius', label: 'Area Radius', type: 'number', description: 'Splash radius.', example: '0' }
    ],
    isMulti: true
  },
  {
    id: 'action',
    title: 'Action',
    description: 'Dynamic abilities triggered by players.',
    fields: [
      { id: 'id', label: 'Action ID', type: 'string', description: 'Unique identifier.', example: 'repair' },
      { id: 'text', label: 'Button Text', type: 'string', description: 'Label on the UI button.', example: 'Repair Self' },
      { id: 'description', label: 'Tool-tip', type: 'string', description: 'Hover description.', example: 'Fix internal systems.' },
      { id: 'price', label: 'Price', type: 'price', description: 'Cost to trigger.', example: 'credits=500' },
      { id: 'playSoundAtUnit', label: 'Unit Sound', type: 'sound', description: 'Sound played at the unit when action is used.', example: 'repair.wav' },
      { id: 'playSoundGlobally', label: 'Global Sound', type: 'sound', description: 'Sound played to everyone.', example: 'alert.wav' },
      { id: 'autoTrigger', label: 'Auto Trigger Condition', type: 'logic', description: 'Logic Boolean for auto activation.', example: 'if self.hp() < 100' },
      { id: 'convertTo', label: 'Convert To', type: 'string', description: 'Transforms unit into another.', example: 'upgradedTank' }
    ],
    isMulti: true
  },
  {
    id: 'animation',
    title: 'Animation',
    description: 'Define frame-by-frame movement for body, turrets, and legs.',
    fields: [
      { id: 'id', label: 'Animation ID', type: 'string', description: 'Name of the animation.', example: 'idle' },
      { id: 'onActions', label: 'Trigger Actions', type: 'string', description: 'When this animation plays (e.g. idle, move, attack).', example: 'move, idle' },
      { id: 'blendIn', label: 'Blend In (s)', type: 'float', description: 'Time to transition into animation.', example: '0.1' },
      { id: 'blendOut', label: 'Blend Out (s)', type: 'float', description: 'Time to transition out.', example: '0.1' },
      { id: 'pingPong', label: 'Ping-Pong?', type: 'boolean', description: 'Reverses animation at the end.', example: 'true' },
      { id: 'Keyframes', label: 'Keyframes (Raw)', type: 'logic', description: 'Define time-based frames (e.g. body_0.1s: {frame: 0}).', example: 'body_0s: {frame:0}\nbody_0.5s: {frame:4}' }
    ],
    isMulti: true
  },
  {
    id: 'canBuild',
    title: 'Build Menu',
    description: 'Build queues for creating new units.',
    fields: [
      { id: 'name', label: 'Unit ID', type: 'string', description: 'Unit identifier to build.', example: 'heavyTank' },
      { id: 'pos', label: 'UI Position', type: 'float', description: 'Order in build menu.', example: '1.0' },
      { id: 'tech', label: 'Tech Tier', type: 'number', description: 'Required tech level.', example: '1' },
      { id: 'forceNano', label: 'Force Nano?', type: 'boolean', description: 'Build as if structure.', example: 'false' },
      { id: 'isVisible', label: 'Is Visible?', type: 'logic', description: 'Condition to show button.', example: 'if self.hp() > 50' },
      { id: 'isLocked', label: 'Is Locked?', type: 'logic', description: 'Condition to disable button.', example: 'if not self.energy() > 10' }
    ],
    isMulti: true
  },
  {
    id: 'leg',
    title: 'Leg / Arm',
    description: 'Moveable cosmetics for mechs, infantry etc.',
    fields: [
      { id: 'x', label: 'X Foot Pos', type: 'float', description: 'Foot position horizontal.', example: '10' },
      { id: 'y', label: 'Y Foot Pos', type: 'float', description: 'Foot position vertical.', example: '10' },
      { id: 'attach_x', label: 'Attach X', type: 'float', description: 'Join point horizontal.', example: '5' },
      { id: 'attach_y', label: 'Attach Y', type: 'float', description: 'Join point vertical.', example: '5' },
      { id: 'rotateSpeed', label: 'Rotate Speed', type: 'float', description: 'Leg rotation velocity.', example: '2.0' },
      { id: 'heightSpeed', label: 'Height Speed', type: 'float', description: 'Vertical movement velocity.', example: '1.0' },
      { id: 'moveSpeed', label: 'Move Speed', type: 'float', description: 'Walking movement speed.', example: '2.5' },
      { id: 'image_leg', label: 'Leg Image', type: 'file', description: 'Leg sprite asset.', example: 'leg.png' },
      { id: 'image_foot', label: 'Foot Image', type: 'file', description: 'Foot sprite asset.', example: 'foot.png' }
    ],
    isMulti: true
  },
  {
    id: 'attachment',
    title: 'Attachment',
    description: 'Units stacked onto original to make compound units.',
    fields: [
      { id: 'id', label: 'Slot ID', type: 'string', description: 'Name of attachment slot.', example: 'cannon_mount' },
      { id: 'x', label: 'X Position', type: 'float', description: 'Offset horizontal.', example: '0' },
      { id: 'y', label: 'Y Position', type: 'float', description: 'Offset vertical.', example: '10' },
      { id: 'height', label: 'Height', type: 'float', description: 'Elevation offset.', example: '5' },
      { id: 'idleDir', label: 'Idle Dir', type: 'number', description: 'Facing direction.', example: '0' },
      { id: 'isVisible', label: 'Is Visible?', type: 'boolean', description: 'Show the attachment.', example: 'true' },
      { id: 'canAttack', label: 'Can Attack?', type: 'boolean', description: 'Attachment can fire.', example: 'true' },
      { id: 'onCreateSpawnUnitOf', label: 'Unit Type', type: 'string', description: 'Unit to spawn in slot.', example: 'smallTurret' },
      { id: 'prioritizeParentsMainTarget', label: 'Share Target?', type: 'boolean', description: 'Target parent\'s enemy.', example: 'true' }
    ],
    isMulti: true
  },
  {
    id: 'effect',
    title: 'Effect',
    description: 'Visual effects spawned by the unit.',
    fields: [
      { id: 'id', label: 'Effect ID', type: 'string', description: 'Unique name.', example: 'smoke' },
      { id: 'life', label: 'Lifespan', type: 'float', description: 'Time till removal.', example: '100' },
      { id: 'image', label: 'Effect Image', type: 'file', description: 'Sprite asset.', example: 'puff.png' },
      { id: 'scaleTo', label: 'Scale To', type: 'float', description: 'End scale.', example: '2.0' },
      { id: 'scaleFrom', label: 'Scale From', type: 'float', description: 'Start scale.', example: '1.0' },
      { id: 'color', label: 'Tint Color', type: 'string', description: 'Hex color code.', example: '#FFFFFF' },
      { id: 'fadeInTime', label: 'Fade In (s)', type: 'float', description: 'Alpha transition.', example: '0.2' },
      { id: 'xSpeedRelative', label: 'Speed X', type: 'float', description: 'Horizontal drift.', example: '0.5' },
      { id: 'ySpeedRelative', label: 'Speed Y', type: 'float', description: 'Vertical drift.', example: '0.5' }
    ],
    isMulti: true
  },
  {
    id: 'placementRule',
    title: 'Placement Rule',
    description: 'Allows creation of rules for buildings.',
    fields: [
      { id: 'id', label: 'Rule ID', type: 'string', description: 'Unique name.', example: 'nearFactory' },
      { id: 'searchTags', label: 'Search Tags', type: 'string', description: 'Find units with tags.', example: 'factory' },
      { id: 'searchTeam', label: 'Search Team', type: 'enum', options: ['own', 'neutral', 'ally', 'enemy', 'any'], description: 'Who to look for.', example: 'own' },
      { id: 'searchDistance', label: 'Distance', type: 'number', description: 'Radius to check.', example: '500' },
      { id: 'minCount', label: 'Min Units', type: 'number', description: 'Required minimum.', example: '1' },
      { id: 'maxCount', label: 'Max Units', type: 'number', description: 'Required maximum.', example: '10' },
      { id: 'cannotPlaceMessage', label: 'Error Message', type: 'string', description: 'Shown if failed.', example: 'Requires a factory nearby.' }
    ],
    isMulti: true
  },
  {
    id: 'resource',
    title: 'Local Resource',
    description: 'Local resource used by units (like ammo).',
    fields: [
      { id: 'id', label: 'Resource ID', type: 'string', description: 'Internal name.', example: 'ammo' },
      { id: 'displayName', label: 'Display Name', type: 'string', description: 'Visible name.', example: 'Missiles' },
      { id: 'displayNameShort', label: 'Short Name', type: 'string', description: 'Compact label.', example: 'Msl' },
      { id: 'hidden', label: 'Is Hidden?', type: 'boolean', description: 'Hide from player UI.', example: 'false' }
    ],
    isMulti: true
  },
  {
    id: 'decal',
    title: 'Decal',
    description: 'Versatile graphics stacked onto the unit.',
    fields: [
      { id: 'image', label: 'Decal Image', type: 'file', description: 'Sprite asset.', example: 'logo.png' },
      { id: 'layer', label: 'Layer', type: 'enum', options: ['shadow', 'beforeBody', 'afterBody', 'onTop', 'beforeUI'], description: 'Stacking priority.', example: 'onTop' },
      { id: 'order', label: 'Sort Order', type: 'float', description: 'Sub-layer priority.', example: '1.0' },
      { id: 'xOffsetRelative', label: 'X Offset', type: 'float', description: 'Horizontal shift.', example: '0' },
      { id: 'yOffsetRelative', label: 'Y Offset', type: 'float', description: 'Vertical shift.', example: '0' },
      { id: 'isVisible', label: 'Is Visible?', type: 'logic', description: 'Condition to draw.', example: 'if self.hp() > 0' }
    ],
    isMulti: true
  }
];
