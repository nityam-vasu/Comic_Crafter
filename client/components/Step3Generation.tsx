import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle, RefreshCcw, Loader } from 'lucide-react';
import { ComicProject, ComicPage } from '../types';
import { ImageGenerationService } from '../services/imageGeneratorService';

// Initialize the service with configuration from environment variables
const imageGenerationService = new ImageGenerationService();

interface Step3Props {
  project: ComicProject;
  setProject: React.Dispatch<React.SetStateAction<ComicProject>>;
  onNext: () => void;
}

export const Step3Generation: React.FC<Step3Props> = ({ project, setProject, onNext }) => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedImages, setCompletedImages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generatingSceneIds, setGeneratingSceneIds] = useState<Set<string>>(new Set());
  
  // Calculate total scenes across all pages
  const totalScenes = project.pages.reduce((acc, page) => acc + page.scenes.length, 0);

  useEffect(() => {
    const hasImages = project.pages.every(p => p.scenes.every(s => s.imageUrl));
    if (hasImages) {
        setCompletedImages(totalScenes);
        setProgress(100);
        return; // Already generated
    }
    
    startGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGeneration = async () => {
    setGenerating(true);
    setProgress(0);
    setCompletedImages(0);
    setError(null); // Clear any previous errors
    setGeneratingSceneIds(new Set()); // Reset generating scene IDs

    const newPages = JSON.parse(JSON.stringify(project.pages)) as ComicPage[];
    let count = 0;

    try {
      // Process each scene to generate images
      for (let pIdx = 0; pIdx < newPages.length; pIdx++) {
        for (let sIdx = 0; sIdx < newPages[pIdx].scenes.length; sIdx++) {
          const scene = newPages[pIdx].scenes[sIdx];
          
          // Mark this scene as currently generating
          setGeneratingSceneIds(prev => new Set(prev).add(scene.id));
          
          try {
            // Generate image using the fine-tuned model
            const imageUrl = await imageGenerationService.generateImage({
              prompt: scene.prompt,
              // Adjust parameters based on comic style
              steps: project.style === 'Pixel Art' ? 15 : 20,
              width: project.style === 'Webtoon' ? 1024 : 1024, // Adjust dimensions as needed
              height: project.style === 'Webtoon' ? 2048 : 1024, // Webtoons are typically taller
              // Add negative prompts specific to comic art
              negative_prompt: "blurry, deformed, disfigured, bad anatomy, extra limbs, missing limbs, poorly drawn face",
            }, 3); // Retry up to 3 times

            // Update the scene with the generated image
            newPages[pIdx].scenes[sIdx].imageUrl = imageUrl;
          } catch (error) {
            console.error(`Failed to generate image for scene ${scene.id} after all retries:`, error);
            // Set a fallback image or handle the error as appropriate
            newPages[pIdx].scenes[sIdx].imageUrl = '/placeholder-error.png'; // This might not exist, but you can create one
          }
          
          // Remove this scene from the generating set
          setGeneratingSceneIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(scene.id);
            return newSet;
          });
          
          count++;
          setCompletedImages(count);
          setProgress(Math.round((count / totalScenes) * 100));
          
          // Incremental update of state so user sees images pop in
          setProject(prev => ({
              ...prev,
              pages: [...newPages]
          }));
        }
      }
    } catch (error) {
      console.error('Error during image generation:', error);
      const errorMessage = (error as Error).message || 'Unknown error occurred during image generation';
      setError(errorMessage);
      setGenerating(false);
      setGeneratingSceneIds(new Set()); // Clear all generating scene IDs
      return; // Stop execution if there's a major error
    }
    
    setGenerating(false);
    setGeneratingSceneIds(new Set()); // Clear all generating scene IDs
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Generating Art Assets</h2>
        <p className="text-gray-500 mb-6">Using your fine-tuned Stable Diffusion model: {project.style}</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            <strong>Error:</strong> {error}
            <button 
              onClick={() => setError(null)}
              className="float-right text-red-900 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
          <div 
            className="bg-indigo-600 h-4 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600">
            <span>{generating ? 'Painting pixels...' : 'Generation Complete'}</span>
            <span>{completedImages} / {totalScenes} Panels</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-2">
        {project.pages.map((page) => (
            page.scenes.map((scene) => (
                <div key={scene.id} className={`relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-300 shadow-sm ${generatingSceneIds.has(scene.id) ? 'ring-2 ring-indigo-500' : ''}`}>
                    {scene.imageUrl ? (
                        <>
                           <img 
                                src={scene.imageUrl} 
                                alt={scene.prompt} 
                                className="w-full h-full object-cover transition transform group-hover:scale-105" 
                           />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <span className="text-white text-xs px-2 text-center">{scene.prompt.slice(0, 50)}...</span>
                           </div>
                           <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-md">
                                <CheckCircle className="w-4 h-4" />
                           </div>
                           {generatingSceneIds.has(scene.id) && (
                             <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                               <Loader className="w-6 h-6 text-white animate-spin" />
                             </div>
                           )}
                        </>
                    ) : generatingSceneIds.has(scene.id) ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                            <Loader className="w-8 h-8 animate-spin mb-2" />
                            <span className="text-xs">Generating...</span>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <span className="text-xs">Pending</span>
                        </div>
                    )}
                </div>
            ))
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-3">
         {!generating && (
            <button 
                onClick={startGeneration}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 border border-gray-300 transition"
            >
                <RefreshCcw className="w-4 h-4" /> Regenerate All
            </button>
         )}
         <button
            onClick={onNext}
            disabled={generating || !!error} // Disable next button if there's an error
            className={`px-6 py-2 rounded-lg flex items-center gap-2 font-bold shadow-md transition ${
                generating || error ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
        >
            Enter Layout Editor <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
