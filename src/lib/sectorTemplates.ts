export type SectorKey =
  | "Software"
  | "Pharma & Biotech"
  | "Agriculture"
  | "Manufacturing"
  | "Music & Publishing"
  | "Film & Television"
  | "AI & Data"
  | "College Athletics"
  | "Other";

export type StakeType = "Financial" | "Attribution" | "Governance" | "Mixed";

export type ContractTemplate = {
  id: string;
  title: string;
  summary: string;
  name_suggestion: string;
  stake_type: StakeType;
  entitlement_placeholder: string;
  trigger_placeholder: string;
  evidence_examples: string[];
};

export const SECTOR_TEMPLATES: Record<SectorKey, ContractTemplate[]> = {
  Software: [
    {
      id: "sw-cla-revshare",
      title: "Contributor licence + revenue share",
      summary: "OSS contribution with a downstream revenue share clause.",
      name_suggestion: "Contributor Licence + Revenue Share",
      stake_type: "Financial",
      entitlement_placeholder: "e.g. 5% of net commercial revenue attributable to merged contributions",
      trigger_placeholder: "e.g. Project generates revenue from a release containing my contributions",
      evidence_examples: ["Code", "Document"],
    },
    {
      id: "sw-protocol-founding",
      title: "Protocol founding agreement",
      summary: "Co-founding contributor stake in a protocol or foundation.",
      name_suggestion: "Protocol Founding Agreement",
      stake_type: "Mixed",
      entitlement_placeholder: "e.g. 8% governance stake + pro-rata of any token issuance to founders",
      trigger_placeholder: "e.g. Mainnet launch OR foundation incorporation",
      evidence_examples: ["Document", "Code"],
    },
    {
      id: "sw-cla-royalty",
      title: "CLA with royalty clause",
      summary: "Contributor Licence Agreement that retains a royalty right.",
      name_suggestion: "CLA with Royalty Clause",
      stake_type: "Financial",
      entitlement_placeholder: "e.g. 2% royalty on enterprise licences derived from my modules",
      trigger_placeholder: "e.g. Each enterprise licence sold containing my modules",
      evidence_examples: ["Code", "Document"],
    },
  ],
  "Pharma & Biotech": [
    {
      id: "ph-bayh-dole",
      title: "Bayh-Dole inventor agreement",
      summary: "University-employed inventor's share of licensing income.",
      name_suggestion: "Bayh-Dole Inventor Agreement",
      stake_type: "Financial",
      entitlement_placeholder: "e.g. 33% inventor share of net licensing income (institution policy)",
      trigger_placeholder: "e.g. Patent issued AND licensed to a third party",
      evidence_examples: ["Patent filing", "Document"],
    },
    {
      id: "ph-tech-transfer",
      title: "Technology transfer attribution",
      summary: "Named-inventor attribution on a tech transfer agreement.",
      name_suggestion: "Technology Transfer Attribution",
      stake_type: "Attribution",
      entitlement_placeholder: "e.g. Named inventor on all tech transfer disclosures and downstream filings",
      trigger_placeholder: "e.g. Tech transfer office files an invention disclosure based on my work",
      evidence_examples: ["Patent filing", "Document"],
    },
    {
      id: "ph-api-synthesis",
      title: "API synthesis contribution",
      summary: "Process-development contribution to an active pharmaceutical ingredient.",
      name_suggestion: "API Synthesis Contribution",
      stake_type: "Mixed",
      entitlement_placeholder: "e.g. Named inventor + 1% process royalty on commercial batches",
      trigger_placeholder: "e.g. Commercial production of a batch using my synthesis route",
      evidence_examples: ["Batch record", "Document"],
    },
  ],
  Agriculture: [
    {
      id: "ag-coop-msa",
      title: "Cooperative master services agreement",
      summary: "Member contributor agreement under a cooperative.",
      name_suggestion: "Cooperative Master Services Agreement",
      stake_type: "Mixed",
      entitlement_placeholder: "e.g. Patronage dividend pro-rata to delivered volume",
      trigger_placeholder: "e.g. Annual surplus distribution by the cooperative",
      evidence_examples: ["Document", "Measurement"],
    },
    {
      id: "ag-pvr",
      title: "Plant variety rights agreement",
      summary: "Breeder royalty for a registered plant variety.",
      name_suggestion: "Plant Variety Rights Agreement",
      stake_type: "Financial",
      entitlement_placeholder: "e.g. €X per tonne of certified seed sold under PVR",
      trigger_placeholder: "e.g. Certified seed of the variety is sold",
      evidence_examples: ["Document", "Measurement"],
    },
    {
      id: "ag-yield-royalty",
      title: "Yield-linked royalty",
      summary: "Royalty tied to measured yield improvement.",
      name_suggestion: "Yield-Linked Royalty",
      stake_type: "Financial",
      entitlement_placeholder: "e.g. 3% of revenue uplift from yield improvement vs baseline",
      trigger_placeholder: "e.g. Verified yield exceeds baseline by X% on Y hectares",
      evidence_examples: ["Measurement", "Dataset"],
    },
  ],
  Manufacturing: [
    {
      id: "mf-process-innovation",
      title: "Process innovation addendum",
      summary: "Addendum granting a stake in a process improvement.",
      name_suggestion: "Process Innovation Addendum",
      stake_type: "Financial",
      entitlement_placeholder: "e.g. 2% of verified annual cost savings for 5 years",
      trigger_placeholder: "e.g. Process is implemented in production AND savings verified",
      evidence_examples: ["Document", "Measurement"],
    },
    {
      id: "mf-arbeg",
      title: "Employee inventor compensation (ArbEG / S.21)",
      summary: "Statutory employee-inventor compensation (DE ArbEG / UK Patents Act s.40).",
      name_suggestion: "Employee Inventor Compensation",
      stake_type: "Financial",
      entitlement_placeholder: "e.g. Statutory share of economic benefit from the invention",
      trigger_placeholder: "e.g. Employer commercialises the patented invention",
      evidence_examples: ["Patent filing", "Document"],
    },
    {
      id: "mf-governance",
      title: "Governance rights clause",
      summary: "Voting/board observer right tied to a contribution.",
      name_suggestion: "Governance Rights Clause",
      stake_type: "Governance",
      entitlement_placeholder: "e.g. Board observer seat for the duration of the JV",
      trigger_placeholder: "e.g. JV is formed AND my contribution is accepted",
      evidence_examples: ["Document"],
    },
  ],
  "Music & Publishing": [
    {
      id: "mu-cowrite",
      title: "Co-writing split agreement",
      summary: "Songwriter split for a co-written work.",
      name_suggestion: "Co-writing Split Agreement",
      stake_type: "Mixed",
      entitlement_placeholder: "e.g. 50% writer share of mechanicals and performance royalties",
      trigger_placeholder: "e.g. The work is commercially released or licensed",
      evidence_examples: ["Session file", "Document"],
    },
    {
      id: "mu-sync",
      title: "Sync rights agreement",
      summary: "Sync licence revenue share for film/TV/ads.",
      name_suggestion: "Sync Rights Agreement",
      stake_type: "Financial",
      entitlement_placeholder: "e.g. 50% of sync fees attributable to my share",
      trigger_placeholder: "e.g. The work is licensed for a synchronised use",
      evidence_examples: ["Document"],
    },
    {
      id: "mu-producer-points",
      title: "Producer points agreement",
      summary: "Producer points (royalty share) on a master recording.",
      name_suggestion: "Producer Points Agreement",
      stake_type: "Financial",
      entitlement_placeholder: "e.g. 3 producer points on net receipts from the master",
      trigger_placeholder: "e.g. Master generates net receipts after recoupment",
      evidence_examples: ["Session file", "Document"],
    },
  ],
  "Film & Television": [
    {
      id: "ft-residual",
      title: "WGA / union residual agreement",
      summary: "Union-scale residuals on reuse and streaming.",
      name_suggestion: "WGA / Union Residual Agreement",
      stake_type: "Financial",
      entitlement_placeholder: "e.g. WGA-MBA scale residuals for reuse and streaming",
      trigger_placeholder: "e.g. Reuse, rerun, or streaming of the covered work",
      evidence_examples: ["Document"],
    },
    {
      id: "ft-cocreator",
      title: "Co-creator attribution",
      summary: "Created-by / developed-by credit and back-end participation.",
      name_suggestion: "Co-creator Attribution",
      stake_type: "Attribution",
      entitlement_placeholder: "e.g. 'Created by' credit on all episodes + 1% MAGR",
      trigger_placeholder: "e.g. Series is produced and distributed",
      evidence_examples: ["Document"],
    },
    {
      id: "ft-streaming-rev",
      title: "Streaming revenue share",
      summary: "Direct revenue share on streaming exploitation.",
      name_suggestion: "Streaming Revenue Share",
      stake_type: "Financial",
      entitlement_placeholder: "e.g. 2% of net streaming revenue for the title",
      trigger_placeholder: "e.g. Title earns net streaming revenue",
      evidence_examples: ["Document", "Dataset"],
    },
  ],
  "AI & Data": [
    {
      id: "ai-training-data",
      title: "Training data contribution agreement",
      summary: "Compensation for data used to train a model.",
      name_suggestion: "Training Data Contribution Agreement",
      stake_type: "Financial",
      entitlement_placeholder: "e.g. Per-token royalty when data is included in a training run",
      trigger_placeholder: "e.g. Dataset is included in a model training run",
      evidence_examples: ["Dataset", "Document"],
    },
    {
      id: "ai-dataset-licence",
      title: "Dataset provenance licence",
      summary: "Attribution + licence-fee right on derivative datasets.",
      name_suggestion: "Dataset Provenance Licence",
      stake_type: "Mixed",
      entitlement_placeholder: "e.g. Attribution + licence fee on any redistribution",
      trigger_placeholder: "e.g. Dataset is redistributed or used commercially",
      evidence_examples: ["Dataset"],
    },
    {
      id: "ai-model-contributor",
      title: "Model contributor agreement",
      summary: "Stake in a model from training/fine-tuning contribution.",
      name_suggestion: "Model Contributor Agreement",
      stake_type: "Mixed",
      entitlement_placeholder: "e.g. Pro-rata revenue share + named contributor on the model card",
      trigger_placeholder: "e.g. Model generates revenue OR is publicly released",
      evidence_examples: ["Code", "Training record", "Document"],
    },
  ],
  "College Athletics": [
    {
      id: "ca-house",
      title: "Revenue-sharing agreement (House settlement)",
      summary: "Direct revenue share under House v. NCAA settlement framework.",
      name_suggestion: "Revenue-Sharing Agreement (House)",
      stake_type: "Financial",
      entitlement_placeholder: "e.g. Pro-rata share of institution's annual rev-share pool",
      trigger_placeholder: "e.g. Annual distribution from the institution's rev-share pool",
      evidence_examples: ["Document"],
    },
    {
      id: "ca-nil",
      title: "NIL Team Marketing Rights licence",
      summary: "Group NIL licence to team marketing rights.",
      name_suggestion: "NIL Team Marketing Rights Licence",
      stake_type: "Financial",
      entitlement_placeholder: "e.g. Per-use fee for inclusion in licensed team marketing",
      trigger_placeholder: "e.g. My NIL is used in a licensed team marketing campaign",
      evidence_examples: ["Document"],
    },
  ],
  Other: [],
};

export function templatesForSector(sector: string | null | undefined): ContractTemplate[] {
  if (!sector) return [];
  return SECTOR_TEMPLATES[sector as SectorKey] ?? [];
}