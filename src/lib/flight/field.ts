import * as T from "three";
import type { Vec3 } from "./path";
export function fieldHeight(x: number, z: number) {
  const edge = Math.max(0, Math.min(1, (-z - 16) / 65));
  const road = Math.max(0, Math.min(1, (Math.abs(x - 9) - 5) / 12));
  const cross = Math.min(1, Math.abs(z + 57) / 6);
  return edge * road * cross * (0.55 * Math.sin(x * 0.028) + 0.42 * Math.sin(z * 0.047));
}
type Kit = {
  scene: T.Scene;
  geo: <G extends T.BufferGeometry>(g: G) => G;
  mat: (c: T.ColorRepresentation, r?: number, m?: number) => T.MeshStandardMaterial;
  basic: (c: T.ColorRepresentation) => T.MeshBasicMaterial;
  bodyGeo: T.BufferGeometry;
  canvasMap: (
    w: number,
    h: number,
    paint: (c: CanvasRenderingContext2D) => void,
  ) => T.Texture | null;
};

/** Plant layout, shared with world.ts and path.ts. Rows run east-west, tables face +z (south). */
export const MODULE_W = 1.134,
  MODULE_H = 2.28,
  TABLE_D = 2 * MODULE_H + 0.03,
  TILT = 0.36,
  ROW_PITCH = 7.4,
  ROW_Z0 = -121,
  ROWS = 17,
  WALKWAY = 3.5;
export const ROAD_WEST = 2.3,
  ROAD_EAST = 15.7,
  FIELD_WEST = -80,
  FIELD_EAST = 80,
  FENCE_SOUTH = 4,
  FENCE_NORTH = -130,
  FENCE_X = 81.8;
export const KIOSK_CLEAR = { minX: -8, maxX: 3, minZ: -63, maxZ: -50 };
export const CONTROL_HOUSE_CLEAR = { minX: 19, maxX: 29, minZ: -7.6, maxZ: 2 };
export const HERO_INVERTER: Vec3 = [15.45, 0, -47.9];
export type Table = {
  x: number;
  z: number;
  n: number;
  h: number;
  row: number;
  side: "west" | "east";
};
export function tableLength(n: number) {
  return n * MODULE_W + (n - 1) * 0.02;
}
/** Right-align west tables to the road, left-align east tables; fill with 20-module tables and one shorter remainder (>=8). */
export function planTables(): Table[] {
  const tables: Table[] = [];
  for (let row = 0; row < ROWS; row++) {
    const z = ROW_Z0 + row * ROW_PITCH;
    if (Math.abs(z + 57) < TABLE_D / 2 + 3.2) continue;
    const fill = (from: number, to: number, side: "west" | "east") => {
      const span = to - from;
      let used = 0;
      const list: number[] = [];
      while (span - used >= tableLength(20)) {
        list.push(20);
        used += tableLength(20) + WALKWAY;
      }
      const rest = span - used;
      const n = Math.floor((rest + 0.02) / (MODULE_W + 0.02));
      if (n >= 8) list.push(n);
      let cursor = side === "west" ? to : from;
      for (const n of list.filter((n) => n === 20)) {
        const L = tableLength(n);
        const x = side === "west" ? cursor - L / 2 : cursor + L / 2;
        cursor += side === "west" ? -(L + WALKWAY) : L + WALKWAY;
        const minX = x - L / 2,
          maxX = x + L / 2,
          minZ = z - TABLE_D / 2,
          maxZ = z + TABLE_D / 2;
        if (
          maxX > KIOSK_CLEAR.minX &&
          minX < KIOSK_CLEAR.maxX &&
          maxZ > KIOSK_CLEAR.minZ &&
          minZ < KIOSK_CLEAR.maxZ
        )
          continue;
        if (
          maxX > CONTROL_HOUSE_CLEAR.minX &&
          minX < CONTROL_HOUSE_CLEAR.maxX &&
          maxZ > CONTROL_HOUSE_CLEAR.minZ &&
          minZ < CONTROL_HOUSE_CLEAR.maxZ
        )
          continue;
        tables.push({ x, z, n, h: fieldHeight(x, z), row, side });
      }
    };
    fill(FIELD_WEST, ROAD_WEST, "west");
    fill(ROAD_EAST, FIELD_EAST, "east");
  }
  return tables;
}

export function buildSolarField({ scene, geo, mat, basic, bodyGeo, canvasMap }: Kit) {
  const root = new T.Group();
  root.name = "solar-field";
  scene.add(root);
  const meshes: T.InstancedMesh[] = [];
  const dummy = new T.Object3D();
  // One module: deep navy monocrystalline cells with chamfered corners, fine busbars, a thin aluminium frame drawn into the texture so tiled tables show module seams.
  const panelMap = canvasMap(512, 1024, (c) => {
    c.fillStyle = "#b9bec0";
    c.fillRect(0, 0, 512, 1024);
    c.fillStyle = "#0a1326";
    c.fillRect(8, 8, 496, 1008);
    const cw = 496 / 6,
      ch = 1008 / 12;
    for (let y = 0; y < 12; y++)
      for (let x = 0; x < 6; x++) {
        const xx = 8 + x * cw + 1.5,
          yy = 8 + y * ch + 1.5,
          w = cw - 3,
          h = ch - 3,
          k = 5;
        c.fillStyle = ["#0c1a38", "#0b1934", "#0d1b3b"][(x * 7 + y) % 3]!;
        c.beginPath();
        c.moveTo(xx + k, yy);
        c.lineTo(xx + w - k, yy);
        c.lineTo(xx + w, yy + k);
        c.lineTo(xx + w, yy + h - k);
        c.lineTo(xx + w - k, yy + h);
        c.lineTo(xx + k, yy + h);
        c.lineTo(xx, yy + h - k);
        c.lineTo(xx, yy + k);
        c.closePath();
        c.fill();
        c.strokeStyle = "#5d6a80";
        c.lineWidth = 0.9;
        for (let b = 1; b < 5; b++) {
          c.beginPath();
          c.moveTo(xx + (b * w) / 5, yy);
          c.lineTo(xx + (b * w) / 5, yy + h);
          c.stroke();
        }
        c.strokeStyle = "#162544";
        c.lineWidth = 0.35;
        for (let f = 1; f < 22; f++) {
          c.beginPath();
          c.moveTo(xx, yy + (f * h) / 22);
          c.lineTo(xx + w, yy + (f * h) / 22);
          c.stroke();
        }
      }
  });
  if (panelMap) {
    panelMap.wrapS = panelMap.wrapT = T.RepeatWrapping;
    panelMap.anisotropy = 8;
  }
  const glass = new T.MeshBasicMaterial({
    color: panelMap ? "#ffffff" : "#0c1a38",
    map: panelMap,
    toneMapped: false,
  });
  const rim = basic("#52646a"),
    backsheet = mat("#cfd3d0", 0.9);
  glass.name = "pv-glass";
  rim.name = "pv-frame";
  backsheet.name = "pv-backsheet";
  const galvanized = mat("#9aa3a6", 0.55, 0.75),
    concrete = mat("#aaa898", 1),
    gravel = mat("#a7997c", 1),
    wire = mat("#67736e", 1),
    cabinet = mat("#d6d6c8", 0.9),
    dark = mat("#374b51", 1),
    ditch = mat("#6f6552", 1);
  const batches = new Map<T.Material, T.Matrix4[]>();
  const box = (m: T.Material, p: Vec3, size: Vec3, rx = 0, ry = 0) => {
    dummy.position.set(...p);
    dummy.scale.set(...size);
    dummy.rotation.set(rx, ry, 0);
    dummy.updateMatrix();
    const a = batches.get(m) ?? [];
    a.push(dummy.matrix.clone());
    batches.set(m, a);
  };

  const tables = planTables();
  root.userData["moduleCount"] = tables.reduce((s, t) => s + t.n * 2, 0);
  // Table geometry per module count: a thin box whose UVs tile the module texture n x 2.
  const tableGeo = new Map<number, T.BufferGeometry>();
  const tableGeometry = (n: number) => {
    let g = tableGeo.get(n);
    if (!g) {
      g = geo(new T.BoxGeometry(tableLength(n), 0.05, TABLE_D));
      const uv = g.attributes["uv"]!;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * n, uv.getY(i) * 2);
      tableGeo.set(n, g);
    }
    return g;
  };
  const byLength = new Map<number, Table[]>();
  for (const t of tables) {
    const a = byLength.get(t.n) ?? [];
    a.push(t);
    byLength.set(t.n, a);
  }
  const centreHeight = 1.5;
  for (const [n, list] of byLength) {
    const surfaces = new T.InstancedMesh(
      tableGeometry(n),
      [rim, rim, glass, backsheet, rim, rim],
      list.length,
    );
    surfaces.name = `pv-tables-${n}`;
    list.forEach((t, i) => {
      dummy.position.set(t.x, t.h + centreHeight, t.z);
      dummy.rotation.set(TILT, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      surfaces.setMatrixAt(i, dummy.matrix);
    });
    surfaces.castShadow = true;
    surfaces.receiveShadow = true;
    root.add(surfaces);
    meshes.push(surfaces);
  }
  // Soft shadow decal under each table (sun from +x,+y,+z => shadow to -x,-z), sized to the table.
  const shadowMap = canvasMap(256, 64, (c) => {
    c.clearRect(0, 0, 256, 64);
    c.filter = "blur(5px)";
    c.fillStyle = "#000000";
    c.fillRect(10, 8, 236, 48);
  });
  const shadowMat = new T.MeshBasicMaterial({
    name: "contact-shadow-decal",
    map: shadowMap,
    transparent: true,
    opacity: shadowMap ? 0.45 : 0,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  shadowMat.color.set("#171c22");
  const decalGeo = geo(new T.PlaneGeometry(1, 1));
  decalGeo.rotateX(-Math.PI / 2);
  const decals = new T.InstancedMesh(decalGeo, shadowMat, tables.length);
  tables.forEach((t, i) => {
    dummy.position.set(t.x - 1.0, t.h + 0.015, t.z - 0.85);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(tableLength(t.n) + 0.6, 1, TABLE_D * Math.cos(TILT) + 0.9);
    dummy.updateMatrix();
    decals.setMatrixAt(i, dummy.matrix);
  });
  decals.name = "table-contact-shadows";
  decals.renderOrder = 1;
  root.add(decals);
  meshes.push(decals);
  // Racking: front and rear post pairs every ~2.85 m, tilted rafters, two purlins along the table, concrete footings.
  const sin = Math.sin(TILT),
    cos = Math.cos(TILT);
  for (const t of tables) {
    const L = tableLength(t.n),
      pairs = Math.max(2, Math.round(L / 2.85));
    for (let k = 0; k < pairs; k++) {
      const x = t.x - L / 2 + 0.6 + (L - 1.2) * (k / (pairs - 1));
      for (const dz of [-1.55, 1.55]) {
        const height = centreHeight - sin * dz - 0.08;
        box(galvanized, [x, t.h + height / 2, t.z + dz], [0.07, height, 0.08]);
        box(concrete, [x, t.h + 0.06, t.z + dz], [0.3, 0.12, 0.34]);
      }
      box(galvanized, [x, t.h + centreHeight - 0.06, t.z], [0.05, 0.06, TABLE_D * 0.92], TILT);
    }
    for (const dz of [-1.35, 1.35])
      box(
        galvanized,
        [t.x, t.h + centreHeight - sin * dz - 0.05, t.z + dz * cos],
        [L, 0.05, 0.06],
        TILT,
      );
    // Roadside cabinets removed: the opening camera made two of them look like floating panels.
  }
  // Service tracks: central cross track in the row gap, perimeter gravel on all four sides, drainage ditches along the main road.
  box(gravel, [-39, 0.015, -58.1], [83, 0.035, 3.2]);
  box(gravel, [48, 0.015, -58.1], [64, 0.035, 3.2]);
  for (const x of [-81, 81]) box(gravel, [x, 0.015, -63], [3.5, 0.03, 134]);
  box(gravel, [0, 0.015, -129], [163, 0.03, 3.5]);
  box(gravel, [-35, 0.015, 1.5], [93, 0.03, 3.5]);
  box(gravel, [47, 0.015, 1.5], [67, 0.03, 3.5]);
  for (const x of [5.0, 13.0]) {
    box(ditch, [x, -0.1, -55], [0.9, 0.12, 150]);
  }
  // Fence on all four sides with the service gate in the south line, in front of the control house.
  for (const x of [-FENCE_X, FENCE_X]) {
    for (let i = 0; i < 45; i++)
      box(galvanized, [x, 0.95, FENCE_NORTH + 1 + i * 3], [0.065, 1.9, 0.065]);
    for (const y of [0.45, 1.1, 1.75])
      box(wire, [x, y, (FENCE_NORTH + FENCE_SOUTH) / 2], [0.016, 0.016, FENCE_SOUTH - FENCE_NORTH]);
  }
  for (const z of [FENCE_NORTH, FENCE_SOUTH])
    for (let i = 0; i < 55; i++) {
      const x = -81 + i * 3;
      if (z === FENCE_SOUTH && x > 5 && x < 13) continue;
      box(galvanized, [x, 0.95, z], [0.065, 1.9, 0.065]);
      box(wire, [x, 1.2, z], [2.95, 0.016, 0.016]);
    }
  for (const x of [5.2, 12.8]) box(galvanized, [x, 1.15, FENCE_SOUTH], [0.13, 2.3, 0.13]);
  const fenceMap = canvasMap(64, 64, (c) => {
    c.clearRect(0, 0, 64, 64);
    c.strokeStyle = "#b0b9b2";
    c.lineWidth = 1.2;
    for (let i = -64; i <= 128; i += 32) {
      c.beginPath();
      c.moveTo(i, 0);
      c.lineTo(i + 64, 64);
      c.moveTo(i, 0);
      c.lineTo(i - 64, 64);
      c.stroke();
    }
  });
  if (fenceMap) {
    fenceMap.wrapS = fenceMap.wrapT = T.RepeatWrapping;
    fenceMap.repeat.set(80, 1.1);
  }
  const fenceMat = basic("#8c9c99");
  fenceMat.map = fenceMap;
  fenceMat.transparent = true;
  fenceMat.opacity = 0.34;
  fenceMat.side = T.DoubleSide;
  fenceMat.depthWrite = false;
  const fencePlane = geo(new T.PlaneGeometry(1, 1));
  for (const [x, z, w, rotation] of [
    [-FENCE_X, -63, 134, Math.PI / 2],
    [FENCE_X, -63, 134, Math.PI / 2],
    [0, FENCE_NORTH, 163.6, 0],
    [-38.3, FENCE_SOUTH, 87, 0],
    [47.3, FENCE_SOUTH, 69, 0],
  ] as const) {
    const mesh = new T.Mesh(fencePlane, fenceMat);
    mesh.position.set(x, 1.05, z);
    mesh.scale.set(w, 1.4, 1);
    mesh.rotation.y = rotation;
    mesh.name = "field-mesh-fence";
    root.add(mesh);
  }
  // Weather station inside the array, in a walkway: plane-of-array pyranometer, ambient sensor, anemometer.
  const weather = new T.Group();
  weather.name = "field-weather-station";
  weather.position.set(-22.15, fieldHeight(-22.15, -50.7), -50.7);
  root.add(weather);
  const part = (m: T.Material, p: Vec3, size: Vec3) => {
    const mesh = new T.Mesh(bodyGeo, m);
    mesh.position.set(...p);
    mesh.scale.set(...size);
    mesh.castShadow = true;
    weather.add(mesh);
    return mesh;
  };
  part(concrete, [0, 0.1, 0], [0.7, 0.2, 0.7]);
  part(galvanized, [0, 1.6, 0], [0.075, 3.2, 0.075]);
  part(galvanized, [0, 2.9, 0], [1.6, 0.05, 0.05]);
  const poa = part(cabinet, [-0.65, 2.95, 0], [0.2, 0.08, 0.2]);
  poa.rotation.x = TILT;
  part(dark, [-0.65, 3.0, 0], [0.12, 0.025, 0.12]).rotation.x = TILT;
  part(cabinet, [0, 1.2, 0.12], [0.3, 0.48, 0.18]);
  part(galvanized, [0.65, 3.2, 0], [0.035, 0.6, 0.035]);
  const cupGeo = geo(new T.SphereGeometry(0.07, 10, 6));
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3,
      x = 0.65 + Math.cos(angle) * 0.2,
      z = Math.sin(angle) * 0.2;
    const arm = part(galvanized, [(x + 0.65) / 2, 3.45, z / 2], [0.22, 0.02, 0.02]);
    arm.rotation.y = -angle;
    const cup = new T.Mesh(cupGeo, dark);
    cup.position.set(x, 3.45, z);
    weather.add(cup);
  }
  // Sector labels along the south fence: maintenance identifiers only.
  for (const [index, x] of [-76, -48, -20, 25, 50, 74].entries()) {
    box(galvanized, [x, 0.5, FENCE_SOUTH - 2], [0.035, 1, 0.035]);
    const map = canvasMap(128, 64, (c) => {
      c.fillStyle = "#d3d7c9";
      c.fillRect(0, 0, 128, 64);
      c.fillStyle = "#314650";
      c.font = "600 27px sans-serif";
      c.textAlign = "center";
      c.fillText(`A-${String(index + 1).padStart(2, "0")}`, 64, 42);
    });
    const labelMat = basic("#ffffff");
    labelMat.map = map;
    const sign = new T.Mesh(geo(new T.PlaneGeometry(0.6, 0.3)), labelMat);
    sign.position.set(x, 1.04, FENCE_SOUTH - 1.96);
    sign.name = "field-sector-label";
    root.add(sign);
  }
  for (const [material, matrices] of batches) {
    const mesh = new T.InstancedMesh(bodyGeo, material, matrices.length);
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.name =
      material === galvanized
        ? "field-steel-racks"
        : material === gravel
          ? "field-old-service-surfaces"
          : "field-detail-batch";
    mesh.castShadow = material === galvanized || material === cabinet;
    mesh.receiveShadow = true;
    root.add(mesh);
    meshes.push(mesh);
  }
  root.userData["tables"] = tables.length;
  root.userData["moduleCoordinates"] = [];
  root.userData["terrainFollowing"] = true;
  return {
    tables,
    dispose() {
      meshes.forEach((m) => m.dispose());
      glass.dispose();
    },
  };
}
