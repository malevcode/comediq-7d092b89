import { useState } from "react";
import { Database, Instagram, Loader2, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { requestInstagramCommentCollection, requestInstagramMonthlyVerification } from "@/api/admin";

const MEDIA_ID_PATTERN = /^\d{5,}(?:_\d+)?$/;

export function InstagramCommentCollector() {
  const [mediaId, setMediaId] = useState("");
  const [collecting, setCollecting] = useState(false);
  const [sendingMics, setSendingMics] = useState(false);
  const [collectingResponses, setCollectingResponses] = useState(false);
  const [sendDryRun, setSendDryRun] = useState(true);
  const [collectDryRun, setCollectDryRun] = useState(false);
  const [missingOnly, setMissingOnly] = useState(true);
  const [amount, setAmount] = useState("300");

  const normalizedMediaId = mediaId.trim();
  const isValid = MEDIA_ID_PATTERN.test(normalizedMediaId);

  const handleCollect = async () => {
    if (!isValid) {
      toast({
        title: "Enter a valid media ID",
        description: "Use the Instagram Graph API media ID, usually a long numeric ID.",
        variant: "destructive",
      });
      return;
    }

    setCollecting(true);

    try {
      const result = await requestInstagramCommentCollection(normalizedMediaId);
      toast({
        title: "Comment collection requested",
        description: result?.workflowUrl
          ? `GitHub will run ${result.workflow ?? "the comment collection workflow"}.`
          : "GitHub will run the Instagram comment collection workflow.",
      });
    } catch (error) {
      toast({
        title: "Could not collect comments",
        description: error instanceof Error ? error.message : "Could not trigger the collection workflow.",
        variant: "destructive",
      });
    } finally {
      setCollecting(false);
    }
  };

  const handleSendMics = async () => {
    setSendingMics(true);

    try {
      const result = await requestInstagramMonthlyVerification({
        action: "send_mics",
        dry_run: sendDryRun,
      });

      toast({
        title: sendDryRun ? "Send dry run requested" : "Monthly mic send requested",
        description: result?.workflow
          ? `GitHub will run ${result.workflow}.`
          : "GitHub will run the monthly verification send workflow.",
      });
    } catch (error) {
      toast({
        title: "Could not send mics",
        description: error instanceof Error ? error.message : "Could not trigger the send workflow.",
        variant: "destructive",
      });
    } finally {
      setSendingMics(false);
    }
  };

  const handleCollectResponses = async () => {
    const amountNumber = Number.parseInt(amount, 10);
    if (!Number.isFinite(amountNumber) || amountNumber < 1 || amountNumber > 1000) {
      toast({
        title: "Enter a valid amount",
        description: "Use a number between 1 and 1000.",
        variant: "destructive",
      });
      return;
    }

    setCollectingResponses(true);

    try {
      const result = await requestInstagramMonthlyVerification({
        action: "collect_responses",
        amount: amountNumber,
        missing_only: missingOnly,
        dry_run: collectDryRun,
      });

      toast({
        title: collectDryRun ? "Collection dry run requested" : "Response collection requested",
        description: result?.workflow
          ? `GitHub will run ${result.workflow}.`
          : "GitHub will run the monthly verification collection workflow.",
      });
    } catch (error) {
      toast({
        title: "Could not collect responses",
        description: error instanceof Error ? error.message : "Could not trigger the response collection workflow.",
        variant: "destructive",
      });
    } finally {
      setCollectingResponses(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg rounded-2xl border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a5fb4]/10 text-[#1a5fb4]">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Monthly Mic Verification</CardTitle>
              <CardDescription>
                Send Instagram DMs from Supabase open_mics_historical and collect replies.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sendDryRun}
                  onChange={(event) => setSendDryRun(event.target.checked)}
                  className="h-4 w-4"
                />
                Dry run before sending
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                The workflow will pull active mics directly from Supabase.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleSendMics}
              disabled={sendingMics}
              className="gap-2"
            >
              {sendingMics ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Mics
            </Button>
          </div>

          <div className="grid gap-4 rounded-xl bg-muted/40 p-4 md:grid-cols-[160px_1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="collect-response-amount">Threads</Label>
              <Input
                id="collect-response-amount"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={missingOnly}
                  onChange={(event) => setMissingOnly(event.target.checked)}
                  className="h-4 w-4"
                />
                Missing replies only
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={collectDryRun}
                  onChange={(event) => setCollectDryRun(event.target.checked)}
                  className="h-4 w-4"
                />
                Dry run
              </label>
            </div>
            <Button
              type="button"
              onClick={handleCollectResponses}
              disabled={collectingResponses}
              className="gap-2"
            >
              {collectingResponses ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              Collect Responses
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-2xl border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a5fb4]/10 text-[#1a5fb4]">
              <Instagram className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Instagram Comment Collector</CardTitle>
              <CardDescription>
                Trigger the Comediq IG API comment pipeline for a public list post.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagram-media-id">Instagram media ID</Label>
            <Input
              id="instagram-media-id"
              value={mediaId}
              onChange={(event) => setMediaId(event.target.value)}
              placeholder="e.g. 17912345678901234"
              inputMode="numeric"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              This dispatches the IG API pipeline that runs collect_instagram_comments.py with the media ID.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleCollect}
            disabled={collecting || !normalizedMediaId}
            className="gap-2"
          >
            {collecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            Collect Comments
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
