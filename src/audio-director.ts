import type { Run } from './survival';
import type { VehicleKind } from './vehicles';
import { activeVehicle } from './survival';
import { itemBalance } from './config';

const files = import.meta.glob([
  '../project-reference/sfx/elevenlabs-2026-10-29/*.mp3',
  '!../project-reference/sfx/elevenlabs-2026-10-29/water_entry_splash.mp3',
  '!../project-reference/sfx/elevenlabs-2026-10-29/water_roll_loop.mp3',
  '!../project-reference/sfx/elevenlabs-2026-10-29/water_roll_*.mp3',
  '../project-reference/sfx/owner-voices-2026-11-04/*.mp3',
  '../project-reference/sfx/elevenlabs-rain-2026-11-04/*.mp3',
  '../project-reference/sfx/elevenlabs-storm-2026-11-05/*.mp3',
  '../project-reference/sfx/elevenlabs-water-2026-11-06/*.mp3',
  '../project-reference/sfx/owner-music-2026-11-05/*.mp3',
  '../project-reference/sfx/elevenlabs-world-2026-11-06/*.mp3',
  '../project-reference/sfx/elevenlabs-traffic-2026-11-06/*.mp3',
  '../project-reference/sfx/elevenlabs-rewards-2026-11-06/*.mp3',
  '../project-reference/sfx/elevenlabs-pothole-2026-11-06/*.mp3',
  '../project-reference/sfx/elevenlabs-interactions-2026-11-06/*.mp3',
  '../project-reference/sfx/elevenlabs-train-pothole-2026-11-06/*.mp3',
  '../project-reference/sfx/owner-kick-voices-2026-11-06/*.mp3',
  '../project-reference/sfx/elevenlabs-indicator-2026-11-07/*.mp3',
  '../project-reference/sfx/owner-officer-voices-2026-11-07/*.mp3',
  '../project-reference/sfx/owner-vendor-voices-2026-11-07/*.mp3',
  '../project-reference/sfx/owner-impact-foley-2026-11-07/*.mp3',
  '../project-reference/sfx/owner-vehicle-impacts-2026-11-07/*.mp3',
  '../project-reference/sfx/elevenlabs-ui-2026-11-07/*.mp3',
  '../project-reference/sfx/owner-pickup-voices-2026-11-07/*.mp3',
], { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const generatedRoot = '../project-reference/sfx/elevenlabs-2026-10-29/';
const voiceRoot = '../project-reference/sfx/owner-voices-2026-11-04/';
const kickVoiceRoot = '../project-reference/sfx/owner-kick-voices-2026-11-06/';
const rainRoot = '../project-reference/sfx/elevenlabs-rain-2026-11-04/';
const stormRoot = '../project-reference/sfx/elevenlabs-storm-2026-11-05/';
const waterRoot = '../project-reference/sfx/elevenlabs-water-2026-11-06/';
const musicRoot = '../project-reference/sfx/owner-music-2026-11-05/';
const worldRoot = '../project-reference/sfx/elevenlabs-world-2026-11-06/';
const trafficRoot = '../project-reference/sfx/elevenlabs-traffic-2026-11-06/';
const rewardRoot = '../project-reference/sfx/elevenlabs-rewards-2026-11-06/';
const potholeRoot = '../project-reference/sfx/elevenlabs-pothole-2026-11-06/';
const interactionRoot = '../project-reference/sfx/elevenlabs-interactions-2026-11-06/';
const revisionRoot = '../project-reference/sfx/elevenlabs-train-pothole-2026-11-06/';
const indicatorRoot = '../project-reference/sfx/elevenlabs-indicator-2026-11-07/';
const officerVoiceRoot = '../project-reference/sfx/owner-officer-voices-2026-11-07/';
const vendorVoiceRoot = '../project-reference/sfx/owner-vendor-voices-2026-11-07/';
const impactFoleyRoot = '../project-reference/sfx/owner-impact-foley-2026-11-07/';
const vehicleImpactRoot = '../project-reference/sfx/owner-vehicle-impacts-2026-11-07/';
const uiEffectsRoot = '../project-reference/sfx/elevenlabs-ui-2026-11-07/';
const ownerPickupRoot = '../project-reference/sfx/owner-pickup-voices-2026-11-07/';
const ownerPickupNames = ['pickup/owner_pickup_01', 'pickup/owner_pickup_02',
  'pickup/owner_pickup_03', 'pickup/owner_pickup_04'];
const vehicleImpactNames = ['light_01', 'light_02', 'light_03', 'medium_01', 'medium_02', 'medium_03',
  'heavy_01', 'heavy_02', 'heavy_03'].map(name => `vehicle-impact/${name}`);
const vehicleImpactGain: Record<string, number> = {
  'vehicle-impact/light_01': 1.1, 'vehicle-impact/light_02': .8, 'vehicle-impact/light_03': 1.45,
  'vehicle-impact/medium_01': .85, 'vehicle-impact/medium_02': 1.35, 'vehicle-impact/medium_03': 1.6,
  'vehicle-impact/heavy_01': 1, 'vehicle-impact/heavy_02': .9, 'vehicle-impact/heavy_03': 1.05,
};
const impactFoleyNames = ['foley/person_thud_01', 'foley/person_thud_02', 'foley/person_thud_03',
  'foley/crate_thud_01', 'foley/crate_thud_02'];
// Skip the measured lead-in so the impact transient lands with the collision frame.
const impactFoleyOffset: Record<string, number> = {
  'foley/person_thud_01': .09, 'foley/person_thud_02': .11, 'foley/person_thud_03': .24,
  'foley/crate_thud_01': .08, 'foley/crate_thud_02': .16,
};
const revisionCues: Record<string, string> = {
  'road/pothole_rattle_light_c.wav': 'pothole_light_c.mp3',
  'road/pothole_rattle_light_d.wav': 'pothole_light_d.mp3',
  'road/pothole_rattle_medium_c.wav': 'pothole_medium_c.mp3',
  'road/pothole_rattle_medium_d.wav': 'pothole_medium_d.mp3',
  'road/pothole_rattle_heavy_c.wav': 'pothole_heavy_c.mp3',
  'road/pothole_rattle_heavy_d.wav': 'pothole_heavy_d.mp3',
  'train/horn_approach': 'train_horn_approach.mp3',
  'train/crossing_loop': 'train_wheels_clack_loop.mp3',
};
const interactionCues: Record<string, string> = {
  'interaction-v2/passenger_hit.wav': 'person_impact_a.mp3',
  'interaction-v2/passenger_hit_alt.wav': 'person_impact_b.mp3',
  'interaction-v2/vendor_hit.wav': 'vendor_cart_impact_a.mp3',
  'interaction-v2/vendor_hit_alt.wav': 'vendor_cart_impact_b.mp3',
  'control/indicator_tick': 'indicator_tick.mp3',
};
const potholeCues: Record<string, string> = {
  'road/pothole_rattle_light.wav': 'pothole_light_a.mp3',
  'road/pothole_rattle_light_alt.wav': 'pothole_light_b.mp3',
  'road/pothole_rattle_medium.wav': 'pothole_medium_a.mp3',
  'road/pothole_rattle_medium_alt.wav': 'pothole_medium_b.mp3',
  'road/pothole_rattle_heavy.wav': 'pothole_heavy_a.mp3',
  'road/pothole_rattle_heavy_alt.wav': 'pothole_heavy_b.mp3',
};
const rewardCues: Record<string, string> = {
  'item/fuel_pickup.wav': 'fuel_pickup_rise.mp3',
  'item/repair_pickup.wav': 'repair_pickup_rise.mp3',
  'pickup_01.wav': 'passenger_pickup_rise.mp3',
  'ui-modern/menu_select_a.wav': 'ui_soft_select.mp3',
  'ui-modern/help_open_a.wav': 'ui_soft_select.mp3',
  'ui-modern/card_open_a.wav': 'ui_soft_select.mp3',
  'ui-modern/shop_category_a.wav': 'ui_soft_select.mp3',
  'ui-modern/toggle_on_a.wav': 'ui_soft_select.mp3',
  'ui-modern/menu_back_a.wav': 'ui_soft_back.mp3',
  'ui-modern/card_dismiss_a.wav': 'ui_soft_back.mp3',
  'ui-modern/toggle_off_a.wav': 'ui_soft_back.mp3',
  'ui-modern/shop_enter_a.wav': 'ui_shop_open.mp3',
  'ui-modern/purchase_fail_a.wav': 'ui_purchase_fail.mp3',
  'ui-modern/pause_a.wav': 'ui_pause.mp3',
  'ui-modern/resume_a.wav': 'ui_resume.mp3',
  'ui-modern/restart_a.wav': 'ui_restart.mp3',
};
const waterCues: Record<string, string> = {
  'road/water_tire_light_loop.wav': 'water_light_loop.mp3',
  'road/water_tire_medium_loop.wav': 'water_medium_loop.mp3',
  'road/water_tire_heavy_loop.wav': 'water_heavy_loop.mp3',
};
const generated: Record<string, string> = {
  'road/water_entry_skim.wav': 'water_entry_skim.mp3',
  'road/water_entry_wash.wav': 'water_entry_wash.mp3',
  'road/water_entry_heavy.wav': 'water_entry_heavy.mp3',
  'road/water_entry_skim_alt.wav': 'water_entry_skim_alt.mp3',
  'road/water_entry_skim_grit.wav': 'water_entry_skim_grit.mp3',
  'road/water_entry_wash_alt.wav': 'water_entry_wash_alt.mp3',
  'road/water_entry_wash_ripple.wav': 'water_entry_wash_ripple.mp3',
  'road/water_entry_heavy_alt.wav': 'water_entry_heavy_alt.mp3',
  'road/water_entry_heavy_surge.wav': 'water_entry_heavy_surge.mp3',
  'road/water_exit_spray.wav': 'water_exit_spray.mp3',
  'road/pothole_rattle_light.wav': 'pothole_light.mp3',
  'road/pothole_rattle_light_alt.wav': 'pothole_light_alt.mp3',
  'road/pothole_rattle_heavy.wav': 'pothole_heavy.mp3',
  'road/pothole_rattle_heavy_alt.wav': 'pothole_heavy_alt.mp3',
  'interaction-v2/collision_light.wav': 'collision_light.mp3',
  'interaction-v2/collision_light_alt.wav': 'collision_light_alt.mp3',
  'interaction-v2/collision_medium.wav': 'collision_medium.mp3',
  'interaction-v2/collision_medium_alt.wav': 'collision_medium_alt.mp3',
  'interaction-v2/collision_heavy.wav': 'collision_heavy.mp3',
  'interaction-v2/collision_heavy_alt.wav': 'collision_heavy_alt.mp3',
  'interaction-v2/cargo_crate_hit.wav': 'cargo_crate_hit.mp3',
  'interaction-v2/cargo_crate_hit_alt.wav': 'cargo_crate_hit_alt.mp3',
  'interaction-v2/cargo_barrel_hit.wav': 'cargo_barrel_hit.mp3',
  'interaction-v2/cargo_barrel_hit_alt.wav': 'cargo_barrel_hit_alt.mp3',
  'interaction-v2/vendor_hit.wav': 'vendor_cart_hit.mp3',
  'interaction-v2/vendor_hit_alt.wav': 'vendor_cart_hit_alt.mp3',
  'interaction-v2/passenger_hit.wav': 'pedestrian_hit.mp3',
  'interaction-v2/passenger_hit_alt.wav': 'pedestrian_hit_alt.mp3',
  'interaction-v2/train_pass.wav': 'train_hit.mp3',
  'interaction-v2/barrier_hit.wav': 'barrier_hit.mp3',
  'interaction-v2/barrier_hit_alt.wav': 'barrier_hit_alt.mp3',
  'interaction-v2/ambulance_hit.wav': 'ambulance_hit.mp3',
  'interaction-v2/ambulance_hit_alt.wav': 'ambulance_hit_alt.mp3',
  'ambience/wind_loop.wav': 'wind_road_loop.mp3',
  'ambience/wind_soft_loop.wav': 'wind_road_soft_loop.mp3',
  'ambience/wet_road_loop.wav': 'wet_tire_loop.mp3',
  'engine-v2/bike_texture_loop.wav': 'engine_bike_texture_loop.mp3',
  'engine-v2/car_texture_loop.wav': 'engine_car_texture_loop.mp3',
  'engine-v2/heavy_texture_loop.wav': 'engine_heavy_texture_loop.mp3',
  'vehicle/coast.wav': 'vehicle_coast.mp3',
  'vehicle/stop.wav': 'vehicle_stop.mp3',
  'vehicle/driver_fall.wav': 'driver_fall.mp3',
  'vehicle/driver_fall_alt.wav': 'driver_fall_alt.mp3',
  'vehicle/vehicle_switch.wav': 'vehicle_switch.mp3',
  'interaction-v2/cargo_release.wav': 'cargo_release.mp3',
  'interaction-v2/cargo_barrel_roll.wav': 'cargo_barrel_roll.mp3',
  'interaction-v2/cargo_crate_roll.wav': 'cargo_crate_roll.mp3',
  'interaction-v2/ambulance_pass.wav': 'ambulance_pass.mp3',
  'interaction-v2/wind_gust.wav': 'wind_gust.mp3',
  'interaction-v2/police_capture.wav': 'police_capture.mp3',
  'interaction-v2/banana_use.wav': 'banana_use.mp3',
  'interaction-v2/broken_car.wav': 'broken_car.mp3',
  'item/nitro_activate.wav': 'nitro_activate.mp3',
  'item/jump.wav': 'jump_launch.mp3',
  'item/landing.wav': 'jump_land.mp3',
  'item/star_activate.wav': 'star_activate.mp3',
  'item/grab_call.wav': 'grab_call.mp3',
  'kick_01.wav': 'passenger_drop.mp3',
  'result/result_damage.wav': 'result_failure.mp3',
  'result/result_fuel.wav': 'result_fuel.mp3',
  'result/result_train.wav': 'result_train.mp3',
  'result/result_police.wav': 'result_police.mp3',
  'result/result_secret.wav': 'result_success.mp3',
};
const url = (name: string): string | undefined =>
  name.startsWith('pickup/owner_') ? files[ownerPickupRoot + name.slice('pickup/owner_'.length) + '.mp3'] :
  name === 'ui-modern/qte_turn_a.wav' ? files[uiEffectsRoot + 'qte_turn_confirm.mp3'] :
  ['ui-modern/purchase_success_a.wav', 'ui-modern/shop_service_a.wav', 'ui-modern/shop_upgrade_a.wav',
    'ui-modern/vehicle_purchase_a.wav'].includes(name) ? files[uiEffectsRoot + 'cash_checkout.mp3'] :
  name === 'traffic/horn_light.wav' || name === 'traffic/horn_car.wav' ? files[worldRoot + 'traffic_horn_car.mp3'] :
  name === 'traffic/horn_heavy.wav' ? files[worldRoot + 'traffic_horn_heavy.mp3'] :
  name.startsWith('traffic/new/') ? files[trafficRoot + name.slice('traffic/new/'.length) + '.mp3'] :
  revisionCues[name] ? files[revisionRoot + revisionCues[name]] :
  name.startsWith('control/indicator_tick_') ? files[indicatorRoot + name.slice('control/'.length) + '.mp3'] :
  interactionCues[name] ? files[interactionRoot + interactionCues[name]] :
  potholeCues[name] ? files[potholeRoot + potholeCues[name]] :
  rewardCues[name] ? files[rewardRoot + rewardCues[name]] :
  name === 'npc/footsteps_wet' ? files[worldRoot + 'npc_footsteps_wet.mp3'] :
  name === 'train/roll_past' ? files[worldRoot + 'train_roll_past.mp3'] :
  name.startsWith('voice/kick-line/') ? files[kickVoiceRoot + name.slice('voice/kick-line/'.length) + '.mp3'] :
  name.startsWith('voice/officer/') ? files[officerVoiceRoot + name.slice('voice/officer/'.length) + '.mp3'] :
  name.startsWith('voice/vendor/') ? files[vendorVoiceRoot + name.slice('voice/vendor/'.length) + '.mp3'] :
  name.startsWith('foley/') ? files[impactFoleyRoot + name.slice('foley/'.length) + '.mp3'] :
  name.startsWith('vehicle-impact/') ? files[vehicleImpactRoot + name.slice('vehicle-impact/'.length) + '.mp3'] :
  name.startsWith('voice/') ? files[voiceRoot + name.slice(6) + '.mp3'] :
  name === 'ambience/rain_light_loop.wav' ? files[rainRoot + 'rain_shower_loop.mp3'] :
  name === 'ambience/distant_thunder_loop.wav' ? files[stormRoot + 'distant_thunder_loop.mp3'] :
  name === 'ambience/lightning_distant_a.wav' ? files[stormRoot + 'lightning_distant_a.mp3'] :
  name === 'ambience/lightning_distant_b.wav' ? files[stormRoot + 'lightning_distant_b.mp3'] :
  files[waterRoot + waterCues[name]] ?? files[generatedRoot + generated[name]];

const actors = ['nam', 'thanh'] as const;
type VoiceEvent = 'call' | 'thanks' | 'return' | 'abandon' | 'kick' | 'kickLine' | 'fall' | 'playerFall' | 'hit' | 'laugh' | 'traffic' | 'driver' | 'militiaHit' | 'policeHit' | 'vendorHit';
const screamClips = ['tram_scream', 'quang_toan_scream', 'anh_thu_scream_a', 'anh_thu_scream_b',
  'anh_minh_scream', 'nam_kick_scream', 'nam_kick_scream_alt', 'thanh_kick_scream',
  'huy_kick_scream', 'huy_kick_short', 'huy_kick_scream_alt'];
const playerScreamClips = ['anh_minh_scream', 'quang_toan_scream', 'huy_kick_scream'];
const ownerKickLines = ['kick-line/kick_line_01', 'kick-line/kick_line_02',
  'kick-line/kick_line_03', 'kick-line/kick_line_04'];
const militiaHitLines = ['officer/militia_hit_01', 'officer/militia_hit_02', 'officer/militia_hit_03'];
const policeHitLines = ['officer/police_hit_01', 'officer/police_hit_02', 'officer/police_hit_03'];
const vendorHitLines = ['vendor/vendor_hit_01', 'vendor/vendor_hit_02', 'vendor/vendor_hit_03'];
const isScream = (event: VoiceEvent): boolean => event === 'kick' || event === 'fall' || event === 'playerFall' || event === 'hit';
const voiceClips: Record<VoiceEvent, Record<string, string[]>> = {
  call: { nam: ['nam_call_here', 'nam_call_wait'], thanh: ['thanh_call_shout', 'thanh_call_ride'] },
  thanks: { nam: ['nam_onboard_chatter'], thanh: ['thanh_thanks_sing', 'thanh_thanks_cry'] },
  return: { nam: ['nam_return_mutter'], thanh: ['thanh_return_warning', 'thanh_return_pain'] },
  abandon: { nam: ['nam_abandon_insult'], thanh: ['thanh_abandon_problem', 'thanh_abandon_plead', 'thanh_abandon_judge'] },
  kick: { nam: ['nam_kick_scream', 'nam_kick_scream_alt'], thanh: ['thanh_kick_scream'] },
  kickLine: { nam: ownerKickLines, thanh: ownerKickLines },
  fall: { nam: ['huy_kick_scream', 'huy_kick_short'], thanh: ['huy_kick_scream_alt'] },
  playerFall: { nam: playerScreamClips, thanh: playerScreamClips },
  hit: { nam: screamClips, thanh: screamClips },
  laugh: { nam: ['thanh_laugh'], thanh: ['thanh_laugh'] },
  traffic: { nam: ['nam_traffic_carcry'], thanh: ['thanh_traffic_surprise'] },
  driver: { nam: ['nam_driver_mirror', 'thuong_driver_police', 'thuong_driver_taunt'],
    thanh: ['bao_ngoc_driver_lexus', 'bao_ngoc_driver_touch'] },
  militiaHit: { nam: militiaHitLines, thanh: militiaHitLines },
  policeHit: { nam: policeHitLines, thanh: policeHitLines },
  vendorHit: { nam: vendorHitLines, thanh: vendorHitLines },
};
const voiceActor = (id: string): typeof actors[number] => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (Math.imul(hash, 31) + id.charCodeAt(i)) | 0;
  return actors[(hash >>> 0) % actors.length];
};
const voiceVariantStart = (seed: number, event: VoiceEvent, actor: string, length: number): number => {
  let hash = seed | 0;
  for (const char of `${event}:${actor}`) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  return (hash >>> 0) % length;
};
/** Light speed-up for longer takes; cap it before the delivery becomes cartoonish. */
export const speechPlaybackRate = (duration: number, chuckle = false): number =>
  Number.isFinite(duration) && duration > 1.5 ? Math.min(chuckle ? 1.9 : 1.5, duration / 1.45) : 1;

/** A roadside voice is quieter at range and fades after the player has passed it. */
export const spatialVoiceVolume = (ahead: number, lateral: number, range = 58, rearCutoff = 12): number => {
  if (ahead < -rearCutoff) return 0;
  const distance = Math.hypot(ahead, lateral);
  const distanceGain = Math.max(0, Math.min(1, 1 - distance / range)) ** 1.35;
  return distanceGain * (ahead < 0 ? Math.max(0, 1 + ahead / rearCutoff) : 1);
};

/** Start a short call roughly two seconds before a fast vehicle reaches the caller. */
export const roadsideCallRange = (speed: number): number => Math.max(30, Math.min(46, speed * 1.8));

const oneShotVariants: Record<string, string[]> = {
  'pickup/owner_pickup': ownerPickupNames,
  'traffic/horn_light.wav': ['traffic/new/horn_scooter_short', 'traffic/horn_light.wav'],
  'traffic/horn_car.wav': ['traffic/horn_car.wav', 'traffic/new/horn_car_urgent'],
  'traffic/horn_heavy.wav': ['traffic/horn_heavy.wav', 'traffic/new/horn_truck_low'],
  'traffic/new/traffic_block_light': ['traffic/new/traffic_block_light', 'interaction-v2/collision_medium.wav'],
  'traffic/new/traffic_block_heavy': ['traffic/new/traffic_block_heavy', 'interaction-v2/collision_heavy.wav'],
  'road/water_entry_skim.wav': ['road/water_entry_skim.wav', 'road/water_entry_skim_alt.wav', 'road/water_entry_skim_grit.wav'],
  'road/water_entry_wash.wav': ['road/water_entry_wash.wav', 'road/water_entry_wash_alt.wav', 'road/water_entry_wash_ripple.wav'],
  'road/water_entry_heavy.wav': ['road/water_entry_heavy.wav', 'road/water_entry_heavy_alt.wav', 'road/water_entry_heavy_surge.wav'],
  'interaction-v2/collision_light.wav': ['interaction-v2/collision_light.wav', 'interaction-v2/collision_light_alt.wav'],
  'interaction-v2/collision_medium.wav': ['interaction-v2/collision_medium.wav', 'interaction-v2/collision_medium_alt.wav'],
  'interaction-v2/collision_heavy.wav': ['interaction-v2/collision_heavy.wav', 'interaction-v2/collision_heavy_alt.wav'],
  'road/pothole_rattle_light.wav': ['road/pothole_rattle_light.wav', 'road/pothole_rattle_light_alt.wav', 'road/pothole_rattle_light_c.wav', 'road/pothole_rattle_light_d.wav'],
  'road/pothole_rattle_medium.wav': ['road/pothole_rattle_medium.wav', 'road/pothole_rattle_medium_alt.wav', 'road/pothole_rattle_medium_c.wav', 'road/pothole_rattle_medium_d.wav'],
  'road/pothole_rattle_heavy.wav': ['road/pothole_rattle_heavy.wav', 'road/pothole_rattle_heavy_alt.wav', 'road/pothole_rattle_heavy_c.wav', 'road/pothole_rattle_heavy_d.wav'],
  'interaction-v2/cargo_crate_hit.wav': ['interaction-v2/cargo_crate_hit.wav', 'interaction-v2/cargo_crate_hit_alt.wav'],
  'interaction-v2/cargo_barrel_hit.wav': ['interaction-v2/cargo_barrel_hit.wav', 'interaction-v2/cargo_barrel_hit_alt.wav'],
  'interaction-v2/ambulance_hit.wav': ['interaction-v2/ambulance_hit.wav', 'interaction-v2/ambulance_hit_alt.wav'],
  'interaction-v2/barrier_hit.wav': ['interaction-v2/barrier_hit.wav', 'interaction-v2/barrier_hit_alt.wav'],
  'interaction-v2/vendor_hit.wav': ['interaction-v2/vendor_hit.wav', 'interaction-v2/vendor_hit_alt.wav'],
  'interaction-v2/passenger_hit.wav': ['interaction-v2/passenger_hit.wav', 'interaction-v2/passenger_hit_alt.wav'],
  'foley/person_thud': impactFoleyNames.slice(0, 3),
  'foley/crate_thud': impactFoleyNames.slice(3),
  'vehicle-impact/light': vehicleImpactNames.slice(0, 3),
  'vehicle-impact/medium': vehicleImpactNames.slice(3, 6),
  'vehicle-impact/heavy': vehicleImpactNames.slice(6),
  'vehicle/driver_fall.wav': ['vehicle/driver_fall.wav', 'vehicle/driver_fall_alt.wav'],
};
const waterLoops = ['road/water_tire_light_loop.wav', 'road/water_tire_medium_loop.wav',
  'road/water_tire_heavy_loop.wav'];
const windLoops = ['ambience/wind_loop.wav', 'ambience/wind_soft_loop.wav'];
const hornCue = (kind?: VehicleKind): string =>
  `traffic/horn_${heavyVehicle(kind) ? 'heavy' : lightVehicle(kind) ? 'light' : 'car'}.wav`;
const passCue = (kind?: VehicleKind): string => `traffic/new/pass_${heavyVehicle(kind) ? 'truck' : lightVehicle(kind) ? 'scooter' : 'car'}`;
/** Start the recorded approach early so its closest pass coincides with the vehicle crossing the player. */
export const trafficPassLeadDistance = (kind: VehicleKind | undefined, relativeSpeed: number): number =>
  Math.max(6, Math.min(40, Math.abs(relativeSpeed) * (heavyVehicle(kind) ? 1.5 : lightVehicle(kind) ? 1.1 : 1.25)));
const trafficBlockCue = (kind?: VehicleKind): string =>
  `traffic/new/traffic_block_${heavyVehicle(kind) ? 'heavy' : 'light'}`;

type Bus = 'sfx' | 'ambience' | 'music';
type Stem = { sources: AudioBufferSourceNode[]; gains: GainNode[]; filters: BiquadFilterNode[]; kind: VehicleKind };
const heavyVehicle = (kind?: VehicleKind): boolean => kind === 'bus' || kind === 'truck' || kind === 'container';
const lightVehicle = (kind?: VehicleKind): boolean => kind === 'motorcycle' || kind === 'motorbike' || kind === 'tricycle';
const vehicleImpactCue = (kind?: VehicleKind): string =>
  `vehicle-impact/${heavyVehicle(kind) ? 'heavy' : lightVehicle(kind) ? 'light' : 'medium'}`;
const trafficPairImpactCue = (a?: VehicleKind, b?: VehicleKind): string =>
  `vehicle-impact/${heavyVehicle(a) || heavyVehicle(b) ? 'heavy' : lightVehicle(a) && lightVehicle(b) ? 'light' : 'medium'}`;
export const waterLoopForVehicle = (kind: VehicleKind): string =>
  waterLoops[lightVehicle(kind) ? 0 : heavyVehicle(kind) ? 2 : 1];
const collisionCue = (a?: VehicleKind, b?: VehicleKind, impactSpeed?: number): string => {
  const weight = impactSpeed === undefined
    ? heavyVehicle(a) || heavyVehicle(b) ? 'heavy' : lightVehicle(a) && lightVehicle(b) ? 'light' : 'medium'
    : impactSpeed < 9 ? 'light' : impactSpeed < 21 ? 'medium' : heavyVehicle(a) || heavyVehicle(b) ? 'heavy' : 'medium';
  return `interaction-v2/collision_${weight}.wav`;
};
const potholeCue = (kind?: VehicleKind): string =>
  `road/pothole_rattle_${heavyVehicle(kind) ? 'heavy' : lightVehicle(kind) ? 'light' : 'medium'}.wav`;
const engineTexture = (kind: VehicleKind): string =>
  `engine-v2/${lightVehicle(kind) ? 'bike' : heavyVehicle(kind) ? 'heavy' : 'car'}_texture_loop.wav`;
const cueTrim: Record<string, number> = {
  'vehicle/coast.wav': .55, 'vehicle/stop.wav': 1.5, 'vehicle/driver_fall.wav': .55,
  'vehicle/vehicle_switch.wav': .35, 'interaction-v2/cargo_release.wav': .7,
  'interaction-v2/cargo_barrel_roll.wav': .65, 'interaction-v2/cargo_crate_roll.wav': .65,
  'interaction-v2/ambulance_pass.wav': .4, 'interaction-v2/wind_gust.wav': .3,
  'interaction-v2/police_capture.wav': 1.1, 'interaction-v2/banana_use.wav': .7,
  'interaction-v2/broken_car.wav': .55, 'item/nitro_activate.wav': .65,
  'item/jump.wav': .9, 'item/landing.wav': .8, 'item/star_activate.wav': .85,
  'item/grab_call.wav': 1.3, 'kick_01.wav': .55,
  'result/result_damage.wav': .55, 'result/result_fuel.wav': 1.5,
  'result/result_train.wav': .6, 'result/result_police.wav': 1.4,
  'result/result_secret.wav': .35,
};
export type UiCue = 'menu_select' | 'menu_back' | 'help_open' | 'card_open' | 'card_dismiss' |
  'pause' | 'resume' | 'restart' | 'shop_enter' | 'shop_category' | 'purchase_fail' |
  'purchase_success' | 'shop_service' | 'shop_upgrade' | 'vehicle_purchase' |
  'toggle_on' | 'toggle_off' | 'resource_gain' | 'resource_loss' | 'reward_small' | 'qte_turn';
const rainLevel = 2.5;
const thunderLevel = 2.7;
const thunderLoop = 'ambience/distant_thunder_loop.wav';
const trainLoop = 'train/crossing_loop';
const indicatorLoops = ['control/indicator_tick', 'control/indicator_tick_crisp', 'control/indicator_tick_hollow'];
const indicatorLevel = 1.12;
/** Seeded indicator take for each new press, never repeating the preceding take. */
export function indicatorVariantIndex(seed: number, count: number, previous = -1): number {
  let hash = Math.imul(seed ^ Math.imul(count + 1, 0x9e3779b1), 0x85ebca6b);
  hash = Math.imul(hash ^ hash >>> 16, 0xc2b2ae35) >>> 0;
  let index = hash % indicatorLoops.length;
  if (index === previous) index = (index + 1 + (hash >>> 8) % (indicatorLoops.length - 1)) % indicatorLoops.length;
  return index;
}
/** Seeded selection with no immediate repeat across four pothole takes. */
export function potholeVariantIndex(seed: number, count: number, previous = -1): number {
  let hash = Math.imul(seed ^ Math.imul(count + 1, 0x9e3779b1), 0x85ebca6b);
  hash = Math.imul(hash ^ hash >>> 13, 0xc2b2ae35);
  hash = (hash ^ hash >>> 16) >>> 0;
  let index = hash % 4;
  if (index === previous) index = (index + 1 + (hash >>> 8) % 3) % 4;
  return index;
}
/** Seeded impact take with no immediate repeat; two-take groups necessarily alternate. */
export function impactFoleyVariantIndex(seed: number, count: number, length: number, previous = -1): number {
  let hash = Math.imul(seed ^ Math.imul(count + 1, 0x9e3779b1), 0x85ebca6b);
  hash = Math.imul(hash ^ hash >>> 13, 0xc2b2ae35);
  hash = (hash ^ hash >>> 16) >>> 0;
  let index = hash % length;
  if (index === previous) index = (index + 1 + (hash >>> 8) % (length - 1)) % length;
  return index;
}
export const kickLineVariantIndex = (seed: number, count: number, previous = -1): number =>
  potholeVariantIndex(seed ^ 0x4b49434b, count, previous);
const lightningCues = ['ambience/lightning_distant_a.wav', 'ambience/lightning_distant_b.wav'];
const voiceBoost = (event: VoiceEvent): number => event === 'call' ? 2.6 : event === 'laugh' ? 3.4 :
  event === 'thanks' || event === 'traffic' || event === 'driver' ? 1.6 :
    event === 'militiaHit' || event === 'policeHit' || event === 'vendorHit' ? 1.45 : 1;
const kickLineBoost = (name: string): number => name.endsWith('/kick_line_01') ? 2.2 : 1.4;

/** Deterministic, irregular spacing so lightning is occasional without a clocklike repeat. */
export function stormStrikeDelay(seed: number, strikeIndex: number): number {
  let hash = 2166136261;
  for (const char of `${seed}:${strikeIndex}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (strikeIndex === 0 ? 14 : 27) + (hash >>> 0) % (strikeIndex === 0 ? 9 : 17);
}

/** Taper loop endpoints to zero so compressed MP3 boundary samples cannot click. */
export function taperLoopEdges(buffer: AudioBuffer): void {
  const fade = Math.min(Math.floor(buffer.sampleRate * .005), Math.floor(buffer.length / 4));
  if (fade < 2) return;
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    for (let i = 0; i < fade; i++) {
      const gain = Math.sin(Math.PI * i / (2 * (fade - 1)));
      samples[i] *= gain;
      samples[samples.length - 1 - i] *= gain;
    }
  }
}

/** Presentation-only sound: every cue follows simulation state and never feeds back into it. */
export class AudioDirector {
  private context?: AudioContext;
  private buses?: Record<Bus, GainNode>;
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private stem?: Stem;
  private retiring = new Set<Stem>();
  private ambience = new Map<string, { source: AudioBufferSourceNode; gain: GainNode }>();
  private music?: { audio: HTMLAudioElement; source: MediaElementAudioSourceNode; gain: GainNode };
  private musicPending = false;
  private shopMusic?: { audio: HTMLAudioElement; source: MediaElementAudioSourceNode; gain: GainNode };
  private shopMusicPending = false;
  private shopOpen = false;
  private shopStopTimer?: ReturnType<typeof setTimeout>;
  private near = new Set<string>();
  private trafficPairs = new Set<string>();
  private trafficHoles = new Set<string>();
  private trafficBlocks = new Set<string>();
  private entityState = new Map<string, { lastHit: number; cargoDropped: boolean; consumed: boolean;
    ahead: number; lateral: number; distance: number; x: number }>();
  private trafficHorned = new Set<string>();
  private trafficPassed = new Set<string>();
  private spoken = new Set<string>();
  private lastRiders = new Set<string>();
  private returningRiders: string[] = [];
  private strandedRiders: string[] = [];
  private cooldown = new Map<string, number>();
  private variantCount = new Map<string, number>();
  private indicatorActive = false;
  private activeIndicator?: string;
  private windStart = 0;
  private nextLightningAt = 0;
  private lightningCount = 0;
  private oneShots = new Set<AudioBufferSourceNode>();
  private voices = new Set<{ audio: HTMLAudioElement; source: MediaElementAudioSourceNode; gain: GainNode;
    panner?: StereoPannerNode; spatial?: { entityId: string; range: number; rearCutoff?: number; level: number };
    event: VoiceEvent; riderId: string; stop: () => void }>();
  private runId = '';
  private voiceSeed = 0;
  private lastSequence = -1;
  private lastJump = -100;
  private lastBoost = 0;
  private lastStar = 0;
  private lastMotion = '';
  private lastSpeed = 0;
  private ended = false;
  private airborne = false;
  private crashed = false;
  private inWind = false;
  private waterActive = false;
  private vehicleId = '';
  private requestedKind?: VehicleKind;
  private running = false;
  private generation = 0;
  private uiRequest = 0;
  private sweepTick = 0;
  private levels = { sfx: 1, ambience: 1, music: 1 };

  setLevels(sfx: number, ambience: number, music = 1): void {
    this.levels = { sfx: Math.max(0, Math.min(1, sfx)), ambience: Math.max(0, Math.min(1, ambience)),
      music: Math.max(0, Math.min(1, music)) };
    if (this.buses) {
      const now = this.context?.currentTime ?? 0;
      this.buses.sfx.gain.setTargetAtTime(.65 * this.levels.sfx, now, .025);
      this.syncVoiceDucking();
    }
  }

  private syncVoiceDucking(): void {
    if (!this.buses || !this.context) return;
    const speaking = this.voices.size > 0;
    this.buses.ambience.gain.setTargetAtTime(.22 * this.levels.ambience * (speaking ? .55 : 1),
      this.context.currentTime, speaking ? .08 : .25);
    this.buses.music.gain.setTargetAtTime(.36 * this.levels.music * (speaking ? .45 : 1),
      this.context.currentTime, speaking ? .08 : .25);
  }

  unlock(): void {
    if (typeof AudioContext === 'undefined') return;
    if (!this.context) {
      this.context = new AudioContext();
      const sfx = this.context.createGain(), ambience = this.context.createGain(), music = this.context.createGain();
      sfx.gain.value = .65 * this.levels.sfx; ambience.gain.value = .22 * this.levels.ambience;
      music.gain.value = .36 * this.levels.music;
      sfx.connect(this.context.destination); ambience.connect(this.context.destination); music.connect(this.context.destination);
      this.buses = { sfx, ambience, music };
      for (const name of [...impactFoleyNames, ...vehicleImpactNames, ...ownerPickupNames]) void this.buffer(name);
    }
    void this.context.resume();
  }

  private async buffer(name: string): Promise<AudioBuffer | null> {
    const ctx = this.context, path = url(name);
    if (!ctx || !path) return null;
    if (!this.buffers.has(name)) this.buffers.set(name, fetch(path).then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error('audio fetch')))
      .then(data => ctx.decodeAudioData(data)).then(buffer => {
        if ((name.includes('_loop') || name === trainLoop) && (generated[name] || waterCues[name] || name === trainLoop ||
          name === 'ambience/rain_light_loop.wav' || name === thunderLoop) && buffer.length > 0)
          taperLoopEdges(buffer);
        return buffer;
      }).catch(() => null));
    return this.buffers.get(name)!;
  }

  private async play(name: string, key = name, gap = .18, volume = 1, pan = 0, busKind: Bus = 'sfx',
    onEnded?: () => void): Promise<void> {
    const ctx = this.context, bus = this.buses?.[busKind];
    if (!ctx || !bus || ctx.state !== 'running') { onEnded?.(); return; }
    const now = ctx.currentTime;
    if (now - (this.cooldown.get(key) ?? -100) < gap) { onEnded?.(); return; }
    this.cooldown.set(key, now);
    const trim = cueTrim[name] ?? 1;
    const variants = oneShotVariants[name];
    if (variants) {
      const count = this.variantCount.get(name) ?? 0;
      this.variantCount.set(name, count + 1);
      if (name.startsWith('road/pothole_rattle_')) {
        const index = potholeVariantIndex(this.voiceSeed, count, this.variantCount.get(`last:${name}`) ?? -1);
        this.variantCount.set(`last:${name}`, index);
        name = variants[index];
      } else if (name.startsWith('foley/') || name.startsWith('vehicle-impact/') || name === 'pickup/owner_pickup') {
        const index = impactFoleyVariantIndex(this.voiceSeed, count, variants.length, this.variantCount.get(`last:${name}`) ?? -1);
        this.variantCount.set(`last:${name}`, index);
        name = variants[index];
      } else name = variants[count % variants.length];
    }
    const generation = this.generation;
    const buffer = await this.buffer(name);
    if (!buffer || generation !== this.generation || !this.context || this.context.state !== 'running') {
      if (generation === this.generation) onEnded?.();
      return;
    }
    const source = ctx.createBufferSource(), gain = ctx.createGain();
    const waterEntry = name.startsWith('road/water_entry_');
    const panner = pan ? ctx.createStereoPanner() : undefined;
    if (panner) panner.pan.value = Math.max(-.8, Math.min(.8, pan));
    source.buffer = buffer;
    gain.gain.value = waterEntry ? 0 : volume * trim * (vehicleImpactGain[name] ?? 1);
    if (panner) gain.connect(panner).connect(bus);
    else gain.connect(bus);
    if (waterEntry) {
      // The raw splash has a hard first transient; let the rolling water lead in.
      gain.gain.setTargetAtTime(volume * trim, ctx.currentTime, .12);
      const soften = ctx.createBiquadFilter();
      soften.type = 'lowpass'; soften.frequency.value = 1800;
      source.connect(soften).connect(gain);
      source.onended = () => { this.oneShots.delete(source); source.disconnect(); soften.disconnect(); gain.disconnect(); panner?.disconnect();
        if (generation === this.generation) onEnded?.(); };
    } else {
      source.connect(gain);
      source.onended = () => { this.oneShots.delete(source); source.disconnect(); gain.disconnect(); panner?.disconnect();
        if (generation === this.generation) onEnded?.(); };
    }
    const offset = impactFoleyOffset[name];
    if (offset !== undefined) {
      const duration = Math.min(.7, buffer.duration - offset);
      gain.gain.setTargetAtTime(0, ctx.currentTime + Math.min(.48, duration * .7), .075);
      source.start(0, offset, duration);
    } else if (name === 'vehicle-impact/medium_02') source.start(0, .29);
    else source.start();
    this.oneShots.add(source);
  }

  private voice(event: VoiceEvent, riderId: string, volume = .6, pan = 0, gap = 0,
    spatial?: { entityId: string; range: number; rearCutoff?: number; level: number }): void {
    const ctx = this.context, bus = this.buses?.sfx;
    if (!ctx || !bus || ctx.state !== 'running') return;
    const actor = voiceActor(riderId);
    const clips = event === 'playerFall' ? playerScreamClips : isScream(event) ? screamClips : voiceClips[event][actor];
    const collisionLine = event === 'militiaHit' || event === 'policeHit' || event === 'vendorHit';
    const countKey = collisionLine ? `voice-variant-${event}` : event === 'kickLine' ? 'voice-variant-kick-line' :
      event === 'playerFall' ? 'voice-variant-player-fall' :
      isScream(event) ? 'voice-variant-scream' : `voice-variant-${event}-${actor}`;
    const count = this.variantCount.get(countKey) ?? 0;
    const variantActor = isScream(event) ? 'all' : actor;
    const variantIndex = collisionLine
      ? indicatorVariantIndex(this.voiceSeed ^ (event === 'militiaHit' ? 0x4d494c : event === 'policeHit' ? 0x504f4c : 0x56454e),
        count, this.variantCount.get(`last:${countKey}`) ?? -1)
      : event === 'kickLine'
      ? kickLineVariantIndex(this.voiceSeed, count, this.variantCount.get(`last:${countKey}`) ?? -1)
      : (voiceVariantStart(this.voiceSeed, event, variantActor, clips.length) + count) % clips.length;
    const name = `voice/${clips[variantIndex]}`;
    const path = url(name), key = `voice-${event}-${riderId}`;
    if (!path || ctx.currentTime - (this.cooldown.get(key) ?? -100) < gap) return;
    for (const active of [...this.voices]) {
      const pairedKick = event === 'kickLine' && active.event === 'kick' || event === 'kick' && active.event === 'kickLine';
      if (active.riderId === riderId && !pairedKick && (isScream(active.event) || isScream(event))) active.stop();
    }
    this.variantCount.set(countKey, count + 1);
    if (event === 'kickLine' || collisionLine) this.variantCount.set(`last:${countKey}`, variantIndex);
    const requestedAt = ctx.currentTime;
    this.cooldown.set(key, requestedAt);
    // HTML media preserves pitch when a long line is sped up; buffer playback does not.
    const audio = new Audio(path), source = ctx.createMediaElementSource(audio), gain = ctx.createGain();
    const panner = pan ? ctx.createStereoPanner() : undefined;
    audio.preservesPitch = true;
    audio.onloadedmetadata = () => { audio.playbackRate = speechPlaybackRate(audio.duration, event === 'laugh'); };
    gain.gain.value = volume * 1.25 * voiceBoost(event) * (event === 'kickLine' ? kickLineBoost(name) : 1);
    if (panner) { panner.pan.value = Math.max(-.8, Math.min(.8, pan)); source.connect(gain).connect(panner).connect(bus); }
    else source.connect(gain).connect(bus);
    const node: { audio: HTMLAudioElement; source: MediaElementAudioSourceNode; gain: GainNode;
      panner?: StereoPannerNode; spatial?: { entityId: string; range: number; rearCutoff?: number; level: number };
      event: VoiceEvent; riderId: string; stop: () => void } =
      { audio, source, gain, panner, spatial, event, riderId, stop: () => undefined };
    const clear = () => {
      if (!this.voices.delete(node)) return;
      audio.pause(); source.disconnect(); gain.disconnect(); panner?.disconnect(); this.syncVoiceDucking();
    };
    node.stop = clear;
    audio.onended = clear; audio.onerror = clear;
    this.voices.add(node);
    this.syncVoiceDucking();
    void audio.play().catch(() => {
      // A rejected first play must not consume the entire roadside approach window.
      if (this.cooldown.get(key) === requestedAt) this.cooldown.set(key, ctx.currentTime - gap + .6);
      clear();
    });
  }

  private pickupSequence(riderId: string, eventSequence: number): void {
    for (const active of [...this.voices])
      if (active.riderId === riderId && (active.event === 'call' || active.event === 'laugh')) active.stop();
    const stillAboard = () => this.running && this.lastRiders.has(riderId);
    void this.play('pickup/owner_pickup', `pickup-owner:${eventSequence}`, .18, .95, 0, 'sfx', () => {
      if (!stillAboard()) return;
      void this.play('foley/person_thud', `pickup-thud:${eventSequence}`, .18, .78, 0, 'sfx', () => {
        if (stillAboard()) this.voice('thanks', riderId, .9);
      });
    });
  }

  private async loop(name: string, bus: Bus, volume: number): Promise<void> {
    if (this.ambience.has(name) || !this.context || !this.buses) return;
    const ctx = this.context, generation = this.generation, buffer = await this.buffer(name);
    if (!buffer || generation !== this.generation || !this.running || this.ambience.has(name) || ctx.state !== 'running' ||
      waterLoops.includes(name) && !this.waterActive || indicatorLoops.includes(name) &&
      (!this.indicatorActive || this.activeIndicator !== name)) return;
    const source = ctx.createBufferSource(), gain = ctx.createGain();
    source.buffer = buffer; source.loop = true; gain.gain.value = indicatorLoops.includes(name) ? volume : 0;
    source.connect(gain).connect(this.buses[bus]); source.start();
    this.ambience.set(name, { source, gain });
    gain.gain.setTargetAtTime(volume, ctx.currentTime, indicatorLoops.includes(name) ? .01 : .15);
  }

  private stopLoop(name: string): void {
    const node = this.ambience.get(name);
    if (!node) return;
    this.ambience.delete(name);
    node.gain.gain.setTargetAtTime(0, this.context?.currentTime ?? 0, .03);
    try { node.source.stop((this.context?.currentTime ?? 0) + .12); } catch { /* already stopped */ }
    node.source.onended = () => { node.source.disconnect(); node.gain.disconnect(); };
  }

  private startMusic(): void {
    const ctx = this.context, bus = this.buses?.music, path = files[musicRoot + 'nimble_pursuit.mp3'];
    if (!ctx || !bus || !path || !this.running || ctx.state !== 'running' || typeof Audio === 'undefined') return;
    if (!this.music) {
      const audio = new Audio(path);
      audio.loop = true;
      audio.preload = 'auto';
      const source = ctx.createMediaElementSource(audio), gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(gain).connect(bus);
      this.music = { audio, source, gain };
    }
    if (!this.music.audio.paused || this.musicPending) return;
    const audio = this.music.audio;
    this.music.gain.gain.value = 0;
    this.music.gain.gain.setTargetAtTime(1, ctx.currentTime, .12);
    this.musicPending = true;
    void audio.play().then(() => {
      if (this.music?.audio !== audio || !this.running) audio.pause();
    }).catch(() => { /* Retry after the next user gesture. */ }).finally(() => {
      if (this.music?.audio === audio) this.musicPending = false;
    });
  }

  /** The shop pauses gameplay, but its music continues through the shared music slider. */
  enterShop(): void {
    const ctx = this.context, bus = this.buses?.music;
    const path = files[musicRoot + 'afternoon_jazz.mp3'];
    if (!ctx || !bus || !path || typeof Audio === 'undefined') return;
    this.shopOpen = true;
    if (ctx.state !== 'running') {
      void ctx.resume().then(() => { if (this.shopOpen && ctx.state === 'running') this.enterShop(); })
        .catch(() => { /* Retry on the next gesture. */ });
      return;
    }
    if (this.shopStopTimer) clearTimeout(this.shopStopTimer);
    this.shopStopTimer = undefined;
    if (!this.shopMusic) {
      const audio = new Audio(path);
      audio.loop = true;
      audio.preload = 'auto';
      const source = ctx.createMediaElementSource(audio), gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(gain).connect(bus);
      this.shopMusic = { audio, source, gain };
    }
    this.shopMusic.gain.gain.setTargetAtTime(.95, ctx.currentTime, .12);
    if (!this.shopMusic.audio.paused || this.shopMusicPending) return;
    const audio = this.shopMusic.audio;
    this.shopMusicPending = true;
    void audio.play().then(() => {
      if (this.shopMusic?.audio !== audio || !this.shopOpen) audio.pause();
    }).catch(() => { /* Retry on the next shop interaction. */ }).finally(() => {
      if (this.shopMusic?.audio === audio) this.shopMusicPending = false;
    });
  }

  leaveShop(): void {
    this.shopOpen = false;
    const track = this.shopMusic, ctx = this.context;
    if (!track || !ctx) return;
    track.gain.gain.setTargetAtTime(0, ctx.currentTime, .08);
    if (this.shopStopTimer) clearTimeout(this.shopStopTimer);
    this.shopStopTimer = setTimeout(() => {
      if (this.shopMusic === track && !this.shopOpen) track.audio.pause();
      this.shopStopTimer = undefined;
    }, 400);
  }

  private async engine(kind: VehicleKind): Promise<void> {
    if (!this.context || !this.buses || this.stem?.kind === kind) return;
    const ctx = this.context, generation = this.generation;
    const names = [engineTexture(kind)];
    const buffers = await Promise.all(names.map(n => this.buffer(n)));
    if (!buffers[0] || generation !== this.generation || this.requestedKind !== kind || this.stem?.kind === kind || ctx.state !== 'running') return;
    this.stopEngine(.18);
    const sources: AudioBufferSourceNode[] = [], gains: GainNode[] = [], filters: BiquadFilterNode[] = [];
    for (const buffer of buffers) {
      if (!buffer) continue;
      const source = ctx.createBufferSource(), gain = ctx.createGain(), presence = ctx.createBiquadFilter();
      source.buffer = buffer; source.loop = true; gain.gain.value = 0;
      // Rain and music mask the midrange of these bass-heavy engine recordings.
      presence.type = 'peaking'; presence.frequency.value = 850; presence.Q.value = .8; presence.gain.value = 6;
      source.connect(gain).connect(presence).connect(this.buses.sfx);
      sources.push(source); gains.push(gain); filters.push(presence);
    }
    const start = ctx.currentTime + .01;
    for (const source of sources) source.start(start);
    this.stem = { kind, sources, gains, filters };
  }

  private stopEngine(fadeSeconds = 0): void {
    const stem = this.stem, ctx = this.context;
    this.stem = undefined;
    if (!stem) return;
    if (fadeSeconds && ctx?.state === 'running') this.retiring.add(stem);
    let remaining = stem.sources.length;
    stem.sources.forEach((source, index) => {
      const gain = stem.gains[index];
      if (fadeSeconds && ctx?.state === 'running') {
        gain.gain.setTargetAtTime(0, ctx.currentTime, fadeSeconds / 4);
        source.onended = () => { source.disconnect(); gain.disconnect(); stem.filters[index].disconnect(); if (--remaining === 0) this.retiring.delete(stem); };
        try { source.stop(ctx.currentTime + fadeSeconds); } catch { /* already stopped */ }
      } else {
        try { source.stop(); } catch { /* already stopped */ }
        source.disconnect(); gain.disconnect(); stem.filters[index].disconnect();
      }
    });
  }

  private clearRetiring(): void {
    for (const stem of this.retiring) {
      stem.sources.forEach(source => { try { source.stop(); } catch { /* already stopped */ } source.disconnect(); });
      stem.gains.forEach(gain => gain.disconnect());
      stem.filters.forEach(filter => filter.disconnect());
    }
    this.retiring.clear();
  }

  reset(): void {
    this.generation++;
    this.uiRequest++;
    for (const source of this.oneShots) { try { source.stop(); } catch { /* already stopped */ } }
    this.oneShots.clear();
    for (const { audio, source, gain, panner } of this.voices) { audio.pause(); source.disconnect(); gain.disconnect(); panner?.disconnect(); }
    this.voices.clear();
    this.syncVoiceDucking();
    this.stopEngine();
    this.clearRetiring();
    for (const { source, gain } of this.ambience.values()) { try { source.stop(); } catch { /* already stopped */ } source.disconnect(); gain.disconnect(); }
    if (this.music) { this.music.audio.pause(); this.music.source.disconnect(); this.music.gain.disconnect(); this.music = undefined; }
    this.musicPending = false;
    if (this.shopStopTimer) clearTimeout(this.shopStopTimer);
    this.shopStopTimer = undefined;
    if (this.shopMusic) { this.shopMusic.audio.pause(); this.shopMusic.source.disconnect(); this.shopMusic.gain.disconnect(); this.shopMusic = undefined; }
    this.shopMusicPending = false; this.shopOpen = false;
    this.ambience.clear(); this.near.clear(); this.trafficPairs.clear(); this.trafficHoles.clear(); this.trafficBlocks.clear(); this.trafficHorned.clear(); this.trafficPassed.clear(); this.spoken.clear(); this.lastRiders.clear(); this.returningRiders = []; this.strandedRiders = []; this.entityState.clear(); this.cooldown.clear(); this.variantCount.clear(); this.sweepTick = 0;
    this.windStart = 0; this.nextLightningAt = 0; this.lightningCount = 0;
    this.lastSequence = -1; this.lastJump = -100; this.lastBoost = 0; this.lastStar = 0; this.lastMotion = ''; this.lastSpeed = 0; this.ended = false; this.airborne = false; this.crashed = false; this.inWind = false; this.waterActive = false; this.indicatorActive = false; this.activeIndicator = undefined; this.vehicleId = ''; this.requestedKind = undefined; this.running = false; this.voiceSeed = 0;
  }

  pause(): void {
    this.generation++;
    this.uiRequest++;
    this.requestedKind = undefined;
    this.running = false;
    this.waterActive = false;
    this.stopEngine();
    this.clearRetiring();
    for (const source of this.oneShots) { try { source.stop(); } catch { /* already stopped */ } }
    for (const { audio, source, gain, panner } of this.voices) { audio.pause(); source.disconnect(); gain.disconnect(); panner?.disconnect(); }
    this.voices.clear();
    this.syncVoiceDucking();
    this.music?.audio.pause();
    if (this.shopStopTimer) clearTimeout(this.shopStopTimer);
    this.shopStopTimer = undefined;
    this.shopOpen = false;
    this.shopMusic?.audio.pause();
    if (this.shopMusic && this.context) this.shopMusic.gain.gain.setTargetAtTime(0, this.context.currentTime, .08);
    for (const { gain } of this.ambience.values()) gain.gain.setTargetAtTime(0, this.context?.currentTime ?? 0, .08);
  }

  ui(name: UiCue): void {
    const ctx = this.context;
    if (!ctx) return;
    const request = ++this.uiRequest, generation = this.generation;
    const cue = `ui-modern/${name}_a.wav`;
    if (!url(cue)) return;
    const play = () => { void this.play(cue, `ui-${name}`, .09,
      name === 'resource_gain' || name === 'resource_loss' || name === 'reward_small' ? .24 :
        name === 'purchase_success' || name === 'shop_service' || name === 'shop_upgrade' || name === 'vehicle_purchase' ? 1.25 :
          name === 'qte_turn' ? .8 :
          name === 'shop_enter' ? .52 : .3); };
    if (ctx.state === 'running') play(); else void ctx.resume().then(() => {
      if (request === this.uiRequest && generation === this.generation) play();
    }).catch(() => { /* blocked until a gesture */ });
  }

  async update(run: Run, steering?: { left: boolean; right: boolean }): Promise<void> {
    const ctx = this.context;
    if (!ctx) return;
    if (run.runId !== this.runId) { this.reset(); this.runId = run.runId; }
    this.voiceSeed = run.seed;
    const vehicle = activeVehicle(run);
    let pickupRiderId: string | undefined;
    if (run.eventSequence !== this.lastSequence) {
      this.lastSequence = run.eventSequence;
      const kind = run.feedbackKind;
      const hitEntity = run.world.entities.find(e => e.consumed && !this.entityState.get(e.id)?.consumed && e.kind === kind);
      const hitTraffic = run.world.entities.find(e => e.kind === 'traffic' && e.lastHit >= 0 && Math.abs(e.lastHit - run.activeSeconds) < .1);
      const impactSpeed = run.crash?.impactSpeed ?? run.speed;
      const cue: Record<string, string> = { pothole: potholeCue(vehicle.kind), traffic: collisionCue(vehicle.kind, hitTraffic?.trafficKind, impactSpeed), cargo: hitEntity?.cargoType === 'crate' ? 'interaction-v2/cargo_crate_hit.wav' : 'interaction-v2/cargo_barrel_hit.wav', fuel: 'item/fuel_pickup.wav', repair: 'item/repair_pickup.wav', passenger: 'pickup_01.wav', drop: 'kick_01.wav', coast: 'vehicle/coast.wav', police: run.feedback.includes('Chuối') ? 'interaction-v2/banana_use.wav' : 'interaction-v2/police_capture.wav', militia: run.feedback.includes('Chuối') ? 'interaction-v2/banana_use.wav' : collisionCue(vehicle.kind, undefined, impactSpeed), jam: hitEntity?.crossingRole === 'vendor' ? 'interaction-v2/vendor_hit.wav' : hitEntity?.serviceRole === 'ambulance' ? 'interaction-v2/ambulance_hit.wav' : 'interaction-v2/barrier_hit.wav', accident: 'interaction-v2/collision_heavy.wav', train: 'interaction-v2/train_pass.wav', broken: 'interaction-v2/broken_car.wav' };
      if (kind && cue[kind]) void this.play(cue[kind], `event-${kind}`, .18,
        kind === 'pothole' ? 1.35 : kind === 'repair' ? 1.6 : kind === 'passenger' ? .55 : 1);
      const officerCollision = (kind === 'police' || kind === 'militia') && !run.feedback.includes('Chuối');
      if (kind === 'traffic' || kind === 'accident' || officerCollision ||
          (kind === 'jam' && hitEntity?.crossingRole !== 'vendor'))
        void this.play(vehicleImpactCue(vehicle.kind), `vehicle-impact:${run.eventSequence}`, .18, .78);
      if (kind === 'passenger') {
        pickupRiderId = run.riderIds.find(id => !this.lastRiders.has(id));
        if (pickupRiderId) this.pickupSequence(pickupRiderId, run.eventSequence);
      }
      if (officerCollision) {
        void this.play('interaction-v2/passenger_hit.wav', 'npc-impact', .18, .6);
        void this.play('foley/person_thud', `person-thud:${hitEntity?.id ?? run.eventSequence}`, .18, .95);
        this.voice(kind === 'militia' ? 'militiaHit' : 'policeHit', hitEntity?.id ?? `${kind}:${run.eventSequence}`, 1);
      }
      if (kind === 'jam' && hitEntity?.crossingRole === 'vendor') {
        void this.play('foley/person_thud', `person-thud:${hitEntity.id}`, .18, .95);
        this.voice('vendorHit', hitEntity.id, 1);
      }
      if (kind === 'cargo' && hitEntity?.cargoType === 'crate')
        void this.play('foley/crate_thud', `crate-thud:${hitEntity.id}`, .18, .8);
      if (kind === 'pothole' || kind === 'police' || kind === 'militia') this.ui('resource_loss');
    }
    if (run.phase !== 'running') {
      this.running = false;
      this.indicatorActive = false;
      if (this.activeIndicator) this.stopLoop(this.activeIndicator);
      this.activeIndicator = undefined;
      this.requestedKind = undefined;
      this.stopEngine(.12);
      this.music?.audio.pause();
      for (const { gain } of this.ambience.values()) gain.gain.setTargetAtTime(0, ctx.currentTime, .1);
      if (run.phase === 'ended' && !this.ended) {
        this.ended = true;
        const reason = run.result?.reason;
        if (reason) void this.play(`result/result_${reason}.wav`, 'result', 0, .8);
      }
      return;
    }
    this.running = true;
    const indicatorSide = run.route.choice ?? (steering?.left === steering?.right ? null : steering?.left ? 'left' : 'right');
    this.indicatorActive = !run.crash && !!indicatorSide;
    if (this.indicatorActive && !this.activeIndicator) {
      const count = this.variantCount.get('indicator') ?? 0;
      const index = indicatorVariantIndex(run.seed, count, this.variantCount.get('last:indicator') ?? -1);
      this.activeIndicator = indicatorLoops[index];
      this.variantCount.set('indicator', count + 1);
      this.variantCount.set('last:indicator', index);
    }
    if (this.indicatorActive && this.activeIndicator) void this.loop(this.activeIndicator, 'sfx', indicatorLevel);
    else if (this.activeIndicator) { this.stopLoop(this.activeIndicator); this.activeIndicator = undefined; }
    this.startMusic();
    for (const node of this.voices) {
      if (!node.spatial) continue;
      const entity = run.world.entities.find(e => e.id === node.spatial?.entityId && !e.consumed);
      const ahead = entity ? entity.distance - run.distance : -100;
      const lateral = entity ? entity.x - run.x : 0;
      node.gain.gain.setTargetAtTime(node.spatial.level * 1.25 * voiceBoost(node.event) * spatialVoiceVolume(ahead, lateral,
        node.spatial.range, node.spatial.rearCutoff), ctx.currentTime, .08);
      if (node.panner) node.panner.pan.setTargetAtTime(Math.max(-.8, Math.min(.8, lateral / 8)), ctx.currentTime, .12);
    }
    for (const riderId of run.riderIds) if (!this.lastRiders.has(riderId) && !this.returningRiders.includes(riderId) &&
      riderId !== pickupRiderId)
      this.voice('thanks', riderId, .9);
    this.lastRiders = new Set(run.riderIds);
    if (run.crash && !this.crashed) {
      this.returningRiders = [...run.crash.returningRiderIds];
      this.strandedRiders = [...run.crash.strandedRiderIds];
    }
    const touchingWater = run.world.entities.filter(e => e.kind === 'water' && e.touching && !e.consumed);
    const inWater = touchingWater.length > 0;
    if (this.waterActive && !inWater) void this.play('road/water_exit_spray.wav', 'water-exit', .35, .26);
    this.waterActive = inWater;
    void this.loop('ambience/rain_light_loop.wav', 'ambience', rainLevel);
    void this.loop(thunderLoop, 'ambience', thunderLevel);
    if (!this.nextLightningAt) this.nextLightningAt = stormStrikeDelay(run.seed, 0);
    if (run.activeSeconds >= this.nextLightningAt) {
      void this.play(lightningCues[this.lightningCount % lightningCues.length], 'storm-lightning', .25, 1, 0, 'ambience');
      this.lightningCount++;
      this.nextLightningAt = run.activeSeconds + stormStrikeDelay(run.seed, this.lightningCount);
    }
    if (!this.windStart) this.windStart = ctx.currentTime;
    const windIndex = Math.floor(Math.max(0, ctx.currentTime - this.windStart) / 9) % windLoops.length;
    for (const name of windLoops) void this.loop(name, 'ambience', name === windLoops[windIndex] ? .18 : 0);
    void this.loop('ambience/wet_road_loop.wav', 'ambience', .1);
    const crossingTrains = run.world.entities.filter(e => e.kind === 'train' && !e.consumed && e.crossMotion &&
      !e.motionWaiting && Math.abs(e.distance - run.distance) < 85 && Math.abs(e.x) < 34);
    const trainNearby = crossingTrains.length > 0;
    if (run.world.entities.some(e => e.kind === 'train' && !e.consumed && e.distance - run.distance < 110)) {
      void this.buffer(trainLoop);
      void this.buffer('train/horn_approach');
    }
    for (const train of crossingTrains) if (!this.near.has(`train:${train.id}`)) {
      this.near.add(`train:${train.id}`);
      void this.play('train/horn_approach', 'train-horn', .4, .72, train.x / 24);
    }
    if (trainNearby) void this.loop(trainLoop, 'sfx', .98);
    const waterSpeed = Math.max(0, Math.min(1, run.speed / Math.max(1, vehicle.maxSpeed)));
    const activeWater = waterLoopForVehicle(vehicle.kind);
    const waterLevel = (heavyVehicle(vehicle.kind) ? .65 : .75) + .4 * waterSpeed;
    if (inWater) for (const name of waterLoops)
      void this.loop(name, 'sfx', name === activeWater ? waterLevel : 0);
    for (const [name, node] of this.ambience) {
      const waterRoll = waterLoops.includes(name);
      const waterTarget = inWater && name === activeWater ? waterLevel : 0;
      const windTarget = name === windLoops[windIndex] ? .18 : 0;
      node.gain.gain.setTargetAtTime(waterRoll ? waterTarget : windLoops.includes(name) ? windTarget :
        name === trainLoop ? trainNearby ? .98 : 0 : indicatorLoops.includes(name) ? indicatorLevel :
          name === thunderLoop ? thunderLevel : name.includes('rain') ? rainLevel : .1,
        ctx.currentTime, waterRoll || windLoops.includes(name) ? .22 : .15);
      if (waterRoll) node.source.playbackRate.setTargetAtTime(.92 + .16 * waterSpeed, ctx.currentTime, .18);
    }
    this.requestedKind = vehicle.kind;
    if (this.vehicleId && this.vehicleId !== run.activeVehicleId) void this.play('vehicle/vehicle_switch.wav');
    this.vehicleId = run.activeVehicleId;
    if (!run.crash && run.speed > .15) {
      void this.engine(vehicle.kind);
      if (this.stem?.kind === vehicle.kind) {
        const s = Math.max(0, Math.min(1, (run.speed - vehicle.minSpeed) / Math.max(1, vehicle.maxSpeed - vehicle.minSpeed)));
        const vehicleGain = lightVehicle(vehicle.kind) ? 1 : heavyVehicle(vehicle.kind) ? .85 : 1.7;
        const level = (run.motion === 'coasting' ? .7 : 1.25) * vehicleGain;
        this.stem.gains[0].gain.setTargetAtTime(level, ctx.currentTime, .085);
        this.stem.sources.forEach(source => source.playbackRate.setTargetAtTime((.86 + .38 * s) * (run.motion === 'coasting' ? .9 : 1), ctx.currentTime, .085));
      }
    } else this.stopEngine(.12);
    if (!run.crash && this.lastSpeed > 2 && run.speed < .1) void this.play('vehicle/stop.wav', 'stop', 1, .35);
    if (run.crash && !this.crashed) {
      void this.play('vehicle/driver_fall.wav', 'driver-fall', .5, .32);
      const fallen = [...run.crash.returningRiderIds, ...run.crash.strandedRiderIds];
      const level = 1 / Math.sqrt(fallen.length + 1);
      this.voice('playerFall', run.runId, level);
      for (const id of fallen) this.voice('fall', id, level);
    }
    if (!run.crash && this.crashed) {
      // The simulation clears crash only after the driver has climbed back onto the vehicle.
      for (const id of this.returningRiders) if (run.riderIds.includes(id)) this.voice('return', id, .9);
      for (const id of this.strandedRiders) this.voice('abandon', id, .9);
      this.returningRiders = [];
      this.strandedRiders = [];
    }
    this.crashed = !!run.crash;
    if (run.motion === 'coasting' && this.lastMotion !== 'coasting') void this.play('vehicle/coast.wav');
    this.lastMotion = run.motion; this.lastSpeed = run.speed;
    if (run.powers.jumpAt > this.lastJump) { this.lastJump = run.powers.jumpAt; void this.play('item/jump.wav'); }
    const airborne = run.activeSeconds > run.powers.jumpAt && run.activeSeconds < run.powers.jumpAt + itemBalance.jumpSeconds;
    if (this.airborne && !airborne) void this.play('item/landing.wav');
    this.airborne = airborne;
    if (run.powers.boostUntil > this.lastBoost) { this.lastBoost = run.powers.boostUntil; void this.play('item/nitro_activate.wav'); }
    if (run.powers.starUntil > this.lastStar) { this.lastStar = run.powers.starUntil; void this.play('item/star_activate.wav'); }
    const inWind = run.world.entities.some(e => e.kind === 'wind' && !e.consumed && Math.abs(e.distance - run.distance) < (e.length + vehicle.length) / 2 && Math.abs(e.x - run.x) < (e.width + vehicle.width) / 2);
    if (inWind && !this.inWind) void this.play('interaction-v2/wind_gust.wav', 'wind-gust', 1, .5);
    this.inWind = inWind;
    const nextPairs = new Set<string>(), nextHoles = new Set<string>(), nextBlocks = new Set<string>();
    const trafficById = new Map(run.world.entities.filter(e => e.kind === 'traffic').map(e => [e.id, e]));
    const potholes = new Set(run.world.entities.filter(e => e.kind === 'pothole').map(e => e.id));
    const blockers = new Set(run.world.entities.filter(e =>
      ['jam', 'train', 'accident', 'broken'].includes(e.kind)).map(e => e.id));
    for (const e of run.world.entities) {
      const prior = this.entityState.get(e.id);
      const ahead = e.distance - run.distance;
      if (e.kind === 'traffic') {
        const lateral = Math.abs(e.x - run.x);
        const relativeSpeed = run.speed - e.speed;
        const passLead = trafficPassLeadDistance(e.trafficKind, relativeSpeed);
        if (!e.consumed && !e.wrecked && ahead > passLead && ahead < 95 && relativeSpeed > 4)
          void this.buffer(passCue(e.trafficKind));
        if (!e.consumed && !e.wrecked && !this.trafficHorned.has(e.id) && ahead > 9 && ahead < 42 &&
          relativeSpeed > 5 && lateral < (e.width + vehicle.width) / 2 + 2.2) {
          this.trafficHorned.add(e.id);
          void this.play(hornCue(e.trafficKind), 'traffic-horn', 4.5, .35 + .21 * (1 - ahead / 42), (e.x - run.x) / 6);
        }
        if (!e.consumed && !e.wrecked && !run.crash && !this.trafficPassed.has(e.id) &&
          prior && prior.ahead > passLead && ahead <= passLead && relativeSpeed > 4 && lateral < 9) {
          this.trafficPassed.add(e.id);
          void this.play(passCue(e.trafficKind), 'traffic-pass', .45, .48 * (1 - lateral / 12), (e.x - run.x) / 6);
        }
        for (const otherId of e.trafficPairContacts ?? []) {
          const other = trafficById.get(otherId);
          if (!other) continue;
          const key = [e.id, otherId].sort().join('|');
          nextPairs.add(key);
          if (!this.trafficPairs.has(key) && Math.abs((e.distance + other.distance) / 2 - run.distance) < 65) {
            void this.play(collisionCue(e.trafficKind, other.trafficKind), 'traffic-pair', .22, .68);
            void this.play(trafficPairImpactCue(e.trafficKind, other.trafficKind), 'traffic-pair-impact', .22, .62);
            this.voice('driver', key, .48 * spatialVoiceVolume((e.distance + other.distance) / 2 - run.distance,
              (e.x + other.x) / 2 - run.x, 65), (e.x - run.x) / 8, 1);
          }
        }
        for (const holeId of e.trafficContacts ?? []) {
          const key = `${e.id}|${holeId}`;
          if (potholes.has(holeId)) {
            nextHoles.add(key);
            if (!this.trafficHoles.has(key) && Math.abs(e.distance - run.distance) < 40)
              void this.play(potholeCue(e.trafficKind), 'traffic-pothole', .28, .75);
          } else if (blockers.has(holeId)) {
            nextBlocks.add(key);
            if (!this.trafficBlocks.has(key) && Math.abs(e.distance - run.distance) < 65) {
              void this.play(trafficBlockCue(e.trafficKind), 'traffic-block', .35,
                .42 + .38 * (1 - Math.abs(e.distance - run.distance) / 65), (e.x - run.x) / 8);
              void this.play(vehicleImpactCue(e.trafficKind), 'traffic-block-impact', .35,
                .52 * (1 - Math.abs(e.distance - run.distance) / 85), (e.x - run.x) / 8);
            }
          }
        }
      }
      if (e.kind === 'passenger' && prior && e.lastHit > prior.lastHit && e.lastHit >= 0 &&
          e.passengerMotion?.crashRecovery) {
        void this.play('foley/person_thud', `person-thud:${e.id}`, .18, .95, (e.x - run.x) / 8);
        if (e.passengerMotion.hitByPlayer) {
          void this.play('interaction-v2/passenger_hit.wav', 'passenger-hit', .35, 1.15);
          this.voice('hit', e.riderId ?? e.id, 1, (e.x - run.x) / 8);
          this.spoken.add(`road-hit:${e.id}`);
        }
      }
      if (e.kind === 'passenger' && !e.consumed) {
        const lateral = e.x - run.x;
        if (!e.id.startsWith('fallen-') && !e.id.startsWith('wreck-rider:') &&
          e.passengerMotion && !e.passengerMotion.idle && ahead > -8 && ahead < 20 &&
          Math.abs(lateral) < 12 && !this.near.has(`steps:${e.id}`)) {
          this.near.add(`steps:${e.id}`);
          void this.play('npc/footsteps_wet', `steps:${e.id}`, 0, .22, lateral / 8);
        }
        if (e.id.startsWith('dropped-') && !this.spoken.has(e.id) && Math.abs(ahead) < 25) {
          this.spoken.add(e.id);
          this.voice('kick', e.riderId ?? e.id, .8);
          this.voice('kickLine', e.riderId ?? e.id, .9);
        } else if (e.id.startsWith('wreck-rider:') && !prior && !this.spoken.has(`wreck-scream:${e.id}`) &&
          ahead > -18 && ahead < 40) {
          const group = e.id.slice(0, e.id.lastIndexOf(':') + 1);
          const count = run.world.entities.filter(rider => rider.id.startsWith(group)).length;
          this.spoken.add(`wreck-scream:${e.id}`);
          this.voice('fall', e.riderId ?? e.id, 1 / Math.sqrt(count), lateral / 8);
        } else if (e.id.startsWith('wreck-rider:') && e.id.endsWith(':0') && !this.spoken.has(e.id) &&
          this.spoken.has(`wreck-scream:${e.id}`) && ![...this.voices].some(node =>
            node.riderId === (e.riderId ?? e.id) && isScream(node.event)) &&
          Math.abs(ahead) < 65) {
          this.spoken.add(e.id); this.voice('traffic', e.riderId ?? e.id,
            .8 * spatialVoiceVolume(ahead, e.x - run.x, 65, 65), (e.x - run.x) / 8);
        } else if (!e.id.startsWith('fallen-') && !this.spoken.has(`road-hit:${e.id}`) &&
          e.pickupable !== false && ahead > 0 && ahead < roadsideCallRange(run.speed) && Math.abs(e.x - run.x) < 9) {
          const volume = .62 * spatialVoiceVolume(ahead, e.x - run.x);
          this.voice(e.passengerType === 'grab' ? 'laugh' : 'call', e.riderId ?? e.id,
            volume, (e.x - run.x) / 8, 4.2, { entityId: e.id, range: 58, rearCutoff: 24, level: .62 });
        }
      }
      if (e.kind === 'traffic' && e.cargoDropped && prior && !prior.cargoDropped && run.world.entities.some(c => c.cargoSourceId === e.id))
        void this.play('interaction-v2/cargo_release.wav', 'cargo-release', .5, .7);
      if (e.kind === 'cargo' && !prior && e.cargoSourceId && e.distance - run.distance < 95)
        void this.play(`interaction-v2/cargo_${e.cargoType === 'barrel' ? 'barrel' : 'crate'}_roll.wav`, 'cargo-roll', .3, .45);
      if (!e.consumed && ahead > 0 && ahead < 18 && e.serviceRole === 'ambulance' && !this.near.has(e.id)) {
        this.near.add(e.id); void this.play('interaction-v2/ambulance_pass.wav', 'ambulance-pass', 2, .6);
      }
      this.entityState.set(e.id, { lastHit: e.lastHit, cargoDropped: !!e.cargoDropped, consumed: e.consumed,
        ahead, lateral: e.x - run.x, distance: e.distance, x: e.x });
    }
    this.trafficPairs = nextPairs; this.trafficHoles = nextHoles; this.trafficBlocks = nextBlocks;
    if (++this.sweepTick % 300 === 0) {
      const ids = new Set(run.world.entities.map(e => e.id));
      for (const id of this.entityState.keys()) if (!ids.has(id)) this.entityState.delete(id);
      for (const id of this.near) if (!ids.has(id.replace(/^(steps|train):/, ''))) this.near.delete(id);
      for (const id of this.trafficHorned) if (!ids.has(id)) this.trafficHorned.delete(id);
      for (const id of this.trafficPassed) if (!ids.has(id)) this.trafficPassed.delete(id);
    }
  }

  dispose(): void { this.reset(); void this.context?.close(); }
}
