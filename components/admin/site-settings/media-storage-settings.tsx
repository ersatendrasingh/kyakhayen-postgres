"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Cloud, Database, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SettingsState = {
  primaryProvider: "CLOUDINARY" | "S3";
  effectiveProvider: "CLOUDINARY" | "S3" | null;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinarySecretConfigured: boolean;
  cloudinaryConfigured: boolean;
  s3Configured: boolean;
  encryptionConfigured: boolean;
};

const emptySettings: SettingsState = {
  primaryProvider: "CLOUDINARY",
  effectiveProvider: null,
  cloudinaryCloudName: "",
  cloudinaryApiKey: "",
  cloudinarySecretConfigured: false,
  cloudinaryConfigured: false,
  s3Configured: false,
  encryptionConfigured: false,
};

async function responseMessage(response: Response) {
  const value = await response.json().catch(() => null);
  return typeof value === "string" ? value : "Unable to update media storage settings.";
}

export function MediaStorageSettings() {
  const [settings, setSettings] = useState(emptySettings);
  const [apiSecret, setApiSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/site-settings/media")
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseMessage(response));
        return response.json() as Promise<SettingsState>;
      })
      .then(setSettings)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load settings."))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/site-settings/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryProvider: settings.primaryProvider,
          cloudinaryCloudName: settings.cloudinaryCloudName,
          cloudinaryApiKey: settings.cloudinaryApiKey,
          cloudinaryApiSecret: apiSecret,
        }),
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      setSettings((await response.json()) as SettingsState);
      setApiSecret("");
      toast.success("Media storage settings saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch("/api/admin/site-settings/media", { method: "POST" });
      if (!response.ok) throw new Error(await responseMessage(response));
      toast.success("Cloudinary connection is working.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cloudinary connection failed.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-48 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
      <Card className="rounded-[28px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cloud className="size-5 text-primary" />Cloudinary</CardTitle>
          <CardDescription>New images and videos use signed direct uploads. The API secret is encrypted before it is stored.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="media-provider">Primary provider</Label>
            <Select value={settings.primaryProvider} onValueChange={(value: "CLOUDINARY" | "S3") => setSettings((current) => ({ ...current, primaryProvider: value }))}>
              <SelectTrigger id="media-provider"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="CLOUDINARY">Cloudinary (recommended)</SelectItem><SelectItem value="S3">Amazon S3</SelectItem></SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">If the primary provider is not configured, uploads automatically fall back to the configured secondary provider.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="cloud-name">Cloud name</Label><Input id="cloud-name" value={settings.cloudinaryCloudName} onChange={(event) => setSettings((current) => ({ ...current, cloudinaryCloudName: event.target.value }))} placeholder="your-cloud-name" /></div>
            <div className="space-y-2"><Label htmlFor="cloud-api-key">API key</Label><Input id="cloud-api-key" value={settings.cloudinaryApiKey} onChange={(event) => setSettings((current) => ({ ...current, cloudinaryApiKey: event.target.value }))} placeholder="123456789012345" /></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cloud-api-secret">API secret</Label>
            <Input id="cloud-api-secret" type="password" value={apiSecret} onChange={(event) => setApiSecret(event.target.value)} placeholder={settings.cloudinarySecretConfigured ? "Saved — leave blank to keep it" : "Enter Cloudinary API secret"} autoComplete="new-password" />
            <p className="text-xs text-muted-foreground">The saved secret is never returned to the browser. Enter a value only when adding or rotating it.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 size-4 animate-spin" />}Save settings</Button>
            <Button variant="outline" onClick={testConnection} disabled={testing || !settings.cloudinaryConfigured}>{testing && <Loader2 className="mr-2 size-4 animate-spin" />}Test connection</Button>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-5">
        <Card className="rounded-[28px]"><CardHeader><CardTitle className="text-lg">Provider status</CardTitle></CardHeader><CardContent className="space-y-4">
          <StatusRow icon={Cloud} label="Cloudinary" ready={settings.cloudinaryConfigured} />
          <StatusRow icon={Database} label="Amazon S3 fallback" ready={settings.s3Configured} />
          <StatusRow icon={ShieldCheck} label="Secret encryption" ready={settings.encryptionConfigured} />
          <div className="rounded-2xl border bg-muted/40 p-4"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Currently used for new uploads</p><p className="mt-2 text-lg font-semibold">{settings.effectiveProvider || "Not configured"}</p></div>
        </CardContent></Card>
        <Card className="rounded-[28px] border-primary/20 bg-primary/5"><CardContent className="flex gap-3 p-5 text-sm text-muted-foreground"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" /><p>Existing S3 files and URLs remain valid. Only new uploads switch to Cloudinary after its credentials are saved and verified.</p></CardContent></Card>
      </div>
    </div>
  );
}

function StatusRow({ icon: Icon, label, ready }: { icon: typeof Cloud; label: string; ready: boolean }) {
  return <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Icon className="size-4 text-muted-foreground" /><span className="text-sm font-medium">{label}</span></div><Badge variant={ready ? "default" : "secondary"}>{ready ? "Ready" : "Not set"}</Badge></div>;
}
