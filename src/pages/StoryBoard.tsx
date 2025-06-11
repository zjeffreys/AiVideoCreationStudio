import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Character, VideoScript, VideoGoals } from '../types';
import { ArrowLeft, PlusCircle, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SceneVideoUpload } from '../components/dashboard/SceneVideoUpload';

const initialGoals: VideoGoals = {
  title: '',
  description: '',
  targetAudience: '',
  isDetailsOpen: true,
};

const initialScript: VideoScript = {
  segments: [],
  style: '',
};

const StoryBoard: React.FC = () => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<VideoGoals>(initialGoals);
  const [script, setScript] = useState<VideoScript>(initialScript);
  const [specificErrors, setSpecificErrors] = useState<Record<string, string>>({});
  const [isEnhancing, setIsEnhancing] = useState(false);
  const navigate = useNavigate();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadedSceneUrls, setUploadedSceneUrls] = useState<Record<number, string | null>>({});
  const [isGeneratingScenes, setIsGeneratingScenes] = useState(false);

  useEffect(() => {
    const fetchCharacters = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('user_id', user.id);
        if (error) throw error;
        setCharacters(data || []);
      } catch (err) {
        setError('Failed to load characters');
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
  }, [user]);

  // Add a new scene
  const addNewSegment = () => {
    setScript(prev => ({
      ...prev,
      segments: [
        ...prev.segments,
        {
          text: '',
          sceneDescription: '',
          charactersInScene: [],
          speakerCharacterId: undefined,
          isOpen: false,
        },
      ],
    }));
  };

  // Remove a scene
  const deleteSegment = (index: number) => {
    setScript(prev => ({
      ...prev,
      segments: prev.segments.filter((_, i) => i !== index),
    }));
  };

  // AI Enhance Description
  const enhanceDescription = async () => {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      setSpecificErrors({ descriptionEnhancement: 'OpenAI API key is required for description enhancement. Please add it to your environment variables.' });
      return;
    }
    if (!goals.description.trim()) {
      setSpecificErrors({ descriptionEnhancement: 'Please enter a description before enhancing' });
      return;
    }
    setIsEnhancing(true);
    setSpecificErrors({});
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at writing engaging educational video descriptions. Enhance the given description to be more detailed, engaging, and SEO-friendly while maintaining the original intent.'
            },
            {
              role: 'user',
              content: `Please enhance this educational video description: "${goals.description}"`
            }
          ],
          temperature: 0.7,
        }),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const data = await response.json();
      const enhancedDescription = data.choices[0].message.content;
      setGoals(prev => ({
        ...prev,
        description: enhancedDescription.replace(/^\["']|["']$/g, ''),
      }));
    } catch (error) {
      if (error instanceof Error) {
        setSpecificErrors({ descriptionEnhancement: `Failed to enhance description: ${error.message}` });
      } else {
        setSpecificErrors({ descriptionEnhancement: 'Failed to enhance description. Please try again.' });
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  // AI Generate Scenes
  const generateScenes = async () => {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      setSpecificErrors({ sceneGeneration: 'OpenAI API key is required for scene generation.' });
      return;
    }
    if (!goals.description.trim()) {
      setSpecificErrors({ sceneGeneration: 'Please provide a video description before generating scenes.' });
      return;
    }
    setIsGeneratingScenes(true);
    setSpecificErrors({});
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at outlining educational video scenes. Based on the video description, suggest 3-5 distinct scenes. Provide only the scene descriptions, one per line. Do not include any numbering or extra text, just the descriptions.'
            },
            {
              role: 'user',
              content: `Video Description: "${goals.description}"
Target Audience: ${goals.targetAudience || 'general public'}

Suggest 3-5 concise scene descriptions (approx. 6 seconds each) for this educational video.`
            }
          ],
          temperature: 0.7,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to generate scenes: ${response.statusText}`);
      }
      const data = await response.json();
      const generatedScenesText = data.choices[0].message.content;
      const suggestedScenes = generatedScenesText.split('\n').filter((line: string) => line.trim() !== '');
      setScript(prev => ({
        ...prev,
        segments: suggestedScenes.map((desc: string) => ({
          text: '',
          sceneDescription: desc.trim(),
          charactersInScene: [],
          speakerCharacterId: undefined,
          isOpen: false,
        })),
      }));
    } catch (error) {
      if (error instanceof Error) {
        setSpecificErrors({ sceneGeneration: error.message });
      } else {
        setSpecificErrors({ sceneGeneration: 'An error occurred while generating scenes' });
      }
    } finally {
      setIsGeneratingScenes(false);
    }
  };

  // Handle video upload for a scene
  const handleFileUpload = async (file: File, index: number) => {
    if (!user) return;
    // Simulate upload and URL creation (replace with real upload logic as needed)
    setUploadingIndex(index);
    setTimeout(() => {
      setUploadedSceneUrls(prev => ({ ...prev, [index]: URL.createObjectURL(file) }));
      setUploadingIndex(null);
    }, 1200);
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-gradient-to-br from-[#d1cfff] via-[#fbe2d2] to-[#e0e7ff]">
      {/* Sticky Top Bar */}
      <div className="w-full max-w-3xl sticky top-0 z-10 bg-[#f6f3ff]/80 backdrop-blur border-b border-[#e5e7eb] rounded-b-2xl px-6 pt-6 pb-3 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm font-medium">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button className="ml-auto px-5 py-2 rounded-lg bg-[#a78bfa] hover:bg-[#8b5cf6] text-white font-semibold flex items-center gap-2 shadow transition">
            Next <span className="ml-1">✨</span>
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-slate-600 font-medium">Storyboard</span>
          <span>/</span>
          <span>Preview</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-3xl mt-8 mb-16 bg-white rounded-2xl shadow-lg border border-[#ece6fa] p-8 flex flex-col gap-8">
        <h2 className="text-2xl font-bold text-slate-700 mb-4">Let's craft the story of your video!</h2>
        {/* Video Details */}
        <div className="rounded-xl border border-[#e5e7eb] bg-[#fafaff] p-6 flex flex-col gap-4 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-slate-500 text-xs font-medium">Title</label>
              <input type="text" value={goals.title} onChange={e => setGoals({ ...goals, title: e.target.value })} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-slate-700 text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#a78bfa]" placeholder="Enter a title for your video" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-slate-500 text-xs font-medium">Target Audience</label>
              <input type="text" value={goals.targetAudience} onChange={e => setGoals({ ...goals, targetAudience: e.target.value })} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-slate-700 text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#a78bfa]" placeholder="Who is this video for?" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-slate-500 text-xs font-medium">Description</label>
              <div className="flex gap-2">
                <textarea value={goals.description} onChange={e => setGoals({ ...goals, description: e.target.value })} rows={4} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-slate-700 text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#a78bfa] resize-y" placeholder="Describe your video" />
                <button type="button" onClick={enhanceDescription} disabled={isEnhancing || !goals.description} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#a78bfa] hover:bg-[#f3f0ff] font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">
                  <Wand2 className="h-4 w-4" />
                  {isEnhancing ? 'Enhancing...' : 'Enhance'}
                </button>
              </div>
              {specificErrors.descriptionEnhancement && (
                <p className="text-red-500 text-xs mt-1">{specificErrors.descriptionEnhancement}</p>
              )}
              <button
                type="button"
                onClick={generateScenes}
                disabled={isGeneratingScenes || !goals.description}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#a78bfa] hover:bg-[#8b5cf6] text-white font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingScenes ? 'Generating Scenes...' : 'Generate Scenes'}
              </button>
              {specificErrors.sceneGeneration && (
                <p className="text-red-500 text-xs mt-1">{specificErrors.sceneGeneration}</p>
              )}
            </div>
          </div>
        </div>
        {/* Scenes */}
        <div className="flex flex-col gap-8">
          {script.segments.map((scene, index) => (
            <div key={index} className="rounded-xl border border-[#e5e7eb] bg-[#fafaff] p-6 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="w-40 min-w-[10rem]">
                  <SceneVideoUpload
                    onFileUpload={file => handleFileUpload(file, index)}
                    isUploading={uploadingIndex === index}
                    existingVideoUrl={uploadedSceneUrls[index] || undefined}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-slate-500 text-xs font-medium">Scene {index + 1}</label>
                  <textarea
                    value={scene.sceneDescription}
                    onChange={e => {
                      const newScenes = [...script.segments];
                      newScenes[index] = { ...scene, sceneDescription: e.target.value };
                      setScript({ ...script, segments: newScenes });
                    }}
                    rows={3}
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-slate-700 text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#a78bfa] resize-y"
                    placeholder="Describe what happens in this scene"
                  />
                </div>
                <button onClick={() => deleteSegment(index)} className="ml-auto p-2 rounded-lg hover:bg-slate-100 text-slate-400"><span className="sr-only">Delete</span>🗑️</button>
              </div>
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-slate-500 text-xs font-medium">Dialogue</label>
                  <input type="text" value={scene.text} onChange={e => {
                    const newScenes = [...script.segments];
                    newScenes[index] = { ...scene, text: e.target.value };
                    setScript({ ...script, segments: newScenes });
                  }} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-slate-700 text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#a78bfa]" placeholder="What do they say?" />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-slate-500 text-xs font-medium">Speaker</label>
                  <select value={scene.speakerCharacterId || ''} onChange={e => {
                    const newScenes = [...script.segments];
                    newScenes[index] = { ...scene, speakerCharacterId: e.target.value };
                    setScript({ ...script, segments: newScenes });
                  }} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-slate-700 text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#a78bfa]">
                    <option value="">Select a character</option>
                    {characters.map(char => (
                      <option key={char.id} value={char.id}>{char.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-slate-500 text-xs font-medium">Characters in Scene (up to 3)</label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {characters.map(character => {
                      const selected = scene.charactersInScene.includes(character.id);
                      const disabled = !selected && scene.charactersInScene.length >= 3;
                      return (
                        <button
                          key={character.id}
                          type="button"
                          className={`flex items-center gap-2 rounded-lg border p-2 transition-colors text-sm font-medium
                            ${selected ? 'border-purple-500 bg-purple-100 text-purple-700' : 'border-[#e5e7eb] bg-white text-slate-700 hover:bg-slate-100'}
                            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={disabled}
                          onClick={() => {
                            const newScenes = [...script.segments];
                            const current = newScenes[index].charactersInScene;
                            newScenes[index] = {
                              ...scene,
                              charactersInScene: selected
                                ? current.filter(id => id !== character.id)
                                : [...current, character.id],
                            };
                            setScript({ ...script, segments: newScenes });
                          }}
                        >
                          {character.avatar_url ? (
                            <img src={character.avatar_url} alt={character.name} className="h-7 w-7 rounded-full object-cover" />
                          ) : (
                            <span className="h-7 w-7 flex items-center justify-center rounded-full bg-purple-200 text-purple-700 font-bold">
                              {character.name[0]}
                            </span>
                          )}
                          {character.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addNewSegment} className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl shadow border border-[#e5e7eb] hover:bg-slate-50 text-slate-700 font-medium self-start">
            <PlusCircle className="h-5 w-5" /> Add New Scene
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryBoard; 