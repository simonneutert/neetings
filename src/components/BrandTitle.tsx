import { FunctionalComponent } from "preact";
import { ProductionReadyHint } from "./ProductionReadyHint";

export const BrandTitle: FunctionalComponent = () => {
  return (
    <div>
      <h1
        style={{
          textAlign: "center",
          fontSize: "3rem",
          fontWeight: "800",
          letterSpacing: "-0.02em",
          margin: "2rem 0",
          position: "relative",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <span
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
            border: "3px solid rgba(255,255,255,0.2)",
            transform: "rotate(-2deg)",
            position: "relative",
          }}
        >
          neetings *
        </span>
        <span
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          -
        </span>
        <span
          style={{
            background: "linear-gradient(135deg, #fd7e14 0%, #e83e8c 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          neatly
        </span>
        <span
          style={{
            background: "linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          noted
        </span>
        <span
          style={{
            background: "linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          meetings
        </span>
      </h1>
      <div>
        <ProductionReadyHint />
      </div>
    </div>
  );
};
