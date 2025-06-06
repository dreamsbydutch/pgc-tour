"use client";

import { useState } from 'react';
import { Button } from "@/src/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/app/_components/ui/card";
import { Badge } from "@/src/app/_components/ui/badge";
import { log } from '@/src/lib/logging';

export default function LoggingPanel() {
  const [isGeneratingLogs, setIsGeneratingLogs] = useState(false);
  const [logStatus, setLogStatus] = useState<string | null>(null);

  // Function to generate sample logs at all levels
  const generateSampleLogs = async () => {
    setIsGeneratingLogs(true);
    setLogStatus("Generating sample logs...");
    
    try {
      // Auth logs
      log.auth.info("Sample auth log - user signed in");
      log.auth.error("Sample auth error", new Error("Invalid credentials"));
      
      // Tournament logs
      log.tournament.info("Sample tournament log - round completed");
      log.tournament.transition("Tournament state change", { 
        name: 'sample-123', 
        round: 1 
      });
      
      // API logs
      log.api.request("GET", "/api/tournaments");
      log.api.error("POST", "/api/scores", new Error("Validation failed"));
      
      // Store logs
      log.store.info("Store data refreshed");
      log.store.error("Failed to update store", new Error("Unknown error"));
      
      // Cache logs
      log.cache.hit("tournament:123");
      log.cache.invalidate("leaderboard", "admin-action");
      
      // System logs
      log.system.info("System status check completed");
      log.error("Critical system error", new Error("Resource exhausted"));
      
      // Short delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLogStatus("Sample logs successfully generated and sent to Axiom");
    } catch (error) {
      setLogStatus(`Error generating logs: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGeneratingLogs(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Logging System</CardTitle>
        <CardDescription>
          Monitor and test the Axiom logging integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Logging Status</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">
                Axiom Integration: {process.env.AXIOM_TOKEN ? "Configured" : "Not Configured"}
              </Badge>
              <Badge variant={process.env.NODE_ENV === "production" ? "destructive" : "secondary"}>
                Environment: {process.env.NODE_ENV || "development"}
              </Badge>
            </div>
          </div>
          
          {/* Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Logging Actions</h4>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generateSampleLogs}
                disabled={isGeneratingLogs}
              >
                {isGeneratingLogs ? "Generating..." : "Generate Sample Logs"}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open("https://app.axiom.co/", "_blank");
                }}
              >
                Open Axiom Dashboard
              </Button>
            </div>
          </div>
          
          {/* Status Message */}
          {logStatus && (
            <div className="mt-4 rounded bg-slate-100 p-3 text-sm">
              {logStatus}
            </div>
          )}
          
          {/* Logging Information */}
          <div className="space-y-2 pt-4">
            <h4 className="text-sm font-medium">Logging Information</h4>
            <p className="text-sm text-muted-foreground">
              Logs are automatically sent to Axiom in production environment. 
              Log entries include context, severity level, and structured data.
            </p>
            <div className="space-y-1 text-sm">
              <div><strong>Log Contexts:</strong> Auth, Tournament, API, Store, Cache, System</div>
              <div><strong>Log Levels:</strong> ERROR, WARN, INFO, DEBUG</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
