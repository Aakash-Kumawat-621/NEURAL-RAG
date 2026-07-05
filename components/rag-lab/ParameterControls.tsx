import { useState } from "react";

interface Params {
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
}

interface Props {
  params: Params;
  onChange: (params: Params) => void;
  disabled?: boolean;
}

export function ParameterControls({ params, onChange, disabled }: Props) {
  const [localParams, setLocalParams] = useState(params);

  const handleChange = (key: keyof Params, value: number) => {
    const newParams = { ...localParams, [key]: value };
    setLocalParams(newParams);
    // Debounce or call directly (we'll just call directly for simplicity)
    onChange(newParams);
  };

  return (
    <div className="controls-panel">
      <div className="control-group">
        <label>
          Chunk Size <span>{localParams.chunkSize} chars</span>
        </label>
        <input
          type="range"
          min="100"
          max="2000"
          step="50"
          value={localParams.chunkSize}
          onChange={(e) => handleChange("chunkSize", parseInt(e.target.value))}
          disabled={disabled}
          className="slider"
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
          <span>More granular</span>
          <span>More context</span>
        </div>
      </div>

      <div className="control-group">
        <label>
          Chunk Overlap <span>{localParams.chunkOverlap} chars</span>
        </label>
        <input
          type="range"
          min="0"
          max="500"
          step="10"
          value={localParams.chunkOverlap}
          onChange={(e) => handleChange("chunkOverlap", parseInt(e.target.value))}
          disabled={disabled}
          className="slider"
        />
      </div>

      <div className="control-group">
        <label>
          Top-K (Vector Search) <span>{localParams.topK} chunks</span>
        </label>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={localParams.topK}
          onChange={(e) => handleChange("topK", parseInt(e.target.value))}
          disabled={disabled}
          className="slider"
        />
      </div>
    </div>
  );
}
