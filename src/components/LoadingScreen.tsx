import { useEffect, useState } from "preact/hooks";
import { ProductionReadyHint } from "./ProductionReadyHint";

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
}

export function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const [phase, setPhase] = useState<"showing" | "fading" | "hidden">(
    "showing",
  );

  useEffect(() => {
    // Show loading screen for 500ms
    const showTimer = setTimeout(() => {
      setPhase("fading");
    }, 750);

    // Complete fadeout after additional 500ms
    const fadeTimer = setTimeout(() => {
      setPhase("hidden");
      onLoadingComplete?.();
    }, 1250); // 500ms + 500ms

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
    };
  }, [onLoadingComplete]);

  if (phase === "hidden") {
    return null;
  }

  return (
    <div
      className={`loading-screen ${
        phase === "fading" ? "loading-screen--fading" : ""
      }`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#6980C4",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        opacity: phase === "fading" ? 0 : 1,
        transition: "opacity 500ms ease-out",
      }}
    >
      <img
        src="/neetings-logo.jpg"
        alt="Neetings Logo"
        style={{
          maxWidth: "400px",
          maxHeight: "400px",
          width: "80vw",
          height: "auto",
        }}
      />
      <ProductionReadyHint color="white" />
    </div>
  );
}
