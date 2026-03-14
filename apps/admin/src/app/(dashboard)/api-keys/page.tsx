"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Copy, Check, KeyRound, PowerOff, Trash2 } from "lucide-react";
import { formatDate } from "@sierra/shared";
import { toast } from "sonner";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CreateKeyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const create = trpc.apiKey.create.useMutation({
    onSuccess: (data) => {
      utils.apiKey.list.invalidate();
      setCreatedKey(data.key);
    },
    onError: (e) => toast.error(e.message),
  });

  function handleClose() {
    setName("");
    setCreatedKey(null);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({ name });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Give this key a descriptive name so you know what it's used for.
          </DialogDescription>
        </DialogHeader>

        {createdKey ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your new API key — copy it now
              </p>
              <p className="font-mono text-sm break-all">{createdKey}</p>
              <CopyButton text={createdKey} />
            </div>
            <p className="text-sm text-muted-foreground">
              This key will <span className="font-semibold text-foreground">not</span> be shown again. Store it securely.
            </p>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mobile App, Partner Integration"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Creating…" : "Create Key"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ApiKeysPage() {
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = trpc.apiKey.list.useQuery();

  const revoke = trpc.apiKey.revoke.useMutation({
    onSuccess: () => { utils.apiKey.list.invalidate(); toast.success("Key revoked"); },
    onError: (e) => toast.error(e.message),
  });

  const remove = trpc.apiKey.delete.useMutation({
    onSuccess: () => { utils.apiKey.list.invalidate(); toast.success("Key deleted"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Keys for authenticating calls to{" "}
            <code className="rounded bg-muted px-1 text-xs">/api/v1/*</code>
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Key
        </Button>
      </div>

      <div className="mb-6 rounded-lg border bg-muted/40 p-4 text-sm space-y-1">
        <p className="font-medium">How to use</p>
        <p className="text-muted-foreground">
          Include the key in every request as a header:{" "}
          <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs border">
            X-Api-Key: sk_live_…
          </code>
        </p>
        <p className="text-muted-foreground">
          Base URL:{" "}
          <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs border">
            https://your-domain.com/api/v1
          </code>
        </p>
      </div>

      <Card>
        {isLoading ? (
          <p className="p-8 text-center text-muted-foreground">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((k) => (
                <TableRow key={k.id} className={!k.isActive ? "opacity-50" : undefined}>
                  <TableCell className="font-medium">{k.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <KeyRound className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-mono text-xs text-muted-foreground">
                        {k.key.slice(0, 14)}…{k.key.slice(-4)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={k.isActive ? "success" : "secondary"}>
                      {k.isActive ? "Active" : "Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {k.lastUsedAt ? formatDate(k.lastUsedAt) : "Never"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(k.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {k.isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={revoke.isPending}
                          onClick={() => revoke.mutate({ id: k.id })}
                          title="Revoke"
                        >
                          <PowerOff className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Delete"
                        disabled={remove.isPending}
                        onClick={() => {
                          if (confirm(`Delete API key "${k.name}"? Any integrations using it will stop working immediately.`)) {
                            remove.mutate({ id: k.id });
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No API keys yet. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateKeyDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
