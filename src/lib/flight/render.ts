import { subscribeLocale } from "@/lib/i18n";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { markModelInteraction } from "./model-loader";
import { prepareDisplayTexture } from "./screen-texture";
import { prepareScene } from "./prepare-scene";
import { createInstanceCuller } from "./instance-culling";
import * as T from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createFlightWorld } from "./world";
export type FlightRenderer = {
  paint?: () => void;
  setDayNight?: (day: boolean) => void;
  setProgress: (p: number) => void;
  setPaused: (paused: boolean) => void;
  setEffectsPaused?: (paused: boolean) => void;
  setScreen: (url: string) => void;
  screenUV: (x: number, y: number) => { u: number; v: number } | null;
  resize: () => void;
  dispose: () => void;
};
export function mountFlight(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  onReady: () => void,
  onError: () => void,
  onProgress: (value: number) => void = () => {},
  onFrame: (progress: number, screenUrl: string) => void = () => {},
): FlightRenderer {
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, container.clientWidth < 760 ? 1 : 1.25),
  );
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  let failed = false,
    ready = false,
    p = 0,
    visible = true,
    paused = false,
    disposed = false,
    frame = 0,
    width = 1,
    height = 1,
    sceneDirty = true,
    screenRequest = 0,
    lastShadow = -Infinity,
    textureTimer = 0,
    lastScroll = -Infinity,
    effectTimer = 0,
    lastWorldP = -1,
    lastWorldAspect = -1,
    selectedUrl = "/assets/screens/monitor-dashboard-1.png";
  const world = createFlightWorld({
      onLoadProgress: (value) => onProgress(0.15 + value * 0.75),
      prepareModel: prepareModelTextures,
      onTextureError: () => {},
      onSceneChange: () => {
        sceneDirty = true;
        invalidate();
      },
    }),
    culler = createInstanceCuller(world.scene);
  const pmrem = new T.PMREMGenerator(renderer),
    environmentScene = new RoomEnvironment(),
    env = pmrem.fromScene(environmentScene, 0.04);
  world.scene.environment = env.texture;
  environmentScene.dispose();
  pmrem.dispose();
  const ray = new T.Raycaster(),
    screens = new Map<string, T.Texture>(),
    uploaded = new WeakSet<T.Texture>(),
    pendingTextures: T.Texture[] = [];
  ray.layers.enableAll();
  async function prepareModelTextures(model: GLTF) {
    const textures = new Set<T.Texture>();
    model.scene.traverse((o) => {
      if (!(o instanceof T.Mesh)) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        for (const t of Object.values(m)) if (t instanceof T.Texture && t.image) textures.add(t);
    });
    for (const texture of textures) {
      if (disposed) return;
      const began = performance.now();
      while (performance.now() - lastScroll < 140 && performance.now() - began < 1000 && !disposed)
        await new Promise<void>((resolve) => setTimeout(resolve, 80));
      await new Promise<void>((resolve) => setTimeout(resolve, 20));
      if (disposed) return;
      texture.anisotropy = 4;
      renderer.initTexture?.(texture);
      uploaded.add(texture);
    }
  }
  const fail = () => {
    failed = true;
    onError();
  };
  function prepareArrivals() {
    culler.scan();
    world.scene.matrixWorldAutoUpdate = false;
    sceneDirty = false;
    const activeTextures = new Set<T.Texture>();
    world.scene.traverse((o) => {
      if (!(o instanceof T.Mesh)) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        for (const t of Object.values(m))
          if (t instanceof T.Texture && t.image) {
            activeTextures.add(t);
            if (!uploaded.has(t)) {
              uploaded.add(t);
              pendingTextures.push(t);
            }
          }
    });
    for (let i = pendingTextures.length - 1; i >= 0; i--)
      if (!activeTextures.has(pendingTextures[i]!)) pendingTextures.splice(i, 1);
  }
  let effectsPaused = false;
  function draw() {
    frame = 0;
    if (!ready || failed || disposed || paused || !visible || document.visibilityState === "hidden")
      return;
    try {
      const started = performance.now(),
        arrived = sceneDirty;
      if (sceneDirty) prepareArrivals();
      const texture = started - lastScroll > 140 ? pendingTextures.shift() : undefined;
      if (texture) renderer.initTexture?.(texture);
      if (arrived || lastWorldP !== p || lastWorldAspect !== width / height) {
        world.update(p, width / height);
        lastWorldP = p;
        lastWorldAspect = width / height;
      }
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        animate =
          !effectsPaused && world.tick?.(reduced ? 0 : performance.now() / 1000) && !reduced;
      if (animate && !effectTimer)
        effectTimer = window.setTimeout(() => {
          effectTimer = 0;
          invalidate();
        }, 120);
      const instances = culler.update(world.camera);
      renderer.shadowMap.needsUpdate = p < 0.5 && (arrived || started - lastShadow > 100);
      if (renderer.shadowMap.needsUpdate) lastShadow = started;
      renderer.setRenderTarget(null);
      renderer.render(world.scene, world.camera);
      onFrame(p, selectedUrl);
      Object.assign(canvas.dataset, {
        renderMs: (performance.now() - started).toFixed(1),
        drawCalls: String(renderer.info?.render.calls ?? 0),
        triangles: String(renderer.info?.render.triangles ?? 0),
        visibleInstances: String(instances.submitted),
      });
      if (pendingTextures.length && !textureTimer)
        textureTimer = window.setTimeout(
          () => {
            textureTimer = 0;
            invalidate();
          },
          started - lastScroll > 140 ? 24 : 160,
        );
    } catch {
      fail();
    }
  }
  function invalidate() {
    if (!frame && !disposed && !paused && visible) frame = requestAnimationFrame(draw);
  }
  const unsubscribeLocale = subscribeLocale(invalidate);
  const resize = () => {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, width < 760 ? 1 : 1.25);
    if (renderer.getPixelRatio?.() !== ratio) renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    invalidate();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  const intersection = new IntersectionObserver(
    (entries) => {
      visible = Boolean(entries[0]?.isIntersecting);
      if (visible) invalidate();
    },
    { rootMargin: "100px" },
  );
  intersection.observe(container);
  const visibility = () => {
    if (document.visibilityState === "visible") invalidate();
  };
  document.addEventListener("visibilitychange", visibility);
  const contextLost = (e: Event) => {
    e.preventDefault();
    fail();
  };
  canvas.addEventListener("webglcontextlost", contextLost);
  function apply(texture: T.Texture) {
    const material = world.screen.material as T.MeshBasicMaterial;
    material.map = texture;
    material.color.set("#ffffff");
    material.needsUpdate = true;
    invalidate();
  }
  async function warmCompleteScene() {
    prepareArrivals();
    while (pendingTextures.length && !disposed) {
      renderer.initTexture?.(pendingTextures.shift()!);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    if (disposed || typeof renderer.getRenderTarget !== "function") return;
    const previous = renderer.getRenderTarget(),
      target = new T.WebGLRenderTarget(64, 64, { depthBuffer: true, stencilBuffer: false });
    try {
      for (const value of [0.84, 0.925, 0.94, 0]) {
        if (disposed) return;
        world.update(value, width / height);
        world.scene.updateMatrixWorld(true);
        culler.update(world.camera);
        if (typeof renderer.compileAsync === "function")
          await renderer.compileAsync(world.scene, world.camera);
        renderer.setRenderTarget(target);
        renderer.shadowMap.needsUpdate = value === 0;
        renderer.render(world.scene, world.camera);
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    } finally {
      renderer.setRenderTarget(previous);
      target.dispose();
      world.update(p, width / height);
      world.scene.updateMatrixWorld(true);
      culler.update(world.camera);
    }
  }
  resize();
  prepareScene(renderer, world, width / height, onProgress, () => disposed)
    .then(async () => {
      await warmCompleteScene();
      if (disposed || failed) return;
      ready = true;
      draw();
      if (failed) return;
      onProgress(1);
      onReady();
    })
    .catch(() => {
      if (!disposed) fail();
    });
  return {
    paint() {
      cancelAnimationFrame(frame);
      frame = 0;
      draw();
    },
    setEffectsPaused(value) {
      effectsPaused = value;
      invalidate();
    },
    setDayNight(day) {
      world.setDayNight?.(day);
      lastWorldP = -1;
      invalidate();
    },
    setProgress(value) {
      p = value;
      lastScroll = performance.now();
      markModelInteraction(value);
      invalidate();
    },
    setPaused(value) {
      paused = value;
      if (!paused) {
        if (container.isConnected) {
          const rect = container.getBoundingClientRect();
          visible = rect.bottom > -100 && rect.top < innerHeight + 100;
        }
        invalidate();
      }
    },
    setScreen(url) {
      const request = ++screenRequest;
      if (url === selectedUrl) return;
      const cached = screens.get(url);
      if (cached) {
        screens.delete(url);
        screens.set(url, cached);
        selectedUrl = url;
        apply(cached);
        return;
      }
      new T.TextureLoader().load(
        url,
        (texture) => {
          if (disposed) {
            texture.dispose();
            return;
          }
          prepareDisplayTexture(texture, url);
          texture.colorSpace = T.SRGBColorSpace;
          texture.anisotropy = 2;
          screens.set(url, texture);
          if (request === screenRequest) {
            selectedUrl = url;
            apply(texture);
          }
          while (screens.size > 3) {
            const [old, value] = screens.entries().next().value!;
            screens.delete(old);
            if (old === selectedUrl) {
              screens.set(old, value);
              continue;
            }
            value.dispose();
          }
        },
        undefined,
        () => {},
      );
    },
    screenUV(x, y) {
      if (!ready || p < 0.974) return null;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      world.screen.updateWorldMatrix(true, false);
      world.camera.updateMatrixWorld(true);
      ray.setFromCamera(
        new T.Vector2(
          ((x - rect.left) / rect.width) * 2 - 1,
          1 - ((y - rect.top) / rect.height) * 2,
        ),
        world.camera,
      );
      const hit = ray.intersectObject(world.screen, false)[0];
      return hit?.uv ? { u: hit.uv.x, v: 1 - hit.uv.y } : null;
    },
    resize,
    dispose() {
      disposed = true;
      unsubscribeLocale();
      clearTimeout(effectTimer);
      clearTimeout(textureTimer);
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("webglcontextlost", contextLost);
      screens.forEach((t) => t.dispose());
      screens.clear();
      culler.clear();
      world.dispose();
      env.dispose();
      renderer.dispose();
    },
  };
}
