import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PassportView, PassportData } from "@/components/passport/PassportView";

const PublicPassport = () => {
  const { contributorId } = useParams<{ contributorId: string }>();
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!contributorId) return;
    (async () => {
      const { data: result } = await supabase.rpc("get_public_passport", {
        p_contributor_id: contributorId,
      });
      if (!result) {
        setNotFound(true);
      } else {
        setData(result as unknown as PassportData);
        document.title = `${(result as PassportData).full_name ?? "Passport"} — SCORE`;
      }
      setLoading(false);
    })();
  }, [contributorId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading passport…</div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <h1 className="text-lg font-semibold">Passport unavailable</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          This passport does not exist or has been set to private by its owner.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PassportView data={data} />
    </div>
  );
};

export default PublicPassport;