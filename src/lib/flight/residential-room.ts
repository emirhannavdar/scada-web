import * as T from "three";
import { fitImported, trackImported } from "./imported-models";
type Resources = {
  geometries: Set<T.BufferGeometry>;
  materials: Set<T.Material>;
  maps: Set<T.Texture>;
};
export type FurnitureKind =
  "furniture_sofa" | "furniture_table" | "furniture_desk" | "furniture_bookshelf";
export const furnitureLayout = {
  furniture_sofa: {
    name: "residential-sectional-sofa",
    width: 3.65,
    x: 16,
    z: 5.6,
    y: 0.018,
    rotation: Math.PI,
  },
  furniture_table: {
    name: "residential-coffee-table",
    width: 1.15,
    x: 15.7,
    z: 5.1,
    y: 0.018,
    rotation: 0,
  },
  furniture_desk: {
    name: "residential-office-desk",
    width: 2.155,
    x: 20,
    z: 3.39,
    y: 0,
    rotation: 0,
  },
  furniture_bookshelf: {
    name: "residential-bookshelf",
    width: 1.85,
    x: 23.1,
    z: -1.65,
    y: 0.004,
    rotation: 0,
  },
} as const;
export function installFurniture(
  room: T.Object3D,
  kind: FurnitureKind,
  source: T.Object3D,
  r: Resources,
) {
  let root = room.getObjectByName("residential-furniture");
  if (!root) {
    root = new T.Group();
    root.name = "residential-furniture";
    room.add(root);
  }
  const layout = furnitureLayout[kind],
    model = fitImported(source, layout.width, "x");
  model.name = layout.name;
  model.position.set(layout.x, layout.y, layout.z);
  model.rotation.y = layout.rotation;
  model.userData["physicalPlacement"] = { ...layout };
  model.traverse((o) => {
    o.layers.set(2);
    if (o instanceof T.Mesh) {
      o.castShadow = false;
      o.receiveShadow = true;
    }
  });
  trackImported(model, r);
  model.traverse((o) => {
    if (o instanceof T.Mesh) o.castShadow = false;
  });
  root.add(model);
  return model;
}
/** Build a coherent living/work room around the fixed, interactive monitor and camera aperture. */
export function furnishRoomShell(room: T.Group, r: Resources) {
  if (room.userData["interiorLayoutVersion"] === 36) return;
  room.userData["interiorLayoutVersion"] = 36;
  const root = new T.Group();
  root.name = "residential-room-dressing";
  room.add(root);
  const geometry = new T.BoxGeometry();
  r.geometries.add(geometry);
  const material = (color: string, basic = false) => {
    const m = basic
      ? new T.MeshBasicMaterial({ color })
      : new T.MeshStandardMaterial({ color, roughness: 0.9 });
    r.materials.add(m);
    return m;
  };
  const wall = material("#c4bba9"),
    trim = material("#e5dece"),
    dark = material("#222c30"),
    rug = material("#737d76"),
    livingRug = material("#b3a594"),
    wood = (room.getObjectByName("home-floorboards") as T.Mesh).material as T.Material,
    leaves = material("#4b6750"),
    warm = material("#ead7ad", true);
  const batches = new Map<T.Material, T.Matrix4[]>(),
    pose = new T.Object3D();
  const box = (m: T.Material, x: number, y: number, z: number, w: number, h: number, d: number) => {
    const list = batches.get(m) ?? [];
    pose.position.set(x, y, z);
    pose.scale.set(w, h, d);
    pose.updateMatrix();
    list.push(pose.matrix.clone());
    batches.set(m, list);
  };
  // Internal partitions reduce the oversized source room to a believable 12 × 12.7 m loft.
  box(wall, 19, 1.6, -2.2, 12, 3.2, 0.16);
  box(wall, 13, 1.6, 4.15, 0.16, 3.2, 12.7);
  box(wall, 25, 1.6, 4.15, 0.16, 3.2, 12.7);
  box(trim, 19, 3.28, 4.15, 12, 0.14, 12.7);
  box(dark, 20, 3.18, 3.4, 1.5, 0.045, 0.12);
  box(warm, 20, 3.15, 3.4, 1.4, 0.015, 0.08);
  box(trim, 19, 0.08, -2.08, 11.8, 0.16, 0.04);
  for (const x of [13.1, 24.9]) box(trim, x, 0.08, 4.15, 0.04, 0.16, 12.5);
  const floor = room.getObjectByName("home-floorboards") as T.InstancedMesh,
    plank = new T.Object3D();
  for (let row = 0; row < 28; row++)
    for (let col = 0; col < 8; col++) {
      plank.position.set(13.75 + col * 1.5, -0.003, -1.975 + row * 0.45);
      plank.scale.set(0.76, 1, 0.759);
      plank.updateMatrix();
      floor.setMatrixAt(row * 8 + col, plank.matrix);
    }
  floor.instanceMatrix.needsUpdate = true;
  floor.boundingSphere = null;
  floor.boundingBox = null;
  box(livingRug, 16, 0.009, 4.6, 5.2, 0.014, 6.1);
  box(rug, 20, 0.009, 3.6, 3.3, 0.014, 3.6);
  // Low media joinery, an off television and shelving define the sitting area.
  box(wood, 16, 0.38, -1.72, 2.6, 0.7, 0.65);
  box(dark, 16, 1.65, -2.075, 1.85, 1.06, 0.06);
  box(dark, 16, 1.65, -2.035, 1.78, 0.99, 0.012);
  for (const x of [15.2, 16, 16.8]) box(dark, x, 0.39, -1.38, 0.64, 0.012, 0.012);
  box(wood, 22.8, 0.4, 7.3, 2.4, 0.75, 0.42);
  for (const x of [22.05, 22.8, 23.55]) box(trim, x, 0.7, 7.52, 0.62, 0.02, 0.015);
  box(wood, 20.85, 0.7775, 3.18, 0.28, 0.025, 0.19);
  box(trim, 20.85, 0.799, 3.18, 0.21, 0.018, 0.16);
  // Realistic dimensions for a floor lamp, planter, and a restrained company artwork.
  box(dark, 17.9, 1.12, 7.7, 0.025, 2.24, 0.025);
  box(dark, 17.9, 0.04, 7.7, 0.36, 0.06, 0.36);
  box(trim, 17.9, 2.15, 7.7, 0.45, 0.32, 0.45);
  box(warm, 17.9, 1.99, 7.7, 0.39, 0.012, 0.39);
  box(trim, 23.5, 0.25, 6.7, 0.43, 0.5, 0.43);
  for (let i = 0; i < 7; i++)
    box(
      leaves,
      23.5 + Math.sin(i * 2.4) * 0.24,
      0.8 + (i % 3) * 0.2,
      6.7 + Math.cos(i * 2.4) * 0.24,
      0.09,
      0.85,
      0.09,
    );
  const bayraktarMap = new T.TextureLoader().load("/assets/bayraktar-solar-ges-artwork.jpg");
  bayraktarMap.colorSpace = T.SRGBColorSpace;
  bayraktarMap.anisotropy = 4;
  r.maps.add(bayraktarMap);
  const artwork = material("#ffffff", true) as T.MeshBasicMaterial;
  artwork.map = bayraktarMap;
  artwork.toneMapped = false;
  // Photoreal GES artwork; Bayraktar Solar appears only as a discreet lower-right signature.
  box(dark, 20.25, 1.78, -2.075, 2.72, 0.96, 0.04);
  box(artwork, 20.25, 1.78, -2.048, 2.58, 0.82, 0.012);
  const mouseGeometry = new T.SphereGeometry(1, 12, 8);
  r.geometries.add(mouseGeometry);
  const mouse = new T.Mesh(mouseGeometry, trim);
  mouse.name = "desk-mouse";
  mouse.position.set(20.48, 0.786, 3.58);
  mouse.scale.set(0.034, 0.021, 0.058);
  mouse.layers.set(2);
  root.add(mouse);
  // Tower below the desk, separate from the seated person's feet and the camera.
  box(dark, 19.15, 0.3, 3.38, 0.23, 0.6, 0.46);
  box(trim, 19.15, 0.48, 3.62, 0.15, 0.015, 0.01);
  for (const [m, matrices] of batches) {
    const mesh = new T.InstancedMesh(geometry, m, matrices.length);
    matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.name = "residential-shell-batch";
    mesh.layers.set(2);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  root.userData["floorY"] = 0;
  root.userData["dimensions"] = [12, 3.2, 12.7];
}
