import React from 'react';
import { AnalysisResult, MurmurType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  result: AnalysisResult | null;
}

const AnalysisReport: React.FC<Props> = ({ result }) => {
  if (!result) return null;

  const isNormal = result.primaryDiagnosis === MurmurType.NORMAL;
  
  const chartData = [
    { name: 'Diagnosis', value: result.confidence * 100 },
    ...result.secondaryPossibilities.map(p => ({
      name: p.label.split('(')[0].trim(), // Shorten name for chart
      value: p.score * 100
    }))
  ];

  return (
    <div className="mt-6 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className={`p-4 border-b ${isNormal ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Clinical Decision Support</h2>
            <h1 className={`text-2xl font-bold mt-1 ${isNormal ? 'text-green-700' : 'text-red-700'}`}>
              {result.primaryDiagnosis}
            </h1>
          </div>
          <div className="text-right">
             <div className="text-xs text-slate-500">Confidence</div>
             <div className="text-xl font-bold text-slate-800">{(result.confidence * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Clinical Data */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-slate-900 mb-2">Findings</h3>
            <p className="text-slate-600 leading-relaxed text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
              {result.clinicalNotes}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <div className="text-xs text-slate-500 uppercase">Heart Rate</div>
                <div className="text-lg font-semibold text-slate-900">{result.heartRate} <span className="text-xs font-normal text-slate-500">BPM</span></div>
             </div>
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <div className="text-xs text-slate-500 uppercase">S1 Sound</div>
                <div className="text-lg font-semibold text-slate-900">{result.s1Intensity}</div>
             </div>
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <div className="text-xs text-slate-500 uppercase">S2 Sound</div>
                <div className="text-lg font-semibold text-slate-900">{result.s2Intensity}</div>
             </div>
          </div>

          <div className="text-xs text-slate-400 mt-4">
            Analysis Timestamp: {new Date(result.timestamp).toLocaleString()}
          </div>
        </div>

        {/* Right Column: Visualization */}
        <div className="h-64 w-full">
            <h3 className="text-sm font-medium text-slate-900 mb-4">Probability Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? (isNormal ? '#22c55e' : '#ef4444') : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </div>

      </div>
      
      {/* Disclaimer Footer */}
      <div className="bg-slate-100 p-3 text-center border-t border-slate-200">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
           Rx Only • Investigational Device • Not for Diagnostic Use
        </p>
      </div>
    </div>
  );
};

export default AnalysisReport;