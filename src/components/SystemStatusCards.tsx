"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Wifi, Activity, Clock } from "lucide-react";
function formatRelativeTime(ts?: string | null) {
  if (!ts) return 'Never';
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleString();
}

export function SystemStatusCards({ isConnected = false, activeSensors = 0, lastUpdate = null } : { isConnected?: boolean; activeSensors?: number; lastUpdate?: string | null }) {
  const connectionColor = isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const dotClass = isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Active Sensors</p>
              <p className="text-lg font-semibold">{activeSensors}/4</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Last Update</p>
              <p className="text-lg font-semibold">{formatRelativeTime(lastUpdate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
