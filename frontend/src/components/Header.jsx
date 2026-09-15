import React from 'react';
import { Wand2, Cpu, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function Header({ backendHealth, onRefreshHealth }) {
  const isOnline = backendHealth?.status === 'ok';
  const isReady = backendHealth?.model_loaded;
  const device = backendHealth?.device || 'Unknown';

  return (
    <header className="border-b border-[#EAE5DB] bg-[#FBF9F5]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#2E2B25] flex items-center justify-center text-white shadow-xs">
            <Wand2 className="w-4 h-4 text-[#F7F4EC]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-[#1F1C18]">
                Stylo
              </span>
              <span className="text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-md bg-[#F2EDE2] text-[#696255] border border-[#E2DDD0]">
                AdaIN Studio
              </span>
            </div>
          </div>
        </div>

        {/* System & Backend Status Badges */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 bg-[#F5F2EB] border border-[#EAE5DB] rounded-lg px-2.5 py-1 text-xs text-[#696255]">
            <Cpu className="w-3.5 h-3.5 text-[#8A8271]" />
            <span className="text-[#8A8271]">Device:</span>
            <span className="font-mono font-semibold text-[#2E2B25]">{device.toUpperCase()}</span>
          </div>

          <button
            type="button"
            onClick={onRefreshHealth}
            title="Click to check backend status"
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isOnline && isReady
                ? 'bg-[#F2F7F2] border-[#D6E6D6] text-[#2D5A27] hover:bg-[#E8F2E8]'
                : isOnline
                ? 'bg-[#FFF9EE] border-[#F2E0BD] text-[#8C6B23] hover:bg-[#FFF4DD]'
                : 'bg-[#FCF2F2] border-[#F2D1D1] text-[#9A2E2E] hover:bg-[#FAECEC]'
            }`}
          >
            {isOnline && isReady ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-[#3D7D35]"></span>
                <span>Ready</span>
              </>
            ) : isOnline ? (
              <>
                <AlertCircle className="w-3 h-3 text-[#B0862C]" />
                <span>Loading Models</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 text-[#C24141]" />
                <span>Offline</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
