import React, { useState, useEffect } from 'react';
import { ArrowRight, ZoomIn, ZoomOut, RotateCcw, Layout, Type, Palette, Bold, Italic, MessageSquare } from 'lucide-react';
import { ComicProject, EditorPanelState, DialogueLine, BubbleStyle } from '../types';

interface Step4Props {
  project: ComicProject;
  setProject: React.Dispatch<React.SetStateAction<ComicProject>>;
  onNext: () => void;
}

// Simple layout templates
const LAYOUTS = [
  { id: 'grid-2x2', name: '2x2 Grid', class: 'grid-cols-2 grid-rows-2', slots: 4 },
  { id: 'top-focus', name: 'Top Focus', class: 'grid-cols-2 grid-rows-2 [&>*:first-child]:col-span-2', slots: 3 },
  { id: 'side-focus', name: 'Side Focus', class: 'grid-cols-2 grid-rows-2 [&>*:first-child]:row-span-2', slots: 3 },
  { id: 'cinematic', name: 'Cinematic', class: 'grid-cols-1 grid-rows-3', slots: 3 },
];

const DEFAULT_BUBBLE_STYLE: BubbleStyle = {
  backgroundColor: '#ffffff',
  textColor: '#000000',
  fontSize: 12,
  scale: 1,
  fontFamily: 'Comic Neue',
  fontWeight: 'normal',
  fontStyle: 'normal',
  tailRotation: 135
};

const FONT_FAMILIES = [
  { name: 'Comic', value: 'Comic Neue' },
  { name: 'Inter', value: 'Inter' },
  { name: 'Serif', value: 'serif' },
  { name: 'Mono', value: 'monospace' },
];

export const Step4Editor: React.FC<Step4Props> = ({ project, setProject, onNext }) => {
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[0]);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);

  // Initialize panel states if missing
  useEffect(() => {
    const activePage = project.pages[activePageIdx];
    const scenesForPage = activePage.scenes.slice(0, selectedLayout.slots);
    
    const currentPanelStates = project.panelsState || {};
    let hasChanges = false;
    
    const newStates = { ...currentPanelStates };
    
    scenesForPage.forEach(scene => {
        if (!newStates[scene.id]) {
            newStates[scene.id] = {
                sceneId: scene.id,
                zoom: 1,
                panX: 0,
                panY: 0,
                rotation: 0,
                dialogueBubbles: []
            };
            hasChanges = true;
        }
    });

    if (hasChanges) {
        setProject(prev => ({ ...prev, panelsState: newStates }));
    }
  }, [activePageIdx, selectedLayout, project.pages, project.panelsState, setProject]);

  const getPanelState = (sceneId: string): EditorPanelState => {
    return (project.panelsState && project.panelsState[sceneId]) || {
        sceneId, zoom: 1, panX: 0, panY: 0, rotation: 0, dialogueBubbles: []
    };
  };

  const updatePanelState = (sceneId: string, updates: Partial<EditorPanelState>) => {
    setProject(prev => ({
        ...prev,
        panelsState: {
            ...(prev.panelsState || {}),
            [sceneId]: { ...getPanelState(sceneId), ...updates }
        }
    }));
  };

  const getActiveBubble = () => {
    if (!activePanelId || !selectedBubbleId) return null;
    return getPanelState(activePanelId).dialogueBubbles.find(b => b.id === selectedBubbleId);
  };

  const updateBubbleStyle = (updates: Partial<BubbleStyle>) => {
    if (!activePanelId || !selectedBubbleId) return;
    
    const currentState = getPanelState(activePanelId);
    const newBubbles = currentState.dialogueBubbles.map(b => {
        if (b.id === selectedBubbleId) {
            return { ...b, style: { ...(b.style || DEFAULT_BUBBLE_STYLE), ...updates } };
        }
        return b;
    });
    
    updatePanelState(activePanelId, { dialogueBubbles: newBubbles });
  };

  const handleDragStart = (e: React.DragEvent, dialogue: DialogueLine, sourceSceneId: string) => {
    e.dataTransfer.setData('dialogue', JSON.stringify(dialogue));
    e.dataTransfer.setData('sourceSceneId', sourceSceneId);
  };

  const handleDrop = (e: React.DragEvent, targetSceneId: string) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('dialogue');
    const sourceSceneId = e.dataTransfer.getData('sourceSceneId');
    if (!data) return;

    if (sourceSceneId !== targetSceneId) {
        alert("Keep dialogue in its own panel for context!");
        return;
    }

    const dialogue = JSON.parse(data) as DialogueLine;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; // Percentage
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const currentState = getPanelState(targetSceneId);
    
    // Check if already placed
    const exists = currentState.dialogueBubbles.find(d => d.id === dialogue.id);
    let newBubbles;
    
    const bubbleStyle = exists?.style || dialogue.style || DEFAULT_BUBBLE_STYLE;

    if (exists) {
        newBubbles = currentState.dialogueBubbles.map(d => d.id === dialogue.id ? { ...d, x, y } : d);
    } else {
        newBubbles = [...currentState.dialogueBubbles, { ...dialogue, x, y, style: bubbleStyle }];
    }

    updatePanelState(targetSceneId, { dialogueBubbles: newBubbles });
    setActivePanelId(targetSceneId);
    setSelectedBubbleId(dialogue.id);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const activePage = project.pages[activePageIdx];
  const activeScenes = activePage.scenes.slice(0, selectedLayout.slots);
  const activeBubble = getActiveBubble();

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* LEFT: Sidebar (Dialogue & Layouts) */}
      <div className="w-72 flex flex-col gap-4">
         {/* Layout Selector */}
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Layout className="w-4 h-4" /> Templates</h3>
            <div className="grid grid-cols-2 gap-2">
                {LAYOUTS.map(l => (
                    <button
                        key={l.id}
                        onClick={() => setSelectedLayout(l)}
                        className={`text-xs p-2 border rounded hover:bg-indigo-50 transition ${selectedLayout.id === l.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200'}`}
                    >
                        {l.name}
                    </button>
                ))}
            </div>
         </div>

         {/* Dialogue Source */}
         <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200 overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Type className="w-4 h-4" /> Dialogue Pool</h3>
            <p className="text-xs text-gray-400 mb-4">Drag bubbles onto the matching panel.</p>
            
            {activeScenes.map((scene, idx) => (
                <div key={scene.id} className="mb-6">
                    <div className="text-xs font-bold text-gray-500 mb-2 uppercase">Panel {idx + 1}</div>
                    <div className="space-y-2">
                        {scene.dialogue.map(d => {
                             const isPlaced = getPanelState(scene.id).dialogueBubbles.some(placed => placed.id === d.id);
                             return (
                                <div
                                    key={d.id}
                                    draggable={!isPlaced}
                                    onDragStart={(e) => handleDragStart(e, d, scene.id)}
                                    className={`p-2 rounded border text-sm cursor-grab active:cursor-grabbing ${
                                        isPlaced 
                                        ? 'bg-gray-100 text-gray-400 border-gray-200 decoration-line-through' 
                                        : 'bg-indigo-50 border-indigo-200 hover:shadow-md'
                                    }`}
                                >
                                    <span className="font-bold text-indigo-800">{d.character}:</span> {d.line}
                                </div>
                             );
                        })}
                    </div>
                </div>
            ))}
         </div>
      </div>

      {/* CENTER: Canvas */}
      <div className="flex-1 bg-gray-100 rounded-xl border border-gray-300 shadow-inner p-8 flex items-center justify-center overflow-auto relative">
         <div 
            className={`bg-white shadow-2xl w-full max-w-[600px] aspect-[2/3] grid gap-2 p-2 ${selectedLayout.class}`}
         >
            {activeScenes.map((scene) => {
                const state = getPanelState(scene.id);
                const isActive = activePanelId === scene.id;
                return (
                    <div 
                        key={scene.id}
                        onDrop={(e) => handleDrop(e, scene.id)}
                        onDragOver={handleDragOver}
                        onClick={() => { setActivePanelId(scene.id); setSelectedBubbleId(null); }}
                        className={`relative overflow-hidden border-2 bg-gray-50 group ${isActive ? 'border-indigo-500 z-10 ring-2 ring-indigo-200' : 'border-black'}`}
                    >
                        {/* Image Layer */}
                        <div 
                            className="w-full h-full relative"
                            style={{
                                transform: `scale(${state.zoom}) translate(${state.panX}px, ${state.panY}px) rotate(${state.rotation}deg)`,
                                transformOrigin: 'center center',
                                transition: 'transform 0.1s ease-out'
                            }}
                        >
                            {scene.imageUrl ? (
                                <img src={scene.imageUrl} alt="scene" className="w-full h-full object-cover pointer-events-none select-none" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                            )}
                        </div>

                        {/* Dialogue Overlay Layer */}
                        {state.dialogueBubbles.map(d => {
                            const style = d.style || DEFAULT_BUBBLE_STYLE;
                            const isSelected = selectedBubbleId === d.id;
                            
                            return (
                                <div
                                    key={d.id}
                                    onClick={(e) => { e.stopPropagation(); setSelectedBubbleId(d.id); setActivePanelId(scene.id); }}
                                    className={`absolute rounded-[50%] px-4 py-3 text-center leading-tight shadow-md cursor-move min-w-[80px] transition-all
                                        ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 z-50' : 'z-20'}
                                    `}
                                    style={{
                                        left: `${d.x}%`,
                                        top: `${d.y}%`,
                                        transform: `translate(-50%, -50%) scale(${style.scale})`,
                                        maxWidth: '70%',
                                        backgroundColor: style.backgroundColor,
                                        color: style.textColor,
                                        fontFamily: style.fontFamily,
                                        fontSize: `${style.fontSize}px`,
                                        fontWeight: style.fontWeight,
                                        fontStyle: style.fontStyle,
                                        border: `2px solid ${style.textColor}`
                                    }}
                                >
                                    {/* Tail */}
                                    <div 
                                        className="absolute top-1/2 left-1/2 w-0 h-0 pointer-events-none"
                                        style={{ transform: `rotate(${style.tailRotation}deg)` }}
                                    >
                                        <div 
                                            className="absolute top-[100%] left-[-8px] w-0 h-0"
                                            style={{
                                                top: 'calc(50% + 10px)', // Push out from center
                                                borderLeft: '8px solid transparent',
                                                borderRight: '8px solid transparent',
                                                borderTop: `16px solid ${style.textColor}`,
                                                transform: 'translateY(100%)' // Just a visual representation, simplified for CSS
                                            }}
                                        />
                                         <div 
                                            className="absolute top-[100%] left-[-6px] w-0 h-0"
                                            style={{
                                                top: 'calc(50% + 8px)',
                                                borderLeft: '6px solid transparent',
                                                borderRight: '6px solid transparent',
                                                borderTop: `14px solid ${style.backgroundColor}`,
                                                transform: 'translateY(100%)'
                                            }}
                                        />
                                    </div>
                                    
                                    <span className="relative z-10">{d.line}</span>
                                </div>
                            );
                        })}
                        
                        {/* Narrator Box */}
                        {scene.narrator && (
                            <div className="absolute top-2 left-2 right-2 bg-yellow-100 border border-black p-1 shadow-sm opacity-90 z-10 pointer-events-none">
                                <p className="text-[10px] font-bold text-gray-800 uppercase font-sans tracking-wide">{scene.narrator}</p>
                            </div>
                        )}
                    </div>
                );
            })}
         </div>

         {/* Floating Context Toolbar */}
         {selectedBubbleId && activeBubble ? (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur border border-gray-300 p-3 rounded-2xl shadow-xl flex flex-col gap-3 min-w-[320px] animation-in slide-in-from-bottom-2 duration-200">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                     <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                        <MessageSquare className="w-3 h-3" /> Bubble Editor
                     </span>
                     <button onClick={() => setSelectedBubbleId(null)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
                </div>
                
                <div className="flex gap-4 items-center justify-between">
                     {/* Colors */}
                     <div className="flex gap-2">
                        <div className="flex flex-col items-center">
                             <label className="text-[10px] text-gray-400 mb-1">Fill</label>
                             <input type="color" value={activeBubble.style?.backgroundColor} onChange={(e) => updateBubbleStyle({ backgroundColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                        </div>
                        <div className="flex flex-col items-center">
                             <label className="text-[10px] text-gray-400 mb-1">Text</label>
                             <input type="color" value={activeBubble.style?.textColor} onChange={(e) => updateBubbleStyle({ textColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                        </div>
                     </div>
                     
                     <div className="h-8 w-px bg-gray-200"></div>

                     {/* Font Style Toggles */}
                     <div className="flex gap-1">
                        <button 
                             onClick={() => updateBubbleStyle({ fontWeight: activeBubble.style?.fontWeight === 'bold' ? 'normal' : 'bold' })}
                             className={`p-2 rounded ${activeBubble.style?.fontWeight === 'bold' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                            <Bold className="w-4 h-4" />
                        </button>
                        <button 
                             onClick={() => updateBubbleStyle({ fontStyle: activeBubble.style?.fontStyle === 'italic' ? 'normal' : 'italic' })}
                             className={`p-2 rounded ${activeBubble.style?.fontStyle === 'italic' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                            <Italic className="w-4 h-4" />
                        </button>
                     </div>
                </div>

                {/* Typography Row */}
                <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Font Family</label>
                        <select 
                            value={activeBubble.style?.fontFamily} 
                            onChange={(e) => updateBubbleStyle({ fontFamily: e.target.value })}
                            className="w-full text-xs p-1.5 border rounded"
                        >
                            {FONT_FAMILIES.map(f => <option key={f.name} value={f.value}>{f.name}</option>)}
                        </select>
                     </div>
                     <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] text-gray-400 block mb-1">Size</label>
                            <input 
                                type="number" 
                                value={activeBubble.style?.fontSize} 
                                onChange={(e) => updateBubbleStyle({ fontSize: Number(e.target.value) })}
                                className="w-full text-xs p-1.5 border rounded"
                                min={8} max={32}
                            />
                        </div>
                         <div className="flex-1">
                            <label className="text-[10px] text-gray-400 block mb-1">Scale</label>
                             <input 
                                type="number" 
                                value={activeBubble.style?.scale} 
                                onChange={(e) => updateBubbleStyle({ scale: Number(e.target.value) })}
                                className="w-full text-xs p-1.5 border rounded"
                                step={0.1} min={0.5} max={2.0}
                            />
                        </div>
                     </div>
                </div>

                {/* Tail Rotation */}
                <div>
                     <label className="text-[10px] text-gray-400 block mb-1 flex justify-between">
                        <span>Tail Angle</span>
                        <span>{activeBubble.style?.tailRotation}°</span>
                     </label>
                     <input 
                        type="range" 
                        min="0" 
                        max="360" 
                        value={activeBubble.style?.tailRotation}
                        onChange={(e) => updateBubbleStyle({ tailRotation: Number(e.target.value) })}
                        className="w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                     />
                </div>
            </div>
         ) : activePanelId ? (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-gray-300 p-2 rounded-full shadow-lg flex gap-4 items-center px-6">
                <span className="text-xs font-bold text-gray-500">Panel Controls</span>
                <div className="h-4 w-px bg-gray-300"></div>
                <button onClick={() => updatePanelState(activePanelId, { zoom: Math.max(0.5, getPanelState(activePanelId).zoom - 0.1) })} className="p-1 hover:bg-gray-100 rounded"><ZoomOut className="w-4 h-4"/></button>
                <button onClick={() => updatePanelState(activePanelId, { zoom: Math.min(3, getPanelState(activePanelId).zoom + 0.1) })} className="p-1 hover:bg-gray-100 rounded"><ZoomIn className="w-4 h-4"/></button>
                <div className="h-4 w-px bg-gray-300"></div>
                 <div className="flex gap-1">
                    <button onClick={() => updatePanelState(activePanelId, { panX: getPanelState(activePanelId).panX - 10 })} className="p-1 text-[10px] border rounded">←</button>
                    <button onClick={() => updatePanelState(activePanelId, { panX: getPanelState(activePanelId).panX + 10 })} className="p-1 text-[10px] border rounded">→</button>
                    <button onClick={() => updatePanelState(activePanelId, { panY: getPanelState(activePanelId).panY - 10 })} className="p-1 text-[10px] border rounded">↑</button>
                    <button onClick={() => updatePanelState(activePanelId, { panY: getPanelState(activePanelId).panY + 10 })} className="p-1 text-[10px] border rounded">↓</button>
                 </div>
                 <div className="h-4 w-px bg-gray-300"></div>
                 <button onClick={() => updatePanelState(activePanelId, { rotation: (getPanelState(activePanelId).rotation + 90) % 360 })} className="p-1 hover:bg-gray-100 rounded"><RotateCcw className="w-4 h-4"/></button>
            </div>
         ) : null}
      </div>

      {/* RIGHT: Actions */}
      <div className="w-16 flex flex-col gap-2">
         {project.pages.map((_, idx) => (
            <button
                key={idx}
                onClick={() => setActivePageIdx(idx)}
                className={`w-full aspect-square rounded flex items-center justify-center font-bold text-sm ${activePageIdx === idx ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-500'}`}
            >
                {idx + 1}
            </button>
         ))}
         <div className="flex-1"></div>
         <button onClick={onNext} className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 shadow-md">
            <ArrowRight className="w-6 h-6" />
         </button>
      </div>
    </div>
  );
};