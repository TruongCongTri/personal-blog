"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import styles from "./DustField.module.css";

/**
 * Paper dust drifting in the lamp light above the drawer (three.js).
 * Lazy-loaded, capped pixel ratio, fewer particles on phones, and paused
 * whenever it is off screen or the tab is hidden.
 */
export default function DustField() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el || prefersReducedMotion()) return;
    let cleanup = () => {};
    let cancelled = false;

    import("three").then((THREE) => {
      if (cancelled) return;
      const mobile = window.matchMedia("(max-width: 768px)").matches;
      const count = mobile ? 140 : 360;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      camera.position.z = 10;

      // Soft round sprite drawn on a canvas — no texture download.
      const sprite = document.createElement("canvas");
      sprite.width = sprite.height = 32;
      const ctx = sprite.getContext("2d")!;
      const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, "rgba(253,250,247,1)");
      g.addColorStop(1, "rgba(253,250,247,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 32, 32);
      const texture = new THREE.CanvasTexture(sprite);

      const positions = new Float32Array(count * 3);
      const speeds = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 16;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
        speeds[i] = 0.08 + Math.random() * 0.22;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        size: mobile ? 0.09 : 0.07,
        map: texture,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
      const onPointer = (e: PointerEvent) => {
        pointer.tx = (e.clientX / window.innerWidth - 0.5) * 0.6;
        pointer.ty = (e.clientY / window.innerHeight - 0.5) * 0.4;
      };

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = el;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };

      const clock = new THREE.Clock();
      const attr = geometry.getAttribute("position") as InstanceType<typeof THREE.BufferAttribute>;
      const loop = () => {
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;
        for (let i = 0; i < count; i++) {
          let y = positions[i * 3 + 1] + speeds[i] * dt;
          if (y > 6) y = -6;
          positions[i * 3 + 1] = y;
          positions[i * 3] += Math.sin(t * 0.3 + i) * 0.0015;
        }
        attr.needsUpdate = true;
        pointer.x += (pointer.tx - pointer.x) * 0.04;
        pointer.y += (pointer.ty - pointer.y) * 0.04;
        points.rotation.y = pointer.x;
        points.rotation.x = pointer.y;
        renderer.render(scene, camera);
      };

      let onScreen = true;
      const sync = () => renderer.setAnimationLoop(onScreen && !document.hidden ? loop : null);
      const io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      });
      io.observe(el);
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      document.addEventListener("visibilitychange", sync);
      window.addEventListener("pointermove", onPointer, { passive: true });
      resize();
      sync();
      el.dataset.ready = "true";

      cleanup = () => {
        renderer.setAnimationLoop(null);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", sync);
        window.removeEventListener("pointermove", onPointer);
        geometry.dispose();
        material.dispose();
        texture.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return <div ref={host} className={styles.dust} aria-hidden="true" />;
}
