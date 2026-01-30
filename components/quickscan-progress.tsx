"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickscanStep = 
  | "initializing"
  | "fetching"
  | "analyzing"
  | "generating"
  | "completed";

interface QuickscanProgressProps {
  currentStep: QuickscanStep;
  progress?: number; // 0-100, optioneel voor meer gedetailleerde progress
  className?: string;
}

const quickscanSteps: Array<{
  id: QuickscanStep;
  label: string;
  description: string;
}> = [
  {
    id: "initializing",
    label: "Initialiseren",
    description: "Quickscan wordt voorbereid...",
  },
  {
    id: "fetching",
    label: "Website ophalen",
    description: "Website content wordt opgehaald...",
  },
  {
    id: "analyzing",
    label: "Analyseren",
    description: "AI analyseert je website...",
  },
  {
    id: "generating",
    label: "Resultaten genereren",
    description: "AI kansen worden gegenereerd...",
  },
  {
    id: "completed",
    label: "Voltooid",
    description: "Quickscan is klaar!",
  },
];

export function QuickscanProgress({ 
  currentStep, 
  progress, 
  className 
}: QuickscanProgressProps) {
  const currentStepIndex = quickscanSteps.findIndex((step) => step.id === currentStep);
  const isCompleted = currentStep === "completed";

  // Bereken progress percentage
  const getProgressPercentage = () => {
    if (progress !== undefined) {
      return Math.min(100, Math.max(0, progress));
    }
    
    // Automatische progress op basis van stap
    if (isCompleted) return 100;
    return ((currentStepIndex + 1) / quickscanSteps.length) * 100;
  };

  const progressPercentage = getProgressPercentage();

  return (
    <Card className={cn("shadow-lg border-0", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className={cn(
            "w-5 h-5",
            isCompleted ? "hidden" : "animate-spin"
          )} />
          <span>Quickscan in uitvoering...</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Voortgang</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {quickscanSteps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isPast = index < currentStepIndex;
            const isFuture = index > currentStepIndex;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-4 p-3 rounded-lg transition-colors",
                  isActive && "bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800",
                  isPast && "bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800",
                  isFuture && "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                )}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isPast || isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "font-medium",
                      isActive && "text-blue-900 dark:text-blue-100",
                      isPast && "text-green-900 dark:text-green-100",
                      isFuture && "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    {step.label}
                  </div>
                  <div
                    className={cn(
                      "text-sm mt-0.5",
                      isActive && "text-blue-700 dark:text-blue-300",
                      isPast && "text-green-700 dark:text-green-300",
                      isFuture && "text-gray-400 dark:text-gray-500"
                    )}
                  >
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
