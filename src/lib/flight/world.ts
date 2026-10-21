import { earthSunDirection } from "./day-night";
import { buildFieldSky, fieldSunDirection } from "./field-sky";
import { buildScadaDevice } from "./scada-device";
import { HERO_INVERTER } from "./field";
import { setModelPreparer, abortModelLoads } from "./model-loader";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { prepareDisplayTexture } from "./screen-texture";
import { loadAdditionalModels } from "./additional-models";
import { loadUserModels } from "./user-models";
import { loadImportedModels } from "./imported-models";
import { createServiceRoad } from "./service-road";
import { buildFieldCraft } from "./field-craft";
import { applySurface } from "./surface-materials";
import * as T from "three";
import { buildNightCity } from "./city";
import { buildSolarField, fieldHeight } from "./field";
import { buildKiosk } from "./kiosk";
import { buildSiteActivity } from "./site-activity";
import { terrainHeight } from "./terrain";
import {
  globeOrientation,
  geographicNormal,
  geographicAnchors,
  destinationOrientation,
  destinationOrigin,
  usaUp,
  turkeyUp,
  globeCenter,
} from "./geography";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { flightPose, ease, nightToWorld, type Vec3 } from "./path";

export type FlightWorld = {
  scene: T.Scene;
  camera: T.PerspectiveCamera;
  update: (p: number, aspect: number) => void;
  dispose: () => void;
  screen: T.Mesh;
  inverter: T.Group;
  scada: T.Group;
  tick?: (seconds: number) => boolean;
  setCityDay?: (day: boolean) => void;
  setDayNight?: (fieldNight: boolean) => void;
  textureReady: Promise<void>;
  startStreaming: () => void;
};
// Procedural scene scaffold; supplied scans and models replace their targets after loading.
export function createFlightWorld({
  textures = true,
  onTextureError = () => {},
  onLoadProgress = () => {},
  onSceneChange = () => {},
  prepareModel,
}: {
  textures?: boolean;
  onTextureError?: () => void;
  onLoadProgress?: (value: number) => void;
  onSceneChange?: () => void;
  prepareModel?: (model: GLTF) => Promise<void>;
} = {}): FlightWorld {
  const loadingManager = new T.LoadingManager();
  if (prepareModel) setModelPreparer(loadingManager, prepareModel);
  let loadProgress = 0;
  loadingManager.onProgress = (_url, loaded, total) => {
    loadProgress = Math.max(loadProgress, Math.min(0.85, (loaded / Math.max(1, total)) * 0.85));
    onLoadProgress(loadProgress);
  };
  const scene = new T.Scene();
  scene.background = new T.Color("#adbfc7");
  scene.fog = new T.FogExp2("#b1c1c7", 0.0022);
  const camera = new T.PerspectiveCamera(46, 1, 0.06, 12000);
  const geometries = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>(),
    maps = new Set<T.Texture>();
  const geo = <G extends T.BufferGeometry>(g: G) => {
    geometries.add(g);
    return g;
  };
  const mat = (c: T.ColorRepresentation, roughness = 0.6, metalness = 0) => {
    const m = new T.MeshStandardMaterial({ color: c, roughness, metalness });
    materials.add(m);
    return m;
  };
  const basic = (c: T.ColorRepresentation) => {
    const m = new T.MeshBasicMaterial({ color: c });
    materials.add(m);
    return m;
  };
  const iron = mat("#39454b", 0.43, 0.72),
    silver = mat("#b9c5c9", 0.3, 0.8),
    cream = mat("#e1e1d9", 0.55, 0.3),
    rubber = mat("#182329", 0.8),
    pcb = mat("#1d6552", 0.7),
    gold = mat("#bb8c43", 0.36, 0.7),
    blue = mat("#125693", 0.28, 0.35),
    orange = mat("#e77736", 0.4, 0.3),
    dark = mat("#091e2d", 0.28, 0.45),
    wood = mat("#99846c", 0.86),
    concrete = mat("#a0a39b", 0.93),
    black = mat("#1c2328", 0.4, 0.2);
  const bodyGeo = geo(new T.BoxGeometry(1, 1, 1));
  const roundGeo = geo(new RoundedBoxGeometry(1, 1, 1, 2, 0.055));
  function box(parent: T.Object3D, m: T.Material, pos: Vec3, size: Vec3, rounded = false) {
    const mesh = new T.Mesh(rounded ? roundGeo : bodyGeo, m);
    mesh.position.set(...pos);
    mesh.scale.set(...size);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(parent: T.Object3D, m: T.Material, pos: Vec3, radius: number, height: number) {
    const mesh = new T.Mesh(geo(new T.CylinderGeometry(radius, radius, height, 16)), m);
    mesh.position.set(...pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cable(parent: T.Object3D, points: Vec3[], color: string, radius = 0.016) {
    const curve = new T.CatmullRomCurve3(points.map((v) => new T.Vector3(...v)));
    const mesh = new T.Mesh(
      geo(new T.TubeGeometry(curve, 48, radius, 6, false)),
      mat(color, 0.55, 0.2),
    );
    parent.add(mesh);
    return curve;
  }
  function canvasMap(w: number, h: number, paint: (c: CanvasRenderingContext2D) => void) {
    if (!textures) return null;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    paint(ctx);
    const tex = new T.CanvasTexture(canvas);
    tex.colorSpace = T.SRGBColorSpace;
    maps.add(tex);
    return tex;
  }
  function placard(
    parent: T.Object3D,
    text: string,
    pos: Vec3,
    width: number,
    height: number,
    bg = "#dbe2df",
    fg = "#243239",
  ) {
    const map = canvasMap(768, 192, (c) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, 768, 192);
      c.fillStyle = fg;
      c.font = "600 58px sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, 384, 100);
    });
    const m = new T.MeshBasicMaterial({ color: map ? "white" : bg, map, toneMapped: false });
    materials.add(m);
    const mesh = new T.Mesh(geo(new T.PlaneGeometry(width, height)), m);
    mesh.position.set(...pos);
    parent.add(mesh);
    return mesh;
  }
  const sky = new Sky();
  sky.scale.setScalar(900);
  sky.material.uniforms["turbidity"]!.value = 7;
  sky.material.uniforms["rayleigh"]!.value = 1.1;
  sky.material.uniforms["mieCoefficient"]!.value = 0.006;
  sky.material.uniforms["mieDirectionalG"]!.value = 0.8; // Warm atmospheric scattering; no hard procedural second sun behind the disc.
  sky.material.fragmentShader = sky.material.fragmentShader.replace(
    "gl_FragColor = vec4( retColor, 1.0 );",
    `vec3 viewDir=normalize(vWorldPosition-cameraPosition);
 float elevation=clamp(viewDir.y,0.,1.);
 vec3 horizon=vec3(1.0,.24,.045);vec3 zenith=vec3(.27,.18,.29);
 vec3 sunset=mix(horizon,zenith,pow(elevation,.66));
 float glow=pow(max(dot(viewDir,normalize(vSunDirection)),0.),6.);
 sunset+=vec3(.32,.12,.025)*glow;
 gl_FragColor=vec4(sunset,1.);`,
  );
  const sun = fieldSunDirection;
  sky.material.uniforms["sunPosition"]!.value.copy(sun);
  scene.add(sky);
  geometries.add(sky.geometry);
  materials.add(sky.material);
  const fieldSky = buildFieldSky({ geo, mat, basic, bodyGeo, canvasMap });
  fieldSky.materials.forEach((m) => materials.add(m));
  scene.add(fieldSky.root);
  const daylight = new T.HemisphereLight("#c9e5ff", "#6c654c", 1.65);
  scene.add(daylight);
  const sunlight = new T.DirectionalLight("#ffefd8", 2.8);
  sunlight.position.set(60, 80, 25);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  sunlight.shadow.bias = -0.00025;
  sunlight.shadow.normalBias = 0.018;
  sunlight.shadow.camera.near = 0.1;
  sunlight.shadow.camera.far = 200;
  sunlight.shadow.radius = 3;
  scene.add(sunlight, sunlight.target);
  const fill = new T.DirectionalLight("#b9d7f1", 0.55);
  fill.position.set(-30, 20, 30);
  scene.add(fill);
  // Dry, gently undulating terrain. The specimen photo is never used as a backdrop.
  const groundMap = canvasMap(512, 512, (c) => {
    c.fillStyle = "#918269";
    c.fillRect(0, 0, 512, 512);
    let seed = 15;
    for (let i = 0; i < 22000; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const x = seed % 512;
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const y = seed % 512;
      c.fillStyle = i % 3 ? "#736b5444" : "#c0b49a66";
      c.fillRect(x, y, 2, 2);
    }
  });
  if (groundMap) {
    groundMap.wrapS = groundMap.wrapT = T.RepeatWrapping;
    groundMap.repeat.set(28, 28);
  }
  const groundMat = mat("#a99c80", 0.99);
  groundMat.map = groundMap;
  groundMat.bumpMap = groundMap;
  groundMat.bumpScale = 0.055;
  const landGeo = geo(new T.PlaneGeometry(750, 750, 250, 250));
  landGeo.rotateX(-Math.PI / 2);
  const positions = landGeo.attributes["position"]!;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      z = positions.getZ(i);
    positions.setY(i, terrainHeight(x, z) - 0.09);
  }
  landGeo.computeVertexNormals();
  const terrainColors: number[] = [];
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i),
      x = positions.getX(i),
      z = positions.getZ(i),
      normal = landGeo.attributes["normal"]!.getY(i),
      patch =
        Math.sin(x * 0.083 + Math.sin(z * 0.031) * 2) * Math.cos(z * 0.057) +
        0.4 * Math.sin(x * 0.19 - z * 0.13),
      color = new T.Color(
        normal < 0.8
          ? "#cbc9c2"
          : y > 8 && patch > 0.65
            ? "#ffffff"
            : patch < -0.45
              ? "#d1c9b8"
              : "#ede6d8",
      );
    terrainColors.push(color.r, color.g, color.b);
  }
  landGeo.setAttribute("color", new T.Float32BufferAttribute(terrainColors, 3));
  groundMat.vertexColors = true;
  groundMat.color.set("#ffffff");
  const land = new T.Mesh(landGeo, groundMat);
  land.receiveShadow = true;
  land.name = "scanned-rocky-terrain";
  scene.add(land);
  const groundReady = Promise.resolve();
  const shoulder = mat("#b0a58d", 1),
    curb = mat("#babbb0", 0.98);
  const trackMap = canvasMap(256, 512, (c) => {
    c.fillStyle = "#a49271";
    c.fillRect(0, 0, 256, 512);
    let seed = 83;
    for (let i = 0; i < 7000; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const x = seed % 256;
      seed = (seed * 1664525 + 1013904223) >>> 0;
      c.fillStyle = i % 3 ? "#6d654344" : "#d2c3a966";
      c.fillRect(x, seed % 512, 2, 3);
    }
    for (const x of [65, 180]) {
      c.fillStyle = "#786c5140";
      c.fillRect(x, 0, 16, 512);
    }
  });
  if (trackMap) {
    trackMap.wrapS = trackMap.wrapT = T.RepeatWrapping;
    trackMap.repeat.set(1, 18);
  }
  const dirt = mat("#b4a081", 1);
  dirt.map = trackMap;
  dirt.bumpMap = trackMap;
  dirt.bumpScale = 0.045;
  const tracks = new T.Group();
  tracks.name = "site-dirt-roads";
  scene.add(tracks);
  box(tracks, shoulder, [9, -0.01, -56], [9, 0.04, 166]);
  const road = createServiceRoad(dirt);
  geometries.add(road.geometry);
  dirt.vertexColors = true;
  tracks.add(road);
  box(tracks, dirt, [-3, 0.025, -55.8], [13, 0.04, 17]);
  box(tracks, dirt, [19, 0.025, 1], [14, 0.04, 2.8]);
  applySurface(concrete, "concrete", canvasMap, 2);
  applySurface(silver, "zinc", canvasMap, 2);
  const bark = mat("#76614b", 1),
    leaf = mat("#576b48", 1);
  const trunkGeo = geo(new T.CylinderGeometry(0.12, 0.18, 1.8, 7)),
    leafGeo = geo(new T.IcosahedronGeometry(1.05, 1));
  const trunks = new T.InstancedMesh(trunkGeo, bark, 58),
    crowns = new T.InstancedMesh(leafGeo, leaf, 58),
    treeDummy = new T.Object3D();
  for (let i = 0; i < 58; i++) {
    const side = (i < 29 ? -1 : 1) * (104 + ((i * 19.71) % 39)),
      z = -140 + ((i * 37.91) % 172);
    const base = terrainHeight(side, z);
    treeDummy.position.set(side, base + 0.9, z);
    treeDummy.scale.set(1, 1, 1);
    treeDummy.updateMatrix();
    trunks.setMatrixAt(i, treeDummy.matrix);
    treeDummy.position.y = base + 2.35;
    treeDummy.scale.set(0.85 + (i % 3) * 0.15, 1.25, 1);
    treeDummy.updateMatrix();
    crowns.setMatrixAt(i, treeDummy.matrix);
  }
  trunks.name = "legacy-field-trunks";
  crowns.name = "legacy-field-crowns";
  trunks.count = crowns.count = 18;
  trunks.castShadow = crowns.castShadow = true;
  scene.add(trunks, crowns);
  const pebbles = new T.InstancedMesh(geo(new T.IcosahedronGeometry(1, 0)), mat("#928d77", 1), 240);
  for (let i = 0; i < 240; i++) {
    treeDummy.position.set(
      (i % 2 ? -59 : 55) + Math.sin(i * 2.71) * 1.7,
      0.06,
      -99 + (i / 240) * 120,
    );
    treeDummy.scale.set(0.08 + (i % 5) * 0.025, 0.04, 0.12);
    treeDummy.updateMatrix();
    pebbles.setMatrixAt(i, treeDummy.matrix);
  }
  scene.add(pebbles);

  const rural = new T.Group();
  rural.name = "rural-landscape";
  scene.add(rural);
  const hillMat = mat("#68766c", 1),
    farmSoil = mat("#8c8265", 1),
    farmGreen = mat("#7b8060", 1),
    serviceRoof = mat("#7a8685", 1);
  // Terrain-following boulders and scrub fill the margins without entering the array or service roads.
  const rocks = new T.InstancedMesh(geo(new T.IcosahedronGeometry(1, 1)), mat("#898579", 1), 430),
    scrub = new T.InstancedMesh(geo(new T.IcosahedronGeometry(1, 0)), mat("#777b59", 1), 430),
    rockDummy = new T.Object3D();
  let rockCount = 0;
  for (let i = 0; i < 430; i++) {
    let x, z;
    if (i < 310) {
      x = (i % 2 ? -1 : 1) * (91 + ((((Math.sin(i * 127.1) * 43758.5453) % 1) + 1) % 1) * 112);
      z = -163 + ((((Math.sin(i * 311.7) * 96453.17) % 1) + 1) % 1) * 205;
    } else {
      x = -187 + ((i * 7.19) % 370);
      z = 37 + ((i * 5.43) % 94);
    }
    if (Math.abs(x - 9) < 8 || (x > 17 && x < 32 && z > 7 && z < 24)) continue;
    const size = 0.45 + (i % 9) * 0.28,
      y = terrainHeight(x, z);
    rockDummy.position.set(x, y + size * 0.26, z);
    rockDummy.scale.set(size, 0.45 * size, 0.7 * size);
    rockDummy.rotation.set(i * 0.4, i * 0.73, i * 0.2);
    rockDummy.updateMatrix();
    rocks.setMatrixAt(rockCount, rockDummy.matrix);
    rocks.setColorAt(rockCount, new T.Color(i % 3 ? "#b6afa0" : "#8c9289"));
    rockDummy.position.set(x + 1.4, y + 0.25, z + 1.2);
    rockDummy.scale.set(0.5 + (i % 4) * 0.2, 0.35, 0.55);
    rockDummy.rotation.set(0, i, 0);
    rockDummy.updateMatrix();
    scrub.setMatrixAt(rockCount, rockDummy.matrix);
    rockCount++;
  }
  rocks.count = scrub.count = rockCount;
  rocks.name = "rocky-site-perimeter";
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  rural.add(rocks, scrub);
  // Lightweight procedural turbines. Their local origin is the concrete footing,
  // so they can be placed on the terrain without model bounding-box ambiguity.
  const windFarm = new T.Group();
  windFarm.name = "distant-wind-ridge";
  const windRotors: T.Object3D[] = [];
  const windSites: Array<[number, number, number]> = [
    [-166, -264, 0.9],
    [-128, -270, 1.02],
    [-90, -276, 0.95],
    [-51, -270, 1.04],
    [-12, -264, 0.88],
  ];
  // Keep this as a top-level scene group so terrain visibility/culling can never
  // hide the turbines. Their exact elevation is still sampled from the land mesh.
  scene.add(windFarm);
  const turbineWhite = mat("#e7e8e3", 0.72),
    turbineEdge = mat("#b8c0c1", 0.62),
    towerGeometry = geo(new T.CylinderGeometry(0.18, 0.64, 14.2, 14)),
    footingGeometry = geo(new T.CylinderGeometry(0.82, 1.02, 0.55, 12)),
    hubGeometry = geo(new T.SphereGeometry(0.53, 14, 10)),
    nacelleGeometry = geo(new RoundedBoxGeometry(1.8, 0.72, 0.72, 4, 0.16));
  const bladeShape = new T.Shape();
  bladeShape.moveTo(-0.17, 0.28);
  bladeShape.bezierCurveTo(-0.31, 1.6, -0.55, 4.35, -0.16, 5.75);
  bladeShape.quadraticCurveTo(0, 6.05, 0.15, 5.72);
  bladeShape.bezierCurveTo(0.29, 4.1, 0.24, 1.55, 0.17, 0.28);
  bladeShape.closePath();
  const bladeGeometry = geo(
    new T.ExtrudeGeometry(bladeShape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.05,
      bevelThickness: 0.04,
      curveSegments: 8,
    }),
  );
  land.updateMatrixWorld(true);
  const groundRay = new T.Raycaster(),
    down = new T.Vector3(0, -1, 0);
  windSites.forEach(([x, z, scale], index) => {
    groundRay.set(new T.Vector3(x, 160, z), down);
    const surfaceY = groundRay.intersectObject(land, false)[0]?.point.y ?? terrainHeight(x, z);
    const turbine = new T.Group();
    turbine.name = `wind-turbine-${index + 1}`;
    turbine.position.set(x, surfaceY - 0.24, z);
    turbine.scale.setScalar(scale);
    turbine.rotation.y = ((index % 3) - 1) * 0.055;
    const footing = new T.Mesh(footingGeometry, turbineEdge),
      tower = new T.Mesh(towerGeometry, turbineWhite),
      nacelle = new T.Mesh(nacelleGeometry, turbineWhite),
      rotor = new T.Group(),
      hub = new T.Mesh(hubGeometry, turbineEdge);
    footing.position.y = 0.08;
    tower.position.y = 7.1;
    nacelle.position.set(0, 14.45, 0.12);
    rotor.name = `wind-rotor-${index + 1}`;
    rotor.position.set(0, 14.42, 0.54);
    hub.position.z = 0.12;
    rotor.add(hub);
    for (let bladeIndex = 0; bladeIndex < 3; bladeIndex++) {
      const blade = new T.Mesh(bladeGeometry, turbineWhite);
      blade.rotation.z = bladeIndex * ((Math.PI * 2) / 3);
      blade.position.z = 0.03;
      rotor.add(blade);
    }
    turbine.add(footing, tower, nacelle, rotor);
    turbine.traverse((node) => {
      node.frustumCulled = false;
      if (node instanceof T.Mesh) {
        node.castShadow = false;
        node.receiveShadow = false;
      }
    });
    windRotors.push(rotor);
    windFarm.add(turbine);
  });
  windFarm.updateMatrixWorld(true);
  const windReady = Promise.resolve();
  const craft = buildFieldCraft({ scene, geo, mat, bodyGeo });
  const field = buildSolarField({ scene, geo, mat, basic, bodyGeo, canvasMap });
  const dummy = new T.Object3D();
  // One square control house; the electrical kiosk is a separate prefabricated equipment enclosure.
  const house = new T.Group();
  house.name = "field-control-house";
  house.position.z = 5;
  scene.add(house);
  const roof = mat("#66777a", 1),
    dayGlass = mat("#354e59", 1);
  box(house, concrete, [24, 0.12, -8], [8, 0.24, 8]);
  box(house, cream, [24, 1.65, -8], [7, 3.1, 7]);
  box(house, roof, [24, 3.3, -8], [7.5, 0.25, 7.5]);
  box(house, iron, [22, 1.3, -4.45], [1.2, 2.4, 0.08]);
  box(house, dayGlass, [25.25, 1.9, -4.44], [2.4, 1.3, 0.045]);
  placard(house, "KONTROL EVİ", [24, 2.9, -4.43], 2.5, 0.3);
  box(house, iron, [26, 3.65, -9], [0.65, 0.5, 0.65]);
  // A parked service pickup, clear of the gate and the camera corridor.
  const pickup = new T.Group();
  pickup.name = "field-service-pickup";
  pickup.position.set(10.2, 0, -36);
  pickup.rotation.y = 0;
  scene.add(pickup);
  const paint = mat("#d4d1c4", 0.66, 0.22),
    pickupRubber = mat("#242625", 1),
    vehicleGlass = mat("#263d44", 0.72, 0.1);
  box(pickup, iron, [0, 0.48, 0], [1.8, 0.23, 4.8], true);
  box(pickup, paint, [0, 0.85, 1.35], [1.92, 0.62, 1.9], true);
  box(pickup, paint, [0, 1.05, -0.55], [1.94, 0.65, 1.9], true);
  box(pickup, paint, [0, 1.87, 0.25], [1.83, 0.09, 1.75], true);
  box(pickup, vehicleGlass, [0, 1.56, 0.22], [1.68, 0.57, 1.55], true);
  for (const x of [-0.89, 0.89])
    for (const z of [-0.58, 1]) box(pickup, paint, [x, 1.58, z], [0.09, 0.65, 0.1]);
  box(pickup, paint, [0, 1.12, -2.25], [1.9, 0.6, 0.12]);
  for (const x of [-0.9, 0.9]) box(pickup, paint, [x, 1.12, -1.66], [0.12, 0.6, 1.25]);
  box(pickup, pickupRubber, [0, 0.87, -1.66], [1.65, 0.035, 1.1]);
  box(pickup, iron, [0, 0.64, 2.37], [1.95, 0.16, 0.15]);
  box(pickup, iron, [0, 0.99, 2.315], [0.82, 0.22, 0.018]);
  for (const x of [-0.7, 0.7]) {
    box(pickup, cream, [x, 1.1, 2.32], [0.45, 0.22, 0.025]);
    box(pickup, mat("#8a3029", 0.8), [x, 1.1, -2.32], [0.24, 0.28, 0.025]);
    box(pickup, black, [x * 1.46, 1.62, 0.9], [0.17, 0.15, 0.28], true);
  }
  for (const x of [-0.97, 0.97])
    for (const z of [-1.55, 1.55]) {
      const tire = cylinder(pickup, pickupRubber, [x, 0.48, z], 0.43, 0.25);
      tire.rotation.z = Math.PI / 2;
      const hub = cylinder(pickup, silver, [x * 1.13, 0.48, z], 0.22, 0.02);
      hub.rotation.z = Math.PI / 2;
    }
  // Equipment in the pickup bed, matched to the vehicle's longitudinal axis.
  const load = new T.Group();
  load.name = "pickup-maintenance-supplies";
  load.position.copy(pickup.position);
  scene.add(load);
  for (const [x, z] of [
    [-0.35, 1.35],
    [0.32, 1.6],
  ] as const) {
    box(load, orange, [x, 0.91, z], [0.49, 0.36, 0.55], true);
    box(load, black, [x, 1.1, z], [0.25, 0.025, 0.035]);
  }
  const reel = cylinder(load, wood, [0.25, 1.0, 0.9], 0.19, 0.3);
  reel.rotation.z = Math.PI / 2;
  for (const x of [0.08, 0.42]) {
    const flange = cylinder(load, wood, [x, 1.0, 0.9], 0.23, 0.025);
    flange.rotation.z = Math.PI / 2;
  }
  const activity = buildSiteActivity({ scene, geo, mat, basic, bodyGeo });
  const kiosk = buildKiosk({ scene, geo, mat, basic, bodyGeo, placard, canvasMap });
  const inverter = new T.Group();
  inverter.position.set(...HERO_INVERTER);
  inverter.rotation.y = -Math.PI / 2;
  inverter.name = "inverter";
  scene.add(inverter);
  box(inverter, concrete, [0, 0.1, 0], [2, 0.2, 1.6]);
  box(inverter, iron, [-0.43, 0.7, -0.12], [0.09, 1.2, 0.09]);
  box(inverter, iron, [0.43, 0.7, -0.12], [0.09, 1.2, 0.09]);
  // Closed weatherproof inverter cabinet; the camera remains outside its casing.
  box(inverter, silver, [0, 1.65, -0.24], [1.2, 1.5, 0.06], true);
  box(inverter, cream, [-0.61, 1.65, 0], [0.06, 1.5, 0.52]);
  box(inverter, cream, [0.61, 1.65, 0], [0.06, 1.5, 0.52]);
  box(inverter, cream, [0, 2.4, 0], [1.28, 0.06, 0.52]);
  box(inverter, cream, [0, 0.9, 0], [1.28, 0.06, 0.52]);
  const inverterDoor = new T.Group();
  inverterDoor.name = "inverter-closed-cover";
  inverter.add(inverterDoor);
  box(inverterDoor, cream, [0, 1.65, 0.3], [1.26, 1.5, 0.07], true);
  placard(inverterDoor, "EVİRİCİ", [0, 2.09, 0.341], 0.8, 0.18);
  box(inverterDoor, black, [0, 1.7, 0.348], [0.43, 0.22, 0.01]);
  placard(inverterDoor, "DC  /  AC", [0, 1.7, 0.357], 0.39, 0.18, "#173c40", "#b9dbbb");
  cylinder(inverterDoor, orange, [0.43, 1.23, 0.37], 0.05, 0.03).rotation.x = Math.PI / 2;
  for (let i = 0; i < 14; i++)
    box(inverterDoor, iron, [-0.44 + i * 0.068, 1.05, 0.34], [0.023, 0.1, 0.01]);
  box(inverter, pcb, [0, 1.68, -0.18], [1.04, 1.27, 0.035]);
  function circuit(parent: T.Object3D, center: Vec3, scale = 1) {
    const [x, y, z] = center;
    for (let i = 0; i < 6; i++) {
      box(
        parent,
        gold,
        [x - 0.38 * scale + i * 0.13 * scale, y - 0.26 * scale, z],
        [0.009 * scale, 0.62 * scale, 0.005 * scale],
      );
      box(
        parent,
        gold,
        [x - 0.22 * scale, y - 0.35 * scale + i * 0.12 * scale, z],
        [0.7 * scale, 0.008 * scale, 0.005 * scale],
      );
    }
    box(parent, black, [x, y, z + 0.04 * scale], [0.24 * scale, 0.24 * scale, 0.07 * scale], true);
    for (let i = 0; i < 8; i++) {
      box(
        parent,
        silver,
        [x - 0.15 * scale + i * 0.043 * scale, y + 0.14 * scale, z + 0.035 * scale],
        [0.018 * scale, 0.09 * scale, 0.02 * scale],
      );
      box(
        parent,
        silver,
        [x - 0.15 * scale + i * 0.043 * scale, y - 0.14 * scale, z + 0.035 * scale],
        [0.018 * scale, 0.09 * scale, 0.02 * scale],
      );
    }
  }
  circuit(inverter, [0.1, 1.7, -0.154]);
  for (let i = 0; i < 3; i++) {
    const cap = cylinder(inverter, black, [-0.35 + i * 0.3, 2.13, -0.04], 0.095, 0.2);
    cap.rotation.x = Math.PI / 2;
    const top = cylinder(inverter, silver, [-0.35 + i * 0.3, 2.13, 0.063], 0.087, 0.008);
    top.rotation.x = Math.PI / 2;
  }
  for (let i = 0; i < 9; i++)
    box(inverter, silver, [0.32 + i * 0.027, 1.27, -0.03], [0.012, 0.28, 0.24]);
  for (let i = 0; i < 4; i++)
    cable(
      inverter,
      [
        [i * 0.15 - 0.25, 0.98, 0.15],
        [i * 0.15 - 0.25, 0.58, 0.18],
        [i * 0.15 - 0.25, 0.12, 0.2],
        [1 + i * 0.12, 0.08, 0.5],
      ],
      i % 2 ? "#b63829" : "#1b2529",
      0.018,
    );
  // ScadaWatt is physically mounted on the backplate inside the prefabricated kiosk.
  const scada = new T.Group();
  scada.position.set(-3, 2.15, -44.82);
  scada.name = "scadawatt";
  kiosk.panel.add(scada);
  const scadaDoor = new T.Group();
  scadaDoor.name = "scada-closed-cover";
  scada.add(scadaDoor);
  let resolveDevice = () => {};
  const deviceReady = textures
    ? new Promise<void>((resolve) => {
        resolveDevice = resolve;
      })
    : Promise.resolve();
  const frontPhoto = textures
    ? new T.TextureLoader(loadingManager).load(
        "/assets/s3000i.webp",
        () => resolveDevice(),
        undefined,
        () => {
          onTextureError();
          resolveDevice();
        },
      )
    : undefined;
  if (frontPhoto) {
    frontPhoto.colorSpace = T.SRGBColorSpace;
    maps.add(frontPhoto);
  }
  const device = buildScadaDevice({
    geo,
    mat,
    basic,
    bodyGeo,
    canvasMap,
    frontPhoto,
    trackMap: (t) => maps.add(t),
  });
  device.scale.setScalar(0.15);
  scadaDoor.add(device);
  // Supply (red/black) and twisted RS485 pair enter the bottom terminal blocks, then route into the duct.
  const ports = device.userData["terminalX"] as number[];
  const wiring = new T.Group();
  wiring.name = "scada-bottom-terminated-wiring";
  scada.add(wiring);
  for (const i of [3, 4, 5, 8, 9]) {
    const x = ports[i]! * 0.15;
    const color =
      i === 9
        ? "#ac4938"
        : i === 8
          ? "#26353c"
          : i === 5
            ? "#667b57"
            : i === 3
              ? "#b79b58"
              : "#65908e";
    cable(
      wiring,
      [
        [x, (device.userData["terminalY"] as number) * 0.15, 0.015],
        [x, -0.13, 0.015],
        [x, -0.16, 0.01],
        [0.17, -0.18, 0.005],
        [0.17, -0.28, -0.005],
      ],
      color,
      0.0018,
    );
  }
  // Ethernet is plugged into the underside socket, then dressed into the lower duct.
  const ethernetSocket = new T.Vector3()
    .fromArray(device.userData["ethernetSocket"] as number[])
    .multiplyScalar(0.15);
  const ethernetCable = cable(
    wiring,
    [
      [ethernetSocket.x, ethernetSocket.y, ethernetSocket.z],
      [ethernetSocket.x, -0.105, ethernetSocket.z],
      [-0.1, -0.17, 0.005],
      [-0.18, -0.22, 0],
      [-0.18, -0.28, -0.005],
    ],
    "#466477",
    0.0025,
  );
  (wiring.children[wiring.children.length - 1] as T.Mesh).name = "underside-ethernet-cable";
  wiring.userData["ethernetStart"] = ethernetCable.getPoint(0).toArray();
  cable(
    wiring,
    [
      [0.17, -0.28, -0.005],
      [0.22, -0.4, -0.015],
      [0.22, -0.48, -0.025],
      [0, -0.51, -0.035],
      [0, -0.55, -0.035],
    ],
    "#30454c",
    0.005,
  );
  const dataGland = cylinder(scada, rubber, [0, -0.54, -0.035], 0.012, 0.025);
  dataGland.name = "scada-bottom-cable-gland";
  const ethMat = new T.MeshBasicMaterial({ color: "#50bd7b", toneMapped: false });
  materials.add(ethMat);
  for (const x of [-0.064, -0.057]) {
    const led = box(scadaDoor, ethMat, [x, -0.071, 0.012], [0.002, 0.0015, 0.001]);
    led.name = "ethernet-activity-led";
  }
  let effectProgress = 0,
    cityDay = false;
  function tick(seconds: number) {
    let animated = false;
    if (effectProgress < 0.3 || effectProgress > 0.42) return animated;
    const phase = Math.floor(Math.max(0, seconds) * 8) % 8,
      active = phase === 0 || phase === 2;
    statusMat.emissiveIntensity = active ? 1.7 : 0.35;
    ethMat.color.set(active ? "#8cffaa" : "#245343");
    const greenMaterial = Array.from(materials).find((m) => m.name === "panel-signal-indicators");
    if (greenMaterial instanceof T.MeshBasicMaterial)
      greenMaterial.color.set(active ? "#8fdda0" : "#568166");
    return true;
  }
  // Residential apartment: same footprint and facade rhythm as neighbouring homes.
  const room = new T.Group();
  room.position.y = 18;
  room.name = "remote-home";
  const wall = mat("#c8c0b0", 1);
  box(room, wood, [20, -0.08, 2], [16, 0.16, 17]);
  box(room, wall, [20, 2, -6.5], [16, 4, 0.18]);
  // Procedural wood grain is shared by the physical floor, desk and furniture.
  const grain = canvasMap(512, 128, (c) => {
    c.fillStyle = "#bba184";
    c.fillRect(0, 0, 512, 128);
    for (let i = 0; i < 220; i++) {
      const y = (i * 37.17) % 128;
      c.strokeStyle = i % 3 ? "#70563c22" : "#ead2ad55";
      c.lineWidth = 0.4 + (i % 4) * 0.2;
      c.beginPath();
      for (let x = 0; x <= 512; x += 8) {
        const yy = y + Math.sin(x * 0.021 + i) * 0.7;
        if (x === 0) c.moveTo(x, yy);
        else c.lineTo(x, yy);
      }
      c.stroke();
    }
  });
  if (grain) {
    wood.map = grain;
    wood.bumpMap = grain;
    wood.bumpScale = 0.012;
  }
  const floorboards = new T.InstancedMesh(geo(new T.BoxGeometry(1.97, 0.008, 0.59)), wood, 224);
  floorboards.name = "home-floorboards";
  const plank = new T.Object3D();
  for (let row = 0; row < 28; row++)
    for (let col = 0; col < 8; col++) {
      plank.position.set(13 + col * 2, -0.003, -6.19 + row * 0.605);
      plank.updateMatrix();
      const i = row * 8 + col;
      floorboards.setMatrixAt(i, plank.matrix);
      floorboards.setColorAt(
        i,
        new T.Color().setRGB(
          0.91 + ((i * 7) % 9) * 0.012,
          0.89 + ((i * 3) % 7) * 0.014,
          0.85 + ((i * 5) % 9) * 0.014,
        ),
      );
    }
  floorboards.receiveShadow = true;
  room.add(floorboards);
  for (const x of [12.13, 27.87]) box(room, cream, [x, 0.085, 2], [0.055, 0.17, 16.8]);
  box(room, cream, [20, 0.085, -6.36], [15.8, 0.17, 0.055]);
  const jointsGeo = geo(new T.BufferGeometry()),
    jointPoints: number[] = [];
  for (let i = 0; i < 29; i++) {
    const z = -6.5 + (i * 17) / 28;
    jointPoints.push(12, 0.002, z, 28, 0.002, z);
  }
  for (let row = 0; row < 28; row++)
    for (let col = 1; col < 8; col++) {
      const x = 12 + col * 2 + (row % 2 ? 0.7 : 0);
      if (x < 28)
        jointPoints.push(x, 0.002, -6.5 + (row * 17) / 28, x, 0.002, -6.5 + ((row + 1) * 17) / 28);
    }
  jointsGeo.setAttribute("position", new T.Float32BufferAttribute(jointPoints, 3));
  const jointMaterial = new T.LineBasicMaterial({
    color: "#6a5140",
    transparent: true,
    opacity: 0.3,
  });
  materials.add(jointMaterial);
  const joints = new T.LineSegments(jointsGeo, jointMaterial);
  joints.name = "home-floor-joints";
  joints.visible = false;
  room.add(joints);
  const living = new T.Group();
  living.name = "living-room";
  room.add(living);
  const fabric = mat("#a99b88", 1),
    cushion = mat("#788c82", 1);
  const weave = canvasMap(128, 128, (c) => {
    c.fillStyle = "#c8beb0";
    c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 128; i += 2) {
      c.fillStyle = i % 4 ? "#7d756422" : "#ffffff33";
      c.fillRect(i, 0, 1, 128);
      c.fillRect(0, i, 128, 1);
    }
  });
  if (weave) {
    fabric.map = weave;
    fabric.bumpMap = weave;
    fabric.bumpScale = 0.008;
    cushion.map = weave;
    cushion.bumpMap = weave;
    cushion.bumpScale = 0.008;
  }
  box(living, mat("#706d62", 1), [16, 0.18, 1.5], [5, 0.035, 5]);
  const sofa = new T.Group();
  sofa.name = "home-sofa";
  living.add(sofa);
  box(sofa, fabric, [16, 0.52, 4], [3.1, 0.65, 1.1], true);
  box(sofa, fabric, [16, 1.02, 4.5], [3.1, 0.85, 0.3], true);
  for (const x of [14.55, 17.45]) box(sofa, fabric, [x, 0.8, 4], [0.3, 0.7, 1.25], true);
  for (const x of [15.05, 16, 16.95]) box(sofa, cushion, [x, 0.9, 4.25], [0.78, 0.5, 0.2], true);
  box(living, wood, [16, 0.48, 1.9], [2, 0.12, 1.05], true);
  for (const x of [15.3, 16.7]) box(living, iron, [x, 0.25, 1.9], [0.07, 0.45, 0.65]);
  box(living, cream, [15.8, 0.56, 1.8], [0.45, 0.04, 0.32]);
  box(living, wood, [16, 0.55, -2.5], [3.6, 0.9, 0.65], true);
  const tv = box(living, black, [16, 1.66, -2.6], [2.5, 1.4, 0.08], true);
  tv.name = "home-tv";
  box(living, basic("#243842"), [16, 1.66, -2.55], [2.38, 1.28, 0.012]);
  cylinder(living, iron, [13.6, 1.1, 4], 0.025, 2.2);
  cylinder(living, cream, [13.6, 2.15, 4], 0.35, 0.5);
  cylinder(living, iron, [13.6, 0.16, 4], 0.28, 0.08);
  box(living, wood, [25, 1.2, -3], [1.8, 2.4, 0.5]);
  for (let i = 0; i < 8; i++)
    box(living, i % 2 ? cream : cushion, [24.3 + i * 0.18, 1.8, -2.71], [0.12, 0.55, 0.24]);
  // Physical desk, keyboard, mouse, monitor bezel, stand, rear ports.
  box(room, wood, [20, 1.02, 3], [3.6, 0.09, 1.4], true);
  for (const x of [18.5, 21.5]) {
    box(room, iron, [x, 0.53, 3], [0.06, 1, 0.9]);
  }
  const monitorHardware = new T.Group();
  monitorHardware.name = "monitor-hardware";
  room.add(monitorHardware);
  box(monitorHardware, black, [20, 1.085, 3], [0.21, 0.025, 0.13], true);
  box(monitorHardware, silver, [20, 1.17, 2.98], [0.025, 0.19, 0.035]);
  box(monitorHardware, black, [20, 1.016, 3.08], [0.62, 0.35, 0.028], true);
  let resolveScreen: () => void = () => {};
  const textureReady = new Promise<void>((resolve) => {
    resolveScreen = resolve;
  });
  const screenMap = textures
    ? new T.TextureLoader(loadingManager).load(
        "/assets/screens/monitor-dashboard-1.png",
        (t) => {
          prepareDisplayTexture(t, "monitor-dashboard-1.png");
          resolveScreen();
          onSceneChange();
        },
        undefined,
        () => {
          onTextureError();
          resolveScreen();
        },
      )
    : null;
  if (screenMap) {
    screenMap.colorSpace = T.SRGBColorSpace;
    screenMap.anisotropy = 4;
    maps.add(screenMap);
  } else resolveScreen();
  const screenMat = new T.MeshBasicMaterial({
    color: screenMap ? "#ffffff" : "#315a65",
    map: screenMap,
    toneMapped: false,
  });
  materials.add(screenMat);
  const screen = new T.Mesh(geo(new T.PlaneGeometry(0.588, 0.315)), screenMat);
  screen.position.set(20, 1.016, 3.121);
  screen.name = "monitor-screen";
  room.add(screen);
  box(room, black, [19.75, 1.096, 3.48], [0.72, 0.035, 0.25], true);
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 13; col++)
      box(room, iron, [19.43 + col * 0.051, 1.12, 3.39 + row * 0.054], [0.043, 0.012, 0.041], true);
  box(room, black, [20.4, 1.105, 3.5], [0.12, 0.05, 0.19], true);
  const mug = cylinder(room, cream, [21.25, 1.2, 3.25], 0.085, 0.26);
  const coffee = cylinder(room, mat("#38291d", 0.35), [21.25, 1.333, 3.25], 0.072, 0.003);
  mug.name = "desk-mug";
  coffee.name = "coffee";
  // Sixth-floor room: clear window aperture for the camera, side glazing and frames.
  const envelope = new T.Group();
  envelope.name = "operator-building-envelope";
  envelope.position.y = 18;
  box(envelope, wall, [20, 2, -6.6], [16, 4.2, 0.18]);
  const facade = mat("#354553", 0.95),
    facadeDark = mat("#182a3c", 1),
    paving = mat("#26313b", 1);
  for (const x of [12, 28]) box(envelope, facade, [x, 2, 2], [0.18, 4.2, 17]);
  box(envelope, facadeDark, [20, 4.25, 2], [16.5, 0.3, 17.5]);
  // Ordinary 2.4m window; the camera crosses its opening, not a removed facade.
  box(envelope, facade, [16, 2.1, 10.5], [8, 4.2, 0.18]);
  box(envelope, facade, [25.2, 2.1, 10.5], [5.6, 4.2, 0.18]);
  box(envelope, facade, [21.2, 0.575, 10.5], [2.4, 1.15, 0.18]);
  box(envelope, facade, [21.2, 3.625, 10.5], [2.4, 1.15, 0.18]);
  for (const x of [20, 22.4]) box(envelope, silver, [x, 2.1, 10.53], [0.065, 1.9, 0.14]);
  for (const y of [1.15, 3.05]) box(envelope, silver, [21.2, y, 10.53], [2.46, 0.065, 0.14]);
  // Batch the permanent exterior by material, independent of the interior visibility gate.
  const shellBatches = new Map<T.Material, T.Mesh[]>();
  for (const child of [...envelope.children])
    if (child instanceof T.Mesh) {
      const m = child.material as T.Material;
      const list = shellBatches.get(m) ?? [];
      list.push(child);
      shellBatches.set(m, list);
    }
  for (const [material, parts] of shellBatches) {
    const batch = new T.InstancedMesh(bodyGeo, material, parts.length);
    batch.name = "permanent-building-shell";
    parts.forEach((part, i) => {
      part.updateMatrix();
      batch.setMatrixAt(i, part.matrix);
      envelope.remove(part);
    });
    envelope.add(batch);
  }
  const curtains = new T.Group();
  curtains.name = "pleated-window-curtains";
  room.add(curtains);
  for (const x of [19.65, 22.75]) {
    const g = geo(new T.PlaneGeometry(0.5, 2.8, 32, 12));
    const a = g.attributes["position"]!;
    for (let i = 0; i < a.count; i++)
      a.setZ(i, Math.sin((a.getX(i) + 0.25) * Math.PI * 24) * 0.045);
    g.computeVertexNormals();
    const mesh = new T.Mesh(g, fabric);
    mesh.position.set(x, 2, 10.15);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    curtains.add(mesh);
  }
  box(room, iron, [21.2, 3.48, 10.18], [3.9, 0.035, 0.035]);

  const glassMat = new T.MeshBasicMaterial({
    color: "#9abccc",
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  materials.add(glassMat);
  const entryGlass = box(envelope, glassMat, [21.2, 2.1, 10.52], [2.34, 1.84, 0.01]);
  entryGlass.name = "entry-window-glass";
  entryGlass.castShadow = false;
  // Seated operator, with articulated limbs and a chair; camera passes over right shoulder.
  const person = new T.Group();
  person.name = "seated-operator";
  person.position.x = 0;
  room.add(person);
  const skin = mat("#ac8066", 0.95),
    shirt = mat("#4d687b", 1),
    trousers = mat("#25303d", 1),
    hair = mat("#24232a", 1);
  function limb(parent: T.Object3D, m: T.Material, a: Vec3, b: Vec3, r: number) {
    const av = new T.Vector3(...a),
      bv = new T.Vector3(...b),
      length = av.distanceTo(bv);
    const mesh = new T.Mesh(
      geo(new T.CapsuleGeometry(r, Math.max(0.001, length - r * 2), 4, 8)),
      m,
    );
    mesh.position.copy(av).add(bv).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), bv.sub(av).normalize());
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  const chair = new T.Group();
  chair.name = "operator-chair";
  chair.position.x = 0;
  room.add(chair);
  box(chair, black, [19.65, 0.64, 4.4], [0.55, 0.09, 0.55], true);
  box(chair, black, [19.65, 0.98, 4.66], [0.55, 0.62, 0.08], true);
  cylinder(chair, silver, [19.65, 0.32, 4.4], 0.045, 0.55);
  box(chair, black, [19.65, 0.09, 4.4], [0.7, 0.06, 0.55], true);
  box(person, shirt, [19.65, 1.1, 4.32], [0.43, 0.58, 0.25], true);
  const head = new T.Mesh(geo(new T.SphereGeometry(0.145, 24, 16)), skin);
  head.position.set(19.65, 1.57, 4.24);
  head.scale.y = 1.17;
  person.add(head);
  const hairCap = new T.Mesh(
    geo(new T.SphereGeometry(0.149, 20, 12, 0, Math.PI * 2, 0, 1.35)),
    hair,
  );
  hairCap.position.set(19.65, 1.6, 4.25);
  person.add(hairCap);
  box(person, skin, [19.65, 1.57, 4.09], [0.05, 0.055, 0.05], true);
  limb(person, trousers, [19.5, 0.77, 4.3], [19.5, 0.65, 3.87], 0.095);
  limb(person, trousers, [19.8, 0.77, 4.3], [19.8, 0.65, 3.87], 0.095);
  for (const x of [19.5, 19.8]) {
    limb(person, trousers, [x, 0.65, 3.87], [x, 0.15, 3.86], 0.075);
    box(person, black, [x, 0.11, 3.76], [0.14, 0.12, 0.3], true);
  }
  limb(person, shirt, [19.43, 1.32, 4.29], [19.32, 1.03, 3.98], 0.065);
  limb(person, skin, [19.32, 1.03, 3.98], [19.48, 1.12, 3.55], 0.045);
  limb(person, shirt, [19.87, 1.32, 4.29], [20.02, 1.04, 4.01], 0.065);
  limb(person, skin, [20.02, 1.04, 4.01], [20.08, 1.12, 3.53], 0.045);
  const city = new T.Group();
  city.name = "night-city";
  city.position.copy(destinationOrigin);
  city.quaternion.copy(destinationOrientation);
  city.add(room, envelope);
  scene.add(city);
  const countryGeo = geo(new T.CircleGeometry(740, 96));
  countryGeo.rotateX(-Math.PI / 2);
  const countryPosition = countryGeo.attributes["position"]!;
  for (let i = 0; i < countryPosition.count; i++) {
    const radius = Math.hypot(countryPosition.getX(i), countryPosition.getZ(i));
    countryPosition.setY(i, -0.12 - Math.max(0, radius - 240) ** 2 / 1800);
  }
  countryGeo.computeVertexNormals();
  const districtGround = new T.MeshLambertMaterial({ color: "#293d36" });
  materials.add(districtGround);
  const countryGround = new T.Mesh(countryGeo, districtGround);
  countryGround.receiveShadow = true;
  city.add(countryGround);
  box(city, facade, [20, 9, 2], [16, 18, 17]);
  const nightCity = buildNightCity({
    city,
    geo,
    mat: (color) => {
      const m = new T.MeshLambertMaterial({ color });
      materials.add(m);
      return m;
    },
    basic,
    bodyGeo,
    canvasMap,
  });
  const nightHemi = new T.HemisphereLight("#6b8eae", "#10121b", 1.15);
  nightHemi.layers.set(2);
  scene.add(nightHemi);
  const moon = new T.DirectionalLight("#86a9d2", 1.8);
  moon.position.set(...nightToWorld([100, 700, 300]));
  moon.layers.set(2);
  moon.target.position.set(...nightToWorld([0, 0, 0]));
  moon.castShadow = false;
  moon.shadow.mapSize.set(512, 512);
  moon.shadow.normalBias = 0.06;
  Object.assign(moon.shadow.camera, {
    left: -245,
    right: 245,
    top: 245,
    bottom: -245,
    near: 1,
    far: 1400,
  });
  scene.add(moon, moon.target);
  // Backlight and restrained operational indicators, no fabricated live readings.
  const statusMat = new T.MeshStandardMaterial({
    color: "#80ab85",
    emissive: "#72bf7b",
    emissiveIntensity: 0.5,
  });
  materials.add(statusMat);
  box(scadaDoor, statusMat, [-0.03945, -0.03255, 0.037], [0.0025, 0.0025, 0.001]);
  const roomLight = new T.PointLight("#fff0da", 5, 12, 2);
  roomLight.position.set(...nightToWorld([20, 20.85, 4]));
  roomLight.intensity = 38;
  roomLight.layers.set(2);
  scene.add(roomLight);
  const warmLight = new T.PointLight("#ffd5a1", 22, 9, 2);
  warmLight.position.set(...nightToWorld([22, 20.85, 0]));
  warmLight.layers.set(2);
  scene.add(warmLight);
  // Planet lives below the daytime tangent plane; ascent genuinely reveals curvature.
  const space = new T.Group();
  space.name = "orbital-earth";
  scene.add(space);
  const planet = new T.Group();
  planet.position.copy(globeCenter);
  planet.quaternion.copy(globeOrientation);
  space.add(planet);
  const earthFallback = mat("#223b4e", 1);
  earthFallback.envMapIntensity = 0;
  const solarUniform = { value: earthSunDirection(false) };
  earthFallback.onBeforeCompile = (shader) => {
    shader.uniforms["uSolarDirection"] = solarUniform;
    shader.vertexShader = "varying vec3 vSolarNormal;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvSolarNormal=normalize(mat3(modelMatrix)*normal);",
    );
    shader.fragmentShader =
      "uniform vec3 uSolarDirection; varying vec3 vSolarNormal;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      "#include <emissivemap_fragment>\ntotalEmissiveRadiance *= 1.0-smoothstep(-0.12,0.12,dot(normalize(vSolarNormal),uSolarDirection));",
    );
  };
  earthFallback.customProgramCacheKey = () => "geographic-night-mask-v46";
  const earth = new T.Mesh(geo(new T.SphereGeometry(998, 96, 64)), earthFallback);
  earth.name = "rotating-earth";
  planet.add(earth);
  // Geographic anchors determine the flight only; the globe has no location dots or rings.
  const earthTextures: Promise<void>[] = [];
  function loadMap(url: string, apply: (tex: T.Texture) => void) {
    if (!textures) return;
    earthTextures.push(
      new Promise((resolve) => {
        const tex = new T.TextureLoader(loadingManager).load(
          url,
          () => {
            resolve();
            onSceneChange();
          },
          undefined,
          () => resolve(),
        );
        tex.colorSpace = T.SRGBColorSpace;
        tex.anisotropy = 4;
        maps.add(tex);
        apply(tex);
      }),
    );
  }
  loadMap("/assets/earth/earth_day_4096.jpg", (t) => {
    earthFallback.map = t;
    earthFallback.color.set("#ffffff");
    earthFallback.needsUpdate = true;
  });
  loadMap("/assets/earth/earth_night_4096.jpg", (t) => {
    earthFallback.emissiveMap = t;
    earthFallback.emissive.set("#ffc98a");
    earthFallback.emissiveIntensity = 0.85;
    earthFallback.needsUpdate = true;
  });
  const atmosphereMat = new T.ShaderMaterial({
    transparent: true,
    side: T.BackSide,
    depthWrite: false,
    blending: T.AdditiveBlending,
    uniforms: {},
    vertexShader:
      "varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}",
    fragmentShader:
      "varying vec3 vN;varying vec3 vV;void main(){float rim=pow(1.0-abs(dot(normalize(vN),normalize(vV))),3.0);gl_FragColor=vec4(0.15,0.38,0.70,rim*0.38);}",
  });
  materials.add(atmosphereMat);
  planet.add(new T.Mesh(geo(new T.SphereGeometry(1008, 64, 40)), atmosphereMat));
  const starGeo = geo(new T.BufferGeometry()),
    starData = new Float32Array(2200 * 3);
  for (let i = 0; i < 2200; i++) {
    const a = i * 2.399963,
      b = Math.acos(1 - (2 * (i + 0.5)) / 2200);
    starData.set(
      [
        5000 * Math.sin(b) * Math.cos(a),
        -1000 + 5000 * Math.cos(b),
        5000 * Math.sin(b) * Math.sin(a),
      ],
      i * 3,
    );
  }
  starGeo.setAttribute("position", new T.BufferAttribute(starData, 3));
  const starMat = new T.PointsMaterial({ color: "#c1d4e4", size: 2.5, sizeAttenuation: true });
  materials.add(starMat);
  const stars = new T.Points(starGeo, starMat);
  space.add(stars);
  const spaceSun = new T.DirectionalLight("#fff1da", 3);
  spaceSun.name = "geographic-sunlight";
  spaceSun.position.copy(globeCenter).addScaledVector(earthSunDirection(false), 5000);
  spaceSun.target.position.set(0, -1000, 0);
  spaceSun.layers.set(1);
  scene.add(spaceSun, spaceSun.target);
  const spaceAmbient = new T.AmbientLight("#162841", 0.12);
  spaceAmbient.layers.set(1);
  scene.add(spaceAmbient);
  city.traverse((o) => o.layers.set(2));
  space.traverse((o) => o.layers.set(1));
  camera.layers.enableAll();
  const dayObjects = scene.children.filter(
    (o) => o !== city && o !== space && o.layers.mask === 1 && !(o as T.Light).isLight,
  );
  let startStreaming!: () => void;
  const streamGate = new Promise<void>((resolve) => {
    startStreaming = resolve;
  });
  const imported = textures
    ? loadImportedModels(
        scene,
        { geometries, materials, maps },
        onTextureError,
        loadingManager,
        streamGate,
        onSceneChange,
      )
    : null;
  const userModels = textures
    ? loadUserModels(
        scene,
        { geometries, materials, maps },
        loadingManager,
        onTextureError,
        imported?.ready ?? Promise.resolve(),
        streamGate,
        onSceneChange,
      )
    : null;
  const additionalModels = textures
    ? loadAdditionalModels(
        scene,
        { geometries, materials, maps },
        loadingManager,
        onTextureError,
        userModels?.ready ?? Promise.resolve(),
        streamGate,
        onSceneChange,
      )
    : null;
  let disposed = false;
  function update(p: number, aspect: number) {
    effectProgress = p;
    const pose = flightPose(p);
    windRotors.forEach((rotor, index) => {
      rotor.rotation.z = p * 82 + index * 0.58;
      rotor.updateMatrix();
      rotor.updateMatrixWorld(true);
    });
    camera.position.set(...pose.eye);
    camera.up.set(...pose.up);
    camera.aspect = aspect;
    camera.fov = aspect < 0.8 ? pose.fov + 14 : pose.fov;
    camera.near = p > 0.5 && p < 0.9 ? 1 : 0.06;
    camera.lookAt(new T.Vector3(...pose.target));
    camera.updateProjectionMatrix();
    const ascent = ease((p - 0.49) / 0.09);
    scene.background = new T.Color(cityDay ? "#050d1b" : "#e99459").lerp(
      new T.Color("#030711"),
      ascent,
    );
    scene.fog =
      p < 0.54
        ? new T.FogExp2(cityDay ? "#0a1729" : "#d99567", 0.0022 * (1 - ascent))
        : p > 0.76
          ? new T.FogExp2("#132536", 0.00115)
          : null;
    if (p >= 0.78) {
      scene.background = new T.Color(cityDay ? "#afc8d3" : "#081522");
      scene.fog = new T.FogExp2(cityDay ? "#afc8d3" : "#132536", 0.00115);
    }
    sky.visible = p < 0.53 && !cityDay;
    fieldSky.update(cityDay, p, camera);
    sky.material.uniforms["sunPosition"]!.value.copy(fieldSky.direction(false));
    for (const o of dayObjects) if (o !== sky) o.visible = p < 0.53 && !o.userData["superseded"];
    city.visible = p >= 0.78;
    setFieldNight(cityDay);
    space.visible = p >= 0.53;
    planet.visible = p < 0.78;
    stars.visible = p > 0.54 && !(cityDay && p >= 0.78);
    // Geography is fixed; only the camera follows the shortest arc. No artificial globe spin.
    earth.rotation.set(0, 0, 0);
    if (p < 0.5) {
      activity.update(p, cityDay);
      kiosk.update(p);
      if (!cityDay) imported?.update(p);
    }
    if (p >= 0.78 && p < 0.945) nightCity.update(p);
    room.visible = p >= 0.905;
    for (const child of city.children) if (child !== room) child.visible = p < 0.945;
    for (const name of ["imported-gaming-room", "seated-operator"]) {
      const o = room.getObjectByName(name);
      if (o) o.visible = p >= 0.905;
    }
    daylight.intensity = (cityDay ? 0.3 : 1.65) * (1 - ascent);
    daylight.color.set(cityDay ? "#819fc9" : "#f3cba5");
    daylight.groundColor.set(cityDay ? "#111926" : "#6c654c");
    sunlight.intensity = (cityDay ? 0.32 : 2.25) * (1 - ascent);
    sunlight.color.set(cityDay ? "#a6c5ee" : "#ffb875");
    fill.intensity = (cityDay ? 0.12 : 0.55) * (1 - ascent);
    scene.environmentIntensity =
      p >= 0.78 ? (cityDay ? 0.65 : 0.1) : (cityDay ? 0.18 : 1) * (1 - ascent * 0.9);
    entryGlass.visible = p < 0.93;
    glassMat.opacity = 0.12 * (1 - ease((p - 0.92) / 0.01));
    inverterDoor.position.set(0, 0, 0);
    inverterDoor.rotation.set(0, 0, 0);
    scadaDoor.position.set(0, 0, 0);
    scadaDoor.rotation.set(0, 0, 0);
    const span = p < 0.12 ? 60 : 8;
    sunlight.target.position.set(...pose.target);
    sunlight.position
      .copy(sunlight.target.position)
      .add(fieldSky.direction(cityDay).clone().multiplyScalar(80));
    Object.assign(sunlight.shadow.camera, { left: -span, right: span, top: span, bottom: -span });
    sunlight.shadow.camera.updateProjectionMatrix();
    sunlight.shadow.needsUpdate = true;
    if (!scene.matrixWorldAutoUpdate) {
      if (p < 0.53) {
        scene.getObjectByName("site-activity")?.updateMatrixWorld(true);
        kiosk.root.updateMatrixWorld(true);
        sunlight.updateMatrixWorld();
        sunlight.target.updateMatrixWorld();
      }
      camera.updateMatrixWorld();
    }
  }
  const allReady = Promise.all([
    windReady,
    deviceReady,
    textureReady,
    groundReady,
    imported?.ready,
    userModels?.ready,
    additionalModels?.ready,
    ...earthTextures,
  ]).then(() => {
    if (disposed) return;
    // The imported scan replaces the procedural land asynchronously. Ground only
    // after that replacement, against the actual surface shown to the visitor.
    const finalTerrain = scene.getObjectByName("imported-landscape") ?? land;
    finalTerrain.updateWorldMatrix(true, true);
    const surfaceRay = new T.Raycaster();
    windFarm.children.forEach((turbine) => {
      const origin = new T.Vector3(turbine.position.x, 1000, turbine.position.z);
      surfaceRay.set(origin, new T.Vector3(0, -1, 0));
      const hit = surfaceRay.intersectObject(finalTerrain, true)[0];
      if (hit) {
        turbine.position.y = hit.point.y - 0.38;
        turbine.userData["groundedSurfaceY"] = hit.point.y;
        turbine.updateMatrix();
      }
    });
    windFarm.updateMatrixWorld(true);
    const usedGeometry = new Set<T.BufferGeometry>(),
      usedMaterials = new Set<T.Material>(),
      usedMaps = new Set<T.Texture>();
    scene.traverse((o) => {
      if (!(o instanceof T.Mesh || o instanceof T.Line || o instanceof T.Points)) return;
      usedGeometry.add(o.geometry);
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        usedMaterials.add(m);
        for (const value of Object.values(m)) if (value instanceof T.Texture) usedMaps.add(value);
      }
    });
    let released = 0;
    for (const g of geometries)
      if (!usedGeometry.has(g)) {
        g.dispose();
        geometries.delete(g);
        released++;
      }
    for (const m of materials)
      if (!usedMaterials.has(m)) {
        m.dispose();
        materials.delete(m);
      }
    for (const t of maps)
      if (!usedMaps.has(t)) {
        t.dispose();
        maps.delete(t);
      }
    scene.userData["releasedUnusedGeometries"] = released;
    onSceneChange();
  });
  function setFieldNight(night: boolean) {
    for (const name of ["walking-worker", "maintenance-worker-1", "maintenance-worker-2"]) {
      const worker = scene.getObjectByName(name);
      if (worker) worker.visible = !night;
    }
    pickup.position.set(night ? 24 : 10.2, 0, night ? 2.1 : -36);
    pickup.rotation.y = night ? Math.PI / 2 : 0;
    load.position.copy(pickup.position);
    load.rotation.copy(pickup.rotation);
    pickup.updateMatrixWorld(true);
    load.updateMatrixWorld(true);
  }
  function setTimeMode(day: boolean) {
    cityDay = day;
    setFieldNight(day);
    nightCity.setDay(day);
    nightHemi.color.set(day ? "#d5eaff" : "#6b8eae");
    nightHemi.groundColor.set(day ? "#81916d" : "#10121b");
    nightHemi.intensity = day ? 2.1 : 1.15;
    moon.color.set(day ? "#fff0d6" : "#86a9d2");
    moon.intensity = day ? 3 : 1.8;
    roomLight.intensity = day ? 18 : 38;
    warmLight.intensity = day ? 8 : 22;
    solarUniform.value.copy(earthSunDirection(day));
    spaceSun.position.copy(globeCenter).addScaledVector(solarUniform.value, 5000);
    spaceSun.updateMatrixWorld(true);
    spaceSun.target.updateMatrixWorld(true);
    scene.userData["fieldNight"] = day;
    scene.userData["cityDay"] = day;
  }
  update(0, 1);
  return {
    scene,
    camera,
    screen,
    inverter,
    scada,
    update,
    tick,
    setCityDay: setTimeMode,
    setDayNight: setTimeMode,
    startStreaming,
    textureReady: allReady,
    dispose() {
      if (disposed) return;
      disposed = true;
      abortModelLoads(loadingManager);
      imported?.dispose();
      userModels?.dispose();
      additionalModels?.dispose();
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const t of maps) t.dispose();
      sunlight.shadow.map?.dispose();
      field.dispose();
      craft.dispose();
      trunks.dispose();
      crowns.dispose();
      pebbles.dispose();
      nightCity.dispose();
      rocks.dispose();
      scrub.dispose();
      moon.shadow.map?.dispose();
      scene.clear();
    },
  };
}
