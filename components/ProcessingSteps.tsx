import React from 'react';
import { ProcessingStage } from '../types';

const steps = [
  { id: ProcessingStage.PREPROCESSING, label: 'Denoising' },
  { id: ProcessingStage.SEGMENTATION, label: 'Segmentation' },
  { id: ProcessingStage.FEATURE_EXTRACTION, label: 'Feat. Extraction' },
  { id: ProcessingStage.INFERENCE, label: 'AI Inference' },
];

const ProcessingSteps: React.FC<{ currentStage: ProcessingStage }> = ({ currentStage }) => {
  const getStatus = (stepId: ProcessingStage) => {
    const allStages = Object.values(ProcessingStage);
    const currentIndex = allStages.indexOf(currentStage);
    const stepIndex = allStages.indexOf(stepId);

    if (currentStage === ProcessingStage.COMPLETE || currentStage === ProcessingStage.IDLE) {
       return currentStage === ProcessingStage.COMPLETE ? 'completed' : 'pending';
    }

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full py-4 px-2">
      <div className="flex justify-between items-center relative">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 transform -translate-y-1/2"></div>
        
        {steps.map((step) => {
          const status = getStatus(step.id);
          return (
            <div key={step.id} className="flex flex-col items-center bg-slate-50 px-2 z-10">
              <div className={`w-3 h-3 rounded-full mb-2 transition-all duration-300 ${
                status === 'completed' ? 'bg-medical-500 scale-110' :
                status === 'active' ? 'bg-medical-600 animate-pulse scale-125' :
                'bg-slate-300'
              }`}></div>
              <span className={`text-[10px] font-medium uppercase tracking-tight ${
                status === 'active' ? 'text-medical-800' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessingSteps;