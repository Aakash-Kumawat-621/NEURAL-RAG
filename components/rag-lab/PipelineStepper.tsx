export function PipelineStepper({ currentStep }: { currentStep: string }) {
  const steps = [
    { id: "ingestion", label: "Chunking & Embedding" },
    { id: "retrieval", label: "Vector Search" },
    { id: "generation", label: "LLM Synthesis" },
  ];

  const getStepStatus = (stepId: string, index: number) => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (stepId === currentStep) return "active";
    if (index < currentIndex || currentStep === "completed") return "completed";
    return "pending";
  };

  return (
    <div className="stepper glass-card animate-in">
      {steps.map((step, index) => {
        const status = getStepStatus(step.id, index);
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} style={{ display: "flex", alignItems: "center", flex: isLast ? 0 : 1 }}>
            <div className={`stepper-step ${status}`}>
              <div className="stepper-step-number">
                {status === "completed" ? "✓" : index + 1}
              </div>
              <div className="stepper-step-label">{step.label}</div>
            </div>
            {!isLast && (
              <div className={`stepper-connector ${status === "completed" ? "completed" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
