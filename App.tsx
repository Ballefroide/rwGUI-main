
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ActiveView, UnitData, ModInfoData, SectionMetadata } from './types';
import { MOD_SECTIONS, MULTI_SECTIONS, MOD_INFO_SECTION } from './constants';
import { GeminiService } from './services/geminiService';
// @ts-ignore
import JSZip from 'jszip';

const INITIAL_UNIT_STATE = (id: string, name: string): UnitData => ({
  id,
  filename: `${name.endsWith('.ini') ? name : name + '.ini'}`,
  core: { 
    name: name, 
    maxHp: 100, 
    mass: 100, 
    radius: 15, 
    isBio: false, 
    isBuilder: false 
  },
  graphics: { image: 'unit.png', total_frames: 1 },
  attack: { 
    canAttack: false, 
    canAttackFlyingUnits: false, 
    canAttackLandUnits: false, 
    canAttackUnderwaterUnits: false, 
    maxAttackRange: 150 
  },
  movement: { movementType: 'LAND', moveSpeed: 1.0 },
  ai: { 
    buildPriority: 0.1, 
    useAsBuilder: false, 
    useAsTransport: false 
  },
  turrets: [],
  projectiles: [],
  actions: [],
  animations: [],
  canBuilds: [],
  legs: [],
  attachments: [],
  effects: [],
  placementRules: [],
  resources: [],
  decals: []
});

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>(ActiveView.CORE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCodeMobile, setShowCodeMobile] = useState(false);
  const [codeViewMode, setCodeViewMode] = useState<'unit' | 'manifest'>('unit');

  // Project state
  const [modInfo, setModInfo] = useState<ModInfoData>({
    title: 'New Project',
    description: 'A Rusted Warfare Mod.',
    tags: 'units',
    minVersion: '1.15',
    id: 'com.user.mod',
    requiredMods: '',
    requiredModsMessage: ''
  });
  const [units, setUnits] = useState<UnitData[]>([INITIAL_UNIT_STATE('unit_0', 'Unit1')]);
  const [activeFileId, setActiveFileId] = useState<string>('unit_0');

  const activeUnitIndex = useMemo(() => {
    const idx = units.findIndex(u => u.id === activeFileId);
    return idx === -1 ? 0 : idx;
  }, [units, activeFileId]);

  const isEditingModInfo = activeFileId === 'mod_info';

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  // Sync code view mode when context changes manually
  useEffect(() => {
    if (isEditingModInfo) {
      setCodeViewMode('manifest');
    } else {
      setCodeViewMode('unit');
    }
  }, [isEditingModInfo]);

  const getModInfoIni = useCallback(() => {
    let output = `[mod]\n`;
    Object.entries(modInfo).forEach(([key, value]) => {
      if (value !== undefined && value !== '') output += `${key}: ${value}\n`;
    });
    return output;
  }, [modInfo]);

  const getIniForUnit = useCallback((unit: UnitData) => {
    let output = '# Made using rwGUI\n\n';
    
    // Core sections
    MOD_SECTIONS.forEach(section => {
      output += `[${section.id}]\n`;
      const data = unit[section.id] as any;
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== '') output += `${key}: ${value}\n`;
        });
      }
      output += '\n';
    });

    // Multi sections
    MULTI_SECTIONS.forEach(section => {
      const list = unit[section.id === 'canBuild' ? 'canBuilds' : section.id === 'placementRule' ? 'placementRules' : section.id + 's'] as any[];
      if (!list) return;
      list.forEach((item, index) => {
        const header = section.id === 'leg' ? `leg_${index + 1}` : section.id === 'attachment' ? `attachment_${item.id || index + 1}` : section.id === 'canBuild' ? `canBuild_${index + 1}` : `${section.id}_${item.id || index + 1}`;
        output += `[${header}]\n`;
        Object.entries(item).forEach(([key, value]) => {
          if (key === 'id') return;
          if (value !== undefined && value !== '') {
            if (key === 'Keyframes') output += `${value}\n`;
            else output += `${key}: ${value}\n`;
          }
        });
        output += '\n';
      });
    });

    return output;
  }, []);

  const generateIni = useCallback(() => {
    if (codeViewMode === 'manifest') return getModInfoIni();
    const currentUnit = units[activeUnitIndex];
    if (!currentUnit) return "";
    return getIniForUnit(currentUnit);
  }, [units, activeUnitIndex, codeViewMode, getModInfoIni, getIniForUnit]);

  const createNewProject = () => {
    if (confirm("Are you sure you want to reset and create a new project? All unsaved work will be lost.")) {
      const freshId = 'unit_0';
      setUnits([INITIAL_UNIT_STATE(freshId, 'Unit1')]);
      setActiveFileId(freshId);
      setActiveView(ActiveView.CORE);
      setModInfo({
        title: 'New Project',
        description: 'A Rusted Warfare Mod.',
        tags: 'units',
        minVersion: '1.15',
        id: 'com.user.mod',
        requiredMods: '',
        requiredModsMessage: ''
      });
    }
  };

  const updateField = (section: string, field: string, value: any) => {
    if (isEditingModInfo) {
      setModInfo(prev => ({ ...prev, [field]: value }));
      return;
    }

    setUnits(prev => {
      const newUnits = [...prev];
      const unit = { ...newUnits[activeUnitIndex] };
      unit[section] = { ...(unit[section] as any), [field]: value };
      newUnits[activeUnitIndex] = unit;
      return newUnits;
    });
  };

  const handleAiLogic = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    try {
      const gemini = new GeminiService();
      const result = await gemini.getLogicSuggestion(aiPrompt);
      setAiResult(result);
    } catch (error) {
      console.error(error);
      setAiResult("Error connecting to Gemini API.");
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateIni());
    alert("INI code copied to clipboard!");
  };

  const toggleView = (view: ActiveView) => {
    setActiveView(view);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const currentSection = useMemo(() => {
    if (isEditingModInfo) return MOD_INFO_SECTION;
    return [...MOD_SECTIONS, ...MULTI_SECTIONS].find(s => {
      if (s.id === activeView) return true;
      if (s.id === 'canBuild' && activeView === ActiveView.CAN_BUILD) return true;
      if (s.id === 'placementRule' && activeView === ActiveView.PLACEMENT_RULES) return true;
      return (s.id + 's') === activeView;
    });
  }, [activeView, isEditingModInfo]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Left) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-sky-400 flex items-center gap-2">
              <i className="fas fa-hammer"></i> rwGUI
            </h1>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">Mod Studio v1.16</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 p-2">
            <i className="fas fa-chevron-left"></i>
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-4 scrollbar-hide">
          <div className="mb-6">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Project</h2>
            <SidebarItem 
              active={isEditingModInfo} 
              onClick={() => { setActiveFileId('mod_info'); toggleView(ActiveView.MOD_INFO); }} 
              icon="fas fa-file-invoice" 
              label="Mod Manifest" 
            />
            {units.map((unit) => (
              <SidebarItem 
                key={unit.id}
                active={!isEditingModInfo && activeFileId === unit.id}
                onClick={() => { setActiveFileId(unit.id); if(isEditingModInfo) toggleView(ActiveView.CORE); }}
                icon="fas fa-robot"
                label="Unit Editor"
              />
            ))}
          </div>

          {!isEditingModInfo && (
            <>
              <div className="mb-6">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Base Config</h2>
                <SidebarItem active={activeView === ActiveView.CORE} onClick={() => toggleView(ActiveView.CORE)} icon="fas fa-microchip" label="Core" />
                <SidebarItem active={activeView === ActiveView.GRAPHICS} onClick={() => toggleView(ActiveView.GRAPHICS)} icon="fas fa-image" label="Graphics" />
                <SidebarItem active={activeView === ActiveView.ATTACK} onClick={() => toggleView(ActiveView.ATTACK)} icon="fas fa-crosshairs" label="Attack" />
                <SidebarItem active={activeView === ActiveView.MOVEMENT} onClick={() => toggleView(ActiveView.MOVEMENT)} icon="fas fa-truck" label="Movement" />
                <SidebarItem active={activeView === ActiveView.AI} onClick={() => toggleView(ActiveView.AI)} icon="fas fa-brain" label="AI Logic" />
              </div>

              <div className="mb-6">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Logistics</h2>
                <SidebarItem active={activeView === ActiveView.CAN_BUILD} onClick={() => toggleView(ActiveView.CAN_BUILD)} icon="fas fa-list-ul" label="Build Menu" />
                <SidebarItem active={activeView === ActiveView.ATTACHMENTS} onClick={() => toggleView(ActiveView.ATTACHMENTS)} icon="fas fa-link" label="Attachments" />
                <SidebarItem active={activeView === ActiveView.PLACEMENT_RULES} onClick={() => toggleView(ActiveView.PLACEMENT_RULES)} icon="fas fa-draw-polygon" label="Placement Rules" />
              </div>

              <div className="mb-6">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Cosmetics</h2>
                <SidebarItem active={activeView === ActiveView.TURRETS} onClick={() => toggleView(ActiveView.TURRETS)} icon="fas fa-shield-alt" label="Turrets" />
                <SidebarItem active={activeView === ActiveView.PROJECTILES} onClick={() => toggleView(ActiveView.PROJECTILES)} icon="fas fa-bolt" label="Projectiles" />
                <SidebarItem active={activeView === ActiveView.LEGS} onClick={() => toggleView(ActiveView.LEGS)} icon="fas fa-spider" label="Legs / Mechs" />
                <SidebarItem active={activeView === ActiveView.EFFECTS} onClick={() => toggleView(ActiveView.EFFECTS)} icon="fas fa-wand-magic-sparkles" label="Effects" />
                <SidebarItem active={activeView === ActiveView.DECALS} onClick={() => toggleView(ActiveView.DECALS)} icon="fas fa-paint-brush" label="Decals" />
              </div>

              <div>
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Logic & Data</h2>
                <SidebarItem active={activeView === ActiveView.ACTIONS} onClick={() => toggleView(ActiveView.ACTIONS)} icon="fas fa-magic" label="Actions" />
                <SidebarItem active={activeView === ActiveView.ANIMATIONS} onClick={() => toggleView(ActiveView.ANIMATIONS)} icon="fas fa-film" label="Animations" />
                <SidebarItem active={activeView === ActiveView.RESOURCES} onClick={() => toggleView(ActiveView.RESOURCES)} icon="fas fa-coins" label="Local Resources" />
              </div>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 flex flex-col gap-2 bg-slate-900/50">
          <button 
            onClick={() => setShowAiModal(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <i className="fas fa-sparkles"></i> AI Helper
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={copyToClipboard}
              className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-copy"></i> Copy
            </button>
            <button 
              onClick={createNewProject}
              className="bg-sky-600 hover:bg-sky-500 text-white p-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-file-plus"></i> Create New
            </button>
          </div>
        </div>
      </aside>

      {/* Editor Area */}
      <main className="flex-1 flex flex-col bg-slate-950 relative">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-slate-400 p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <i className="fas fa-bars text-lg"></i>
            </button>
            <div className="min-w-0">
              <h2 className="text-sm lg:text-lg font-bold truncate">
                {isEditingModInfo ? "Mod Information" : currentSection?.title}
              </h2>
              <p className="text-slate-500 text-[10px] lg:text-xs truncate">
                {isEditingModInfo ? "mod-info.txt configuration" : currentSection?.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowCodeMobile(!showCodeMobile)}
              className="lg:hidden bg-slate-800 p-2 rounded-lg text-sky-400 hover:bg-slate-700 transition-colors"
            >
              <i className={`fas ${showCodeMobile ? 'fa-edit' : 'fa-code'}`}></i>
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Form Scroll Area */}
          <div className={`
            flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar transition-opacity duration-200
            ${showCodeMobile ? 'hidden lg:block' : 'block'}
          `}>
            <div className="max-w-3xl mx-auto pb-20 lg:pb-0">
              {isEditingModInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                  {MOD_INFO_SECTION.fields.map(field => (
                    <FormField 
                      key={field.id} 
                      field={field} 
                      value={(modInfo as any)[field.id]} 
                      onChange={(val) => updateField('mod_info', field.id, val)}
                    />
                  ))}
                </div>
              ) : !currentSection?.isMulti ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                  {currentSection?.fields.map(field => (
                    <FormField 
                      key={field.id} 
                      field={field} 
                      value={(units[activeUnitIndex] as any)?.[activeView]?.[field.id]} 
                      onChange={(val) => updateField(activeView, field.id, val)}
                    />
                  ))}
                </div>
              ) : (
                <MultiSectionEditor 
                  section={currentSection} 
                  unitRadius={units[activeUnitIndex]?.core?.radius || 15}
                  data={(units[activeUnitIndex] as any)?.[activeView] || []} 
                  onChange={(val) => {
                    setUnits(prev => {
                      const newUnits = [...prev];
                      newUnits[activeUnitIndex] = { ...newUnits[activeUnitIndex], [activeView]: val };
                      return newUnits;
                    });
                  }}
                />
              )}
            </div>
          </div>

          {/* Code Viewer Pane (Always visible on desktop) */}
          <div className={`
            fixed inset-0 z-40 lg:relative lg:inset-auto lg:flex lg:w-96 xl:w-[400px] bg-slate-900 border-l border-slate-800 flex flex-col transition-transform duration-300
            ${showCodeMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}>
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center lg:sticky lg:top-0 z-10 backdrop-blur-md">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-file-code text-sky-500"></i> GENERATED INI
              </span>
              <div className="flex gap-1">
                <div className="flex gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                  <button 
                    onClick={() => { setCodeViewMode('unit'); if(isEditingModInfo) { setActiveFileId(units[0].id); toggleView(ActiveView.CORE); } }}
                    className={`px-3 py-1.5 rounded-md text-xs transition-all ${codeViewMode === 'unit' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    title="View unit.ini"
                  >
                    <i className="fas fa-code"></i>
                  </button>
                </div>
                <button 
                  onClick={() => setShowCodeMobile(false)}
                  className="lg:hidden text-slate-400 p-2 hover:bg-slate-800 rounded-lg"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            <pre className="flex-1 overflow-auto p-4 lg:p-6 text-[11px] code-font text-sky-200/90 selection:bg-sky-500/30 leading-relaxed scrollbar-hide">
              <code>{generateIni()}</code>
            </pre>
          </div>
        </div>
      </main>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowAiModal(false)} />
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <i className="fas fa-sparkles text-indigo-400"></i> Logic AI Helper
              </h3>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-white transition-colors p-2">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">Describe a condition (e.g. "Trigger when health is low and unit is in water") to generate <code>LogicBoolean</code> code.</p>
              <textarea 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none transition-all placeholder-slate-600"
                placeholder="Type your request here..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              {aiResult && (
                <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase mb-1 block">Suggested Code:</span>
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-indigo-200 text-sm code-font break-all">{aiResult}</code>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(aiResult); alert("Copied!"); }}
                      className="text-indigo-400 hover:text-indigo-300 p-2 shrink-0"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
              )}
              <button 
                disabled={aiLoading || !aiPrompt}
                onClick={handleAiLogic}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {aiLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                {aiLoading ? 'Synthesizing...' : 'Generate Logic'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- Sub-components --- */

const SidebarItem: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all mb-1 border ${active ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-lg shadow-sky-500/5' : 'text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'}`}
  >
    <i className={`${icon} w-5 text-center`}></i>
    <span className="font-semibold truncate">{label}</span>
  </button>
);

const FormField: React.FC<{ field: any; value: any; onChange: (v: any) => void }> = ({ field, value, onChange }) => {
  return (
    <div className="space-y-1.5 group">
      <div className="flex items-center justify-between px-1">
        <label className="text-[11px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wider">
          {field.label}
          <div className="relative group/tooltip">
             <i className="fas fa-info-circle text-slate-600 text-[10px] cursor-help"></i>
             <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-slate-800 text-xs rounded-xl shadow-2xl z-[100] opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity border border-slate-700 text-slate-300 scale-95 group-hover/tooltip:scale-100 origin-bottom-left">
               <p className="mb-2">{field.description}</p>
               <div className="pt-2 border-t border-slate-700">
                 <span className="text-slate-500 font-bold block mb-0.5 uppercase text-[9px]">Example</span>
                 <code className="text-sky-300 break-all">{field.example}</code>
               </div>
             </div>
          </div>
        </label>
      </div>

      {field.type === 'boolean' ? (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onChange(true)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${value === true ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/20' : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-750'}`}
          >
            True
          </button>
          <button 
            onClick={() => onChange(false)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${value === false || value === undefined ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/20' : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-750'}`}
          >
            False
          </button>
        </div>
      ) : field.type === 'enum' ? (
        <div className="relative">
          <select 
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none cursor-pointer transition-all"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs"></i>
        </div>
      ) : field.type === 'file' || field.type === 'sound' ? (
        <div className="flex gap-2 group/upload relative">
          <input 
            type="text"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-600 transition-all shadow-inner"
            placeholder={field.example}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
          <label className="cursor-pointer px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-600 whitespace-nowrap">
            <i className={`fas ${field.type === 'file' ? 'fa-folder-open' : 'fa-volume-up'}`}></i> Select
            <input 
              type="file" 
              className="hidden" 
              accept={field.type === 'file' ? "image/*" : "audio/*"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onChange(file.name);
              }}
            />
          </label>
          <div className="absolute left-0 bottom-full mb-2 w-full p-2.5 bg-slate-900 border border-slate-700 text-[10px] text-slate-300 rounded-lg opacity-0 group-hover/upload:opacity-100 pointer-events-none transition-all z-[60] shadow-2xl backdrop-blur-md transform translate-y-1 group-hover/upload:translate-y-0">
             <i className={`fas ${field.type === 'file' ? 'fa-shield-halved' : 'fa-music'} text-sky-400 mr-2`}></i>
             By selecting {field.type === 'file' ? 'images' : 'sounds'} in this editor, you are providing your own assets.
          </div>
        </div>
      ) : field.id === 'Keyframes' ? (
        <textarea 
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-600 transition-all shadow-inner h-24 code-font"
          placeholder={field.example}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input 
          type={field.type === 'number' ? 'number' : 'text'}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-600 transition-all shadow-inner"
          placeholder={field.example}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
};

/* VisualAnimationEditor component */
interface PartState {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

interface KeyframeData {
  time: number;
  parts: Record<string, Partial<PartState>>;
}

const VisualAnimationEditor: React.FC<{ initialValue: string; onSave: (val: string) => void }> = ({ initialValue, onSave }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [keyframes, setKeyframes] = useState<KeyframeData[]>([]);
  const [partsList, setPartsList] = useState<string[]>(['body', 'turret_1']);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (keyframes.length > 0) return;
    const kfs: KeyframeData[] = [{ time: 0, parts: {} }];
    const lines = initialValue.split('\n');
    lines.forEach(line => {
      const match = line.match(/^(\w+)_([\d.]+)s:\s*\{(.*)\}/);
      if (match) {
        const [, partId, timeStr, propsStr] = match;
        const time = parseFloat(timeStr);
        let kf = kfs.find(k => k.time === time);
        if (!kf) {
          kf = { time, parts: {} };
          kfs.push(kf);
        }
        const props: Partial<PartState> = {};
        propsStr.split(',').forEach(p => {
          const [key, val] = p.split(':').map(s => s.trim());
          if (key === 'x') props.x = parseFloat(val);
          if (key === 'y') props.y = parseFloat(val);
          if (key === 'rotation') props.rotation = parseFloat(val);
          if (key === 'scale') props.scale = parseFloat(val);
        });
        kf.parts[partId] = props;
        if (!partsList.includes(partId)) setPartsList(prev => [...prev, partId]);
      }
    });
    setKeyframes(kfs.sort((a, b) => a.time - b.time));
  }, [initialValue, keyframes.length, partsList]);

  const getPartTransform = (partId: string): { x: number; y: number; rotation: number; scale: number } => {
    const kf = keyframes.find(k => k.time === currentTime);
    const part = kf?.parts?.[partId];
    return {
      x: part?.x ?? 0,
      y: part?.y ?? 0,
      rotation: part?.rotation ?? 0,
      scale: part?.scale ?? 1,
    };
  };

  const updateCurrentPart = (updates: Partial<PartState>) => {
    if (!selectedPart) return;
    setKeyframes(prev => {
      const existingIdx = prev.findIndex(k => k.time === currentTime);
      const newKfs = [...prev];
      if (existingIdx === -1) {
        newKfs.push({ 
          time: currentTime, 
          parts: { [selectedPart]: updates } 
        });
      } else {
        newKfs[existingIdx] = {
          ...newKfs[existingIdx],
          parts: {
            ...newKfs[existingIdx].parts,
            [selectedPart]: { ...newKfs[existingIdx].parts[selectedPart], ...updates }
          }
        };
      }
      return newKfs.sort((a, b) => a.time - b.time);
    });
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!selectedPart || !workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = Math.round(e.clientX - rect.left - centerX);
    const y = Math.round(e.clientY - rect.top - centerY);
    updateCurrentPart({ x, y });
  };

  const saveToIni = () => {
    let code = '';
    keyframes.forEach(kf => {
      Object.entries(kf.parts).forEach(([partId, props]: [string, any]) => {
        const propStrings = [];
        if (props.x !== undefined) propStrings.push(`x: ${props.x}`);
        if (props.y !== undefined) propStrings.push(`y: ${props.y}`);
        if (props.rotation !== undefined) propStrings.push(`rotation: ${props.rotation}`);
        if (props.scale !== undefined) propStrings.push(`scale: ${props.scale}`);
        if (propStrings.length > 0) {
          code += `${partId}_${kf.time}s: {${propStrings.join(', ')}}\n`;
        }
      });
    });
    onSave(code.trim());
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col h-[500px] lg:h-[600px] shadow-2xl">
      <div className="p-3 bg-slate-800/50 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Visual Workspace</span>
          <div className="flex flex-wrap gap-1">
            {partsList.map(p => (
              <button 
                key={p}
                onClick={() => setSelectedPart(p)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${selectedPart === p ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
              >
                {p}
              </button>
            ))}
            <button onClick={() => {
              const name = prompt("Part name (e.g. body, turret_1, leg_2)");
              if (name) setPartsList(prev => [...prev, name]);
            }} className="w-6 h-6 rounded-md bg-slate-800 text-slate-500 hover:text-sky-400 text-xs flex items-center justify-center border border-slate-700">
              <i className="fas fa-plus"></i>
            </button>
          </div>
        </div>
        <button onClick={saveToIni} className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-sky-500/20">
          Apply to Code
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div 
          ref={workspaceRef}
          onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
          className="flex-1 relative bg-slate-950 overflow-hidden cursor-crosshair group"
          style={{ 
            backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)', 
            backgroundSize: '20px 20px' 
          }}
        >
          <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-800/50 pointer-events-none"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800/50 pointer-events-none"></div>
          
          {partsList.map(p => {
            const partTransform = getPartTransform(p);
            return (
              <div 
                key={p}
                onClick={(e) => { e.stopPropagation(); setSelectedPart(p); }}
                className={`absolute w-12 h-12 flex items-center justify-center transition-all duration-75 ${selectedPart === p ? 'z-20' : 'z-10 opacity-50'}`}
                style={{
                  left: `calc(50% + ${Number(partTransform.x) || 0}px - 24px)`,
                  top: `calc(50% + ${Number(partTransform.y) || 0}px - 24px)`,
                  transform: `rotate(${partTransform.rotation}deg) scale(${partTransform.scale})`,
                }}
              >
                <div className={`w-full h-full border-2 rounded-lg flex items-center justify-center ${selectedPart === p ? 'border-sky-500 bg-sky-500/20 shadow-lg shadow-sky-500/20' : 'border-slate-500 bg-slate-800/20'}`}>
                  <span className="text-[8px] font-black pointer-events-none uppercase">{p.charAt(0)}</span>
                </div>
                {selectedPart === p && (
                  <div className="absolute -top-7 whitespace-nowrap bg-sky-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-lg">
                    {p} ({partTransform.x}, {partTransform.y})
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="w-48 bg-slate-900 border-l border-slate-800 p-4 space-y-6 overflow-y-auto">
          <section>
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-4">Properties</label>
            {selectedPart ? (
              <div className="space-y-5">
                 <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-slate-400">Rotation</span>
                      <span className="text-[10px] text-sky-400 font-mono">{getPartTransform(selectedPart).rotation}°</span>
                    </div>
                    <input 
                      type="range" min="-180" max="180" 
                      value={getPartTransform(selectedPart).rotation} 
                      onChange={(e) => updateCurrentPart({ rotation: parseInt(e.target.value) })}
                      className="w-full accent-sky-500"
                    />
                 </div>
                 <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-slate-400">Scale</span>
                      <span className="text-[10px] text-sky-400 font-mono">x{getPartTransform(selectedPart).scale.toFixed(1)}</span>
                    </div>
                    <input 
                      type="range" min="0.1" max="3.0" step="0.1"
                      value={getPartTransform(selectedPart).scale} 
                      onChange={(e) => updateCurrentPart({ scale: parseFloat(e.target.value) })}
                      className="w-full accent-sky-500"
                    />
                 </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-600 italic">Select a part to edit properties</p>
            )}
          </section>
          
          <section className="pt-4 border-t border-slate-800">
             <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-4">Timeline Control</label>
             <button 
               onClick={() => {
                 const time = parseFloat(prompt("New time point (e.g. 0.5)") || "");
                 if (!isNaN(time)) setCurrentTime(time);
               }}
               className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-[9px] font-bold border border-slate-700 transition-colors"
             >
               New Time Point
             </button>
          </section>
        </div>
      </div>

      <div className="p-4 bg-slate-800/80 backdrop-blur-sm border-t border-slate-700">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-sky-400 w-10 text-right">{currentTime.toFixed(1)}s</span>
          <div className="flex-1 h-8 flex items-center relative px-2">
            <div className="absolute inset-0 top-1/2 h-0.5 bg-slate-700/50 -translate-y-1/2"></div>
            {keyframes.map(kf => (
              <button 
                key={kf.time}
                onClick={() => setCurrentTime(kf.time)}
                className={`absolute w-3 h-3 rounded-full border-2 transition-all -translate-x-1/2 ${currentTime === kf.time ? 'bg-sky-500 border-white scale-125 z-10 shadow-[0_0_10px_rgba(14,165,233,0.5)]' : 'bg-slate-900 border-slate-600 hover:border-slate-400'}`}
                style={{ left: `${(kf.time / 2) * 100}%` }}
              />
            ))}
            <input 
              type="range" min="0" max="2" step="0.1" 
              value={currentTime} 
              onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-full z-20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* Unified Visual Layout Editor for Turrets, Legs, and Decals */
const VisualLayoutEditor: React.FC<{ 
  sectionId: string;
  items: any[]; 
  unitRadius: number;
  onSave: (val: any[]) => void;
  onClose: () => void;
}> = ({ sectionId, items, unitRadius, onSave, onClose }) => {
  const [data, setData] = useState<any[]>(items);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(data.length > 0 ? 0 : null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const getLabel = (item: any, idx: number) => {
    if (sectionId === 'turret') return item.id || `T${idx+1}`;
    if (sectionId === 'leg') return `Leg ${idx+1}`;
    if (sectionId === 'decal') return `Decal ${idx+1}`;
    return `#${idx+1}`;
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (selectedIdx === null || !workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = Math.round(e.clientX - rect.left - centerX);
    const mouseY = Math.round(centerY - (e.clientY - rect.top)); // INI Y is up-positive
    
    const newData = [...data];
    const item = { ...newData[selectedIdx] };

    if (sectionId === 'decal') {
      item.xOffsetRelative = mouseX;
      item.yOffsetRelative = mouseY;
    } else {
      item.x = mouseX;
      item.y = mouseY;
    }
    
    newData[selectedIdx] = item;
    setData(newData);
  };

  const updateProp = (idx: number, prop: string, val: any) => {
    const newData = [...data];
    newData[idx] = { ...newData[idx], [prop]: val };
    setData(newData);
  };

  const currentItem = selectedIdx !== null ? data[selectedIdx] : null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col h-[500px] lg:h-[600px] shadow-2xl animate-in zoom-in duration-200">
      <div className="p-3 bg-slate-800/50 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Unit Layout: {sectionId}s</span>
           <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none scrollbar-hide">
              {data.map((t, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all ${selectedIdx === idx ? 'bg-sky-500 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                >
                  {getLabel(t, idx)}
                </button>
              ))}
           </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-[10px] font-bold transition-all">
            Cancel
          </button>
          <button onClick={() => onSave(data)} className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-sky-500/20">
            Apply Placement
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div 
          ref={workspaceRef}
          onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
          className="flex-1 relative bg-slate-950 overflow-hidden cursor-crosshair group"
          style={{ 
            backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)', 
            backgroundSize: '20px 20px' 
          }}
        >
          {/* Unit Body Proxy */}
          <div 
            className="absolute top-1/2 left-1/2 border-2 border-slate-800 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 bg-slate-900/20 flex items-center justify-center"
            style={{ width: unitRadius * 4, height: unitRadius * 4 }}
          >
            <span className="text-[10px] font-black text-slate-800 uppercase">Unit Radius</span>
          </div>
          
          <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-800/50 pointer-events-none"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800/50 pointer-events-none"></div>
          
          {data.map((item, idx) => {
             const xVal = sectionId === 'decal' ? (item.xOffsetRelative || 0) : (item.x || 0);
             const yVal = sectionId === 'decal' ? (item.yOffsetRelative || 0) : (item.y || 0);
             const xNum = Number(xVal);
             const yNum = Number(yVal);
             
             return (
              <div 
                key={idx}
                onClick={(e) => { e.stopPropagation(); setSelectedIdx(idx); }}
                className={`absolute w-10 h-10 flex items-center justify-center transition-all ${selectedIdx === idx ? 'z-20 scale-110' : 'z-10 opacity-50'}`}
                style={{
                  left: `calc(50% + ${xNum}px - 20px)`,
                  top: `calc(50% - ${yNum}px - 20px)`,
                  transform: sectionId === 'turret' ? `rotate(${item.idleDir || 0}deg)` : '',
                }}
              >
                <div className={`w-full h-full border-2 rounded-lg flex flex-col items-center justify-center ${selectedIdx === idx ? 'border-sky-500 bg-sky-500/20 shadow-lg shadow-sky-500/20' : 'border-slate-500 bg-slate-800/20'}`}>
                  <span className="text-[9px] font-black pointer-events-none uppercase">
                    {sectionId.charAt(0)}
                  </span>
                  {sectionId === 'turret' && <div className="w-1 h-3 bg-sky-400 rounded-full mt-1"></div>}
                </div>
                {selectedIdx === idx && (
                  <div className="absolute -top-7 whitespace-nowrap bg-sky-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-lg">
                    {getLabel(item, idx)} ({xNum}, {yNum})
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="w-48 bg-slate-900 border-l border-slate-800 p-4 space-y-6 overflow-y-auto">
          <section>
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-4">Instance Specs</label>
            {currentItem ? (
              <div className="space-y-5">
                 {sectionId === 'turret' && (
                   <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-slate-400">Idle Dir</span>
                        <span className="text-[10px] text-sky-400 font-mono">{(currentItem.idleDir || 0)}°</span>
                      </div>
                      <input 
                        type="range" min="0" max="360" 
                        value={currentItem.idleDir || 0} 
                        onChange={(e) => updateProp(selectedIdx!, 'idleDir', parseInt(e.target.value))}
                        className="w-full accent-sky-500"
                      />
                   </div>
                 )}
                 {sectionId === 'leg' && (
                   <div className="space-y-4">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block mb-1">Joint X</span>
                        <input 
                          type="number" 
                          value={currentItem.attach_x || 0} 
                          onChange={(e) => updateProp(selectedIdx!, 'attach_x', parseFloat(e.target.value))}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block mb-1">Joint Y</span>
                        <input 
                          type="number" 
                          value={currentItem.attach_y || 0} 
                          onChange={(e) => updateProp(selectedIdx!, 'attach_y', parseFloat(e.target.value))}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white outline-none"
                        />
                      </div>
                   </div>
                 )}
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block mb-1">X Pos</span>
                      <input 
                        type="text" 
                        value={sectionId === 'decal' ? (currentItem.xOffsetRelative || 0) : (currentItem.x || 0)} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '-' || /^-?\d*$/.test(val)) {
                             updateProp(selectedIdx!, sectionId === 'decal' ? 'xOffsetRelative' : 'x', val);
                          }
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block mb-1">Y Pos</span>
                      <input 
                        type="text" 
                        value={sectionId === 'decal' ? (currentItem.yOffsetRelative || 0) : (currentItem.y || 0)} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '-' || /^-?\d*$/.test(val)) {
                            updateProp(selectedIdx!, sectionId === 'decal' ? 'yOffsetRelative' : 'y', val);
                          }
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white outline-none"
                      />
                    </div>
                 </div>
                 <p className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-slate-800">
                    <i className="fas fa-info-circle mr-1"></i>
                    Drag in the workspace to reposition the {sectionId}.
                 </p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-600 italic">Select an item to edit</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

/* Visual Preview for Projectiles and Effects */
const VisualPreviewEditor: React.FC<{
  sectionId: string;
  items: any[];
  onSave: (val: any[]) => void;
  onClose: () => void;
}> = ({ sectionId, items, onSave, onClose }) => {
  const [data, setData] = useState<any[]>(items);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(data.length > 0 ? 0 : null);
  const [isSimulating, setIsSimulating] = useState(true);
  
  const currentItem = selectedIdx !== null ? data[selectedIdx] : null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col h-[500px] lg:h-[600px] shadow-2xl animate-in zoom-in duration-200">
      <div className="p-3 bg-slate-800/50 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Unit Preview: {sectionId}s</span>
           <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none scrollbar-hide">
              {data.map((t, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all ${selectedIdx === idx ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                >
                  {t.id || `#${idx+1}`}
                </button>
              ))}
           </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-[10px] font-bold transition-all">
            Close Preview
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center">
           {currentItem ? (
             <div className="relative group">
                {/* Movement Vector Preview */}
                <div className="absolute inset-0 flex items-center justify-center">
                   <div 
                     className="w-1 bg-sky-500/40 rounded-full origin-center"
                     style={{ 
                       height: Math.sqrt(Math.pow(Number(currentItem.xSpeedRelative || 0), 2) + Math.pow(Number(currentItem.ySpeedRelative || 0), 2)) * 10,
                       transform: `rotate(${Math.atan2(Number(currentItem.xSpeedRelative || 0), Number(currentItem.ySpeedRelative || 0))}rad)`
                     }}
                   ></div>
                </div>
                <div 
                  className={`w-16 h-16 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center bg-slate-900/50 relative z-10 ${isSimulating ? 'animate-pulse' : ''}`}
                  style={{
                    transform: `scale(${currentItem.scaleFrom || 1})`,
                    borderColor: currentItem.color || '#3b82f6'
                  }}
                >
                  <i className={`fas ${sectionId === 'projectile' ? 'fa-bolt' : 'fa-sparkles'} text-2xl text-slate-600`}></i>
                  <span className="absolute bottom-1 right-1 text-[8px] font-mono text-slate-500">{currentItem.image || 'no-sprite'}</span>
                </div>
                {sectionId === 'effect' && (
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-slate-500 italic">
                    Simulation active: Velocity preview
                  </div>
                )}
             </div>
           ) : (
             <p className="text-slate-600">Select an item to preview</p>
           )}
        </div>

        <div className="w-48 bg-slate-900 border-l border-slate-800 p-4 space-y-6 overflow-y-auto">
           <section>
             <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-4">Properties</label>
             {currentItem ? (
               <div className="space-y-4">
                  {sectionId === 'projectile' ? (
                    <>
                      <div>
                        <span className="text-[10px] text-slate-400">Direct Damage</span>
                        <input 
                          type="number" 
                          value={currentItem.directDamage || 0} 
                          onChange={(e) => {
                            const newData = [...data];
                            newData[selectedIdx!] = { ...newData[selectedIdx!], directDamage: parseFloat(e.target.value) };
                            setData(newData);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Speed</span>
                        <input 
                          type="number" 
                          step="0.1"
                          value={currentItem.speed || 0} 
                          onChange={(e) => {
                            const newData = [...data];
                            newData[selectedIdx!] = { ...newData[selectedIdx!], speed: parseFloat(e.target.value) };
                            setData(newData);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-[10px] text-slate-400">Life (Ticks)</span>
                        <input 
                          type="number" 
                          value={currentItem.life || 0} 
                          onChange={(e) => {
                            const newData = [...data];
                            newData[selectedIdx!] = { ...newData[selectedIdx!], life: parseFloat(e.target.value) };
                            setData(newData);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase">VX</span>
                          <input type="number" step="0.1" value={currentItem.xSpeedRelative || 0} onChange={(e) => {
                             const newData = [...data];
                             newData[selectedIdx!] = { ...newData[selectedIdx!], xSpeedRelative: parseFloat(e.target.value) };
                             setData(newData);
                          }} className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-[10px] text-white" />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase">VY</span>
                          <input type="number" step="0.1" value={currentItem.ySpeedRelative || 0} onChange={(e) => {
                             const newData = [...data];
                             newData[selectedIdx!] = { ...newData[selectedIdx!], ySpeedRelative: parseFloat(e.target.value) };
                             setData(newData);
                          }} className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-[10px] text-white" />
                        </div>
                      </div>
                    </>
                  )}
               </div>
             ) : (
               <p className="text-[10px] text-slate-600 italic">Select to edit</p>
             )}
           </section>
        </div>
      </div>
    </div>
  );
};

const MultiSectionEditor: React.FC<{ section: any; data: any[]; unitRadius: number; onChange: (v: any[]) => void }> = ({ section, data, unitRadius, onChange }) => {
  const [editingVisual, setEditingVisual] = useState<number | null>(null);
  const [visualMode, setVisualMode] = useState(false);

  const addItem = () => {
    const newId = `new_${section.id}_${data.length + 1}`;
    const newItem: any = { id: newId };
    section.fields.forEach((f: any) => {
      if (f.type === 'boolean') {
        newItem[f.id] = false;
      }
    });
    onChange([...data, newItem]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  };

  const removeItem = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  // Sections that support visual layout or preview
  const supportedVisuals = ['turret', 'leg', 'decal', 'projectile', 'effect'];
  const isLayoutMode = ['turret', 'leg', 'decal'].includes(section.id);
  const isPreviewMode = ['projectile', 'effect'].includes(section.id);

  return (
    <div className="space-y-6">
      {/* Section Level Actions */}
      {supportedVisuals.includes(section.id) && (
        <div className="flex justify-between items-center bg-slate-900/50 border border-slate-800 p-4 rounded-2xl shadow-lg">
           <div>
              <h3 className="text-xs font-bold text-slate-300">
                {section.title} {isLayoutMode ? 'Layout' : 'Preview'}
              </h3>
              <p className="text-[10px] text-slate-500">
                {isLayoutMode ? 'Visual placement tool' : 'Real-time component preview'}
              </p>
           </div>
           <button 
             onClick={() => setVisualMode(!visualMode)}
             className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${visualMode ? 'bg-sky-500 border-sky-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-sky-400'}`}
           >
             <i className={`fas ${isLayoutMode ? 'fa-magic' : 'fa-eye'} mr-2`}></i>
             {visualMode ? `Close ${isLayoutMode ? 'Layout' : 'Preview'}` : `Visual ${isLayoutMode ? 'Layout' : 'Preview'}`}
           </button>
        </div>
      )}

      {visualMode && isLayoutMode ? (
        <VisualLayoutEditor 
          sectionId={section.id}
          items={data} 
          unitRadius={unitRadius}
          onClose={() => setVisualMode(false)}
          onSave={(val) => {
            onChange(val);
            setVisualMode(false);
          }}
        />
      ) : visualMode && isPreviewMode ? (
        <VisualPreviewEditor 
          sectionId={section.id}
          items={data}
          onClose={() => setVisualMode(false)}
          onSave={(val) => {
            onChange(val);
            setVisualMode(false);
          }}
        />
      ) : (
        <>
          {data.map((item, idx) => (
            <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl relative animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Instance #{idx + 1}</span>
                   {section.id === 'animation' && (
                     <button 
                       onClick={() => setEditingVisual(editingVisual === idx ? null : idx)}
                       className={`px-3 py-1 rounded-full text-[9px] font-bold border transition-all ${editingVisual === idx ? 'bg-sky-500 border-sky-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-sky-400'}`}
                     >
                       {editingVisual === idx ? <><i className="fas fa-edit mr-1"></i> Form View</> : <><i className="fas fa-magic mr-1"></i> Visual Editor</>}
                     </button>
                   )}
                </div>
                <button 
                  onClick={() => removeItem(idx)}
                  className="w-8 h-8 bg-slate-800 hover:bg-red-600 rounded-full text-slate-400 hover:text-white transition-all flex items-center justify-center border border-slate-700"
                >
                  <i className="fas fa-trash-alt text-xs"></i>
                </button>
              </div>
              
              <div className="space-y-6">
                {editingVisual === idx && section.id === 'animation' ? (
                  <VisualAnimationEditor 
                    initialValue={item.Keyframes || ''} 
                    onSave={(val) => {
                      updateItem(idx, 'Keyframes', val);
                      setEditingVisual(null);
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    {section.fields.map((field: any) => (
                      <FormField 
                        key={field.id} 
                        field={field} 
                        value={item[field.id]} 
                        onChange={(val) => updateItem(idx, field.id, val)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <button 
            onClick={addItem}
            className="w-full py-6 border-2 border-dashed border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/5 text-slate-500 hover:text-sky-400 rounded-2xl transition-all font-bold flex items-center justify-center gap-3 group"
          >
            <div className="w-8 h-8 bg-slate-800 group-hover:bg-sky-500/20 rounded-full flex items-center justify-center transition-colors">
              <i className="fas fa-plus"></i>
            </div>
            Add New {section.title}
          </button>
        </>
      )}
    </div>
  );
};

export default App;
