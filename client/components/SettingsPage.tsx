import React, { useState, useEffect } from 'react';
import { Save, Download, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { llmService } from '../services/llmService';
import { Settings } from '../types';

// Define available OpenRouter models
const OPENROUTER_MODELS = [
  { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B' },
  { id: 'google/gemma-7b-it', name: 'Gemma 7B' },
  { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B Instruct' },
  { id: 'openchat/openchat-7b', name: 'OpenChat 7B' },
  { id: 'microsoft/phi-2', name: 'Phi-2' },
  { id: 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo', name: 'Nous Hermes 2 Mixtral 8x7B DPO' }
];

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'gemma:2b',
    openRouterApiKey: '',
    openRouterModel: 'google/gemma-2-9b-it'
  });
  
  const [availableOllamaModels, setAvailableOllamaModels] = useState<string[]>([]);
  const [isCheckingOllama, setIsCheckingOllama] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{ connected: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('komamaker-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings) as Settings;
        setSettings(parsedSettings);
        
        // Update the LLM service with saved settings as well
        llmService.setOllamaEndpoint(parsedSettings.ollamaEndpoint);
        llmService.setOpenRouterApiKey(parsedSettings.openRouterApiKey);
        llmService.setOpenRouterModel(parsedSettings.openRouterModel);
        llmService.setGemmaModel(parsedSettings.ollamaModel);
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  // Check Ollama connection
  const checkOllamaConnection = async () => {
    setIsCheckingOllama(true);
    setOllamaStatus(null);
    
    try {
      // Test the connection directly
      const response = await fetch(`${settings.ollamaEndpoint}/api/tags`);
      
      if (response.ok) {
        const data = await response.json();
        const models = data.models?.map((m: any) => m.name) || [];
        
        setAvailableOllamaModels(models);
        setOllamaStatus({ 
          connected: true, 
          message: `Connected to Ollama. ${models.length} models available.` 
        });
      } else {
        setAvailableOllamaModels([]);
        setOllamaStatus({ 
          connected: false, 
          message: `Cannot connect to Ollama: ${response.status} ${response.statusText}` 
        });
      }
    } catch (error) {
      setAvailableOllamaModels([]);
      setOllamaStatus({ 
        connected: false, 
        message: `Error connecting to Ollama: ${(error as Error).message}` 
      });
    } finally {
      setIsCheckingOllama(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save settings to localStorage
  const saveSettings = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Validate settings before saving
      if (settings.openRouterApiKey && settings.openRouterApiKey.length < 10) {
        throw new Error('OpenRouter API key appears to be invalid');
      }
      
      localStorage.setItem('komamaker-settings', JSON.stringify(settings));
      
      // Update the LLM service with new settings
      llmService.setOllamaEndpoint(settings.ollamaEndpoint);
      llmService.setOpenRouterApiKey(settings.openRouterApiKey);
      llmService.setOpenRouterModel(settings.openRouterModel);
      llmService.setGemmaModel(settings.ollamaModel);
      
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setSaveMessage({ type: 'error', text: `Error saving settings: ${(error as Error).message}` });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle model download
  const downloadOllamaModel = async (modelName: string) => {
    try {
      const response = await fetch(`${settings.ollamaEndpoint}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download model: ${response.status} ${response.statusText}`);
      }
      
      // For now, just show success - in a real implementation you'd want to stream the progress
      setSaveMessage({ type: 'success', text: `Started downloading model: ${modelName}` });
      
      // Refresh available models after a delay
      setTimeout(checkOllamaConnection, 2000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: `Error downloading model: ${(error as Error).message}` });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure your API endpoints and models for story generation</p>
      </div>

      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          saveMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* Ollama Settings Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Ollama Configuration</h2>
          <div className="flex items-center gap-2">
            {ollamaStatus && (
              <span className={`flex items-center gap-1 text-sm ${
                ollamaStatus.connected ? 'text-green-600' : 'text-red-600'
              }`}>
                {ollamaStatus.connected ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {ollamaStatus.message}
              </span>
            )}
            <button
              onClick={checkOllamaConnection}
              disabled={isCheckingOllama}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition disabled:opacity-50"
            >
              {isCheckingOllama ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isCheckingOllama ? 'Checking...' : 'Test Connection'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ollama Endpoint</label>
            <input
              type="text"
              name="ollamaEndpoint"
              value={settings.ollamaEndpoint}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="http://localhost:11434"
            />
            <p className="text-xs text-gray-500 mt-1">The URL where Ollama is running</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ollama Model</label>
            <div className="flex gap-2">
              <select
                name="ollamaModel"
                value={settings.ollamaModel}
                onChange={handleInputChange}
                className="flex-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {availableOllamaModels.length > 0 ? (
                  availableOllamaModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))
                ) : (
                  <option value="gemma:2b">Default: gemma:2b</option>
                )}
              </select>
              <a 
                href="https://ollama.ai/library" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-indigo-600 hover:bg-indigo-50 flex items-center"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-1">Select the model to use for story generation</p>
          </div>
        </div>

        {/* Model Download Section */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="font-medium text-gray-800 mb-2">Download New Models</h3>
          <div className="flex flex-wrap gap-2">
            {['gemma:2b', 'gemma:7b', 'llama3', 'mistral', 'phi3'].map(model => (
              <button
                key={model}
                onClick={() => downloadOllamaModel(model)}
                disabled={isCheckingOllama}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {model}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Click to download Ollama models. Download progress will appear in your Ollama terminal.
          </p>
        </div>
      </div>

      {/* OpenRouter Settings Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">OpenRouter Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OpenRouter API Key</label>
            <input
              type="password"
              name="openRouterApiKey"
              value={settings.openRouterApiKey}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your OpenRouter API key"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from <a 
                href="https://openrouter.ai/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                OpenRouter
              </a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OpenRouter Model</label>
            <select
              name="openRouterModel"
              value={settings.openRouterModel}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {OPENROUTER_MODELS.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Select the model to use when Ollama is unavailable</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;