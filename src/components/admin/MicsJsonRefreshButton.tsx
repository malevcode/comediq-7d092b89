import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { requestMicsJsonRefresh } from "@/api/admin";
import { clearCachedOpenMics } from "@/utils/micDataCache";

export function MicsJsonRefreshButton() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      const result = await requestMicsJsonRefresh();
      clearCachedOpenMics();
      toast({
        title: "mics.json refresh requested",
        description: result?.ref
          ? `GitHub will export and commit ${result.ref} after the workflow delay.`
          : "GitHub will export and commit mics.json after the workflow delay.",
      });
    } catch (error) {
      toast({
        title: "Refresh request failed",
        description: error instanceof Error ? error.message : "Could not trigger the workflow.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={refreshing}
      className="h-8"
    >
      <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
      Refresh mics.json
    </Button>
  );
}
