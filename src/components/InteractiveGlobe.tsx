"use client";

import { useEffect, useRef } from "react";
import Globe from "globe.gl";

export default function InteractiveGlobe() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const globe = new Globe(containerRef.current)
      .globeImageUrl(
        "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
      )
      .bumpImageUrl(
        "https://unpkg.com/three-globe/example/img/earth-topology.png"
      )
      .backgroundColor("rgba(0,0,0,0)")
      .showAtmosphere(true)
      .atmosphereColor("#60a5fa")
      .atmosphereAltitude(0.18);

    const resize = () => {
      if (!containerRef.current) return;
      globe
        .width(containerRef.current.clientWidth)
        .height(containerRef.current.clientHeight);
    };

    resize();

    const controls = globe.controls();
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return <div ref={containerRef} className="h-[260px] w-full" />;
}
