import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Database,
  FlaskConical,
  Layers,
  Upload,
  ArrowRight,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import {
  CombinedCandidateAssessment,
  PROTEIN_TARGETS_3D,
  ProteinTarget3DConfig,
  evaluateSmilesWithCritics,
} from '../data/dissertationDockingData';
import { BiologicCandidate, CandidatePathwayMode } from '../types/bioreact';

export interface DrugTargetKnownBinderIntakeState {
  presetId: string;
  pathwayRoute: 'route_a_small_molecule' | 'route_b_biologic';
  biologicalObjective: string;
  plainEnglishMechanismNote: string;
  referenceCitation: string;
  referenceAccessionId: string;
  targetProteinSymbol: string;
  targetProteinFullName: string;
  targetUniprotId: string;
  receptorPdbId: string;
  receptorPocketDescription: string;
  pocketCenter: [number, number, number];
  pocketSize: [number, number, number];
  uploadedReceptorFileName?: string;
  uploadedAtomCount?: number;
  knownBinderName: string;
  knownBinderSmiles: string;
  knownBinderAffinityKcalMol: number;
  knownBinderKdOrPotency: string;
  candidateName: string;
  candidateSmiles: string;
  candidateAffinityKcalMol: number;
  activeViewerLigandMode: 'known_binder' | 'designed_candidate';
  linkedBiologicCandidateId?: string;
}

export const INITIAL_DRUG_TARGET_PRESETS: Record<
  string,
  DrugTargetKnownBinderIntakeState
> = {
  mrp1_mk571_small_molecule: {
    presetId: 'mrp1_mk571_small_molecule',
    pathwayRoute: 'route_a_small_molecule',
    biologicalObjective:
      'Block the MRP1 drug-efflux pump so therapeutic drugs remain inside the cell instead of being pumped out',
    plainEnglishMechanismNote:
      'Some cancer cells use proteins such as MRP1 to pump certain drugs out of the cell. Researchers may want to design molecules that inhibit this transport, potentially helping drugs remain inside cells.',
    referenceCitation:
      'Johnson & Chen (Cell, 2017) — Cryo-EM structure of ATP-bound human MRP1 + LTC4 pocket',
    referenceAccessionId: 'DOI: 10.1016/j.cell.2017.01.008 · Europe PMC PMC5582140',
    targetProteinSymbol: 'MRP1 (ABCC1)',
    targetProteinFullName:
      'Multidrug Resistance-Associated Protein 1 (Drug-Efflux Transporter)',
    targetUniprotId: 'P33527',
    receptorPdbId: '5UJA / 6BHU',
    receptorPocketDescription:
      'Transmembrane Bundle TMD1–TMD2 Bipartite P-Pocket (LYS-332, ARG-1196) & H-Pocket (TRP-1246, PHE-594)',
    pocketCenter: [114.2, 128.6, 96.4],
    pocketSize: [24.0, 24.0, 24.0],
    knownBinderName: 'MK-571 (Known MRP1 Competitive Reference Inhibitor)',
    knownBinderSmiles:
      'CN(C)C(=O)CCS(=O)(=O)c1ccc(cc1)C(SCCC(=O)O)c2cccc(\\C=C\\c3ccc4ccc(Cl)cc4n3)c2',
    knownBinderAffinityKcalMol: -9.1,
    knownBinderKdOrPotency: 'IC₅₀ = 1.1 μM (Docking Ref −9.10 kcal/mol)',
    candidateName: 'R2-Lead-1 (Achiral Biphenyl Sulfonamide Lead)',
    candidateSmiles:
      'O=C(O)c1ccc(-c2ccc(S(=O)(=O)Nc3ccc(Cl)c(C(F)(F)F)c3)cc2)cc1',
    candidateAffinityKcalMol: -10.82,
    activeViewerLigandMode: 'designed_candidate',
  },
  egfr_osimertinib_small_molecule: {
    presetId: 'egfr_osimertinib_small_molecule',
    pathwayRoute: 'route_a_small_molecule',
    biologicalObjective:
      'Occupy the mutant EGFR kinase ATP pocket to stop uncontrolled cell-growth signalling',
    plainEnglishMechanismNote:
      'Mutant EGFR acts like a stuck growth switch on lung cancer cells. Small-molecule inhibitors are designed to fit inside the intracellular ATP pocket to block phosphorylation.',
    referenceCitation:
      'Yosaatmadja et al. (J. Med. Chem., 2015) — EGFR T790M Kinase Domain + Osimertinib Complex',
    referenceAccessionId: 'ChEMBL3353410 · DrugBank DB09330 · PMID 26203852',
    targetProteinSymbol: 'EGFR (T790M)',
    targetProteinFullName:
      'Epidermal Growth Factor Receptor Tyrosine Kinase Domain',
    targetUniprotId: 'P00533',
    receptorPdbId: '4ZAU',
    receptorPocketDescription:
      'ATP-Binding Cleft CYS-797 / MET-790 Gatekeeper Pocket',
    pocketCenter: [114.2, 128.6, 96.4],
    pocketSize: [20.0, 20.0, 20.0],
    knownBinderName: 'Osimertinib (AZD9291 · Known Kinase Inhibitor)',
    knownBinderSmiles:
      'COc1cc(N(C)CCN(C)C)c(NC(=O)C=C)cc1Nc1nccc(-c2cn(C)c3ccccc23)n1',
    knownBinderAffinityKcalMol: -9.8,
    knownBinderKdOrPotency: 'IC₅₀ = 12 nM (Docking Ref −9.80 kcal/mol)',
    candidateName: 'EGFR-Biaryl-Lead-2 (3-Step Reversible Scaffold)',
    candidateSmiles:
      'O=C(O)c1ccc(-c2ccc(S(=O)(=O)Nc3ccc(Cl)c(C(F)(F)F)c3)cc2)cc1',
    candidateAffinityKcalMol: -10.4,
    activeViewerLigandMode: 'known_binder',
  },
  her2_trastuzumab_biologic: {
    presetId: 'her2_trastuzumab_biologic',
    pathwayRoute: 'route_b_biologic',
    biologicalObjective:
      'Bind the extracellular surface of HER2 with a monoclonal antibody and manufacture it at 500 L CHO bioreactor scale',
    plainEnglishMechanismNote:
      'Unlike small molecules that fit inside an intracellular pocket, Trastuzumab is a 145.5 kDa monoclonal antibody that binds the outside of HER2 and requires living mammalian (CHO) cells to manufacture.',
    referenceCitation:
      'Cho et al. (Nature, 2003) & Aertgeerts et al. (J. Biol. Chem., 2011) — HER2 Ectodomain & Kinase Structure',
    referenceAccessionId: 'DrugBank DB00072 · ChEMBL1201585 · PMID 12589362',
    targetProteinSymbol: 'HER2 (ERBB2)',
    targetProteinFullName:
      'Receptor Tyrosine-Protein Kinase erbB-2 (Extracellular Domain IV)',
    targetUniprotId: 'P04626',
    receptorPdbId: '3PP0 / 1N8Z',
    receptorPocketDescription:
      'Extracellular Domain IV Juxtamembrane Epitope (1N8Z for mAb) & Kinase Hinge MET-801 / LYS-753 Pocket (3PP0)',
    pocketCenter: [16.4, 24.8, 32.1],
    pocketSize: [22.0, 22.0, 22.0],
    knownBinderName:
      'Trastuzumab (Herceptin · Known IgG1 Biologic) + SYR127063 Reference',
    knownBinderSmiles:
      'Cc1cc(Nc2ncnc3ccc(NC4=NC(C)(C)CO4)cc23)ccc1Oc1ccn2ncnc2c1',
    knownBinderAffinityKcalMol: -9.6,
    knownBinderKdOrPotency: 'mAb K_D = 0.5 nM (145.5 kDa IgG1) · Kinase Ref −9.60 kcal/mol',
    candidateName: 'Trastuzumab (Herceptin · 145.5 kDa Humanised IgG1 mAb)',
    candidateSmiles:
      'Cc1cc(Nc2ncnc3ccc(NC4=NC(C)(C)CO4)cc23)ccc1Oc1ccn2ncnc2c1',
    candidateAffinityKcalMol: -9.6,
    activeViewerLigandMode: 'known_binder',
    linkedBiologicCandidateId: 'trastuzumab',
  },
  pd1_pembrolizumab_biologic: {
    presetId: 'pd1_pembrolizumab_biologic',
    pathwayRoute: 'route_b_biologic',
    biologicalObjective:
      'Block the PD-1 immune checkpoint receptor with an IgG4 antibody and evaluate mammalian bioreactor production',
    plainEnglishMechanismNote:
      'Pembrolizumab is a large 146.3 kDa IgG4 antibody that blocks PD-1 on T-cells. Because of its size and glycosylation, it cannot be made by chemical synthesis and requires mammalian cell culture.',
    referenceCitation:
      'Lee et al. (Nat. Commun., 2016) — Crystal structure of human PD-1 in complex with Pembrolizumab Fab',
    referenceAccessionId: 'DrugBank DB09037 · PMID 27461440 · Europe PMC PMC4974469',
    targetProteinSymbol: 'PD-1 (PDCD1)',
    targetProteinFullName:
      'Programmed Cell Death Protein 1 (Immune Checkpoint Receptor)',
    targetUniprotId: 'Q15116',
    receptorPdbId: '5GGS',
    receptorPocketDescription:
      'PD-1 CC’ and FG Loop Extracellular Interface Epitope',
    pocketCenter: [16.4, 24.8, 32.1],
    pocketSize: [22.0, 22.0, 22.0],
    knownBinderName: 'Pembrolizumab (Keytruda · Known IgG4 Checkpoint Blocker)',
    knownBinderSmiles:
      'Cc1cc(Nc2ncnc3ccc(NC4=NC(C)(C)CO4)cc23)ccc1Oc1ccn2ncnc2c1',
    knownBinderAffinityKcalMol: -9.4,
    knownBinderKdOrPotency: 'mAb K_D = 29 pM (146.3 kDa IgG4)',
    candidateName: 'Pembrolizumab (Keytruda · 146.3 kDa Humanised IgG4 mAb)',
    candidateSmiles:
      'Cc1cc(Nc2ncnc3ccc(NC4=NC(C)(C)CO4)cc23)ccc1Oc1ccn2ncnc2c1',
    candidateAffinityKcalMol: -9.4,
    activeViewerLigandMode: 'known_binder',
    linkedBiologicCandidateId: 'pembrolizumab',
  },
};

interface InitialDrugTargetIntakePanelProps {
  intakeState: DrugTargetKnownBinderIntakeState;
  onUpdateIntakeState: (next: DrugTargetKnownBinderIntakeState) => void;
  allBiologicCandidates?: BiologicCandidate[];
  onSelectBiologicCandidate?: (candidateId: string) => void;
  onChangePathwayMode?: (mode: CandidatePathwayMode) => void;
  onApplyTo3DViewer?: (
    intake: DrugTargetKnownBinderIntakeState,
    customTarget?: ProteinTarget3DConfig
  ) => void;
  compactMode?: boolean;
}

export const InitialDrugTargetIntakePanel: React.FC<
  InitialDrugTargetIntakePanelProps
> = ({
  intakeState,
  onUpdateIntakeState,
  onSelectBiologicCandidate,
  onChangePathwayMode,
  onApplyTo3DViewer,
}) => {
  const [showAdvancedScientific, setShowAdvancedScientific] =
    useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Live Critic Evaluation of Known Binder SMILES and Candidate SMILES
  const knownBinderCritic: CombinedCandidateAssessment = useMemo(
    () => evaluateSmilesWithCritics(intakeState.knownBinderSmiles || 'c1ccccc1'),
    [intakeState.knownBinderSmiles]
  );

  const candidateCritic: CombinedCandidateAssessment = useMemo(
    () => evaluateSmilesWithCritics(intakeState.candidateSmiles || 'c1ccccc1'),
    [intakeState.candidateSmiles]
  );

  const buildCustomTarget3D = (
    state: DrugTargetKnownBinderIntakeState
  ): ProteinTarget3DConfig => {
    const baseTarget =
      state.pathwayRoute === 'route_b_biologic' ||
      state.targetProteinSymbol.toUpperCase().includes('HER2')
        ? PROTEIN_TARGETS_3D.HER2
        : PROTEIN_TARGETS_3D.MRP1;

    return {
      ...baseTarget,
      id: state.targetProteinSymbol.split(' ')[0] || 'CUSTOM',
      symbol: state.targetProteinSymbol,
      fullName: state.targetProteinFullName,
      pdbId: state.receptorPdbId,
      uniprotId: state.targetUniprotId,
      referenceLigandName: state.knownBinderName,
      referenceLigandSmiles: state.knownBinderSmiles,
      referenceAffinityKcalMol: state.knownBinderAffinityKcalMol,
      boxCenter: state.pocketCenter,
      boxSize: state.pocketSize,
    };
  };

  const handleSelectPreset = (presetKey: string) => {
    const preset = INITIAL_DRUG_TARGET_PRESETS[presetKey];
    if (!preset) return;
    onUpdateIntakeState(preset);
    if (preset.pathwayRoute === 'route_b_biologic') {
      onChangePathwayMode?.('established_biologic');
      if (preset.linkedBiologicCandidateId) {
        onSelectBiologicCandidate?.(preset.linkedBiologicCandidateId);
      }
    } else {
      onChangePathwayMode?.('small_molecule_chemical');
    }
    const target3D = buildCustomTarget3D(preset);
    onApplyTo3DViewer?.(preset, target3D);
    setStatusBanner(
      `Loaded "${preset.targetProteinSymbol}" (${preset.receptorPdbId}) and starting molecule "${preset.knownBinderName}" into the 3D viewer and screening pipeline.`
    );
  };

  // Parse uploaded .pdb / .pdbqt file to compute 3D pocket coordinates
  const handleReceptorFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/);
    const xs: number[] = [];
    const ys: number[] = [];
    const zs: number[] = [];

    for (const line of lines) {
      if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
        const x = parseFloat(line.slice(30, 38));
        const y = parseFloat(line.slice(38, 46));
        const z = parseFloat(line.slice(46, 54));
        if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
          xs.push(x);
          ys.push(y);
          zs.push(z);
        }
      }
    }

    if (xs.length === 0) {
      setStatusBanner(
        `Uploaded ${file.name}, but no ATOM/HETATM coordinate lines were found.`
      );
      return;
    }

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const cx = Number(((minX + maxX) / 2).toFixed(2));
    const cy = Number(((minY + maxY) / 2).toFixed(2));
    const cz = Number(((minZ + maxZ) / 2).toFixed(2));

    const sx = Number(Math.min(30, Math.max(18, maxX - minX + 10)).toFixed(1));
    const sy = Number(Math.min(30, Math.max(18, maxY - minY + 10)).toFixed(1));
    const sz = Number(Math.min(30, Math.max(18, maxZ - minZ + 10)).toFixed(1));

    const nextState: DrugTargetKnownBinderIntakeState = {
      ...intakeState,
      presetId: 'custom_user_input',
      receptorPdbId: file.name,
      uploadedReceptorFileName: file.name,
      uploadedAtomCount: xs.length,
      pocketCenter: [cx, cy, cz],
      pocketSize: [sx, sy, sz],
    };
    onUpdateIntakeState(nextState);
    onApplyTo3DViewer?.(nextState, buildCustomTarget3D(nextState));
    setStatusBanner(
      `Parsed structure "${file.name}" (${xs.length.toLocaleString()} atoms) and updated the 3D binding pocket automatically.`
    );
  };

  const handleApplyIntake = () => {
    const customTarget = buildCustomTarget3D(intakeState);

    if (intakeState.pathwayRoute === 'route_b_biologic') {
      onChangePathwayMode?.('established_biologic');
      if (intakeState.linkedBiologicCandidateId) {
        onSelectBiologicCandidate?.(intakeState.linkedBiologicCandidateId);
      }
    } else {
      onChangePathwayMode?.('small_molecule_chemical');
    }

    onApplyTo3DViewer?.(intakeState, customTarget);
    setStatusBanner(
      `Updated 3D molecular viewer and manufacturability screening for target "${intakeState.targetProteinSymbol}" and molecule "${
        intakeState.activeViewerLigandMode === 'known_binder'
          ? intakeState.knownBinderName
          : intakeState.candidateName
      }".`
    );
  };

  const isMrp1Selected = intakeState.targetProteinSymbol
    .toUpperCase()
    .includes('MRP1');

  return (
    <div className="bg-white border border-slate-300 shadow-xs">
      {/* Header Bar */}
      <div className="px-5 py-4 bg-slate-900 text-slate-100 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
            01. Start With Your Protein Target &amp; Starting Molecule
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
            Define the Biological Problem, Known Binder &amp; Evidence
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Choose a validated example below or enter your own target protein, biological goal, starting compound and structure reference. All changes flow directly into the 3D viewer and manufacturability checks below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectPreset('mrp1_mk571_small_molecule')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to MRP1 Drug-Retention Example</span>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Quick Example Selector Strip */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-800">
              Choose an example case or customise any field below:
            </span>
            <span className="text-slate-600">
              Determined Manufacturing Route:{' '}
              <strong className="text-slate-950">
                {intakeState.pathwayRoute === 'route_a_small_molecule'
                  ? 'Small-Molecule Chemical Synthesis (No Bioreactor Needed)'
                  : 'Recombinant Biologic (Mammalian CHO Biomanufacturing)'}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              {
                id: 'mrp1_mk571_small_molecule',
                routeLabel: 'Small-Molecule Discovery · Primary Case',
                title: 'MRP1 Drug-Efflux Pump + MK-571',
                sub: 'Keep drug inside cell · PDB 5UJA · Chemical synthesis',
              },
              {
                id: 'egfr_osimertinib_small_molecule',
                routeLabel: 'Small-Molecule Discovery',
                title: 'EGFR (T790M) Kinase + Osimertinib',
                sub: 'Block kinase signalling · PDB 4ZAU · Chemical synthesis',
              },
              {
                id: 'her2_trastuzumab_biologic',
                routeLabel: 'Biologic Manufacturing Example',
                title: 'HER2 Receptor + Trastuzumab mAb',
                sub: '145.5 kDa Antibody · PDB 1N8Z · 500 L CHO Bioreactor',
              },
              {
                id: 'pd1_pembrolizumab_biologic',
                routeLabel: 'Biologic Manufacturing Example',
                title: 'PD-1 Checkpoint + Pembrolizumab mAb',
                sub: '146.3 kDa Antibody · PDB 5GGS · 500 L CHO Bioreactor',
              },
            ].map((p) => {
              const isSelected = intakeState.presetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={`p-3 text-left border transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-[11px] text-slate-600">
                    <span className="font-medium text-slate-700">
                      {p.routeLabel}
                    </span>
                    {isSelected && (
                      <span className="text-blue-700 font-semibold">Selected</span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 truncate">
                    {p.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Plain-English MRP1 Explanation & Mandatory Docking Guardrail Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-7 space-y-1">
            <div className="text-xs font-bold text-slate-900">
              Plain-English Biological Goal ({intakeState.targetProteinSymbol})
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {isMrp1Selected
                ? 'Some cancer cells use proteins such as MRP1 to pump certain drugs out of the cell. Researchers may want to design molecules that inhibit this transport, potentially helping drugs remain inside cells.'
                : intakeState.plainEnglishMechanismNote}
            </p>
          </div>
          <div className="lg:col-span-5 p-3 bg-amber-50/80 border border-amber-200 space-y-1">
            <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>What Docking Can and Cannot Prove</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              A molecule fitting into the 3D protein pocket (predicted binding score) is <strong>not proof</strong> that it blocks transporter activity or keeps drugs inside cells. Functional pump inhibition and intracellular drug retention require wet-lab cellular assays.
            </p>
          </div>
        </div>

        {/* 4 Approachable Primary Questions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* QUESTION 1: Which protein are you targeting? */}
          <div className="p-4 bg-white border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Which protein are you targeting?</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Protein Name or Gene Symbol
                </label>
                <input
                  type="text"
                  aria-label="Which protein are you targeting"
                  value={intakeState.targetProteinSymbol}
                  onChange={(e) => {
                    const nextState = {
                      ...intakeState,
                      presetId: 'custom_user_input',
                      targetProteinSymbol: e.target.value,
                    };
                    onUpdateIntakeState(nextState);
                    onApplyTo3DViewer?.(nextState, buildCustomTarget3D(nextState));
                  }}
                  placeholder="e.g. MRP1 (ABCC1)"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Biological Role in the Cell
                </label>
                <input
                  type="text"
                  aria-label="Biological role of target protein"
                  value={intakeState.targetProteinFullName}
                  onChange={(e) =>
                    onUpdateIntakeState({
                      ...intakeState,
                      presetId: 'custom_user_input',
                      targetProteinFullName: e.target.value,
                    })
                  }
                  placeholder="e.g. Cell-membrane drug-efflux pump"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 text-slate-900"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              UniProt ID: <span className="font-mono">{intakeState.targetUniprotId}</span>
            </div>
          </div>

          {/* QUESTION 2: What do you want to change about its behaviour? */}
          <div className="p-4 bg-white border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Sliders className="w-4 h-4 text-blue-600 shrink-0" />
                <span>What do you want to change about its behaviour?</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Desired Biological Action
                </label>
                <textarea
                  rows={2}
                  aria-label="What do you want to change about its behaviour"
                  value={intakeState.biologicalObjective}
                  onChange={(e) =>
                    onUpdateIntakeState({
                      ...intakeState,
                      presetId: 'custom_user_input',
                      biologicalObjective: e.target.value,
                    })
                  }
                  placeholder="e.g. Block the pump so the drug stays inside the cell"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 text-slate-900 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Candidate Molecule Type
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const nextState: DrugTargetKnownBinderIntakeState = {
                        ...intakeState,
                        pathwayRoute: 'route_a_small_molecule',
                      };
                      onUpdateIntakeState(nextState);
                      onChangePathwayMode?.('small_molecule_chemical');
                      onApplyTo3DViewer?.(nextState, buildCustomTarget3D(nextState));
                    }}
                    className={`py-1.5 px-2 text-xs font-medium border cursor-pointer ${
                      intakeState.pathwayRoute === 'route_a_small_molecule'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Small Molecule
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextState: DrugTargetKnownBinderIntakeState = {
                        ...intakeState,
                        pathwayRoute: 'route_b_biologic',
                      };
                      onUpdateIntakeState(nextState);
                      onChangePathwayMode?.('established_biologic');
                      onApplyTo3DViewer?.(nextState, buildCustomTarget3D(nextState));
                    }}
                    className={`py-1.5 px-2 text-xs font-medium border cursor-pointer ${
                      intakeState.pathwayRoute === 'route_b_biologic'
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Biologic Protein
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              Determines whether chemical synthesis or cell culture applies.
            </div>
          </div>

          {/* QUESTION 3: Do you have a known molecule to start from? */}
          <div className="p-4 bg-white border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <FlaskConical className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Do you have a known molecule to start from?</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Known Binder or Reference Compound
                </label>
                <input
                  type="text"
                  aria-label="Do you have a known molecule to start from"
                  value={intakeState.knownBinderName}
                  onChange={(e) => {
                    const nextState = {
                      ...intakeState,
                      presetId: 'custom_user_input',
                      knownBinderName: e.target.value,
                    };
                    onUpdateIntakeState(nextState);
                    onApplyTo3DViewer?.(nextState, buildCustomTarget3D(nextState));
                  }}
                  placeholder="e.g. MK-571 (reference inhibitor)"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Show in 3D Pocket Viewer Below
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const nextState: DrugTargetKnownBinderIntakeState = {
                        ...intakeState,
                        activeViewerLigandMode: 'known_binder',
                      };
                      onUpdateIntakeState(nextState);
                      onApplyTo3DViewer?.(nextState, buildCustomTarget3D(nextState));
                    }}
                    className={`py-1.5 px-2 text-xs font-medium border cursor-pointer ${
                      intakeState.activeViewerLigandMode === 'known_binder'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Known Binder
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextState: DrugTargetKnownBinderIntakeState = {
                        ...intakeState,
                        activeViewerLigandMode: 'designed_candidate',
                      };
                      onUpdateIntakeState(nextState);
                      onApplyTo3DViewer?.(nextState, buildCustomTarget3D(nextState));
                    }}
                    className={`py-1.5 px-2 text-xs font-medium border cursor-pointer ${
                      intakeState.activeViewerLigandMode === 'designed_candidate'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    New Candidate
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              Starting benchmark: <span className="font-mono">{intakeState.knownBinderKdOrPotency}</span>
            </div>
          </div>

          {/* QUESTION 4: Do you have a protein structure or research reference? */}
          <div className="p-4 bg-white border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Do you have a protein structure or research reference?</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    PDB Structure ID
                  </label>
                  <input
                    type="text"
                    aria-label="PDB Structure ID"
                    value={intakeState.receptorPdbId}
                    onChange={(e) => {
                      const nextState = {
                        ...intakeState,
                        presetId: 'custom_user_input',
                        receptorPdbId: e.target.value,
                      };
                      onUpdateIntakeState(nextState);
                      onApplyTo3DViewer?.(nextState, buildCustomTarget3D(nextState));
                    }}
                    placeholder="e.g. 5UJA"
                    className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Or Upload .pdb
                  </label>
                  <label className="flex items-center justify-center gap-1 w-full py-1.5 px-2 text-xs bg-slate-50 border border-dashed border-slate-400 text-slate-700 hover:bg-slate-100 cursor-pointer truncate">
                    <Upload className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">
                      {intakeState.uploadedReceptorFileName || 'Upload File'}
                    </span>
                    <input
                      type="file"
                      accept=".pdb,.pdbqt,.ent"
                      onChange={handleReceptorFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Research Paper or Evidence Source
                </label>
                <input
                  type="text"
                  aria-label="Research Paper or Evidence Source"
                  value={intakeState.referenceCitation}
                  onChange={(e) =>
                    onUpdateIntakeState({
                      ...intakeState,
                      presetId: 'custom_user_input',
                      referenceCitation: e.target.value,
                    })
                  }
                  placeholder="e.g. Johnson & Chen (Cell, 2017)"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 text-slate-900"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 truncate">
              Ref: {intakeState.referenceAccessionId}
            </div>
          </div>
        </div>

        {/* Action Strip + Expandable Advanced Scientific Inputs Toggle */}
        <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowAdvancedScientific((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-950 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {showAdvancedScientific
                ? 'Hide Advanced Scientific Inputs (SMILES, 3D Binding Box Coordinates & Accession IDs)'
                : 'Show Advanced Scientific Inputs (SMILES, 3D Binding Box Coordinates & Accession IDs)'}
            </span>
            {showAdvancedScientific ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleApplyIntake}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
          >
            <span>Update 3D Viewer &amp; Manufacturability Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expandable Advanced Technical Panel (Binding Box, SMILES, Accession IDs, Critic Scores) */}
        {showAdvancedScientific && (
          <div className="p-4 bg-slate-50 border border-slate-200 space-y-4">
            <div className="text-xs font-bold text-slate-900">
              Advanced Scientific Parameters (3D Docking Box, SMILES &amp; Database Accessions)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Advanced Col 1: 3D Binding Box Center & Dimensions */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  3D Binding-Box Centre Coordinates (x, y, z in Å)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['X', 'Y', 'Z'] as const).map((axisLabel, axisIdx) => (
                    <div key={axisLabel}>
                      <span className="block text-[10px] font-mono text-slate-500">
                        Center {axisLabel} (Å)
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        aria-label={`Pocket Center ${axisLabel}`}
                        value={intakeState.pocketCenter[axisIdx]}
                        onChange={(e) => {
                          const nextCenter: [number, number, number] = [
                            ...intakeState.pocketCenter,
                          ] as [number, number, number];
                          nextCenter[axisIdx] = Number(e.target.value) || 0;
                          onUpdateIntakeState({
                            ...intakeState,
                            presetId: 'custom_user_input',
                            pocketCenter: nextCenter,
                          });
                        }}
                        className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 text-slate-900"
                      />
                    </div>
                  ))}
                </div>
                <div className="text-[11px] font-mono text-slate-600">
                  Grid Box Size: {intakeState.pocketSize[0]} × {intakeState.pocketSize[1]} ×{' '}
                  {intakeState.pocketSize[2]} Å · Pocket: {intakeState.receptorPocketDescription}
                </div>
              </div>

              {/* Advanced Col 2: Known Binder SMILES & Critic Readout */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Known Binder SMILES &amp; Reference Docking Score (kcal/mol)
                </label>
                <input
                  type="text"
                  aria-label="Known Binder SMILES"
                  value={intakeState.knownBinderSmiles}
                  onChange={(e) =>
                    onUpdateIntakeState({
                      ...intakeState,
                      presetId: 'custom_user_input',
                      knownBinderSmiles: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 text-slate-900"
                />
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
                  <span>
                    Ref Score: {intakeState.knownBinderAffinityKcalMol.toFixed(2)} kcal/mol
                  </span>
                  <span>
                    SA: {knownBinderCritic.synthesisability.sa_score} ·{' '}
                    {knownBinderCritic.synthesisability.stereocentres} chiral · ~
                    {knownBinderCritic.process_chemistry.estimated_steps} steps
                  </span>
                </div>
              </div>

              {/* Advanced Col 3: Designed Candidate SMILES & Accession IDs */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Designed Candidate Name &amp; SMILES (Live Chemistry Critic)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    aria-label="Candidate Name"
                    value={intakeState.candidateName}
                    onChange={(e) =>
                      onUpdateIntakeState({
                        ...intakeState,
                        presetId: 'custom_user_input',
                        candidateName: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 text-slate-900"
                  />
                  <input
                    type="text"
                    aria-label="Reference Accession ID"
                    value={intakeState.referenceAccessionId}
                    onChange={(e) =>
                      onUpdateIntakeState({
                        ...intakeState,
                        presetId: 'custom_user_input',
                        referenceAccessionId: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 text-slate-900"
                  />
                </div>
                <input
                  type="text"
                  aria-label="Candidate SMILES"
                  value={intakeState.candidateSmiles}
                  onChange={(e) =>
                    onUpdateIntakeState({
                      ...intakeState,
                      presetId: 'custom_user_input',
                      candidateSmiles: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 text-slate-900"
                />
                <div className="text-[11px] font-mono text-slate-700">
                  Candidate Critic: <strong>{candidateCritic.summary}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {statusBanner && (
          <div className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusBanner}</span>
            </span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-xs underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
