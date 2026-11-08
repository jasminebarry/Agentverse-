import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Activity,
  Atom,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  Atom3D,
  CLOSED_LOOP_DATASETS,
  ProteinTarget3DConfig,
  PROTEIN_TARGETS_3D,
  evaluateSmilesWithCritics,
  getModesForSmiles,
} from '../data/dissertationDockingData';
import {
  DrugTargetKnownBinderIntakeState,
  InitialDrugTargetIntakePanel,
} from './InitialDrugTargetIntakePanel';
import {
  BiologicCandidate,
  CandidatePathwayMode,
  HumanSafetyGate,
  MassBalanceAndPhysicsResult,
  NextExperimentRecommendationSuite,
  NovelProteinDissertationProfile,
  OrganismSystemId,
  ProposedNextExperimentRecipe,
  ReactorScreeningEvaluation,
  StirredTankPhysicsParams,
} from '../types/bioreact';
import { ORGANISM_PROCESS_MODELS } from '../data/multiOrganismData';

export type WorkbenchSectionId =
  | 'home_workbench'
  | 'workflow_safety'
  | 'dissertation_3d'
  | 'streams'
  | 'screening'
  | 'mass_balance'
  | 'optimiser'
  | 'brief';

interface UnifiedWorkbenchHomePanelProps {
  intakeState: DrugTargetKnownBinderIntakeState;
  onUpdateIntakeState: (next: DrugTargetKnownBinderIntakeState) => void;
  customTarget3D: ProteinTarget3DConfig | null;
  onUpdateCustomTarget3D: (next: ProteinTarget3DConfig | null) => void;
  candidate: BiologicCandidate;
  allBiologicCandidates: BiologicCandidate[];
  onSelectBiologicCandidate: (candidateId: string) => void;
  candidatePathwayMode: CandidatePathwayMode;
  onChangePathwayMode: (mode: CandidatePathwayMode) => void;
  selectedOrganismId: OrganismSystemId;
  novelProfile: NovelProteinDissertationProfile;
  strParams: StirredTankPhysicsParams;
  physicsResult: MassBalanceAndPhysicsResult;
  evaluations: ReactorScreeningEvaluation[];
  safetyGates: HumanSafetyGate[];
  recommendationSuite: NextExperimentRecommendationSuite;
  prismaRecordsIncluded: number;
  downstreamCogsPerGramUsd: number;
  onNavigateToSection: (section: WorkbenchSectionId) => void;
  onApplyMicrospargerFixAndInspect: () => void;
}

const ELEMENT_COLORS: Record<string, number> = {
  C: 0x10b981,
  N: 0x2563eb,
  O: 0xef4444,
  S: 0xf59e0b,
  F: 0x06b6d4,
  Cl: 0x22c55e,
  Br: 0x991b1b,
  P: 0xf97316,
};

type HomeShowcaseMode =
  | 'known_starting_molecule'
  | 'mrp1_manufacturable_lead'
  | 'mrp1_unbuildable_raw_hit'
  | 'her2_trastuzumab_biologic'
  | 'novel_dissertation_protein';

export const UnifiedWorkbenchHomePanel: React.FC<UnifiedWorkbenchHomePanelProps> = ({
  intakeState,
  onUpdateIntakeState,
  customTarget3D,
  onUpdateCustomTarget3D,
  candidate,
  allBiologicCandidates,
  onSelectBiologicCandidate,
  candidatePathwayMode,
  onChangePathwayMode,
  selectedOrganismId,
  novelProfile,
  strParams,
  physicsResult,
  evaluations,
  safetyGates,
  recommendationSuite,
  prismaRecordsIncluded,
  downstreamCogsPerGramUsd,
  onNavigateToSection,
  onApplyMicrospargerFixAndInspect,
}) => {
  const [showcaseMode, setShowcaseMode] = useState<HomeShowcaseMode>(
    candidatePathwayMode === 'established_biologic'
      ? 'her2_trastuzumab_biologic'
      : candidatePathwayMode === 'novel_dissertation_protein'
      ? 'novel_dissertation_protein'
      : 'mrp1_manufacturable_lead'
  );
  const [showSurfaceBox, setShowSurfaceBox] = useState<boolean>(true);
  const [showContactLabels, setShowContactLabels] = useState<boolean>(true);
  const [cameraResetCounter, setCameraResetCounter] = useState<number>(0);
  const [isTechnicalDetailsOpen, setIsTechnicalDetailsOpen] = useState<boolean>(false);

  const mountRef = useRef<HTMLDivElement | null>(null);

  // Pull real candidates from CLOSED_LOOP_DATASETS
  const mrp1LeadCandidate = useMemo(() => {
    const shortlist = CLOSED_LOOP_DATASETS.cache.final_shortlist;
    return (
      shortlist.find((c) => c.dock_affinity <= -10.8) ||
      shortlist[0] ||
      CLOSED_LOOP_DATASETS.cache.rounds[1].candidates[0]
    );
  }, []);

  const mrp1UnbuildableCandidate = useMemo(() => {
    const round1 = CLOSED_LOOP_DATASETS.cache.rounds[0]?.candidates || [];
    return (
      round1.find((c) => c.overall_verdict === 'fail') ||
      round1[0] ||
      mrp1LeadCandidate
    );
  }, [mrp1LeadCandidate]);

  const activeCandidateCritics = useMemo(
    () => evaluateSmilesWithCritics(intakeState.candidateSmiles || mrp1LeadCandidate.smiles),
    [intakeState.candidateSmiles, mrp1LeadCandidate.smiles]
  );

  const knownBinderCritics = useMemo(
    () => evaluateSmilesWithCritics(intakeState.knownBinderSmiles || 'c1ccccc1'),
    [intakeState.knownBinderSmiles]
  );

  const activeTarget3D = useMemo(() => {
    if (customTarget3D) {
      return customTarget3D;
    }
    if (
      showcaseMode === 'her2_trastuzumab_biologic' ||
      showcaseMode === 'novel_dissertation_protein' ||
      intakeState.pathwayRoute === 'route_b_biologic'
    ) {
      return PROTEIN_TARGETS_3D.HER2;
    }
    return PROTEIN_TARGETS_3D.MRP1;
  }, [customTarget3D, showcaseMode, intakeState.pathwayRoute]);

  const activeDockedCandidate = useMemo(() => {
    if (showcaseMode === 'mrp1_unbuildable_raw_hit') {
      return mrp1UnbuildableCandidate;
    }
    return mrp1LeadCandidate;
  }, [showcaseMode, mrp1LeadCandidate, mrp1UnbuildableCandidate]);

  const activePoseMode = useMemo(() => {
    if (
      showcaseMode === 'known_starting_molecule' ||
      (customTarget3D && intakeState.activeViewerLigandMode === 'known_binder')
    ) {
      const modes = getModesForSmiles(
        activeTarget3D,
        intakeState.knownBinderSmiles,
        intakeState.knownBinderAffinityKcalMol
      );
      return modes[0];
    }
    if (customTarget3D) {
      const smilesToRender = intakeState.candidateSmiles || activeDockedCandidate.smiles;
      const affinityToRender = intakeState.candidateAffinityKcalMol;
      const modes = getModesForSmiles(activeTarget3D, smilesToRender, affinityToRender);
      return modes[0];
    }
    if (
      showcaseMode === 'her2_trastuzumab_biologic' ||
      showcaseMode === 'novel_dissertation_protein'
    ) {
      const modes = getModesForSmiles(
        PROTEIN_TARGETS_3D.HER2,
        PROTEIN_TARGETS_3D.HER2.referenceLigandSmiles,
        PROTEIN_TARGETS_3D.HER2.referenceAffinityKcalMol
      );
      return modes[0];
    }
    const modes = getModesForSmiles(
      PROTEIN_TARGETS_3D.MRP1,
      activeDockedCandidate.smiles,
      activeDockedCandidate.dock_affinity
    );
    return modes[0];
  }, [customTarget3D, intakeState, activeTarget3D, showcaseMode, activeDockedCandidate]);

  // Interactive Three.js WebGL 3D Viewer
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 390;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    const [cx, cy, cz] = activeTarget3D.boxCenter;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(cx + 18.5, cy + 12.5, cz + 21.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(cx, cy, cz);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;
    controls.update();

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight1.position.set(cx + 30, cy + 40, cz + 35);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.55);
    dirLight2.position.set(cx - 30, cy - 25, cz - 20);
    scene.add(dirLight2);

    // 1. Render Transmembrane / Kinase Pocket Helices
    activeTarget3D.helices.forEach((h) => {
      const startVec = new THREE.Vector3(...h.start);
      const endVec = new THREE.Vector3(...h.end);
      const length = startVec.distanceTo(endVec);
      const midVec = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);

      const cylGeom = new THREE.CylinderGeometry(h.radius, h.radius, length, 24);
      const cylMat = new THREE.MeshStandardMaterial({
        color: h.color,
        roughness: 0.4,
        metalness: 0.15,
        transparent: true,
        opacity: 0.42,
      });
      const cylinder = new THREE.Mesh(cylGeom, cylMat);
      cylinder.position.copy(midVec);
      const direction = new THREE.Vector3().subVectors(endVec, startVec).normalize();
      cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      scene.add(cylinder);
    });

    // 2. Render Binding Box Wireframe
    if (showSurfaceBox) {
      const [sx, sy, sz] = activeTarget3D.boxSize;
      const boxGeom = new THREE.BoxGeometry(sx, sy, sz);
      const edges = new THREE.EdgesGeometry(boxGeom);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
      });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      wireframe.position.set(cx, cy, cz);
      scene.add(wireframe);
    }

    // 3. Render Pocket Contact Residues
    activeTarget3D.contactResidues.forEach((res) => {
      res.atoms.forEach((a) => {
        const atomGeom = new THREE.SphereGeometry(0.32, 16, 16);
        const atomMat = new THREE.MeshStandardMaterial({
          color: a.element === 'N' ? 0x60a5fa : a.element === 'O' ? 0xf87171 : 0x94a3b8,
          roughness: 0.35,
        });
        const mesh = new THREE.Mesh(atomGeom, atomMat);
        mesh.position.set(a.x, a.y, a.z);
        scene.add(mesh);
      });
      for (let i = 0; i < res.atoms.length - 1; i++) {
        const p1 = new THREE.Vector3(res.atoms[i].x, res.atoms[i].y, res.atoms[i].z);
        const p2 = new THREE.Vector3(res.atoms[i + 1].x, res.atoms[i + 1].y, res.atoms[i + 1].z);
        const dist = p1.distanceTo(p2);
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const bondGeom = new THREE.CylinderGeometry(0.11, 0.11, dist, 10);
        const bondMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
        const bond = new THREE.Mesh(bondGeom, bondMat);
        bond.position.copy(mid);
        bond.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3().subVectors(p2, p1).normalize()
        );
        scene.add(bond);
      }
    });

    // 4. Render Active Ligand / Structural Pose Atoms & Bonds
    if (activePoseMode) {
      const ligAtoms: Atom3D[] = activePoseMode.ligandAtoms;
      ligAtoms.forEach((a: Atom3D) => {
        const radius = a.element === 'S' || a.element === 'Cl' ? 0.56 : 0.45;
        const geom = new THREE.SphereGeometry(radius, 22, 22);
        const baseColor =
          showcaseMode === 'mrp1_unbuildable_raw_hit' && a.element === 'C'
            ? 0xf43f5e
            : showcaseMode === 'known_starting_molecule' && a.element === 'C'
            ? 0xf59e0b
            : showcaseMode === 'her2_trastuzumab_biologic' && a.element === 'C'
            ? 0x38bdf8
            : ELEMENT_COLORS[a.element] || 0x10b981;
        const mat = new THREE.MeshStandardMaterial({
          color: baseColor,
          roughness: 0.2,
          metalness: 0.15,
        });
        const sphere = new THREE.Mesh(geom, mat);
        sphere.position.set(a.x, a.y, a.z);
        scene.add(sphere);
      });

      for (let i = 0; i < ligAtoms.length; i++) {
        for (let j = i + 1; j < ligAtoms.length; j++) {
          const p1 = new THREE.Vector3(ligAtoms[i].x, ligAtoms[i].y, ligAtoms[i].z);
          const p2 = new THREE.Vector3(ligAtoms[j].x, ligAtoms[j].y, ligAtoms[j].z);
          const dist = p1.distanceTo(p2);
          if (dist < 1.95) {
            const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
            const bondGeom = new THREE.CylinderGeometry(0.16, 0.16, dist, 12);
            const bondMat = new THREE.MeshStandardMaterial({
              color:
                showcaseMode === 'mrp1_unbuildable_raw_hit'
                  ? 0xfda4af
                  : showcaseMode === 'known_starting_molecule'
                  ? 0xfde68a
                  : showcaseMode === 'her2_trastuzumab_biologic'
                  ? 0xbae6fd
                  : 0xd1fae5,
              roughness: 0.28,
            });
            const bond = new THREE.Mesh(bondGeom, bondMat);
            bond.position.copy(mid);
            bond.quaternion.setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              new THREE.Vector3().subVectors(p2, p1).normalize()
            );
            scene.add(bond);
          }
        }
      }

      // 5. Render Non-Covalent Polar Contacts / H-Bonds
      if (showContactLabels) {
        activeTarget3D.contactResidues.forEach((res) => {
          const anchor = res.atoms[res.atoms.length - 1];
          const pAnchor = new THREE.Vector3(anchor.x, anchor.y, anchor.z);
          let nearestLig = ligAtoms[0];
          let minD = 999;
          ligAtoms.forEach((la: Atom3D) => {
            const d = pAnchor.distanceTo(new THREE.Vector3(la.x, la.y, la.z));
            if (d < minD) {
              minD = d;
              nearestLig = la;
            }
          });
          if (nearestLig) {
            const pLig = new THREE.Vector3(nearestLig.x, nearestLig.y, nearestLig.z);
            const lineGeom = new THREE.BufferGeometry().setFromPoints([pAnchor, pLig]);
            const lineMat = new THREE.LineDashedMaterial({
              color: 0xfacc15,
              dashSize: 0.35,
              gapSize: 0.2,
            });
            const line = new THREE.Line(lineGeom, lineMat);
            line.computeLineDistances();
            scene.add(line);
          }
        });
      }
    }

    let reqId = 0;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 390;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(reqId);
      controls.dispose();
      renderer.dispose();
    };
  }, [
    activeTarget3D,
    activePoseMode,
    showcaseMode,
    showSurfaceBox,
    showContactLabels,
    cameraResetCounter,
  ]);

  const approvedGatesCount = safetyGates.filter((g) => g.status === 'Approved').length;
  const topBiologicReactors = evaluations.filter(
    (e) => e.checks.biologicalCompatibilityOk !== false
  );
  const topRankedReactor = topBiologicReactors[0] || evaluations[0];
  const topNextRecipes = recommendationSuite.proposedExperiments.slice(0, 2);

  const isSmallMoleculeRoute =
    intakeState.pathwayRoute === 'route_a_small_molecule' &&
    showcaseMode !== 'her2_trastuzumab_biologic' &&
    showcaseMode !== 'novel_dissertation_protein';

  return (
    <div className="space-y-8">
      {/* SECTION 0: Simplified Homepage Hero & 6-Step Discovery-to-Manufacturing Progression */}
      <section className="bg-white border border-slate-200 shadow-xs">
        <div className="p-6 lg:p-8 border-b border-slate-200 bg-gradient-to-b from-slate-50/70 to-white">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs text-slate-600">
            <span className="font-mono font-bold text-blue-700">
              <span className="normal-case">bioREACT</span> · Candidate-Centred Discovery to Manufacturing Workbench
            </span>
            <span>
              Evidence-aware · Manufacturability-checked · Scientist-reviewed
            </span>
          </div>

          <div className="max-w-4xl space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-950 leading-tight">
              From promising molecules to practical medicines.
            </h1>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-3xl">
              Start with a protein target and a known molecule. bioREACT helps explore new
              candidates, check whether they could work, and investigate how practical they would
              be to manufacture.
            </p>
          </div>

          {/* 5-Stage Unified Progression Bar */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2.5">
              Unified Discovery-to-Manufacturing Workflow
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {[
                {
                  step: '1. Discover',
                  desc: `Target (${intakeState.targetProteinSymbol}) & Known Molecule`,
                  href: '#step-input-form',
                },
                {
                  step: '2. Evaluate',
                  desc: `3D Pocket (PDB ${activeTarget3D.pdbId}) & Candidate Comparison`,
                  href: '#step-3d-viewer',
                },
                {
                  step: '3. Manufacture',
                  desc: isSmallMoleculeRoute
                    ? 'Auto-Classified: Chemical Synthesis'
                    : 'Auto-Classified: 500 L CHO Bioreactor',
                  href: '#step-manufacturability',
                },
                {
                  step: '4. Optimise',
                  desc: 'Compare Cost, Steps, Risks & Trade-offs',
                  href: '#step-compare-candidates',
                },
                {
                  step: '5. Next Experiments',
                  desc: isSmallMoleculeRoute
                    ? 'Synthesis & Cellular Retention Assays'
                    : 'Ranked Bioreactor Recipes & Sign-Off',
                  href: '#step-next-experiments',
                },
              ].map((item) => (
                <a
                  key={item.step}
                  href={item.href}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-400 transition-colors"
                >
                  <div className="font-bold text-slate-900">{item.step}</div>
                  <div className="text-[11px] text-slate-600 truncate mt-0.5">{item.desc}</div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 1: Prominent Candidate Input Form ABOVE the 3D Molecular Viewer */}
        <div id="step-input-form" className="p-6 lg:p-8 border-b border-slate-200 bg-slate-50/60">
          <InitialDrugTargetIntakePanel
            intakeState={intakeState}
            onUpdateIntakeState={onUpdateIntakeState}
            allBiologicCandidates={allBiologicCandidates}
            onSelectBiologicCandidate={onSelectBiologicCandidate}
            onChangePathwayMode={onChangePathwayMode}
            onApplyTo3DViewer={(nextIntake, nextTarget3D) => {
              onUpdateIntakeState(nextIntake);
              if (nextTarget3D) {
                onUpdateCustomTarget3D(nextTarget3D);
              }
              if (nextIntake.pathwayRoute === 'route_a_small_molecule') {
                setShowcaseMode(
                  nextIntake.activeViewerLigandMode === 'known_binder'
                    ? 'known_starting_molecule'
                    : 'mrp1_manufacturable_lead'
                );
                onChangePathwayMode('small_molecule_chemical');
              } else {
                setShowcaseMode('her2_trastuzumab_biologic');
                onChangePathwayMode('established_biologic');
                if (nextIntake.linkedBiologicCandidateId) {
                  onSelectBiologicCandidate(nextIntake.linkedBiologicCandidateId);
                }
              }
              setCameraResetCounter((c) => c + 1);
            }}
          />
        </div>

        {/* SECTION 2: Interactive 3D Molecular Viewer & Candidate Screening */}
        <div id="step-3d-viewer" className="p-6 lg:p-8 bg-slate-950 text-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                02. Explore 3D Target Pocket &amp; Compare Candidate Structures
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Interactive 3D Protein Pocket ({activeTarget3D.symbol} · PDB: {activeTarget3D.pdbId})
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Inspect how the starting reference molecule and newly proposed candidates fit inside
                the target pocket — then see why raw docking scores alone can be misleading.
              </p>
            </div>

            {/* Candidate Switcher Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowcaseMode('known_starting_molecule');
                  onChangePathwayMode('small_molecule_chemical');
                  onUpdateIntakeState({
                    ...intakeState,
                    pathwayRoute: 'route_a_small_molecule',
                    activeViewerLigandMode: 'known_binder',
                  });
                }}
                className={`px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  showcaseMode === 'known_starting_molecule'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                1. Known Binder ({intakeState.knownBinderName.split('(')[0].trim()} ·{' '}
                {intakeState.knownBinderAffinityKcalMol.toFixed(1)} kcal/mol)
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowcaseMode('mrp1_manufacturable_lead');
                  onChangePathwayMode('small_molecule_chemical');
                  onUpdateIntakeState({
                    ...intakeState,
                    pathwayRoute: 'route_a_small_molecule',
                    activeViewerLigandMode: 'designed_candidate',
                  });
                }}
                className={`px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  showcaseMode === 'mrp1_manufacturable_lead'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                2. Practical Lead ({intakeState.candidateName.split('(')[0].trim()} · −10.82 kcal/mol · PASS)
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowcaseMode('mrp1_unbuildable_raw_hit');
                  onChangePathwayMode('small_molecule_chemical');
                }}
                className={`px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  showcaseMode === 'mrp1_unbuildable_raw_hit'
                    ? 'bg-rose-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                3. Unbuildable Raw Hit (R1-C01 · −12.90 kcal/mol · REJECTED)
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateCustomTarget3D(null);
                  setShowcaseMode('her2_trastuzumab_biologic');
                  onChangePathwayMode('established_biologic');
                }}
                className={`px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  showcaseMode === 'her2_trastuzumab_biologic'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Biologic Example: HER2 / {candidate.genericName}
              </button>
            </div>
          </div>

          {/* 12-Col Grid: 7 Cols Live 3D Viewer | 5 Cols Plain-English Candidate Inspection */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5 items-stretch">
            {/* Left 7 Columns: Live Three.js WebGL 3D Viewer */}
            <div className="lg:col-span-7 flex flex-col border border-slate-800 bg-[#090d16]">
              {/* Viewer Top Toolbar */}
              <div className="px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-cyan-300 font-semibold">
                    Interactive 3D Pocket Viewer
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-200 font-semibold">
                    {activeTarget3D.symbol} · PDB: {activeTarget3D.pdbId} · UniProt:{' '}
                    {activeTarget3D.uniprotId}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowSurfaceBox((v) => !v)}
                    className={`px-2 py-1 text-[11px] border cursor-pointer whitespace-nowrap shrink-0 ${
                      showSurfaceBox
                        ? 'bg-slate-800 text-cyan-300 border-cyan-700'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    Binding Box: {showSurfaceBox ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactLabels((v) => !v)}
                    className={`px-2 py-1 text-[11px] border cursor-pointer whitespace-nowrap shrink-0 ${
                      showContactLabels
                        ? 'bg-slate-800 text-amber-300 border-amber-700'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    Pocket Contacts: {showContactLabels ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraResetCounter((c) => c + 1)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset View</span>
                  </button>
                </div>
              </div>

              {/* Three.js Canvas Mount */}
              <div className="relative flex-1 min-h-[360px] w-full">
                <div
                  ref={mountRef}
                  className="w-full h-[360px] cursor-grab active:cursor-grabbing"
                />

                {/* Floating Overlay Legend */}
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 bg-slate-950/85 border border-slate-800 px-3 py-2 text-[11px] font-mono">
                  <div className="flex flex-wrap items-center gap-3 text-slate-300">
                    <span>Drag to rotate · Scroll to zoom</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-amber-300">
                      Key Pocket Residues:{' '}
                      {activeTarget3D.contactResidues
                        .map((r) => `${r.resName}-${r.resSeq}`)
                        .join(', ')}
                    </span>
                  </div>
                  <span className="text-cyan-400">
                    Citation: {intakeState.referenceCitation.split('—')[0].trim()}
                  </span>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Plain-English Candidate Assessment & Practicality Check */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 border border-slate-800 p-5 space-y-4">
              {showcaseMode === 'known_starting_molecule' ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-amber-300 font-bold">
                      STARTING REFERENCE MOLECULE (BENCHMARK)
                    </span>
                    <span className="text-emerald-300 font-semibold">
                      Known Binder · {intakeState.knownBinderAffinityKcalMol.toFixed(2)} kcal/mol
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      {intakeState.knownBinderName}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      This is the known reference compound used as a starting point in the{' '}
                      <strong>{intakeState.targetProteinSymbol}</strong> binding pocket. We use its
                      binding pose and score ({intakeState.knownBinderAffinityKcalMol.toFixed(2)}{' '}
                      kcal/mol) as a baseline to see if newly designed molecules can bind more
                      tightly while remaining simple and affordable to synthesise.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                    <div className="bg-slate-950 border border-slate-800 p-2.5">
                      <div className="text-[10px] text-slate-400">Predicted Pocket Fit</div>
                      <div className="text-sm font-bold text-amber-300 mt-0.5">
                        {intakeState.knownBinderAffinityKcalMol.toFixed(2)} kcal/mol
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {intakeState.knownBinderKdOrPotency}
                      </div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-2.5">
                      <div className="text-[10px] text-slate-400">Synthesis Complexity</div>
                      <div className="text-sm font-bold text-slate-200 mt-0.5">
                        ~{knownBinderCritics.process_chemistry.estimated_steps} steps ·{' '}
                        {knownBinderCritics.synthesisability.stereocentres} chiral
                      </div>
                      <div className="text-[10px] text-slate-400">
                        SA Score: {knownBinderCritics.synthesisability.sa_score} / 10
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <strong className="text-amber-300">Goal for Candidate Redesign:</strong> Improve
                    upon {intakeState.knownBinderName.split('(')[0].trim()}’s pocket fit while
                    eliminating chiral centres and reducing synthesis to 3 standard reaction steps.
                  </div>
                </div>
              ) : showcaseMode === 'mrp1_manufacturable_lead' ||
                showcaseMode === 'mrp1_unbuildable_raw_hit' ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-amber-300 font-bold">
                      SMALL-MOLECULE CANDIDATE EVALUATION
                    </span>
                    <span
                      className={
                        showcaseMode === 'mrp1_manufacturable_lead'
                          ? 'text-emerald-400 font-bold'
                          : 'text-rose-400 font-bold'
                      }
                    >
                      {showcaseMode === 'mrp1_manufacturable_lead'
                        ? 'PRACTICAL TO SYNTHESISE (PASS)'
                        : 'IMPRACTICAL TO SYNTHESISE (REJECTED)'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      {showcaseMode === 'mrp1_manufacturable_lead'
                        ? `${intakeState.candidateName}`
                        : 'Unbuildable Top Raw Docking Hit (R1-C01)'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {showcaseMode === 'mrp1_manufacturable_lead'
                        ? `Designed to fit inside the ${intakeState.targetProteinSymbol} pocket (${intakeState.candidateAffinityKcalMol.toFixed(2)} kcal/mol vs. ${intakeState.knownBinderName.split('(')[0].trim()} at ${intakeState.knownBinderAffinityKcalMol.toFixed(2)} kcal/mol) while passing every synthesisability check: 0 chiral centres and 3 well-established reaction steps.`
                        : 'Why docking scores alone can mislead researchers: this molecule achieved the strongest raw docking score (−12.90 kcal/mol), but requires 7 chiral centres and ~12–18 difficult synthesis steps. Our chemistry critics flag and reject it before wet-lab synthesis.'}
                    </p>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                    <div className="bg-slate-950 border border-slate-800 p-2.5">
                      <div className="text-[10px] text-slate-400">
                        Predicted Pocket Binding
                      </div>
                      <div className="text-sm font-bold text-emerald-400 mt-0.5">
                        {showcaseMode === 'mrp1_manufacturable_lead'
                          ? `${intakeState.candidateAffinityKcalMol.toFixed(2)} kcal/mol`
                          : '−12.90 kcal/mol'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Docking prediction (not proof of inhibition)
                      </div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-2.5">
                      <div className="text-[10px] text-slate-400">
                        Synthesis Difficulty (SA Score)
                      </div>
                      <div
                        className={`text-sm font-bold mt-0.5 ${
                          showcaseMode === 'mrp1_manufacturable_lead'
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {showcaseMode === 'mrp1_manufacturable_lead'
                          ? `${activeCandidateCritics.synthesisability.sa_score} / 10 (Practical)`
                          : '6.42 / 10 (Too Complex)'}
                      </div>
                      <div className="text-[10px] text-slate-400">Threshold ≤ 4.5</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-2.5">
                      <div className="text-[10px] text-slate-400">
                        Estimated Reaction Steps
                      </div>
                      <div
                        className={`text-sm font-bold mt-0.5 ${
                          showcaseMode === 'mrp1_manufacturable_lead'
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {showcaseMode === 'mrp1_manufacturable_lead'
                          ? `${activeCandidateCritics.process_chemistry.estimated_steps} steps · ${activeCandidateCritics.synthesisability.stereocentres} chiral`
                          : '12–18 steps · 7 chiral'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {showcaseMode === 'mrp1_manufacturable_lead'
                          ? 'Standard Suzuki + sulfonamide'
                          : 'Severe chiral separation bottleneck'}
                      </div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-2.5">
                      <div className="text-[10px] text-slate-400">
                        Appropriate Manufacturing Route
                      </div>
                      <div className="text-sm font-bold text-amber-300 mt-0.5">
                        Chemical Synthesis
                      </div>
                      <div className="text-[10px] text-slate-400">
                        No living cell bioreactor
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <strong className="text-amber-300">
                      Biological Caution:
                    </strong>{' '}
                    Fitting into the {intakeState.targetProteinSymbol} pocket predicts possible
                    binding, not guaranteed pump inhibition. Wet-lab efflux and intracellular drug
                    retention assays are required next.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-cyan-400 font-bold">
                      SEPARATE BIOMANUFACTURING EXAMPLE · RECOMBINANT ANTIBODY
                    </span>
                    <span className="text-cyan-300">
                      145.5 kDa IgG1 Biologic
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      {candidate.genericName} ({candidate.brandName}) · Target: HER2 (ERBB2)
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      When the therapeutic candidate is a large recombinant protein such as{' '}
                      <strong>{candidate.genericName}</strong> (rather than a small chemical
                      molecule), it cannot be synthesised chemically and requires living{' '}
                      <strong>CHO mammalian cells</strong> in a 500 L bioreactor.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                    <div className="bg-slate-950 border border-slate-800 p-2.5">
                      <div className="text-[10px] text-slate-400">Production Host</div>
                      <div className="text-sm font-bold text-cyan-300 mt-0.5">
                        {ORGANISM_PROCESS_MODELS[selectedOrganismId].shortBadge}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Reactor: {topRankedReactor?.reactor.shortName}
                      </div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-2.5">
                      <div className="text-[10px] text-slate-400">500 L Oxygen Supply vs Demand</div>
                      <div
                        className={`text-sm font-bold mt-0.5 ${
                          physicsResult.otrMmolPerLHour >= physicsResult.ourMmolPerLHour
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        OTR {physicsResult.otrMmolPerLHour.toFixed(1)} vs OUR{' '}
                        {physicsResult.ourMmolPerLHour.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-slate-400">mmol O₂/L/h</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Action Bar inside Right Column */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToSection('dissertation_3d')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Atom className="w-3.5 h-3.5" />
                  <span>Open Full 3D Docking &amp; Chemistry Critics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <a
                  href="#step-compare-candidates"
                  className="px-3 py-2 text-xs font-mono text-cyan-300 border border-cyan-700/70 hover:bg-cyan-950/50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Compare Pros, Cons &amp; Cost Below ↓
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: "Can We Actually Make This Molecule?" — Manufacturing Route Decision & Feasibility */}
      <section
        id="step-manufacturability"
        className="bg-white border border-slate-200 p-6 lg:p-8 space-y-6 shadow-xs"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-blue-700 font-bold">
              03. Can We Actually Make This Molecule? · Manufacturing Route Decision
            </div>
            <h2 className="text-xl font-bold text-slate-950 mt-0.5">
              Determining the Right Manufacturing Method for Your Selected Candidate
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Not every drug candidate belongs in a bioreactor. bioREACT inspects the molecular
              modality first and routes small molecules to chemical synthesis while routing complex
              proteins to biological host and bioreactor screening.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onUpdateIntakeState({
                  ...intakeState,
                  pathwayRoute: 'route_a_small_molecule',
                });
                onChangePathwayMode('small_molecule_chemical');
                setShowcaseMode('mrp1_manufacturable_lead');
              }}
              className={`px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
                isSmallMoleculeRoute
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Inspect Small-Molecule Synthesis ({intakeState.targetProteinSymbol})
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateIntakeState({
                  ...intakeState,
                  pathwayRoute: 'route_b_biologic',
                });
                onChangePathwayMode('established_biologic');
                setShowcaseMode('her2_trastuzumab_biologic');
              }}
              className={`px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
                !isSmallMoleculeRoute
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Inspect Biologic Biomanufacturing ({candidate.genericName})
            </button>
          </div>
        </div>

        {/* 4 Manufacturing Pathways Status Cards (Clearly Distinguishing Supported vs Not Yet Supported) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Route 1: Small-Molecule Chemical Synthesis */}
          <div
            className={`p-4 border flex flex-col justify-between space-y-3 ${
              isSmallMoleculeRoute
                ? 'border-emerald-600 bg-emerald-50/40'
                : 'border-slate-200 bg-slate-50/60'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <span className="font-bold text-emerald-900">1. Chemical Synthesis</span>
                <span className="text-emerald-700 font-semibold">
                  {isSmallMoleculeRoute ? '● Selected Route' : 'Supported'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-950">
                Organic Synthesis &amp; Crystallisation
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Appropriate for small molecules (~300–650 Da) such as{' '}
                <strong>{intakeState.candidateName.split('(')[0].trim()}</strong> and{' '}
                <strong>{intakeState.knownBinderName.split('(')[0].trim()}</strong>. Evaluates
                synthetic steps, chiral centres, ring strain, and process-chemistry hazards.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 space-y-1">
              <div>
                <strong>Bioreactor status:</strong> Not applicable (no living cells or CHO kinetics
                used).
              </div>
              <button
                type="button"
                onClick={() => onNavigateToSection('dissertation_3d')}
                className="text-blue-700 hover:underline font-semibold cursor-pointer block"
              >
                Open Chemistry Critics →
              </button>
            </div>
          </div>

          {/* Route 2: Mammalian-Cell Biomanufacturing */}
          <div
            className={`p-4 border flex flex-col justify-between space-y-3 ${
              !isSmallMoleculeRoute
                ? 'border-blue-600 bg-blue-50/40'
                : 'border-slate-200 bg-slate-50/60'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <span className="font-bold text-blue-900">2. Mammalian Cell Culture</span>
                <span className="text-blue-700 font-semibold">
                  {!isSmallMoleculeRoute ? '● Selected Route' : 'Supported (CHO)'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-950">
                500 L CHO Bioreactor &amp; Perfusion
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Appropriate for complex glycosylated biologics (~145 kDa IgG antibodies such as{' '}
                <strong>{candidate.genericName}</strong>). Full quantitative physics implemented:
                oxygen transfer (<span className="font-mono">OTR vs OUR</span>), impeller shear,
                mixing time, hollow-fibre filtration &amp; Bayesian optimisation.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onChangePathwayMode('established_biologic');
                  onNavigateToSection('mass_balance');
                }}
                className="text-blue-700 hover:underline font-semibold cursor-pointer"
              >
                Open Animated 500 L Bioreactor →
              </button>
            </div>
          </div>

          {/* Route 3: Microbial Precision Fermentation */}
          <div className="p-4 border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <span className="font-bold text-slate-800">3. Microbial Fermentation</span>
                <span className="text-amber-800 font-semibold">Screening Supported</span>
              </div>
              <h3 className="text-sm font-bold text-slate-950">
                <em>E. coli</em> &amp; <em>K. phaffii</em> (Pichia)
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Appropriate for non-glycosylated antibody fragments (e.g., 28 kDa scFv or VHH
                nanobodies). Host compatibility screening is implemented; quantitative bioreactor
                optimisation is <strong>blocked until researcher wet-lab kinetics</strong> are
                uploaded.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600">
              <button
                type="button"
                onClick={() => {
                  onChangePathwayMode('novel_dissertation_protein');
                  onNavigateToSection('screening');
                }}
                className="text-blue-700 hover:underline font-semibold cursor-pointer"
              >
                Inspect Host Selection Gate →
              </button>
            </div>
          </div>

          {/* Route 4: Unsupported / Future Routes */}
          <div className="p-4 border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <span className="font-bold text-slate-600">4. Cell-Free / Viral / Continuous API</span>
                <span className="text-slate-600 font-semibold">Not Yet Supported</span>
              </div>
              <h3 className="text-sm font-bold text-slate-950">
                Explicit Scope Boundary
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Continuous flow chemistry reactors, cell-free protein synthesis, and viral vector
                packaging models are <strong>not yet supported</strong>. Rather than generating
                fabricated predictions, bioREACT abstains when a candidate requires an unimplemented
                route.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
              Honest scientific abstention enforced.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: "Compare Candidates" — Binding Score vs Manufacturability, Cost, Time & Pros/Cons */}
      <section
        id="step-compare-candidates"
        className="bg-white border border-slate-200 p-6 lg:p-8 space-y-6 shadow-xs"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-blue-700 font-bold">
              04. Compare Candidates · Why Docking Score Alone Is Not Enough
            </div>
            <h2 className="text-xl font-bold text-slate-950 mt-0.5">
              Compare Benefits, Synthesis Difficulty, Heuristic Cost, Time &amp; Evidence Gaps
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              A molecule with a stronger docking score might require 12–18 synthesis steps and
              difficult chiral separations, whereas a slightly milder binder can be made in 3 simple
              steps. Compare candidates side by side before choosing what to synthesise and test in
              the lab.
            </p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 text-xs text-amber-950 max-w-sm">
            <strong>Cost &amp; Time Transparency:</strong> Synthesis costs and lead times below are{' '}
            <em>heuristic order-of-magnitude estimates</em> based on step count and chiral
            complexity — not verified vendor quotes or validated process routes.
          </div>
        </div>

        {/* Side-by-Side Candidate Comparison Table */}
        <div className="overflow-x-auto border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold">
                <th className="p-3">Candidate &amp; Role</th>
                <th className="p-3">Predicted Binding (with Limitations)</th>
                <th className="p-3">Manufacturing Route &amp; Feasibility</th>
                <th className="p-3">Est. Steps &amp; Complexity</th>
                <th className="p-3">Heuristic Cost &amp; Time Estimate</th>
                <th className="p-3">Main Pros vs. Cons</th>
                <th className="p-3">Missing Evidence &amp; Next Validation Step</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 align-top">
              {/* Row 1: Known Starting Molecule */}
              <tr className="hover:bg-slate-50/80">
                <td className="p-3">
                  <div className="font-bold text-slate-950">
                    1. {intakeState.knownBinderName.split('(')[0].trim()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Known Starting Reference ({intakeState.targetProteinSymbol})
                  </div>
                </td>
                <td className="p-3 font-mono">
                  <div className="font-bold text-slate-900">
                    {intakeState.knownBinderAffinityKcalMol.toFixed(2)} kcal/mol
                  </div>
                  <div className="text-[11px] text-slate-600 font-sans mt-0.5">
                    Literature tool compound ({intakeState.knownBinderKdOrPotency}). Baseline pocket
                    fit.
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-semibold text-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Chemical Synthesis · {knownBinderCritics.overall_verdict.toUpperCase()}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Commercially available research reagent; moderate synthesis complexity.
                  </div>
                </td>
                <td className="p-3 font-mono">
                  <div>~{knownBinderCritics.process_chemistry.estimated_steps} steps</div>
                  <div className="text-[11px] text-slate-500">
                    {knownBinderCritics.synthesisability.stereocentres} chiral centre · SA{' '}
                    {knownBinderCritics.synthesisability.sa_score}
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-mono font-semibold text-slate-900">
                    ~$3k–$6k / 10 g · ~3–5 wks
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Heuristic lab-scale synthesis estimate (thioether + quinoline linker).
                  </div>
                </td>
                <td className="p-3 space-y-1">
                  <div className="text-emerald-800">
                    <strong>Pro:</strong> Established experimental positive control for{' '}
                    {intakeState.targetProteinSymbol} assays.
                  </div>
                  <div className="text-rose-800">
                    <strong>Con:</strong> Moderate potency (µM range) and flexible dithioacetal tail.
                  </div>
                </td>
                <td className="p-3 text-slate-700">
                  Use as positive control benchmark in wet-lab cellular efflux &amp; ATPase assays
                  alongside new leads.
                </td>
              </tr>

              {/* Row 2: Unbuildable Top Raw Docking Hit */}
              <tr className="bg-rose-50/30 hover:bg-rose-50/50">
                <td className="p-3">
                  <div className="font-bold text-slate-950">
                    2. Raw Docking Hit R1-C01
                  </div>
                  <div className="text-[11px] text-rose-700 font-semibold mt-0.5">
                    Unconstrained Docking Winner (Rejected)
                  </div>
                </td>
                <td className="p-3 font-mono">
                  <div className="font-bold text-emerald-700">−12.90 kcal/mol</div>
                  <div className="text-[11px] text-slate-600 font-sans mt-0.5">
                    Strongest simulated pocket score, but overfits pocket volume with strained rings;
                    zero experimental proof of pump inhibition.
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-semibold text-rose-700 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Chemical Synthesis · FAIL (Rejected)</span>
                  </div>
                  <div className="text-[11px] text-rose-800 mt-0.5">
                    Fails Ertl SA threshold (&gt;4.5) and stereocentre cap (&gt;2).
                  </div>
                </td>
                <td className="p-3 font-mono">
                  <div className="text-rose-800 font-bold">12–18 steps</div>
                  <div className="text-[11px] text-rose-700">
                    7 chiral centres · SA 6.42
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-mono font-semibold text-rose-900">
                    &gt;$20k–$40k / 10 g · ~10–14 wks
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Heuristic estimate: 128 stereoisomers require costly chiral HPLC separation &amp;
                    protecting-group steps.
                  </div>
                </td>
                <td className="p-3 space-y-1">
                  <div className="text-emerald-800">
                    <strong>Pro:</strong> Highest raw in-silico Vina score (−12.90 kcal/mol).
                  </div>
                  <div className="text-rose-800">
                    <strong>Con:</strong> Practically unbuildable at reasonable cost/time; high
                    failure risk in medicinal chemistry.
                  </div>
                </td>
                <td className="p-3 text-rose-900 font-medium">
                  <strong>Do not synthesise.</strong> Reject via chemistry critic and redesign
                  scaffold to remove chiral glycoside/bridged rings.
                </td>
              </tr>

              {/* Row 3: Practical Manufacturable Lead */}
              <tr className="bg-emerald-50/40 hover:bg-emerald-50/60">
                <td className="p-3">
                  <div className="font-bold text-slate-950">
                    3. {intakeState.candidateName}
                  </div>
                  <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                    Critic-Guided Practical Lead (Recommended)
                  </div>
                </td>
                <td className="p-3 font-mono">
                  <div className="font-bold text-emerald-700">
                    {intakeState.candidateAffinityKcalMol.toFixed(2)} kcal/mol
                  </div>
                  <div className="text-[11px] text-slate-600 font-sans mt-0.5">
                    Outperforms {intakeState.knownBinderName.split('(')[0].trim()} (
                    {intakeState.knownBinderAffinityKcalMol.toFixed(2)} kcal/mol). Predicted binding
                    only — functional inhibition still unmeasured.
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-semibold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Chemical Synthesis · {activeCandidateCritics.overall_verdict.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 mt-0.5">
                    Convergent achiral biaryl sulfonamide route; no bioreactor required.
                  </div>
                </td>
                <td className="p-3 font-mono">
                  <div className="text-emerald-800 font-bold">
                    {activeCandidateCritics.process_chemistry.estimated_steps} steps
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {activeCandidateCritics.synthesisability.stereocentres} chiral centres · SA{' '}
                    {activeCandidateCritics.synthesisability.sa_score}
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-mono font-semibold text-emerald-900">
                    ~$1.2k–$2.5k / 10 g · ~2–3 wks
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Heuristic estimate: commodity boronic acid + sulfonyl chloride building blocks,
                    direct crystallisation.
                  </div>
                </td>
                <td className="p-3 space-y-1">
                  <div className="text-emerald-800">
                    <strong>Pro:</strong> Strong predicted pocket interactions (LYS-332, ARG-1196)
                    with 0 chiral centres and 3-step synthesis.
                  </div>
                  <div className="text-amber-900">
                    <strong>Con:</strong> Slightly milder docking score than R1-C01; cellular
                    permeability and efflux inhibition not yet tested.
                  </div>
                </td>
                <td className="p-3 text-slate-800">
                  <strong>1.</strong> Synthesise 50 mg batch (3 steps) → <strong>2.</strong> Test{' '}
                  {intakeState.targetProteinSymbol} ATPase &amp; vesicular transport inhibition →{' '}
                  <strong>3.</strong> Measure intracellular drug retention in cells.
                </td>
              </tr>

              {/* Row 4: Separate Biologic Example (Trastuzumab / CHO) */}
              <tr className="hover:bg-blue-50/40">
                <td className="p-3">
                  <div className="font-bold text-slate-950">
                    4. {candidate.genericName} ({candidate.brandName})
                  </div>
                  <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
                    Separate Biologic Pathway Example (HER2 IgG1)
                  </div>
                </td>
                <td className="p-3 font-mono">
                  <div className="font-bold text-blue-800">K_D = 0.5 nM (Measured)</div>
                  <div className="text-[11px] text-slate-600 font-sans mt-0.5">
                    Extracellular HER2 domain IV antibody binding (not a small-molecule pocket
                    ligand).
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-semibold text-blue-800 flex items-center gap-1">
                    <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                    <span>Mammalian CHO Biomanufacturing</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    500 L Perfusion STR:{' '}
                    {physicsResult.isScaleUpFeasible
                      ? 'All physics constraints PASS'
                      : `Bottleneck detected (${[
                          physicsResult.otrMmolPerLHour < physicsResult.ourMmolPerLHour ? 'OTR < OUR' : null,
                          physicsResult.estimatedShearStressPa > 1.65 || physicsResult.kolmogorovScaleUm < 18.0
                            ? 'Impeller Shear / Eddy'
                            : null,
                          physicsResult.isMixingRateLimiting ? 'Mixing Time > 60 s' : null,
                          physicsResult.isHfHydraulicsViolated ? 'Filter Shear / ΔP' : null,
                          strParams.spargeRateVvm > 0.095 || strParams.spargeRateVvm < 0.018
                            ? 'Superficial Gas Flow'
                            : null,
                          physicsResult.isTopSubmergenceInsufficient ? 'Impeller Submergence' : null,
                        ]
                          .filter(Boolean)
                          .join(', ')})`}
                  </div>
                </td>
                <td className="p-3 font-mono">
                  <div>14-day Perfusion</div>
                  <div className="text-[11px] text-slate-500">
                    CHO-K1 + Protein A &amp; IEX chromatography
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-mono font-semibold text-blue-900">
                    ~${Math.round(downstreamCogsPerGramUsd)} / g DS · ~6–8 wks campaign
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Synthetic order-of-magnitude bioprocess COGS model at {strParams.workingVolumeL}{' '}
                    L scale.
                  </div>
                </td>
                <td className="p-3 space-y-1">
                  <div className="text-emerald-800">
                    <strong>Pro:</strong> High target specificity; full 500 L oxygen, shear, mixing
                    &amp; filter physics modelled.
                  </div>
                  <div className="text-rose-800">
                    <strong>Con:</strong> Requires living CHO cells, sterile bioreactor scale-up,
                    and cold-chain biologics purification.
                  </div>
                </td>
                <td className="p-3 text-slate-700">
                  Resolve 500 L oxygen transfer (<span className="font-mono">OTR ≥ OUR</span>) and
                  hollow-fibre lumen shear, then run ranked Bayesian Optimisation perfusion recipes.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 5: Unified Next Experiment Planner (Connects Both Small-Molecule Validation & Biologic Bioreactor Optimisation) */}
      <section
        id="step-next-experiments"
        className="bg-white border border-slate-200 p-6 lg:p-8 space-y-6 shadow-xs"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
              05. Unified Next Experiment Planner · What Should We Test Next?
            </div>
            <h2 className="text-xl font-bold text-slate-950 mt-0.5">
              Recommended Experimental Validation Plan for Your Selected Candidate
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Instead of stopping at a computational score, bioREACT formulates the concrete next
              experiments needed to close evidence gaps — whether that means wet-lab chemical
              synthesis and cellular pump-inhibition assays (for small molecules) or bioreactor
              operating conditions (for biologics).
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToSection('workflow_safety')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              Inspect Human Safety Checkpoints ({approvedGatesCount}/5 Approved) →
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 6 Cols: Small-Molecule Next Validation Experiments (Active for MRP1 / EGFR) */}
          <div className="lg:col-span-6 border border-slate-200 bg-slate-50/70 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <span className="font-bold text-emerald-900">
                  SMALL-MOLECULE VALIDATION PLAN ({intakeState.targetProteinSymbol})
                </span>
                <span className="text-slate-600">Chemical &amp; Cellular Assays</span>
              </div>

              <h3 className="text-base font-bold text-slate-950">
                Next Steps for {intakeState.candidateName}
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-white border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">
                    Experiment 1 · 3-Step Bench Synthesis &amp; Purity Verification
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Synthesise 50–100 mg of <strong>{intakeState.candidateName.split('(')[0].trim()}</strong>{' '}
                    via Suzuki-Miyaura biaryl coupling followed by sulfonamide condensation (est.{' '}
                    {activeCandidateCritics.process_chemistry.estimated_steps} steps,{' '}
                    {activeCandidateCritics.synthesisability.stereocentres} chiral centres). Confirm
                    identity and ≥95% purity by LC-MS and ¹H/¹³C NMR.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">
                    Experiment 2 · Direct Target Binding &amp; Vesicular Transport Assay
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Test whether the predicted{' '}
                    <span className="font-mono font-semibold">
                      {intakeState.candidateAffinityKcalMol.toFixed(2)} kcal/mol
                    </span>{' '}
                    docking score translates into real physical binding and transport inhibition in
                    inside-out membrane vesicles expressing human{' '}
                    <strong>{intakeState.targetProteinSymbol}</strong>, benchmarked head-to-head
                    against known binder <strong>{intakeState.knownBinderName.split('(')[0].trim()}</strong>.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">
                    Experiment 3 · Intracellular Drug Retention &amp; Cytotoxicity Assay
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Because docking cannot prove pump inhibition in living cells, measure whether
                    co-treatment increases intracellular drug accumulation (e.g. calcein-AM or
                    daunorubicin retention) without causing off-target toxicity in non-target cells.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onNavigateToSection('dissertation_3d')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-blue-700 cursor-pointer"
              >
                <span>Open Full Molecular Design &amp; Critics Module</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-500">
                Critics-before-docking saves 65% compute
              </span>
            </div>
          </div>

          {/* Right 6 Cols: Biologic Bioreactor Next Experiments (Active for Trastuzumab / Pembrolizumab) */}
          <div className="lg:col-span-6 border border-slate-200 bg-slate-50/70 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <span className="font-bold text-blue-900">
                  BIOLOGIC BIOMANUFACTURING PLAN ({candidate.genericName} · {strParams.workingVolumeL} L CHO)
                </span>
                <span className="text-slate-600">{recommendationSuite.decisionBadge}</span>
              </div>

              <h3 className="text-base font-bold text-slate-950">
                Ranked Next Bioreactor Operating Combinations (Bayesian Optimiser)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When manufacturing a recombinant biologic like <strong>{candidate.genericName}</strong>,
                bioREACT diagnoses 500 L physical bottlenecks (oxygen transfer, shear, mixing, and
                hollow-fibre filtration) and proposes ranked multi-parameter operating recipes:
              </p>

              {topNextRecipes.length > 0 && (
                <div className="space-y-2.5">
                  {topNextRecipes.map((rec: ProposedNextExperimentRecipe) => (
                    <div
                      key={rec.id}
                      className="bg-white border border-slate-200 p-3 flex flex-col justify-between gap-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
                        <span className="font-bold text-blue-900">
                          RANK #{rec.rank} · {rec.title}
                        </span>
                        <span className="text-emerald-800 font-semibold">
                          Feasibility Prob:{' '}
                          {(rec.probabilisticConstraints.jointFeasibilityProbability * 100).toFixed(
                            0
                          )}
                          %
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5">
                        Perfusion = {rec.operatingVector.perfusionRateVvd} VVD · DO ={' '}
                        {rec.operatingVector.doSetpointPercent}% · Agitation ={' '}
                        {rec.operatingVector.agitationRpm} RPM ({rec.operatingVector.impellerCount}{' '}
                        impellers) · Sparge = {rec.operatingVector.spargeRateVvm} vvm · O₂ ={' '}
                        {rec.operatingVector.inletO2Percent.toFixed(0)}%
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-600">
                        <span>
                          Predicted Productivity:{' '}
                          <strong className="text-slate-950">
                            {rec.predictions.volumetricProductivityMeanMgLDay.toFixed(1)} ±{' '}
                            {(1.96 * rec.predictions.volumetricProductivityTotalStdMgLDay).toFixed(
                              1
                            )}{' '}
                            mg/L/day
                          </strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onChangePathwayMode('established_biologic');
                            onNavigateToSection('optimiser');
                          }}
                          className="text-blue-700 hover:underline font-semibold cursor-pointer"
                        >
                          Inspect in Optimiser →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  onChangePathwayMode('established_biologic');
                  onNavigateToSection('mass_balance');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-700 text-white hover:bg-blue-800 cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Open Interactive 500 L Bioreactor Simulator</span>
              </button>
              {!physicsResult.isScaleUpFeasible && (
                <button
                  type="button"
                  onClick={onApplyMicrospargerFixAndInspect}
                  className="px-3 py-2 text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 cursor-pointer"
                >
                  Apply 500 L Oxygen Fix →
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Expandable Progressive Disclosure: "Scientific Details, Provenance & Scope Boundaries" */}
      <section className="bg-white border border-slate-200">
        <button
          type="button"
          onClick={() => setIsTechnicalDetailsOpen((prev) => !prev)}
          className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="space-y-0.5">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              Scientific Details &amp; Scope Transparency
            </div>
            <div className="text-sm font-bold text-slate-900">
              How the Docking Critics, Bioreactor Physics &amp; Cost Models Work — and What Is
              Simulated vs. Measured
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-300 shrink-0">
            <span>
              {isTechnicalDetailsOpen ? 'Hide Scientific Details' : 'Show Scientific Details'}
            </span>
            {isTechnicalDetailsOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {isTechnicalDetailsOpen && (
          <div className="px-6 pb-6 pt-2 border-t border-slate-200 space-y-6 text-xs text-slate-700 leading-relaxed">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-950">
                  1. Implemented &amp; Integrated Today
                </h3>
                <ul className="space-y-1.5 list-disc pl-4">
                  <li>
                    <strong>3D Molecular Pocket &amp; Chemistry Critics:</strong> Interactive
                    Three.js 3D pocket rendering, PDB coordinate parsing, Ertl synthetic
                    accessibility (<span className="font-mono">SA ≤ 4.5</span>), chiral centre count
                    (<span className="font-mono">≤ 2</span>), and process-chemistry step estimation.
                  </li>
                  <li>
                    <strong>Manufacturing Route Separation:</strong> Automatically distinguishes
                    synthetic small molecules (organic synthesis) from recombinant biologics
                    (mammalian or microbial fermentation) and refuses to apply CHO kinetics to small
                    molecules.
                  </li>
                  <li>
                    <strong>First-Principles 500 L Bioreactor Physics &amp; Constrained BO:</strong>{' '}
                    Live calculation of <span className="font-mono">OTR = kLa(C* − C_L)</span>,{' '}
                    <span className="font-mono">OUR = q_O2 · X_v</span>, 1–3 impeller power,
                    Kolmogorov shear, gassed mixing time, hollow-fibre lumen pressure drop &amp; wall
                    shear, and 8-seed Gaussian Process Expected Improvement.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-950">
                  2. Heuristic, Simulated or Future Extensions (Explicitly Distinguished)
                </h3>
                <ul className="space-y-1.5 list-disc pl-4">
                  <li>
                    <strong>Docking Scores vs. Biological Activity:</strong> Binding scores (kcal/mol)
                    are structural conformations in a static cryo-EM/crystal pocket. They do not
                    prove functional MRP1 efflux pump inhibition or intracellular drug accumulation.
                  </li>
                  <li>
                    <strong>Heuristic Synthesis &amp; Bioprocess Cost Estimates:</strong> Gram-scale
                    chemical synthesis costs/times and downstream $/g biologic COGS use transparent
                    order-of-magnitude heuristic equations for trade-off comparison, not verified
                    vendor quotes.
                  </li>
                  <li>
                    <strong>Future Extension (3D Antibody Developability → Bioreactor Shear):</strong>{' '}
                    Directly predicting CHO bioreactor shear sensitivity from 3D antibody surface
                    hydrophobicity patches is a future research direction and is not claimed as an
                    implemented calculation.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
