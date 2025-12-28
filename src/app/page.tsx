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
    feedExternalData,
    feedHistoricalData,
  } = useWebSerialContext();

  const { token, isAuthenticated } = useAuth();
  const [lastSavedData, setLastSavedData] = useState<any | null>(null);

  const [isInIframe, setIsInIframe] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load recent saved readings (history) for current user and seed charts (without marking live)
  useEffect(() => {
    // Guard: this effect should only run in the browser and when feeder is available
    if (typeof window === 'undefined') return;
    if (!isAuthenticated || !token) return;
    if (typeof feedHistoricalData !== 'function') {
      console.warn('feedHistoricalData not available yet');
      return;
    }

    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/history?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          const rows = json.data || [];
          if (rows.length > 0) {
            // sort ascending by timestamp so older first
            const sorted = rows.slice().sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            // feed historical data into the chart pipeline without toggling live
            sorted.forEach((r: any) => {
              feedHistoricalData({
                gas: r.gas,
                temp: r.temp,
                hum: r.humidity ?? r.hum,
                fan: r.fanStatus,
                buzzer: r.buzzerStatus,
                timestamp: r.timestamp
              });
            });

            // Keep last saved record handy for single-value display
            setLastSavedData(rows[0]);
          }
        }
      } catch (err) {
        console.error('Error loading history:', err);
      }
    };
    loadHistory();
  }, [isAuthenticated, token, feedHistoricalData]);

  // Poll backend for latest saved reading and inject it into the live pipeline so UI updates immediately
  useEffect(() => {
    // Run only on client and if feeder is available
    if (typeof window === 'undefined') return;
    if (!isAuthenticated || !token) return;
    if (isDemoMode) return; // demo mode already provides data
    if (typeof feedExternalData !== 'function') {
      console.warn('feedExternalData not available yet');
      return;
    }

    let lastServerTs: number | null = null;
    let stopped = false;

    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/history?limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const json = await res.json();
        const latest = json.data && json.data[0] ? json.data[0] : null;
        if (!latest) return;

        const ts = latest.timestamp ? new Date(latest.timestamp).getTime() : Date.now();
        if (!lastServerTs || ts > lastServerTs) {
          lastServerTs = ts;
          // Feed it into the context so page updates immediately
          feedExternalData({
            gas: latest.gas,
            temp: latest.temp,
            hum: latest.humidity ?? latest.hum,
            fan: latest.fanStatus,
            buzzer: latest.buzzerStatus,
            timestamp: latest.timestamp
          });
        }
      } catch (err) {
        console.error('Error polling latest reading:', err);
      }
    };

    // Initial poll and periodic poll every 2s for near real-time updates
    poll();
    const interval = setInterval(() => {
      if (!stopped) poll();
    }, 2000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [isAuthenticated, token, isDemoMode, feedExternalData]);

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

        {/* Always show sensor cards and charts. When disconnected, use lastSavedData/currentData to populate values; charts come from `history`. */}
        <>
          <div className="mb-8">
            {/* Determine display data: prefer live currentData, fall back to lastSavedData */}
            {(() => {
              const displayData = currentData ?? (lastSavedData ? {
                gas: Number(lastSavedData.gas ?? 0),
                temp: Number(lastSavedData.temp ?? 0),
                hum: Number(lastSavedData.humidity ?? lastSavedData.hum ?? 0),
                fan: Boolean(lastSavedData.fanStatus ?? false),
                buzzer: Boolean(lastSavedData.buzzerStatus ?? false),
                timestamp: lastSavedData.timestamp ? Date.parse(String(lastSavedData.timestamp)) : Date.now()
              } : null);

              return <SensorCards data={displayData} />;
            })()}
          </div>

          {/* Real-time Charts (use history array fed from live or historical data) */}
          {history.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Real-time Charts</h2>
              <SensorCharts history={history} />
            </div>
          )}

          {/* If disconnected, show a small notice so users know data is not currently live */}
          {(!isConnected && !isDemoMode) && (
            <p className="text-sm text-muted-foreground mb-6">Disconnected — showing last saved data and recent history.</p>
          )}
        </>

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