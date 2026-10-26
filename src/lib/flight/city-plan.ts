export type CityBuilding={id:string;x:number;z:number;w:number;d:number;h:number;kind:'tower'|'apartment'|'villa'|'civic';seed:number};
export const cityPark={x:76,z:34,w:22,d:32};
export const cityRoadX=[-260,-220,-180,-140,-100,-52,50,100,140,180,220,260];
export const cityRoadZ=[-260,-220,-180,-140,-100,-62,-16,62,100,140,180,220,260];
export const parkingBlocks=[] as const;
/** Meter-scale mixed residential districts and a rear business skyline; the hero building is separate. */
export function cityPlan():CityBuilding[]{
 const positions=[[-74,-80],[-24,-80],[22,-80],[75,-80],[-74,-38],[-26,-35],[22,-37],[76,-38],[-74,30],[-28,30],[-74,80],[-25,80],[22,80],[74,80]];
 for(const x of [-240,-200,-160,-120,-74,-26,22,76,120,160,200,240])for(const z of [-240,-200,-160,-120,120,160,200,240])positions.push([x,z]);
 for(const x of [-240,-200,-160,-120,120,160,200,240])for(const z of [-80,-38,30,80])positions.push([x,z]);
 return positions.map(([xx,zz],i)=>{
  const x=xx!,z=zz!;
  // Skyline stays behind the destination, clear of the entire descending camera corridor.
  const tower=z<=-80&&Math.abs(x)<125&&(i%7===0||i===1||i===2);
  const apartment=!tower&&((z<0&&Math.abs(x)<165&&i%3!==0)||i%9===0);
  const kind:CityBuilding['kind']=tower?'tower':apartment?'apartment':'villa';
  const floors=tower?15+(i%5)*3:apartment?3+i%6:1+i%2;
  return {id:`district-home-${i}`,x,z,w:tower?16:apartment?14+i%3:10+i%4,d:tower?16:apartment?14:10+i%4,h:floors*3,kind,seed:i+1};
 });
}
