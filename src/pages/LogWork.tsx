import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type WorkEntry = {
  id: string;
  title: string;
  description: string | null;
  work_date: string;
  hours: number | null;
  category: string | null;
  reference_url: string | null;
  created_at: string;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const LogWork = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workDate, setWorkDate] = useState(todayISO());
  const [hours, setHours] = useState("");
  const [category, setCategory] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  const fetchEntries = async () => {
    if (!user) return;
    setLoadingList(true);
    const { data, error } = await supabase
      .from("work_entries")
      .select("id, title, description, work_date, hours, category, reference_url, created_at")
      .eq("user_id", user.id)
      .order("work_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);
    setLoadingList(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEntries((data ?? []) as WorkEntry[]);
  };

  useEffect(() => {
    if (user) fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const errors = useMemo(() => {
    const e: { title?: string; hours?: string; referenceUrl?: string; workDate?: string } = {};
    const t = title.trim();
    if (!t) e.title = "Title is required.";
    else if (t.length > 200) e.title = "Keep title under 200 characters.";
    if (!workDate) e.workDate = "Date is required.";
    if (hours.trim()) {
      const n = Number(hours);
      if (!Number.isFinite(n) || n < 0 || n > 9999) e.hours = "Enter a number between 0 and 9999.";
    }
    if (referenceUrl.trim()) {
      try {
        const u = new URL(referenceUrl.trim());
        if (!/^https?:$/.test(u.protocol)) e.referenceUrl = "URL must start with http:// or https://";
      } catch {
        e.referenceUrl = "Enter a valid URL.";
      }
    }
    return e;
  }, [title, hours, referenceUrl, workDate]);

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isValid) {
      toast.error("Please fix the highlighted fields.");
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
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Work entry saved");
    setTitle("");
    setDescription("");
    setWorkDate(todayISO());
    setHours("");
    setCategory("");
    setReferenceUrl("");
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("work_entries").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success("Entry deleted");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Log work</h1>
          <p className="text-sm text-muted-foreground">
            Record work items to your contributor ledger. Entries are private to you.
          </p>
        </header>

        <Card>
          <CardHeader className="px-5 sm:px-6 pt-5 sm:pt-6">
            <CardTitle>New entry</CardTitle>
            <CardDescription>Capture what you did, when, and where it lives.</CardDescription>
          </CardHeader>
          <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Drafted Phase II protocol section"
                  aria-invalid={!!errors.title}
                  className={errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="workDate">Date</Label>
                  <Input
                    id="workDate"
                    type="date"
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                    aria-invalid={!!errors.workDate}
                    className={errors.workDate ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.workDate && <p className="text-xs text-destructive">{errors.workDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    id="hours"
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    min="0"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="e.g. 3.5"
                    aria-invalid={!!errors.hours}
                    className={errors.hours ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.hours && <p className="text-xs text-destructive">{errors.hours}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Research, Code, Writing"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Short summary of the work…"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ref">Reference URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="ref"
                  type="url"
                  inputMode="url"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://…"
                  aria-invalid={!!errors.referenceUrl}
                  className={errors.referenceUrl ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.referenceUrl && <p className="text-xs text-destructive">{errors.referenceUrl}</p>}
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
              <p className="text-sm text-muted-foreground">No entries yet. Add your first above.</p>
            ) : (
              <ul className="divide-y">
                {entries.map((e) => (
                  <li key={e.id} className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <p className="font-medium text-sm break-words">{e.title}</p>
                        <span className="text-xs text-muted-foreground">{e.work_date}</span>
                        {e.hours != null && <span className="text-xs text-muted-foreground">· {e.hours}h</span>}
                        {e.category && <span className="text-xs text-muted-foreground">· {e.category}</span>}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(e.id)}
                      className="self-start text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LogWork;
