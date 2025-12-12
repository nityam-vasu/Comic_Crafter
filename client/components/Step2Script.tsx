import React, { useEffect, useState } from 'react';
    import { Edit3, ArrowRight, Loader2, Save, Cpu, Globe } from 'lucide-react';
    import { ComicProject, ComicPage, Scene, Settings } from '../types';
    import { llmService } from '../services/llmService';
    
    interface Step2Props {
      project: ComicProject;
      setProject: React.Dispatch<React.SetStateAction<ComicProject>>;
      onNext: () => void;
    }
    
    export const Step2Script: React.FC<Step2Props> = ({ project, setProject, onNext }) => {
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [activePageIdx, setActivePageIdx] = useState(0);
      const [llmServiceUsed, setLlmServiceUsed] = useState<'ollama' | 'openrouter' | null>(null);
      const [modelUsed, setModelUsed] = useState<string | null>(null);
    
      useEffect(() => {
        // Only generate if we don't have pages yet
        if (project.pages.length === 0) {
          const fetchScript = async () => {
            setLoading(true);
            setError(null); // Clear any previous error
            
            try {
              // Load settings from localStorage to ensure latest configuration is used
              const savedSettings = localStorage.getItem('komamaker-settings');
              if (savedSettings) {
                try {
                  const parsedSettings = JSON.parse(savedSettings) as Settings;
                  // Update the LLM service with current settings
                  llmService.setOllamaEndpoint(parsedSettings.ollamaEndpoint);
                  llmService.setOpenRouterApiKey(parsedSettings.openRouterApiKey);
                  llmService.setOpenRouterModel(parsedSettings.openRouterModel);
                  llmService.setGemmaModel(parsedSettings.ollamaModel);
                } catch (parseError) {
                  console.error('Error parsing saved settings:', parseError);
                  // Use defaults if parsing fails
                }
              }
              
              const result = await llmService.generateComicScript({
                title: project.title,
                description: project.description,
                style: project.style,
                pageCount: project.pageCount
              });
              setProject(prev => ({ ...prev, pages: result.pages }));
              setLlmServiceUsed(result.usedService);
              setModelUsed(result.modelUsed);
            } catch (err) {
              console.error('Error generating comic script:', err);
              setError(`Failed to generate script: ${(err as Error).message}`);
            } finally {
              setLoading(false);
            }
          };
          fetchScript();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []); // Run once
    
      const handleSceneUpdate = (pageIdx: number, sceneIdx: number, field: keyof Scene, value: any) => {
        const newPages = [...project.pages];
        newPages[pageIdx].scenes[sceneIdx] = {
          ...newPages[pageIdx].scenes[sceneIdx],
          [field]: value
        };
        setProject(prev => ({ ...prev, pages: newPages }));
      };
    
      const handleDialogueUpdate = (pageIdx: number, sceneIdx: number, diagIdx: number, text: string) => {
        const newPages = [...project.pages];
        newPages[pageIdx].scenes[sceneIdx].dialogue[diagIdx].line = text;
        setProject(prev => ({ ...prev, pages: newPages }));
      };

      const downloadJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${project.title.replace(/\s+/g, '_')}_script.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      };
    
      if (loading) {
        return (
          <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
            <p className="text-lg font-medium">Drafting your story with LLM...</p>
            <p className="text-sm">Detecting available LLM service...</p>
          </div>
        );
      }
    
      if (error) {
        return <div className="text-red-500 text-center p-8 bg-red-50 rounded-lg">{error}</div>;
      }

      if (project.pages.length === 0) return null;
    
      const activePage = project.pages[activePageIdx];
    
      return (
        <div className="flex flex-col h-[calc(100vh-200px)]">
            <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                    {project.pages.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActivePageIdx(idx)}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                activePageIdx === idx 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Page {idx + 1}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    {llmServiceUsed && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                            {llmServiceUsed === 'ollama' ? <Cpu className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                            {llmServiceUsed === 'ollama' ? 'Local Ollama' : 'OpenRouter Cloud'} ({modelUsed})
                        </div>
                    )}
                    <button 
                        onClick={downloadJson}
                        className="px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-2 text-sm font-medium transition"
                    >
                        <Save className="w-4 h-4" /> Save JSON
                    </button>
                    <button 
                        onClick={onNext}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 font-bold shadow-md transition"
                    >
                        Generate Panels <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {llmServiceUsed && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <p className="font-medium text-blue-800">
                        {llmServiceUsed === 'ollama' 
                          ? '🔒 Using your local Ollama instance for story generation' 
                          : '☁️ Using OpenRouter cloud service for story generation'}
                    </p>
                    <p className="text-blue-600 mt-1">
                        Model: <span className="font-mono">{modelUsed}</span>
                    </p>
                </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {activePage.scenes.map((scene, sIdx) => (
                    <div key={scene.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded">PANEL {sIdx + 1}</span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Visual Description */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Visual Prompt</label>
                                <textarea
                                    className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-32"
                                    value={scene.prompt}
                                    onChange={(e) => handleSceneUpdate(activePageIdx, sIdx, 'prompt', e.target.value)}
                                />
                                <label className="block text-xs font-bold text-gray-500 uppercase mt-4 mb-1">Narrator Box</label>
                                <input
                                    type="text"
                                    className="w-full text-sm p-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                                    value={scene.narrator}
                                    onChange={(e) => handleSceneUpdate(activePageIdx, sIdx, 'narrator', e.target.value)}
                                    placeholder="Narrative text..."
                                />
                            </div>

                            {/* Dialogue */}
                            <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
                                <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                    <Edit3 className="w-3 h-3" /> Dialogue
                                </h4>
                                <div className="space-y-3">
                                    {scene.dialogue.map((line, dIdx) => (
                                        <div key={line.id} className="flex gap-2 items-start">
                                            <div className="w-20 pt-2 text-xs font-bold text-right text-gray-600 truncate shrink-0">
                                                {line.character}:
                                            </div>
                                            <textarea
                                                className="flex-1 text-sm p-2 border border-indigo-200 rounded focus:border-indigo-500 outline-none font-comic"
                                                rows={2}
                                                value={line.line}
                                                onChange={(e) => handleDialogueUpdate(activePageIdx, sIdx, dIdx, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                    {scene.dialogue.length === 0 && (
                                        <p className="text-xs text-gray-400 italic text-center py-4">No dialogue in this panel.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      );
    };