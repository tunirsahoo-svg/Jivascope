export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/wav;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const decodeAudioData = async (
  arrayBuffer: ArrayBuffer,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  return await audioContext.decodeAudioData(arrayBuffer);
};

export const normalizeBuffer = (buffer: AudioBuffer): Float32Array => {
  const rawData = buffer.getChannelData(0); // Mono channel for PCG
  const samples = rawData.length;
  const maxVal = rawData.reduce((acc, val) => Math.max(acc, Math.abs(val)), 0);
  
  if (maxVal === 0) return rawData;

  const normalized = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    normalized[i] = rawData[i] / maxVal;
  }
  return normalized;
};