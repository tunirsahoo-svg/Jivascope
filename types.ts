// Clinical Classification Categories
export enum MurmurType {
  NORMAL = "Normal",
  AORTIC_STENOSIS = "Aortic Stenosis (AS)",
  MITRAL_REGURGITATION = "Mitral Regurgitation (MR)",
  MITRAL_STENOSIS = "Mitral Stenosis (MS)",
  MITRAL_VALVE_PROLAPSE = "Mitral Valve Prolapse (MVP)"
}

export interface AnalysisConfidence {
  label: MurmurType;
  score: number; // 0.0 to 1.0
}

export interface AnalysisResult {
  primaryDiagnosis: MurmurType;
  confidence: number;
  secondaryPossibilities: AnalysisConfidence[];
  clinicalNotes: string;
  heartRate: number;
  s1Intensity: 'Normal' | 'Loud' | 'Soft' | 'Variable';
  s2Intensity: 'Normal' | 'Split' | 'Single' | 'Loud P2';
  timestamp: string;
}

export enum ProcessingStage {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PREPROCESSING = 'PREPROCESSING (DWT Denoising)',
  SEGMENTATION = 'SEGMENTATION (DHMM/Viterbi)',
  FEATURE_EXTRACTION = 'FEATURE EXTRACTION (MFCC)',
  INFERENCE = 'INFERENCE (Quantized BiGRU)',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface DeviceStatus {
  connected: boolean;
  batteryLevel: number;
  deviceName: string;
  signalQuality: number; // 0-100
}