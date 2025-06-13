import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Character, VideoScript, VideoGoals } from '../types';
import { ArrowLeft, PlusCircle, Wand2, MoreVertical, GripVertical, Sparkles, Bot } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SceneVideoUpload } from '../components/dashboard/SceneVideoUpload';
import StickyTopBar from '../components/ui/StickyTopBar';

const initialGoals: VideoGoals = {
  title: '',
  description: '',
  targetAudience: '',
  isDetailsOpen: true,
  format: 'short-form', // 'short-form' or 'long-form'
};

const initialScript: VideoScript = {
  segments: [],
  style: '',
};

const TIME_OPTIONS = [
  '10 seconds',
  '20 seconds',
  '30 seconds',
  '40 seconds',
  '50 seconds',
  '1 minute',
  '2 minutes',
  '3 minutes'
];

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
  const location = useLocation();
  const [sections, setSections] = useState<any[] | null>(null);
  const [generatingScriptIndex, setGeneratingScriptIndex] = useState<number | null>(null);
  const [sceneScripts, setSceneScripts] = useState<Record<number, string>>({});

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

  useEffect(() => {
    // Try router state first
    let data = location.state as any;
    if (data && data.sections) {
      setSections(data.sections);
      setLoading(false);
      localStorage.setItem('storyboardInfo', JSON.stringify(data));
      return;
    }
    // Fallback to localStorage
    const stored = localStorage.getItem('storyboardInfo');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.sections) {
          setSections(parsed.sections);
        }
      } catch {}
    }
    setLoading(false);
  }, [location.state]);

  // Add a new segment
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
          duration: TIME_OPTIONS[0],
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
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at outlining educational video scenes. Based on the video description, suggest 3-5 distinct scenes. Provide only the scene descriptions, one per line. Do not include any numbering or extra text, just the descriptions.'
            },
            {
              role: 'user',
              content: `Video Description: "${goals.description}"
Target Audience: ${goals.targetAudience || 'general public'}
Format: ${goals.format}

Suggest 3-5 concise scene descriptions for this educational video. Each scene should be engaging and appropriate for the target audience.`
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
          duration: goals.format === 'short-form' ? '10 seconds' : '1 minute',
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

  // Handle editing scene fields
  const handleSceneChange = (sceneIdx: number, field: string, value: string | string[]) => {
    if (!sections) return;
    const updated = sections.map((section, sIdx) => {
      if (!section.scenes) return section;
      return {
        ...section,
        scenes: section.scenes.map((scene: any, idx: number) => {
          if (idx !== sceneIdx) return scene;
          return {
            ...scene,
            [field]: value
          };
        })
      };
    });
    setSections(updated);
    // Save to localStorage
    const stored = localStorage.getItem('storyboardInfo');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        parsed.sections = updated;
        localStorage.setItem('storyboardInfo', JSON.stringify(parsed));
      } catch {}
    }
  };

  // Handle video upload
  const handleFileUpload = async (file: File, index: number) => {
    setUploadingIndex(index);
    setTimeout(() => {
      setUploadedSceneUrls(prev => ({ ...prev, [index]: URL.createObjectURL(file) }));
      setUploadingIndex(null);
    }, 1200);
  };

  // Generate script/narration for a scene
  const handleGenerateScript = async (scene: any, idx: number) => {
    setGeneratingScriptIndex(idx);
    try {
      const prompt = `Write a compelling narration or script for the following video scene.\n\nTitle: ${scene.title}\nDescription: ${scene.description}${scene.date ? `\nDate: ${scene.date}` : ''}`;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert video scriptwriter.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      });
      if (!response.ok) throw new Error('Failed to generate script');
      const data = await response.json();
      const script = data.choices[0].message.content;
      setSceneScripts(prev => ({ ...prev, [idx]: script }));
    } catch (err) {
      setSceneScripts(prev => ({ ...prev, [idx]: 'Failed to generate script.' }));
    } finally {
      setGeneratingScriptIndex(null);
    }
  };

  // On page load, auto-generate the script for each scene if not already present
  useEffect(() => {
    if (!sections) return;
    sections.forEach((section, sIdx) => {
      if (!section.scenes) return;
      section.scenes.forEach((scene: any, idx: number) => {
        if (!sceneScripts[idx] && scene.title && scene.description) {
          generateScriptForScene(scene, idx);
        }
      });
    });
    // eslint-disable-next-line
  }, [sections]);

  // Helper to generate script for a scene
  const generateScriptForScene = async (scene: any, idx: number) => {
    setGeneratingScriptIndex(idx);
    try {
      const prompt = `Write a very short, concise script for the following video scene. Only one character should speak, and the script should be just a few sentences at most.\n\nTitle: ${scene.title}\nDescription: ${scene.description}`;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert video scriptwriter.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      });
      if (!response.ok) throw new Error('Failed to generate script');
      const data = await response.json();
      const script = data.choices[0].message.content;
      setSceneScripts(prev => ({ ...prev, [idx]: script }));
    } catch (err) {
      setSceneScripts(prev => ({ ...prev, [idx]: 'Failed to generate script.' }));
    } finally {
      setGeneratingScriptIndex(null);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-gradient-to-br from-[#d1cfff] via-[#fbe2d2] to-[#e0e7ff]">
      <div className="w-full max-w-3xl">
        <StickyTopBar
          onBack={() => navigate(-1)}
          breadcrumbTrail={['Story Planner', 'Story Board', 'Preview']}
          currentStep={1}
        />
      </div>
      <div className="w-full max-w-3xl mt-8 mb-16 bg-white rounded-2xl shadow-lg border border-[#ece6fa] p-8 flex flex-col gap-8">
        <h2 className="text-2xl font-bold text-slate-700 mb-4">Outline</h2>
        {loading ? (
          <div className="p-8 text-slate-400">Loading storyboard...</div>
        ) : sections && sections.length > 0 ? (
          <div className="flex flex-col gap-8">
            {sections.map((section: any, sIdx: number) => (
              <div key={sIdx}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-slate-100 text-slate-600 text-xs font-semibold rounded px-3 py-1">{section.label}{section.duration ? `: ${section.duration}` : ''}</span>
                </div>
                <div className="flex flex-col gap-4">
                  {section.scenes && section.scenes.map((scene: any, idx: number) => (
                    <div key={idx} className="relative flex flex-row items-stretch gap-6 rounded-2xl bg-white border border-[#ece6fa] shadow-lg p-6 mb-2">
                      {/* Drag Handle */}
                      <div className="flex flex-col items-center justify-center mr-4 cursor-grab select-none text-slate-300 absolute left-2 top-1/2 -translate-y-1/2">
                        <GripVertical size={24} />
                      </div>
                      {/* Media Preview/Upload */}
                      <div className="flex flex-col items-center justify-center min-w-[140px] w-[140px] h-[140px] bg-[#f6f6fa] rounded-xl border-2 border-dashed border-[#d1cfff] overflow-hidden ml-10">
                        {uploadedSceneUrls[idx] ? (
                          <video src={uploadedSceneUrls[idx] || undefined} controls className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><rect width="100%" height="100%" rx="12" fill="#e5e7eb"/><path d="M12 8v4l3 3" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="#c7d2fe" strokeWidth="2"/></svg>
                            <span className="mt-2 text-xs text-slate-400">Drag and drop your video</span>
                          </div>
                        )}
                        <div className="mt-2 w-full">
                          <SceneVideoUpload
                            onFileUpload={file => handleFileUpload(file, idx)}
                            isUploading={uploadingIndex === idx}
                            existingVideoUrl={uploadedSceneUrls[idx] || undefined}
                          />
                        </div>
                      </div>
                      {/* Scene Content */}
                      <div className="flex-1 flex flex-col gap-3 ml-2 max-w-full">
                        {/* Scene Description Section */}
                        <div className="flex flex-col gap-2 w-full">
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Scene Description</div>
                          <div className="text-base font-bold text-slate-700 break-words w-full">{scene.title}</div>
                          <textarea
                            className="w-full rounded-lg border border-[#e5e7eb] bg-[#f8f7fa] px-4 py-3 text-slate-700 text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#a78bfa] resize-y shadow-sm max-w-full"
                            value={scene.description}
                            onChange={e => handleSceneChange(idx, 'description', e.target.value)}
                            rows={5}
                            placeholder="Describe the scene, including key details (one per line if needed)"
                          />
                        </div>
                        {/* Characters Section */}
                        <div className="flex flex-col gap-1 w-full mt-2">
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Characters</div>
                          <input
                            className="w-full rounded-lg border border-[#e5e7eb] bg-[#f8f7fa] px-4 py-2 text-slate-600 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#a78bfa] shadow-sm max-w-full"
                            value={scene.characters ? scene.characters.join(', ') : ''}
                            onChange={e => handleSceneChange(idx, 'characters', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            placeholder="Add characters (comma separated)"
                          />
                        </div>
                        {/* Script Section */}
                        <div className="flex flex-col gap-1 w-full mt-2">
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Script</div>
                          <div className="min-h-[48px] p-3 bg-slate-50 border border-slate-200 rounded text-slate-700 whitespace-pre-line">
                            {sceneScripts[idx] ? sceneScripts[idx] : <span className="text-slate-400 italic">No script generated yet.</span>}
                          </div>
                        </div>
                        {/* AI Generation Tools Row */}
                        <div className="flex flex-row w-full mt-4 gap-4">
                          <button
                            type="button"
                            disabled
                            title="Coming soon: Generate with HailuoAI"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-200 text-slate-400 font-semibold cursor-not-allowed text-base"
                          >
                            <Sparkles size={20} /> HailuoAI
                          </button>
                          <button
                            type="button"
                            disabled
                            title="Coming soon: Generate with RunwayML"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-200 text-slate-400 font-semibold cursor-not-allowed text-base"
                          >
                            <Bot size={20} /> RunwayML
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-slate-400 text-center">No storyboard data found. Please return to the Story Planner and generate a storyboard.</div>
        )}
      </div>
    </div>
  );
};

export default StoryBoard; 