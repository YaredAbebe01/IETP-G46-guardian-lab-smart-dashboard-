"use client";

import { Navbar } from "@/components/Navbar";
import { LiveSensorCard } from "@/components/LiveSensorCard";
import { SystemStatusCards } from "@/components/SystemStatusCards";
import { RecentAlerts } from "@/components/RecentAlerts";
import { SensorCards } from "@/components/SensorCards";
import { SensorCharts } from "@/components/SensorCharts";
import { AlertBanner } from "@/components/AlertBanner";
import { Wind, Flame, Thermometer, Droplets, Usb, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWebSerialContext } from "@/contexts/WebSerialContext";
import { useEffect, useState } from "react";
import { featureFlags } from '@/lib/featureFlags';
import { useAuth } from "@/contexts/AuthContext";
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const {
    isConnected,
    currentData,
    history,
    connect,
    disconnect,
    isDemoMode,
    startDemoMode,
  } = useWebSerialContext();

  const { token, isAuthenticated } = useAuth();
  const [lastSavedData, setLastSavedData] = useState<any | null>(null);

  const [isInIframe, setIsInIframe] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load latest saved reading (most recent) for current user
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const loadLatest = async () => {
      try {
        const res = await fetch(`${API_URL}/api/history?limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setLastSavedData(json.data && json.data[0] ? json.data[0] : null);
        }
      } catch (err) {
        console.error('Error loading latest history:', err);
      }
    };
    loadLatest();
  }, [isAuthenticated, token]);

  // Update displayed last saved data when new live data arrives
  useEffect(() => {
    if (!currentData) return;
    setLastSavedData({
      gas: currentData.gas,
      temp: currentData.temp,
      humidity: currentData.hum,
      deviceId: 'Live Device',
      timestamp: new Date(currentData.timestamp).toISOString()
    });
  }, [currentData]);

  // Compute active sensors and last update time (truthful values)
  const totalSensors = 4;
  const activeSensors = (currentData || lastSavedData) ? 4 : 0;
  const lastUpdate = currentData ? new Date(currentData.timestamp).toISOString() : (lastSavedData?.timestamp ?? null);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);
    
    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleOpenInNewTab = () => {
    const url = window.location.href;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Navbar />

      {/* Connection Controls */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${isDemoMode || isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-sm font-medium">
              {isDemoMode ? "Demo Mode" : isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          
          <div className="flex gap-2">
            {!isConnected && !isDemoMode && (
              <>
                  {featureFlags.enableWebSerial && (
                    <Button onClick={connect} variant="default" size="sm">
                  <Usb className="h-4 w-4 mr-2" />
                  Connect Device
                    </Button>
                  )}
                  {featureFlags.enableDemoMode && (
                <Button onClick={startDemoMode} variant="outline" size="sm">
                  Demo Mode
                </Button>
                  )}
                {isInIframe && (
                  <Button onClick={handleOpenInNewTab} variant="secondary" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                )}
              </>
            )}
            {(isConnected || isDemoMode) && (
              <Button onClick={disconnect} variant="destructive" size="sm">
                Disconnect
              </Button>
            )}
          </div>
        </div>

        {/* Iframe Warning */}
        {isInIframe && !isConnected && !isDemoMode && (
          <Alert className="mb-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm">
                ⚠️ WebSerial is blocked in iframes. Use <strong>Demo Mode</strong> to test, or <strong>Open in New Tab</strong> to connect a real device.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Alert Banners */}
        {(isConnected || isDemoMode) && <AlertBanner data={currentData} />}
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Real-time laboratory monitoring</p>
        </div>

        {(isConnected || isDemoMode) ? (
          <>
            {/* Original Functional Sensor Cards */}
            <div className="mb-8">
              <SensorCards data={currentData} />
            </div>

            {/* Real-time Charts */}
            {history.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Real-time Charts</h2>
                <SensorCharts history={history} />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Guardian Lab Live Sensor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {(() => {
                const displayGas = currentData?.gas ?? lastSavedData?.gas ?? '—';
                const displayTemp = currentData?.temp ?? lastSavedData?.temp ?? '—';
                const displayHum = currentData?.hum ?? lastSavedData?.humidity ?? '—';
                const displayLocation = currentData ? 'Live Device' : (lastSavedData?.deviceId ?? 'Main Hall');
                const displayTime = currentData ? formatTime(new Date(currentData.timestamp)) : (lastSavedData?.timestamp ? formatTime(new Date(lastSavedData.timestamp)) : formatTime(currentTime));

                const getStatus = (type: 'gas'|'temp'|'hum') => {
                  if (type === 'gas') {
                    const v = Number(currentData?.gas ?? lastSavedData?.gas ?? 0);
                    return v > 300 ? 'Critical' : 'Normal';
                  }
                  if (type === 'temp') {
                    const v = Number(currentData?.temp ?? lastSavedData?.temp ?? 0);
                    if (v > 35) return 'Critical';
                    if (v > 30) return 'Warning';
                    return 'Normal';
                  }
                  if (type === 'hum') {
                    const v = Number(currentData?.hum ?? lastSavedData?.humidity ?? 0);
                    if (v > 70 || v < 40) return 'Warning';
                    return 'Normal';
                  }
                  return 'Normal';
                };

                return (
                  <>
                    <LiveSensorCard
                      icon={Wind}
                      label="Gas Sensor"
                      value={String(displayGas)}
                      unit="ppm"
                      status={getStatus('gas')}
                      location={displayLocation}
                      time={displayTime}
                    />
                    <LiveSensorCard
                      icon={Flame}
                      label="Smoke Sensor"
                      value={currentData ? String(currentData.gas) : (lastSavedData ? String(lastSavedData.gas) : '—')}
                      unit="particles/m³"
                      status={getStatus('gas')}
                      location={displayLocation}
                      time={displayTime}
                    />
                    <LiveSensorCard
                      icon={Thermometer}
                      label="Temperature"
                      value={String(displayTemp)}
                      unit="°C"
                      status={getStatus('temp')}
                      location={displayLocation}
                      time={displayTime}
                    />
                    <LiveSensorCard
                      icon={Droplets}
                      label="Humidity"
                      value={String(displayHum)}
                      unit="%"
                      status={getStatus('hum')}
                      location={displayLocation}
                      time={displayTime}
                    />
                  </>
                );
              })()}
            </div>
          </>
        )}

        {/* System Status Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <SystemStatusCards isConnected={isDemoMode || isConnected} activeSensors={activeSensors} lastUpdate={lastUpdate} />
        </div>

        {/* Recent Alerts Section */}
        <div>
          <RecentAlerts />
        </div>
      </main>
    </div>
  );
}