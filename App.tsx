import React, { useState, useRef, useEffect } from 'react';
import { Activity, Bluetooth, Mic, Upload, Play, Pause, RefreshCw, Smartphone, ShieldCheck } from 'lucide-react';
import { analyzePCGSignal } from './services/geminiService';
import { fileToBase64, decodeAudioData } from './services/audioUtils';
import { AnalysisResult, ProcessingStage, DeviceStatus } from './types';
import WaveformDisplay from './components/WaveformDisplay';
import AnalysisReport from './components/AnalysisReport';
import ProcessingSteps from './components/ProcessingSteps';

// Mock Device Status
const INITIAL_DEVICE_STATUS: DeviceStatus = {
  connected: false,
  batteryLevel: 0,
  deviceName: "Littmann CORE Digital",
  signalQuality: 0
};

export default function App() {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [stage, setStage] = useState<ProcessingStage>(ProcessingStage.IDLE);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>(INITIAL_DEVICE_STATUS);
  
  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  
  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const requestRef = useRef<number>();

  // --- Audio Context Init ---
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // --- Handlers ---

  const handleDevicePairing = () => {
    // Simulate Bluetooth Pairing
    setStage(ProcessingStage.IDLE);
    setDeviceStatus(prev => ({ ...prev, connected: false }));
    setTimeout(() => {
      setDeviceStatus({
        connected: true,
        batteryLevel: 85,
        deviceName: "Littmann CORE Digital",
        signalQuality: 98
      });
    }, 1500);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setAnalysisResult(null);
    setStage(ProcessingStage.IDLE);
    setIsPlaying(false);
    setPlaybackProgress(0);

    // Decode for visualization
    if (audioContextRef.current) {
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const buffer = await decodeAudioData(arrayBuffer, audioContextRef.current);
        setAudioBuffer(buffer);
      } catch (err) {
        console.error("Error decoding audio", err);
        alert("Failed to decode audio file.");
      }
    }
  };

  const togglePlayback = () => {
    if (!audioContextRef.current || !audioBuffer) return;

    if (isPlaying) {
      // Stop
      sourceNodeRef.current?.stop();
      setIsPlaying(false);
      cancelAnimationFrame(requestRef.current!);
    } else {
      // Start
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(0, playbackProgress * audioBuffer.duration); // Start from offset
      
      startTimeRef.current = audioContextRef.current.currentTime - (playbackProgress * audioBuffer.duration);
      sourceNodeRef.current = source;
      setIsPlaying(true);

      // Animation Loop for Progress
      const animate = () => {
        if (!audioContextRef.current || !audioBuffer) return;
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
        const progress = Math.min(elapsed / audioBuffer.duration, 1);
        setPlaybackProgress(progress);

        if (progress < 1) {
          requestRef.current = requestAnimationFrame(animate);
        } else {
          setIsPlaying(false);
          setPlaybackProgress(0); // Reset on finish
        }
      };
      requestRef.current = requestAnimationFrame(animate);

      source.onended = () => {
        // Handled in animate loop primarily, but cleanup here
      };
    }
  };

  const runAnalysis = async () => {
    if (!file) return;

    try {
      // 1. Preprocessing Simulation
      setStage(ProcessingStage.PREPROCESSING);
      await new Promise(r => setTimeout(r, 1200));

      // 2. Segmentation Simulation
      setStage(ProcessingStage.SEGMENTATION);
      await new Promise(r => setTimeout(r, 1200));

      // 3. Feature Extraction
      setStage(ProcessingStage.FEATURE_EXTRACTION);
      
      // Get Base64
      const base64Audio = await fileToBase64(file);

      // 4. Inference (Real Gemini Call)
      setStage(ProcessingStage.INFERENCE);
      const result = await analyzePCGSignal(base64Audio);
      
      setAnalysisResult(result);
      setStage(ProcessingStage.COMPLETE);

    } catch (error) {
      console.error(error);
      setStage(ProcessingStage.ERROR);
      alert("Analysis failed. Please check your API key or connection.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
      
      {/* --- Header --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-medical-600 p-1.5 rounded-lg text-white">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-medical-900 leading-none">CardioQuant</h1>
              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">AI-Powered PCG Analyzer</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Device Status Indicator */}
             <button 
               onClick={handleDevicePairing}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                 deviceStatus.connected 
                 ? 'bg-green-50 text-green-700 border-green-200' 
                 : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
               }`}
             >
               <Bluetooth size={14} className={deviceStatus.connected ? '' : 'opacity-50'} />
               {deviceStatus.connected ? "Connected" : "Pair Device"}
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-6">

        {/* --- Control Panel --- */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Signal Acquisition</h2>
              <p className="text-sm text-slate-500">Upload high-fidelity .wav recording or stream from device.</p>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <label className="flex-1 md:flex-none cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200">
                <Upload size={16} />
                <span>Load File</span>
                <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
              </label>
              
              <button disabled className="opacity-50 flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100 cursor-not-allowed">
                <Mic size={16} />
                <span>Live Stream</span>
              </button>
            </div>
          </div>

          {/* --- Waveform Visualization --- */}
          <WaveformDisplay 
            audioBuffer={audioBuffer} 
            isPlaying={isPlaying} 
            currentTime={playbackProgress} 
          />

          {/* --- Playback Controls --- */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlayback}
                disabled={!audioBuffer}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-medical-600 hover:bg-medical-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </button>
              <div className="text-sm font-mono text-slate-500">
                 {audioBuffer ? `${(playbackProgress * audioBuffer.duration).toFixed(1)}s / ${audioBuffer.duration.toFixed(1)}s` : '--:-- / --:--'}
              </div>
            </div>

            <button
              onClick={runAnalysis}
              disabled={!audioBuffer || stage !== ProcessingStage.IDLE && stage !== ProcessingStage.COMPLETE}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {stage !== ProcessingStage.IDLE && stage !== ProcessingStage.COMPLETE ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Analyze Signal</span>
                </>
              )}
            </button>
          </div>

          {/* --- Pipeline Progress --- */}
          {stage !== ProcessingStage.IDLE && (
            <div className="mt-6 border-t border-slate-100 pt-4">
               <ProcessingSteps currentStage={stage} />
            </div>
          )}
        </section>

        {/* --- Results Section --- */}
        {analysisResult && (
          <AnalysisReport result={analysisResult} />
        )}

      </main>
      
      {/* --- Footer Status Bar --- */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-slate-200 text-[10px] text-slate-400 py-1.5 px-4 flex justify-between z-40">
        <div className="flex gap-4">
           <span>Model: Quantized BiGRU-CNN (Simulated)</span>
           <span>Resolution: 16-bit PCM @ 4000Hz</span>
           <span>Latency: 45ms</span>
        </div>
        <div className="flex items-center gap-1">
           <Smartphone size={10} />
           <span>Edge Optimized (ONNX Runtime)</span>
        </div>
      </footer>
    </div>
  );
}