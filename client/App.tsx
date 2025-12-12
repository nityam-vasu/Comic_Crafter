import React, { useState } from 'react';
import { Step1Story } from './components/Step1Story';
import { Step2Script } from './components/Step2Script';
import { Step3Generation } from './components/Step3Generation';
import { Step4Editor } from './components/Step4Editor';
import { Step5Export } from './components/Step5Export';
import SettingsPage from './components/SettingsPage';
import { ComicProject, ComicStyle } from './types';
import { PenTool, Image, Layout, Download, ChevronRight, Settings, Home } from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Story', icon: PenTool },
  { id: 2, name: 'Script', icon: Layout },
  { id: 3, name: 'Art', icon: Image },
  { id: 4, name: 'Layout', icon: Layout },
  { id: 5, name: 'Export', icon: Download },
];

const App = () => {
  const [currentView, setCurrentView] = useState<'workflow' | 'settings'>('workflow');
  const [currentStep, setCurrentStep] = useState(1);
  const [project, setProject] = useState<ComicProject>({
    title: '',
    description: '',
    style: ComicStyle.MANGA,
    pageCount: 1,
    pages: [],
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 5));

  const handleStorySubmit = (data: { title: string; description: string; style: ComicStyle; pageCount: number }) => {
    setProject((prev) => ({ ...prev, ...data }));
    nextStep();
  };

  const resetToHome = () => {
    setCurrentStep(1);
    setCurrentView('workflow');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header / Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={resetToHome}
              className="bg-indigo-600 text-white p-1.5 rounded-lg font-black font-comic tracking-tighter text-xl hover:bg-indigo-700 transition"
            >
                KM
            </button>
            <h1 className="font-bold text-xl tracking-tight hidden sm:block">KomaMaker AI</h1>
          </div>

          {/* Navigation based on current view */}
          {currentView === 'workflow' ? (
            <div className="flex items-center gap-2 sm:gap-4">
              {STEPS.map((step, idx) => {
                 const Icon = step.icon;
                 const isActive = currentStep === step.id;
                 const isCompleted = currentStep > step.id;
                 return (
                  <div key={step.id} className="flex items-center">
                     <div 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            isActive ? 'bg-indigo-100 text-indigo-700' : 
                            isCompleted ? 'text-green-600' : 'text-gray-400'
                        }`}
                     >
                        <Icon className="w-4 h-4" />
                        <span className="hidden md:inline">{step.name}</span>
                     </div>
                     {idx < STEPS.length - 1 && (
                        <ChevronRight className={`w-4 h-4 mx-1 ${isCompleted ? 'text-green-600' : 'text-gray-300'}`} />
                     )}
                  </div>
                 );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button 
                onClick={resetToHome}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <Home className="w-4 h-4" />
                <span>Back to Workflow</span>
              </button>
            </div>
          )}

          {/* Settings Link */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentView('settings')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                currentView === 'settings' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {currentView === 'workflow' ? (
            <>
              {currentStep === 1 && <Step1Story onNext={handleStorySubmit} />}
              {currentStep === 2 && <Step2Script project={project} setProject={setProject} onNext={nextStep} />}
              {currentStep === 3 && <Step3Generation project={project} setProject={setProject} onNext={nextStep} />}
              {currentStep === 4 && <Step4Editor project={project} setProject={setProject} onNext={nextStep} />}
              {currentStep === 5 && <Step5Export project={project} />}
            </>
          ) : (
            <SettingsPage />
          )}
        </div>
      </main>
      
      {/* Footer */}
      {currentView === 'workflow' && currentStep === 1 && (
        <footer className="text-center text-gray-400 text-sm py-8">
            <p>Powered by Google Gemini 2.5 Flash & Mock Diffusion Engine</p>
        </footer>
      )}
    </div>
  );
};

export default App;
