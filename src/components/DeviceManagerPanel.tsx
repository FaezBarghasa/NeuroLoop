import React, { useState, useRef } from 'react';
import { useNeuroStore } from '../store/useNeuroStore';
import {
  Smartphone,
  Watch,
  Activity,
  Bluetooth,
  Zap,
  CheckCircle2,
  TerminalSquare,
  Radio,
  RefreshCw,
  Copy,
  Check,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { googleHealth } from '../services/googleHealthService';
import { gadgetbridge } from '../services/gadgetbridgeService';
import { triggerHaptic } from '../utils/haptics';

export const DeviceManagerPanel: React.FC = () => {
  const {
    biometrics,
    setBiometricSource,
    googleHealthConfig,
    gadgetbridgeConfig,
    syncGoogleHealthConnect,
    syncGoogleFit,
    startGadgetbridgeListener,
    stopGadgetbridgeListener,
    injectGadgetbridgeBroadcast,
    importGadgetbridgeData,
    bleLogs,
    isBleScanning,
    isBleConnected,
    startBleScan,
    sendAtGetSecret,
    fetchSleepHistoryBle,
    connectRealWebBluetooth,
  } = useNeuroStore();

  const [activeSubTab, setActiveSubTab] = useState<'google_health' | 'gadgetbridge' | 'ble_bridge'>('google_health');
  const [testBpmInput, setTestBpmInput] = useState<number>(76);
  const [googleFitToken, setGoogleFitToken] = useState<string>('');
  const [copiedAdb, setCopiedAdb] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyAdb = () => {
    const cmd = gadgetbridge.getAdbBroadcastCommand(testBpmInput);
    navigator.clipboard.writeText(cmd);
    setCopiedAdb(true);
    setTimeout(() => setCopiedAdb(false), 2000);
  };

  const handleManualSyncGoogleHealth = async () => {
    triggerHaptic('heavy');
    setIsSyncing(true);
    await syncGoogleHealthConnect();
    setTimeout(() => setIsSyncing(false), 600);
  };

  const handleManualSyncGoogleFit = async () => {
    triggerHaptic('heavy');
    setIsSyncing(true);
    await syncGoogleFit(googleFitToken || undefined);
    setTimeout(() => setIsSyncing(false), 600);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      triggerHaptic('success');
      const file = e.target.files[0];
      const text = await file.text();
      await importGadgetbridgeData(text);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
            <Watch className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
              Connect Devices
            </h2>
            <p className="text-xs text-zinc-400">
              Sync your heart rate and sleep data to personalize your audio sessions.
            </p>
          </div>
        </div>

        {/* Current Active Source Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono self-start sm:self-center backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-400">Source:</span>
          <span className="text-emerald-300 font-semibold truncate max-w-[170px]">{biometrics.source}</span>
        </div>
      </div>

      {/* Integration Sources Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* 1. Google Health Connect API */}
        <div
          onClick={() => {
            setBiometricSource('google_health_connect');
            setActiveSubTab('google_health');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
            biometrics.source === 'google_health_connect'
              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-950/20 ring-1 ring-emerald-500/30'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Jetpack API
            </span>
          </div>
          <h4 className="text-sm font-bold text-zinc-100 mb-1">Google Health Connect</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Android OS health database (Samsung, Xiaomi, Amazfit, Pixel Watch, Oura, Garmin).
          </p>
        </div>

        {/* 2. Gadgetbridge Open-Source API */}
        <div
          onClick={() => {
            setBiometricSource('gadgetbridge_intent');
            setActiveSubTab('gadgetbridge');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
            biometrics.source === 'gadgetbridge_intent' || biometrics.source === 'gadgetbridge_db'
              ? 'bg-indigo-500/10 border-indigo-500/50 shadow-md shadow-indigo-950/20 ring-1 ring-indigo-500/30'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
              <Radio className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              FOSS Intent API
            </span>
          </div>
          <h4 className="text-sm font-bold text-zinc-100 mb-1">Gadgetbridge API</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Local Android broadcasts (`ACTION_HEART_RATE_NOTIFICATION`), DB export & Zero-Cloud sync.
          </p>
        </div>

        {/* 3. Google Fit REST API */}
        <div
          onClick={() => {
            setBiometricSource('google_fit');
            setActiveSubTab('google_health');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
            biometrics.source === 'google_fit'
              ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-950/20 ring-1 ring-amber-500/30'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              OAuth 2.0
            </span>
          </div>
          <h4 className="text-sm font-bold text-zinc-100 mb-1">Google Fit API</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            REST endpoint integration (`fitness/v1/users/me/dataset:aggregate`).
          </p>
        </div>

        {/* 4. Direct BLE GATT Protocol */}
        <div
          onClick={() => {
            setBiometricSource('cmf_ble');
            setActiveSubTab('ble_bridge');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
            biometrics.source === 'cmf_ble' || biometrics.source === 'ble_standard'
              ? 'bg-blue-500/10 border-blue-500/50 shadow-md shadow-blue-950/20 ring-1 ring-blue-500/30'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <Bluetooth className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Direct GATT
            </span>
          </div>
          <h4 className="text-sm font-bold text-zinc-100 mb-1">Direct BLE & CMF</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Standard Web Bluetooth HRP (0x180D) and CMF Watch Pro 2 (0xfff0).
          </p>
        </div>
      </div>

      {/* Interactive Sub-Panel Tabs */}
      <div className="flex gap-1.5 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveSubTab('google_health')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'google_health'
              ? 'bg-zinc-800 text-emerald-300 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Google Health Connect & Fit API
        </button>
        <button
          onClick={() => setActiveSubTab('gadgetbridge')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'gadgetbridge'
              ? 'bg-zinc-800 text-indigo-300 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Gadgetbridge Intent API
        </button>
        <button
          onClick={() => setActiveSubTab('ble_bridge')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'ble_bridge'
              ? 'bg-zinc-800 text-blue-300 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Direct Bluetooth & Packet Log
        </button>
      </div>

      {/* TAB 1: GOOGLE HEALTH CONNECT & GOOGLE FIT API */}
      {activeSubTab === 'google_health' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Health Connect Contract Card */}
            <div className="backdrop-blur-md bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-zinc-100">Android Health Connect Client</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  androidx.health.connect
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Connects directly to Android&apos;s unified on-device health storage. Any wearable synchronizing with Health Connect shares continuous Heart Rate (BPM), HRV (RMSSD), and Sleep Sessions with zero battery penalty.
              </p>

              {/* Granted Permissions List */}
              <div className="space-y-1.5 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80">
                <div className="text-[11px] font-mono text-zinc-400 font-semibold mb-1">Active Android Health Permissions:</div>
                {googleHealthConfig.scopesGranted.map((perm) => (
                  <div key={perm} className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{perm}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleManualSyncGoogleHealth}
                  disabled={isSyncing}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Querying SDK...' : 'Sync Health Connect'}</span>
                </button>

                <button
                  onClick={() => googleHealth.openHealthConnectSettings()}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-semibold text-xs border border-zinc-700 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Android Settings</span>
                </button>
              </div>
            </div>

            {/* Google Fit REST API Card */}
            <div className="backdrop-blur-md bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-zinc-100">Google Fit REST API & OAuth</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Google Fitness API v1
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect your Google Account to pull aggregate dataset telemetry across devices via the official Google Fit REST API endpoints.
              </p>

              {/* Token Input for live testing */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-zinc-400">OAuth 2.0 Access Token (Optional / Live Test):</label>
                <input
                  type="password"
                  value={googleFitToken}
                  onChange={(e) => setGoogleFitToken(e.target.value)}
                  placeholder="Bearer ya29.a0AfH6SM..."
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 text-[11px] font-mono space-y-1 text-zinc-400">
                <div className="text-zinc-300 font-semibold">Endpoint:</div>
                <div className="text-amber-400 truncate">POST https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate</div>
                <div className="text-zinc-500 text-[10px]">Data: derived:com.google.heart_rate.bpm, sleep.segment</div>
              </div>

              <button
                onClick={handleManualSyncGoogleFit}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Fetch Google Fit Telemetry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GADGETBRIDGE INTENT API */}
      {activeSubTab === 'gadgetbridge' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Intent Receiver & Broadcast Listener */}
            <div className="backdrop-blur-md bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-zinc-100">Gadgetbridge Android Broadcast Receiver</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  nodomain.freeyourgadget
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Listens to local Android Intent broadcasts dispatched by Gadgetbridge when your smartband (Amazfit, Mi Band, Bangle.js, Pebble, Fossil, PineTime) receives a heart rate measurement.
              </p>

              {/* Action Specification */}
              <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 text-[11px] font-mono space-y-1.5">
                <div className="text-zinc-300 font-semibold">Registered Broadcast Action:</div>
                <div className="text-indigo-400 break-all">{gadgetbridgeConfig.broadcastAction}</div>
                <div className="text-zinc-500 text-[10px] pt-1 border-t border-zinc-900">
                  Extras: EXTRA_HEART_RATE_BPM (Int), EXTRA_TIMESTAMP (Long), EXTRA_DEVICE_ADDRESS (String)
                </div>
              </div>

              {/* Live Listener Toggle */}
              <div className="flex items-center justify-between p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${gadgetbridgeConfig.listeningIntent ? 'bg-indigo-400 animate-ping' : 'bg-zinc-600'}`} />
                  <span className="font-semibold text-zinc-200">
                    {gadgetbridgeConfig.listeningIntent ? 'Intent Listener ACTIVE' : 'Intent Listener IDLE'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (gadgetbridgeConfig.listeningIntent) {
                      stopGadgetbridgeListener();
                    } else {
                      startGadgetbridgeListener();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    gadgetbridgeConfig.listeningIntent
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-indigo-500 text-zinc-950 font-bold hover:bg-indigo-400'
                  }`}
                >
                  {gadgetbridgeConfig.listeningIntent ? 'Stop Listening' : 'Start Listener'}
                </button>
              </div>

              {/* Test Broadcast Dispatcher */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <div className="text-xs font-semibold text-zinc-300">Simulate Incoming Broadcast Intent:</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={40}
                    max={200}
                    value={testBpmInput}
                    onChange={(e) => setTestBpmInput(parseInt(e.target.value) || 70)}
                    className="w-24 p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400 text-center focus:outline-none"
                  />
                  <span className="text-xs text-zinc-500">BPM</span>
                  <button
                    onClick={() => injectGadgetbridgeBroadcast(testBpmInput)}
                    className="flex-1 px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-zinc-950 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Send Intent Packet
                  </button>
                </div>
              </div>
            </div>

            {/* ADB Shell Command & DB Import Card */}
            <div className="backdrop-blur-md bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TerminalSquare className="w-5 h-5 text-zinc-300" />
                  <h3 className="text-sm font-bold text-zinc-100">ADB Intent & Database Import</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  CLI & Export
                </span>
              </div>

              {/* ADB Broadcast Command box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Android Shell Broadcast Command:</span>
                  <button
                    onClick={handleCopyAdb}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    {copiedAdb ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedAdb ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 text-[10px] font-mono text-zinc-300 break-all select-all">
                  {gadgetbridge.getAdbBroadcastCommand(testBpmInput)}
                </div>
              </div>

              {/* Gadgetbridge Export / Database File Import */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <div className="text-xs font-semibold text-zinc-300">Import Gadgetbridge JSON / CSV File:</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.db"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-zinc-700 hover:border-indigo-500 bg-zinc-950/40 hover:bg-zinc-900/60 text-xs text-zinc-300 font-semibold transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>Load Gadgetbridge Export File</span>
                </button>
              </div>

              {/* Live Packet Log Table */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-zinc-400 font-semibold">Recent Intent Packets:</div>
                <div className="max-h-28 overflow-y-auto space-y-1 font-mono text-[10px] scrollbar-thin">
                  {gadgetbridgeConfig.liveHRPackets.length === 0 ? (
                    <div className="p-2 bg-zinc-950/50 rounded-lg text-zinc-500 text-center">
                      No broadcast packets received yet.
                    </div>
                  ) : (
                    gadgetbridgeConfig.liveHRPackets.map((pkt, idx) => (
                      <div key={idx} className="flex items-center justify-between p-1.5 bg-zinc-950 rounded border border-zinc-800/80 text-zinc-300">
                        <span className="text-indigo-400">{pkt.timestamp}</span>
                        <span className="font-bold text-emerald-400">{pkt.bpm} BPM</span>
                        <span className="text-zinc-500 truncate max-w-[100px]">{pkt.deviceMac}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DIRECT BLUETOOTH & GATT LOG */}
      {activeSubTab === 'ble_bridge' && (
        <div className="backdrop-blur-md bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={connectRealWebBluetooth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-zinc-950 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>Pair Web Bluetooth</span>
            </button>
            <button
              onClick={startBleScan}
              disabled={isBleScanning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-zinc-950 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer ${
                isBleScanning ? 'bg-amber-400 opacity-80' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
              }`}
            >
              <span>{isBleScanning ? 'Scanning...' : isBleConnected ? 'BLE Connected' : 'Simulate Scan'}</span>
            </button>
            <button
              onClick={sendAtGetSecret}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer"
            >
              <span>Verify AT Secret</span>
            </button>
            <button
              onClick={fetchSleepHistoryBle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all cursor-pointer"
            >
              <span>Fetch BLE Sleep</span>
            </button>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Real-time direct Bluetooth Low Energy streaming. Performs AES-128-CBC hardware decryption over CMF Watch Pro 2 characteristic 0xfff0 and reads standard Heart Rate Profile (0x180D).
          </p>

          {/* BLE Packet Log Stream */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
              <div className="flex items-center gap-2">
                <TerminalSquare className="w-4 h-4 text-emerald-400" />
                <span>GATT Decrypted Packet Stream</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">{bleLogs.length} events logged</span>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono text-[11px] space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
              {bleLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 border-b border-zinc-900/80 pb-1.5 last:border-0 last:pb-0">
                  <span className="text-zinc-600 text-[10px] shrink-0">{log.timestamp}</span>
                  <span className={`text-[10px] font-bold px-1 rounded shrink-0 ${log.direction === 'TX' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {log.direction}
                  </span>
                  <span className="text-zinc-400 font-semibold shrink-0">{log.command}</span>
                  <span className="text-zinc-300 flex-1 truncate">{log.decryptedSummary}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
