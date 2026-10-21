import * as T from 'three';
/** Graded access road with shallow wheel ruts and irregular shoulders. */
export function createServiceRoad(material:T.Material){
 const g=new T.PlaneGeometry(7.5,166,36,220);g.rotateX(-Math.PI/2);const a=g.attributes['position']!,colors:number[]=[];
 for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i),ruts=Math.exp(-(((x-1.45)/.35)**2))+Math.exp(-(((x+1.45)/.35)**2)),edge=Math.abs(x)/3.75,grain=Math.sin(x*19+z*11)*Math.sin(z*17)*.006;a.setY(i,.022-ruts*.028+grain+edge**5*.016);if(edge>.94)a.setX(i,x+Math.sin(z*1.1)*.1+Math.sin(z*3.7)*.035);const shade=1-ruts*.12-edge**6*.06;colors.push(shade,shade,shade);}
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();const mesh=new T.Mesh(g,material);mesh.position.set(9,0,-56);mesh.name='rutted-service-road';mesh.receiveShadow=true;return mesh;
}
