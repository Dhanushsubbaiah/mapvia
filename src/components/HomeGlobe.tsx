"use client";

import dynamic from "next/dynamic";

const InteractiveGlobe = dynamic(
  () => import("@/components/InteractiveGlobe"),
  { ssr: false }
);

export default function HomeGlobe() {
  return (
    <div className="mx-auto h-[220px] w-full max-w-[360px] sm:h-[260px] sm:max-w-[420px]">
      <InteractiveGlobe />
    </div>
  );
}
