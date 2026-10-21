import {turkeyUp,usaUp} from './geography';
/** Opposite presentation states, anchored geographically; no claim of a live ephemeris. */
export function earthSunDirection(fieldNight:boolean){return turkeyUp.clone().sub(usaUp).normalize().multiplyScalar(fieldNight?-1:1);}
