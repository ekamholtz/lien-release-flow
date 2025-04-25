
import { Info } from "lucide-react";

interface QboDebugInfoProps {
  debugInfo: any;
}

export function QboDebugInfo({ debugInfo }: QboDebugInfoProps) {
  if (!debugInfo) return null;

  return (
    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
      <div className="flex items-center gap-2 mb-2">
        <Info className="h-4 w-4 text-blue-500" />
        <span className="font-medium">Debug Information</span>
      </div>
      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
}
