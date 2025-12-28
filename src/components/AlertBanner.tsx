"use client";

import { SensorData } from "@/hooks/useWebSerial";
import { AlertCircle, Flame } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface AlertBannerProps {
  data: SensorData | null;
}

export function AlertBanner({ data }: AlertBannerProps) {
  const [showGasAlert, setShowGasAlert] = useState(false);
  const [showTempAlert, setShowTempAlert] = useState(false);
  const [gasDismissed, setGasDismissed] = useState(false);
  const [tempDismissed, setTempDismissed] = useState(false);

  useEffect(() => {
    const gasAlert = data && data.gas > 300;
    const tempAlert = data && data.temp > 30;

    // Gas Alert: show while condition true and reset dismissed flag when it becomes true
    if (gasAlert) {
      setGasDismissed(false);
      setShowGasAlert(true);
    } else {
      // Keep showing the alert even if condition cleared until user dismisses it
      if (!gasDismissed && showGasAlert && !gasAlert) {
        // leave alert visible but mark as "resolved" visually (handled in render)
        // do nothing here to auto-close; user must dismiss
      }
    }

    // Temp Alert: show while condition true and reset dismissed flag when it becomes true
    if (tempAlert) {
      setTempDismissed(false);
      setShowTempAlert(true);
    } else {
      // Keep showing until user dismisses
      if (!tempDismissed && showTempAlert && !tempAlert) {
        // do nothing
      }
    }
  }, [data, gasDismissed, tempDismissed, showGasAlert, showTempAlert]);

  if (!showGasAlert && !showTempAlert) {
    return null;
  }

  return (
    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
      {showGasAlert && (
        <Alert variant="destructive" className="border-red-600 bg-red-50 dark:bg-red-950/30 flex items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 animate-pulse" />
              <AlertTitle>Gas Leak Warning!</AlertTitle>
            </div>
            <AlertDescription>
              Dangerous gas level detected: <strong>{data?.gas}</strong> (threshold: 300).<br/>
              Buzzer has been activated. Evacuate the area immediately!
            </AlertDescription>
            {!((data && data.gas > 300)) && (
              <p className="mt-2 text-sm text-muted-foreground">Condition resolved — this alert will remain visible until dismissed.</p>
            )}
          </div>

          <div className="ml-4 mt-1 flex-shrink-0">
            <Button size="sm" variant="ghost" onClick={() => { setShowGasAlert(false); setGasDismissed(true); }}>
              Dismiss
            </Button>
          </div>
        </Alert>
      )}

      {showTempAlert && (
        <Alert variant="destructive" className="border-orange-600 bg-orange-50 dark:bg-orange-950/30 flex items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 animate-pulse" />
              <AlertTitle>Overheat Warning!</AlertTitle>
            </div>
            <AlertDescription>
              High temperature detected: <strong>{data?.temp?.toFixed(1)}°C</strong> (threshold: 30°C).<br/>
              Cooling fan has been activated automatically.
            </AlertDescription>
            {!((data && data.temp > 30)) && (
              <p className="mt-2 text-sm text-muted-foreground">Condition resolved — this alert will remain visible until dismissed.</p>
            )}
          </div>

          <div className="ml-4 mt-1 flex-shrink-0">
            <Button size="sm" variant="ghost" onClick={() => { setShowTempAlert(false); setTempDismissed(true); }}>
              Dismiss
            </Button>
          </div>
        </Alert>
      )}
    </div>
  );
}