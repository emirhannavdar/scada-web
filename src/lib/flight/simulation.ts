/** Deterministic illustrative 24 V supply; these are never device measurements. */
export function simulationSample(seconds:number){const t=Math.max(0,seconds);return {voltage:24+.04*Math.sin(t*.43)+.015*Math.sin(t*.17),packetAgeMs:Math.floor((t*4)%1*250),activity:Math.floor(t*8)%8===0||Math.floor(t*8)%8===2,status:'Bağlantı aktif',label:'SİMÜLASYON VERİSİ'};}
