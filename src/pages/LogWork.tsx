import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDemo } from "@/contexts/DemoContext";
import { formatDemoAmount } from "@/data/demoProfiles";

type WorkStatus = "Pending" | "Settled";

type WorkEntry = {
  id: string;
  title: string;
  description: string | null;
  work_date: string;
  hours: number | null;
  category: string | null;
  reference_url: string | null;
  status: WorkStatus;
  settled_amount: number | null;
  settled_at: string | null;
  created_at: string;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const TITLE_MAX = 200;
const DESC_MAX = 2000;
const CATEGORY_MAX = 60;
const URL_MAX = 2048;
const HOURS_MAX = 999;

type FormErrors = {
  title?: string;
  workDate?: string;
  hours?: string;
  category?: string;
  description?: string;
  referenceUrl?: string;
};

const validate = (input: {
  title: string;
  workDate: string;
  hours: string;
  category: string;
  description: string;
  referenceUrl: string;
}): FormErrors => {
  const e: FormErrors = {};
  const t = input.title.trim();
  if (!t) e.title = "Title is required.";
  else if (t.length < 3) e.title = "Title must be at least 3 characters.";
  else if (t.length > TITLE_MAX) e.title = `Keep title under ${TITLE_MAX} characters.`;

  if (!input.workDate) {
    e.workDate = "Date is required.";
  } else {
    const d = new Date(input.workDate);
    if (Number.isNaN(d.getTime())) e.workDate = "Enter a valid date.";
    else {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (d.getTime() > today.getTime()) e.workDate = "Date cannot be in the future.";
    }
  }

  if (input.hours.trim()) {
    const n = Number(input.hours);
    if (!Number.isFinite(n)) e.hours = "Hours must be a number.";
    else if (n < 0) e.hours = "Hours cannot be negative.";
    else if (n > HOURS_MAX) e.hours = `Hours cannot exceed ${HOURS_MAX}.`;
    else if (Math.round(n * 100) / 100 !== n) e.hours = "Use at most 2 decimal places.";
  }

  if (input.category.trim().length > CATEGORY_MAX) {
    e.category = `Keep category under ${CATEGORY_MAX} characters.`;
  }
  if (input.description.length > DESC_MAX) {
    e.description = `Keep description under ${DESC_MAX} characters.`;
  }

  const url = input.referenceUrl.trim();
  if (url) {
    if (url.length > URL_MAX) {
      e.referenceUrl = `URL must be under ${URL_MAX} characters.`;
    } else {
      try {
        const u = new URL(url);
        if (!/^https?:$/.test(u.protocol)) e.referenceUrl = "URL must start with http:// or https://";
        else if (!u.hostname.includes(".")) e.referenceUrl = "Enter a valid URL with a domain.";
      } catch {
        e.referenceUrl = "Enter a valid URL.";
      }
    }
  }

  return e;
};

const friendlyError = (msg: string) => {
  const m = msg.toLowerCase();
  if (m.includes("work_entries_status_check")) return "Status must be Pending or Settled.";
  if (m.includes("violates row-level security")) return "You don't have permission to save this entry.";
  if (m.includes("network") || m.includes("fetch")) return "Network problem. Check your connection and try again.";
  if (m.includes("duplicate")) return "A duplicate entry already exists.";
  return msg || "Could not save entry. Please try again.";
};

const STATUS_TOOLTIP: Record<string, string> = {
  Pending:
    "Trigger confirmed. Waiting for settlement. Counts toward Passport Pending total.",
  Settled:
    "Payment received. Counts toward your attributed total on the Passport.",
  "Intent logged":
    "Work recorded. Trigger not yet confirmed. Not counted in Passport totals until status changes.",
};

const focusTitleInput = () => {
  const el = document.getElementById("title") as HTMLInputElement | null;
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => el.focus(), 350);
  }
};

const EmptyEntries = ({ onStart }: { onStart: () => void }) => (
  <div className="py-6 flex flex-col items-center text-center">
    <h3
      className="text-foreground"
      style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600, fontSize: 18 }}
    >
      No contributions logged yet.
    </h3>
    <p
      className="mt-3"
      style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: 13,
        color: "#5C5248",
        lineHeight: 1.7,
        maxWidth: 360,
      }}
    >
      Log your first execution against a contract. Each entry moves through three states:
    </p>
    <ol className="mt-5 w-full max-w-[360px] text-left relative" style={{ paddingLeft: 22 }}>
      <span
        aria-hidden
        className="absolute"
        style={{ left: 5, top: 6, bottom: 6, width: 1, background: "rgba(26,22,14,0.10)" }}
      />
      {[
        { label: "Intent logged", color: "#9A8F84", body: "Work happened but the trigger condition isn't confirmed yet. Doesn't affect Passport totals." },
        { label: "Pending", color: "#C4892A", body: "Trigger confirmed. Payment is due but not yet received. Shows in Passport as Pending." },
        { label: "Settled", color: "#2A6A45", body: "Payment received and confirmed. Adds to your Passport attributed total." },
      ].map((s) => (
        <li key={s.label} className="relative pb-4 last:pb-0">
          <span
            aria-hidden
            className="absolute rounded-full"
            style={{ left: -22, top: 6, width: 11, height: 11, background: s.color, border: "2px solid #FDFAF4" }}
          />
          <div
            style={{
              fontFamily: "'DM Mono', ui-monospace, monospace",
              fontSize: 9,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: s.color,
            }}
          >
            {s.label}
          </div>
          <p
            className="mt-1"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: "#5C5248", lineHeight: 1.7 }}
          >
            {s.body}
          </p>
        </li>
      ))}
    </ol>
    <button
      type="button"
      onClick={onStart}
      className="mt-6"
      style={{
        background: "#1A1614",
        color: "#F5F1E8",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: 14,
        borderRadius: 4,
        padding: "10px 20px",
        border: "none",
        cursor: "pointer",
      }}
    >
      Log your first contribution →
    </button>
  </div>
);

const LogWork = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { profile: demoProfile } = useDemo();

  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [busy, setBusy] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workDate, setWorkDate] = useState(todayISO());
  const [hours, setHours] = useState("");
  const [category, setCategory] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [touched, setTouched] = useState<Record<keyof FormErrors, boolean>>({
    title: false,
    workDate: false,
    hours: false,
    category: false,
    description: false,
    referenceUrl: false,
  });

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  const fetchEntries = async () => {
    if (!user) return;
    setLoadingList(true);
    const { data, error } = await supabase
      .from("work_entries")
      .select(
        "id, title, description, work_date, hours, category, reference_url, status, settled_amount, settled_at, created_at",
      )
      .eq("user_id", user.id)
      .order("work_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);
    setLoadingList(false);
    if (error) {
      toast.error(friendlyError(error.message));
      return;
    }
    setEntries((data ?? []) as WorkEntry[]);
  };

  useEffect(() => {
    if (user && !demoProfile) fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, demoProfile]);

  if (demoProfile) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Log work</h1>
            <p className="text-sm text-muted-foreground">
              Read-only demo view. Showing executions for {demoProfile.contributor.name}.
            </p>
          </header>
          <Card>
            <CardHeader className="px-5 sm:px-6 pt-5 sm:pt-6">
              <CardTitle>Demo executions</CardTitle>
              <CardDescription>
                {demoProfile.executions.length} {demoProfile.executions.length === 1 ? "entry" : "entries"} · exit demo to log your own work.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6">
              <ul className="divide-y">
                {demoProfile.executions.map((e) => (
                  <li key={e.title} className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <p className="font-medium text-sm break-words">{e.title}</p>
                        <Badge variant="outline">{e.status}</Badge>
                        <span className="text-xs text-muted-foreground">{e.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground break-words" style={{ fontFamily: "'DM Mono',ui-monospace,monospace" }}>
                        {e.proof}
                      </p>
                    </div>
                    <div className="text-sm font-medium" style={{ fontFamily: "'DM Mono',ui-monospace,monospace" }}>
                      {formatDemoAmount(e.amount, e.currency)}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const errors = useMemo(
    () => validate({ title, workDate, hours, category, description, referenceUrl }),
    [title, workDate, hours, category, description, referenceUrl],
  );

  const isValid = Object.keys(errors).length === 0;

  const showError = (field: keyof FormErrors) => touched[field] && errors[field];

  const totals = useMemo(() => {
    const pending = entries.filter((e) => e.status === "Pending").length;
    const settled = entries.filter((e) => e.status === "Settled").length;
    const settledValue = entries
      .filter((e) => e.status === "Settled" && e.settled_amount != null)
      .reduce((sum, e) => sum + Number(e.settled_amount ?? 0), 0);
    return { pending, settled, settledValue };
  }, [entries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      title: true, workDate: true, hours: true,
      category: true, description: true, referenceUrl: true,
    });
    if (!user) return;
    if (!isValid) {
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("work_entries").insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      work_date: workDate,
      hours: hours.trim() ? Number(hours) : null,
      category: category.trim() || null,
      reference_url: referenceUrl.trim() || null,
      status: "Pending",
    });
    setBusy(false);
    if (error) {
      toast.error(friendlyError(error.message));
      return;
    }
    toast.success("Work entry saved as Pending");
    setTitle("");
    setDescription("");
    setWorkDate(todayISO());
    setHours("");
    setCategory("");
    setReferenceUrl("");
    setTouched({
      title: false, workDate: false, hours: false,
      category: false, description: false, referenceUrl: false,
    });
    fetchEntries();
  };

  const handleMarkSettled = async (entry: WorkEntry) => {
    if (entry.status === "Settled") return;
    const input = window.prompt(
      "Settled amount (optional, leave blank for none):",
      "",
    );
    if (input === null) return; // user cancelled
    let amount: number | null = null;
    if (input.trim()) {
      const n = Number(input);
      if (!Number.isFinite(n) || n < 0) {
        toast.error("Amount must be a non-negative number.");
        return;
      }
      amount = Math.round(n * 100) / 100;
    }
    setUpdatingId(entry.id);
    const { error } = await supabase
      .from("work_entries")
      .update({ status: "Settled", settled_amount: amount, settled_at: new Date().toISOString() })
      .eq("id", entry.id);
    setUpdatingId(null);
    if (error) {
      toast.error(friendlyError(error.message));
      return;
    }
    toast.success("Marked as settled");
    fetchEntries();
  };

  const handleReopen = async (entry: WorkEntry) => {
    setUpdatingId(entry.id);
    const { error } = await supabase
      .from("work_entries")
      .update({ status: "Pending", settled_at: null })
      .eq("id", entry.id);
    setUpdatingId(null);
    if (error) {
      toast.error(friendlyError(error.message));
      return;
    }
    toast.success("Moved back to Pending");
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this entry? This cannot be undone.")) return;
    const { error } = await supabase.from("work_entries").delete().eq("id", id);
    if (error) {
      toast.error(friendlyError(error.message));
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success("Entry deleted");
  };

  const markTouched = (field: keyof FormErrors) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Log work</h1>
          <p className="text-sm text-muted-foreground">
            Record work items to your contributor ledger. New entries start as <strong>Pending</strong> and roll up to your Passport when marked <strong>Settled</strong>.
          </p>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Pending</div>
            <div className="text-lg font-semibold mt-1">{totals.pending}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Settled</div>
            <div className="text-lg font-semibold mt-1">{totals.settled}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Settled value</div>
            <div className="text-lg font-semibold mt-1">
              {totals.settledValue ? totals.settledValue.toLocaleString() : "—"}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="px-5 sm:px-6 pt-5 sm:pt-6">
            <CardTitle>New entry</CardTitle>
            <CardDescription>Capture what you did, when, and where it lives.</CardDescription>
          </CardHeader>
          <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => markTouched("title")}
                  placeholder="e.g. Drafted Phase II protocol section"
                  maxLength={TITLE_MAX + 50}
                  aria-invalid={!!showError("title")}
                  aria-describedby={showError("title") ? "title-error" : undefined}
                  className={showError("title") ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {showError("title") && <p id="title-error" className="text-xs text-destructive">{errors.title}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="workDate">Date <span className="text-destructive">*</span></Label>
                  <Input
                    id="workDate"
                    type="date"
                    value={workDate}
                    max={todayISO()}
                    onChange={(e) => setWorkDate(e.target.value)}
                    onBlur={() => markTouched("workDate")}
                    aria-invalid={!!showError("workDate")}
                    aria-describedby={showError("workDate") ? "workDate-error" : undefined}
                    className={showError("workDate") ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {showError("workDate") && <p id="workDate-error" className="text-xs text-destructive">{errors.workDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    id="hours"
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    min="0"
                    max={HOURS_MAX}
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    onBlur={() => markTouched("hours")}
                    placeholder="e.g. 3.5"
                    aria-invalid={!!showError("hours")}
                    aria-describedby={showError("hours") ? "hours-error" : undefined}
                    className={showError("hours") ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {showError("hours") && <p id="hours-error" className="text-xs text-destructive">{errors.hours}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  onBlur={() => markTouched("category")}
                  maxLength={CATEGORY_MAX + 20}
                  placeholder="e.g. Research, Code, Writing"
                  aria-invalid={!!showError("category")}
                  className={showError("category") ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {showError("category") && <p className="text-xs text-destructive">{errors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => markTouched("description")}
                  rows={3}
                  maxLength={DESC_MAX + 100}
                  placeholder="Short summary of the work…"
                  aria-invalid={!!showError("description")}
                  className={showError("description") ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className={showError("description") ? "text-destructive" : ""}>
                    {showError("description") ? errors.description : ""}
                  </span>
                  <span>{description.length}/{DESC_MAX}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ref">Reference URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="ref"
                  type="url"
                  inputMode="url"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  onBlur={() => markTouched("referenceUrl")}
                  placeholder="https://…"
                  aria-invalid={!!showError("referenceUrl")}
                  aria-describedby={showError("referenceUrl") ? "ref-error" : undefined}
                  className={showError("referenceUrl") ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {showError("referenceUrl") && <p id="ref-error" className="text-xs text-destructive">{errors.referenceUrl}</p>}
              </div>

              <Button type="submit" className="w-full sm:w-auto h-11 sm:h-10" disabled={busy || !isValid}>
                {busy ? "Saving…" : "Save entry"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-5 sm:px-6 pt-5 sm:pt-6">
            <CardTitle>Your entries</CardTitle>
            <CardDescription>
              {loadingList ? "Loading…" : `${entries.length} entr${entries.length === 1 ? "y" : "ies"}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6">
            {loadingList ? (
              <p className="text-sm text-muted-foreground">Loading entries…</p>
            ) : entries.length === 0 ? (
              <EmptyEntries onStart={focusTitleInput} />
            ) : (
              <TooltipProvider delayDuration={150}>
              <ul className="divide-y">
                {entries.map((e) => (
                  <li key={e.id} className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <p className="font-medium text-sm break-words">{e.title}</p>
                        <Badge
                          variant="outline"
                          className={
                            e.status === "Settled"
                              ? "bg-green-100 text-green-900 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30"
                              : "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
                          }
                        >
                          {e.status}
                        </Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label={`What does ${e.status} mean?`}
                              className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                            >
                              <HelpCircle className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="border-0"
                            style={{
                              fontFamily: "'DM Sans', system-ui, sans-serif",
                              fontSize: 12,
                              background: "#1A1614",
                              color: "#F5F1E8",
                              borderRadius: 4,
                              padding: "6px 10px",
                              maxWidth: 220,
                              zIndex: 50,
                            }}
                          >
                            {STATUS_TOOLTIP[e.status] ?? STATUS_TOOLTIP.Pending}
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-xs text-muted-foreground">{e.work_date}</span>
                        {e.hours != null && <span className="text-xs text-muted-foreground">· {e.hours}h</span>}
                        {e.category && <span className="text-xs text-muted-foreground">· {e.category}</span>}
                        {e.status === "Settled" && e.settled_amount != null && (
                          <span className="text-xs text-muted-foreground">· {Number(e.settled_amount).toLocaleString()}</span>
                        )}
                      </div>
                      {e.description && (
                        <p className="text-sm text-muted-foreground break-words">{e.description}</p>
                      )}
                      {e.reference_url && (
                        <a
                          href={e.reference_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary underline break-all"
                        >
                          {e.reference_url}
                        </a>
                      )}
                    </div>
                    <div className="flex flex-row sm:flex-col items-start gap-2 shrink-0">
                      {e.status === "Pending" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={updatingId === e.id}
                          onClick={() => handleMarkSettled(e)}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                          {updatingId === e.id ? "Saving…" : "Mark settled"}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={updatingId === e.id}
                          onClick={() => handleReopen(e)}
                        >
                          {updatingId === e.id ? "Saving…" : "Reopen"}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(e.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LogWork;
