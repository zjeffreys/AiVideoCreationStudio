import React, { useState, useEffect } from 'react';
import { PlusCircle, ArrowLeft, ArrowRight, Wand2, ChevronDown } from 'lucide-react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Character, VideoCreationStep, VideoGoals, VideoScript } from '../../types';
import { SceneVideoUpload } from './SceneVideoUpload';

type Props = {
  characters: Character[];
  onVideoCreated: () => void;
  existingVideoId?: string;
};

export const CreateVideoForm: React.FC<Props> = ({
  characters,
  onVideoCreated,
  existingVideoId,
}) => {
  console.log("CreateVideoForm rendering...");
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<VideoCreationStep>('script');
  const [goals, setGoals] = useState<VideoGoals>({
    title: '',
    description: '',
    targetAudience: '',
    isDetailsOpen: true,
  });
  const [script, setScript] = useState<VideoScript>({ segments: [], style: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [specificErrors, setSpecificErrors] = useState<Record<string, string>>({});
  const [uploadedSceneUrls, setUploadedSceneUrls] = useState<Record<number, string | null>>({});
  const [videoId, setVideoId] = useState<string | null>(existingVideoId || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const createDraftVideo = async () => {
      if (!user || existingVideoId || videoId) return;

      try {
        const { data, error } = await supabase
          .from('videos')
          .insert({
            user_id: user.id,
            title: 'New Video (Draft)',
            description: '',
            script: JSON.stringify({ segments: [], style: '' }),
            status: 'draft',
            characters: [],
          })
          .select('id')
          .single();

        if (error) throw error;
        setVideoId(data.id);
        console.log("Draft video created with ID:", data.id);
      } catch (error) {
        console.error("Error creating draft video:", error);
        if (error instanceof Error) {
          setSpecificErrors({ initialization: `Failed to create draft video: ${error.message}` });
        } else {
          setSpecificErrors({ initialization: "An unknown error occurred during draft video creation." });
        }
      }
    };

    createDraftVideo();
  }, [user, existingVideoId, videoId]);

  useEffect(() => {
    const loadExistingVideo = async () => {
      if (!existingVideoId || !user) return;

      setLoading(true);
      setSpecificErrors({});

      try {
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .select('*')
          .eq('id', existingVideoId)
          .single();

        if (videoError) throw videoError;
        if (!videoData) throw new Error("Video not found.");

        if (videoData.user_id !== user.id) {
          throw new Error("Unauthorized access to video.");
        }

        setGoals({
          title: videoData.title,
          description: videoData.description || '',
          targetAudience: '',
          isDetailsOpen: false,
        });

        const parsedScript: VideoScript = JSON.parse(videoData.script);
        setScript(parsedScript);

        const { data: dbSegmentsData, error: segmentsError } = await supabase
          .from('video_segments')
          .select('id, segment_url')
          .eq('video_id', existingVideoId)
          .order('created_at', { ascending: true });

        if (segmentsError) throw segmentsError;

        const urls: Record<number, string | null> = {};
        parsedScript.segments.forEach((_, index) => {
          if (dbSegmentsData && dbSegmentsData[index] && dbSegmentsData[index].segment_url) {
            urls[index] = dbSegmentsData[index].segment_url;
          }
        });
        setUploadedSceneUrls(urls);

        setVideoId(existingVideoId);

      } catch (error) {
        console.error("Error loading existing video:", error);
        if (error instanceof Error) {
          setSpecificErrors({ loadVideo: `Failed to load video: ${error.message}` });
        } else {
          setSpecificErrors({ loadVideo: "An unknown error occurred while loading video." });
        }
      } finally {
        setLoading(false);
      }
    };

    loadExistingVideo();
  }, [existingVideoId, user]);

  const deleteSegment = (index: number) => {
    setScript(prev => ({
      ...prev,
      segments: prev.segments.filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = async (file: File, index: number) => {
    if (!user) {
      setSpecificErrors({ user: "User not authenticated." });
      return;
    }
    if (!videoId) {
      setSpecificErrors({ fileUpload: "Video ID is not available. Please try again after the draft video is created." });
      return;
    }
    if (!file) return;

    setUploadingIndex(index);
    setSpecificErrors({});

    try {
      const fileExtension = file.name.split('.').pop();
      // Generate a unique ID for the file itself to avoid duplicates and simplify naming
      const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;
      // Path: user_id/video_id/unique_file_id.ext
      const filePath = `${user.id}/${videoId}/${uniqueFileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('scene-videos')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('scene-videos')
        .getPublicUrl(filePath);
      
      if (!publicUrlData) throw new Error("Could not get public URL for the uploaded file.");

      setUploadedSceneUrls(prev => ({ ...prev, [index]: publicUrlData.publicUrl }));

    } catch (error) {
      if (error instanceof Error) {
        setSpecificErrors({ fileUpload: error.message });
      } else {
        setSpecificErrors({ fileUpload: "An unknown error occurred during file upload." });
      }
    } finally {
      setUploadingIndex(null);
    }
  };

  const generateSuggestedScenes = async () => {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      setSpecificErrors({ sceneGeneration: 'OpenAI API key is required for scene generation.' });
      return;
    }

    if (!goals.description.trim()) {
      setSpecificErrors({ sceneGeneration: 'Please provide a video description before generating scenes.' });
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
          videoUrl: undefined,
        })),
      }));

    } catch (error) {
      if (error instanceof Error) {
        setSpecificErrors({ sceneGeneration: error.message });
      } else {
        setSpecificErrors({ sceneGeneration: 'An error occurred while generating scenes' });
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const generateScript = async (index: number) => {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      setSpecificErrors({ scriptGeneration: 'OpenAI API key is required for script generation' });
      return;
    }

    const scene = script.segments[index];
    if (!scene.charactersInScene.length || !scene.speakerCharacterId) {
      setSpecificErrors({ scriptGeneration: 'Please select characters and a speaking character first' });
      return;
    }

    const speaker = characters.find(c => c.id === scene.speakerCharacterId);
    if (!speaker) {
      setSpecificErrors({ scriptGeneration: 'Selected speaking character not found' });
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
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at writing educational video scripts. Create engaging dialogue that teaches the subject matter effectively.'
            },
            {
              role: 'user',
              content: `Write a 6-second script segment for an educational video about "${goals.title}". 
              The scene description is: "${scene.sceneDescription}"
              Speaking character is: ${speaker.name} (${speaker.description || speaker.personality || 'No description'})
              Target audience: ${goals.targetAudience}
              Keep the dialogue concise and natural, suitable for a 6-second delivery.`
            }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate script');
      }

      const data = await response.json();
      const generatedScript = data.choices[0].message.content;

      const newSegments = [...script.segments];
      newSegments[index] = {
        ...newSegments[index],
        text: generatedScript,
      };
      setScript({ ...script, segments: newSegments });
    } catch (error) {
      if (error instanceof Error) {
        setSpecificErrors({ scriptGeneration: error.message });
      } else {
        setSpecificErrors({ scriptGeneration: 'Failed to generate script' });
      }
    } finally {
      setIsEnhancing(false);
    }
  };

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
        description: enhancedDescription.replace(/^["']|["']$/g, ''),
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

  const generateSceneDescription = async (index: number, userInput: string = '') => {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      setSpecificErrors({ sceneGeneration: 'OpenAI API key is required for scene generation' });
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
              content: 'You are an expert at writing engaging scene descriptions for educational videos. Create a brief but vivid description of the scene setting and action.'
            },
            {
              role: 'user',
              content: `Create a scene description for an educational video about "${goals.title}". ${
                userInput ? `The scene should incorporate these elements: ${userInput}. ` : ''
              }Make it engaging and appropriate for the target audience: "${goals.targetAudience}"`
            }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate scene description');
      }

      const data = await response.json();
      const newDescription = data.choices[0].message.content;

      const newSegments = [...script.segments];
      newSegments[index] = {
        ...newSegments[index],
        sceneDescription: newDescription,
      };
      setScript({ ...script, segments: newSegments });
    } catch (error) {
      if (error instanceof Error) {
        setSpecificErrors({ sceneGeneration: error.message });
      } else {
        setSpecificErrors({ sceneGeneration: 'Failed to generate scene description' });
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const validateAndProceedToReview = (): Record<string, string> => {
    console.log("Executing validateAndProceedToReview...");
    const errors: Record<string, string> = {};

    if (!goals.title) {
      errors.title = "Please provide a video title.";
    }
    if (!goals.description) {
      errors.description = "Please provide a video description.";
    }

    script.segments.forEach((scene, index) => {
      if (!scene.text) {
        errors[`scene-${index}-text`] = "Please enter the dialogue for this scene.";
      }
      if (!scene.sceneDescription) {
        errors[`scene-${index}-description`] = "Please provide a description for this scene.";
      }
      if (!scene.speakerCharacterId) {
        errors[`scene-${index}-speaker`] = "Please select a speaking character for this scene.";
      }
    });

    setSpecificErrors(errors);
    return errors;
  };

  const handleSaveVideo = async () => {
    if (!user) {
      setSpecificErrors({ user: "User not authenticated." });
      return;
    }
    if (!videoId) {
      setSpecificErrors({ save: "Video ID is missing. Cannot save video." });
      return;
    }

    setIsSubmitting(true);
    setSpecificErrors({});

    try {
      const uniqueCharacterIds = Array.from(new Set(
        script.segments.flatMap(s => s.charactersInScene)
      ));

      const { error: videoUpdateError } = await supabase
        .from('videos')
        .update({
          title: goals.title,
          description: goals.description,
          script: JSON.stringify(script),
          characters: uniqueCharacterIds,
          status: 'draft',
        })
        .eq('id', videoId);

      if (videoUpdateError) throw videoUpdateError;

      console.log("Main video record updated successfully for ID:", videoId);

      const { error: deleteSegmentsError } = await supabase
        .from('video_segments')
        .delete()
        .eq('video_id', videoId);

      if (deleteSegmentsError) throw deleteSegmentsError;
      console.log("Existing segments deleted.");

      const segmentsToInsert = script.segments.map((segment, index) => ({
        video_id: videoId,
        text: segment.text,
        character_id: segment.speakerCharacterId || null,
        segment_url: uploadedSceneUrls[index] || null,
        status: uploadedSceneUrls[index] ? 'completed' : 'pending',
        created_at: new Date().toISOString(),
      }));

      if (segmentsToInsert.length > 0) {
        const { error: segmentsInsertError } = await supabase
          .from('video_segments')
          .insert(segmentsToInsert);

        if (segmentsInsertError) throw segmentsInsertError;
        console.log("Video segments inserted successfully!");
      } else {
        console.log("No segments to insert.");
      }

      onVideoCreated();
      alert('Video created/updated successfully!');
    } catch (error) {
      console.error('Error saving video:', error);
      if (error instanceof Error) {
        setSpecificErrors({ save: error.message });
      } else {
        setSpecificErrors({ save: 'An error occurred while saving the video' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addNewSegment = () => {
    setScript(prev => ({
      ...prev,
      segments: [...prev.segments, {
        text: '',
        sceneDescription: '',
        charactersInScene: [],
        speakerCharacterId: undefined,
        isOpen: false,
        videoUrl: undefined,
      }],
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'script':
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-700 bg-slate-800">
              <button
                onClick={() => setGoals(prev => ({ ...prev, isDetailsOpen: !prev.isDetailsOpen }))}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <h2 className="text-xl font-semibold text-white">Video Details</h2>
                <ChevronDown
                  className={`h-5 w-5 text-slate-400 transition-transform ${
                    goals.isDetailsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {goals.isDetailsOpen && (
                <div className="space-y-4 border-t border-slate-700 p-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                      Video Title
                    </label>
                    <Input
                      value={goals.title}
                      onChange={(e) => setGoals({ ...goals, title: e.target.value })}
                      placeholder="Enter a title for your educational video"
                      required
                      fullWidth
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-300"
                    />
                    {specificErrors.title && (
                      <p className="text-red-400 text-sm mt-1">{specificErrors.title}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white">
                      Description
                    </label>
                    <Textarea
                      value={goals.description}
                      onChange={(e) => setGoals({ ...goals, description: e.target.value })}
                      placeholder="Describe what you want to teach in this video. For example: 'This video explains the water cycle for middle school students, covering evaporation, condensation, and precipitation through engaging animations and real-world examples.'"
                      required
                      fullWidth
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-300"
                    />
                    {specificErrors.description && (
                      <p className="text-red-400 text-sm mt-1">{specificErrors.description}</p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-400">
                        Pro tip: Write a basic description and click "Enhance" to make it more engaging
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={enhanceDescription}
                        isLoading={isEnhancing}
                        loadingText="Enhancing..."
                        leftIcon={!isEnhancing ? <Wand2 className="h-4 w-4" /> : undefined}
                        disabled={!goals.description || isEnhancing}
                        className="border-slate-700 text-white hover:bg-slate-700"
                      >
                        Enhance Description
                      </Button>
                    </div>
                  </div>
                  
                  <Input
                    label="Target Audience"
                    value={goals.targetAudience}
                    onChange={(e) => setGoals({ ...goals, targetAudience: e.target.value })}
                    placeholder="Who is this video for?"
                    fullWidth
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-300"
                  />
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Create Script</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateSuggestedScenes}
                  isLoading={isEnhancing}
                  loadingText="Generating Scenes..."
                  leftIcon={!isEnhancing ? <Wand2 className="h-4 w-4" /> : undefined}
                  disabled={!goals.description || isEnhancing}
                  className="border-slate-700 text-white hover:bg-slate-700"
                >
                  Generate Suggested Scenes
                </Button>
              </div>
              <div className="space-y-4">
                {script.segments.map((scene, index) => (
                  <div key={index} className="rounded-lg border border-slate-700 bg-slate-900">
                    <button
                      onClick={() => {
                        const newScenes = [...script.segments];
                        newScenes[index] = {
                          ...scene,
                          isOpen: !scene.isOpen
                        };
                        setScript({ ...script, segments: newScenes });
                      }}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">Scene {index + 1}</h3>
                        {scene.sceneDescription && (
                          <span className="text-sm text-slate-400 line-clamp-1">
                            {scene.sceneDescription}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSegment(index);
                          }}
                          className="text-red-400 hover:bg-red-900/50 hover:text-red-300"
                        >
                          Delete Scene
                        </Button>
                        <ChevronDown
                          className={`h-5 w-5 text-slate-400 transition-transform ${
                            scene.isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {scene.isOpen && (
                      <div className="space-y-4 border-t border-slate-700 p-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white">
                            What happens in this scene?
                          </label>
                          <Textarea
                            placeholder="Describe what happens in this scene (e.g., 'The teacher explains the water cycle using a diagram on the whiteboard')"
                            value={scene.sceneDescription}
                            onChange={(e) => {
                              const newScenes = [...script.segments];
                              newScenes[index] = {
                                ...scene,
                                sceneDescription: e.target.value,
                              };
                              setScript({ ...script, segments: newScenes });
                            }}
                            fullWidth
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-300"
                          />
                          {specificErrors[`scene-${index}-description`] && (
                            <p className="text-red-400 text-sm mt-1">{specificErrors[`scene-${index}-description`]}</p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateSceneDescription(index, scene.sceneDescription)}
                            isLoading={isEnhancing}
                            loadingText="Generating..."
                            leftIcon={!isEnhancing ? <Wand2 className="h-4 w-4" /> : undefined}
                            className="border-slate-700 text-white hover:bg-slate-700"
                          >
                            Generate Scene Description
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white">
                            Speaking Character
                          </label>
                          <Select
                            options={characters.map(char => ({
                              value: char.id,
                              label: char.name,
                            }))}
                            value={scene.speakerCharacterId || ''}
                            onChange={(value) => {
                              const newScenes = [...script.segments];
                              newScenes[index] = {
                                ...scene,
                                speakerCharacterId: value || undefined,
                              };
                              setScript({ ...script, segments: newScenes });
                            }}
                            placeholder="Select a character"
                            fullWidth
                          />
                          {specificErrors[`scene-${index}-speaker`] && (
                            <p className="text-red-400 text-sm mt-1">{specificErrors[`scene-${index}-speaker`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium text-white">Who else appears in this scene? (Max 3)</label>
                          <div className="mt-2 flex flex-wrap gap-3">
                            {characters.map(character => (
                              <div
                                key={character.id}
                                className={`cursor-pointer rounded-lg border p-2 transition-colors ${
                                  scene.charactersInScene.includes(character.id)
                                    ? 'border-purple-500 bg-purple-900/20'
                                    : 'border-slate-700 bg-slate-800 hover:bg-slate-700'
                                } ${scene.charactersInScene.length >= 3 && !scene.charactersInScene.includes(character.id)
                                  ? 'opacity-50 cursor-not-allowed'
                                  : ''
                                }`}
                                onClick={() => {
                                  if (scene.charactersInScene.length >= 3 && !scene.charactersInScene.includes(character.id)) return;
                                  const newScenes = [...script.segments];
                                  const currentCharacters = newScenes[index].charactersInScene;
                                  newScenes[index] = {
                                    ...scene,
                                    charactersInScene: currentCharacters.includes(character.id)
                                      ? currentCharacters.filter(id => id !== character.id)
                                      : [...currentCharacters, character.id],
                                  };
                                  setScript({ ...script, segments: newScenes });
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  {character.avatar_url ? (
                                    <img
                                      src={character.avatar_url}
                                      alt={character.name}
                                      className="h-8 w-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-900/50">
                                      <span className="text-sm font-medium text-purple-400">
                                        {character.name[0]}
                                      </span>
                                    </div>
                                  )}
                                  <span className="text-sm font-medium text-white">
                                    {character.name}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white">
                            What do they say?
                          </label>
                          <Input
                            value={scene.text}
                            onChange={(e) => {
                              const newScenes = [...script.segments];
                              newScenes[index] = {
                                ...scene,
                                text: e.target.value,
                              };
                              setScript({ ...script, segments: newScenes });
                            }}
                            placeholder="Enter what the speaking character says in this scene"
                            fullWidth
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-300"
                          />
                          {specificErrors[`scene-${index}-text`] && (
                            <p className="text-red-400 text-sm mt-1">{specificErrors[`scene-${index}-text`]}</p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateScript(index)}
                            isLoading={isEnhancing && (currentStep === 'script')}
                            loadingText="Generating Script..."
                            leftIcon={!isEnhancing ? <Wand2 className="h-4 w-4" /> : undefined}
                            className="border-slate-700 text-white hover:bg-slate-700"
                          >
                            Generate Dialogue
                          </Button>
                        </div>

                        <div>
                          <SceneVideoUpload
                            onFileUpload={(file) => handleFileUpload(file, index)}
                            isUploading={uploadingIndex === index}
                            existingVideoUrl={uploadedSceneUrls[index] || undefined}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addNewSegment}
                  leftIcon={<PlusCircle className="h-4 w-4" />}
                  fullWidth
                  className="border-slate-700 text-white hover:bg-slate-700"
                >
                  Add New Scene
                </Button>
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <h3 className="mb-2 text-lg font-medium text-white">Video Details</h3>
              <div className="space-y-2">
                <p className="text-slate-300"><span className="font-medium text-white">Title:</span> {goals.title}</p>
                <p className="text-slate-300"><span className="font-medium text-white">Description:</span> {goals.description}</p>
                {goals.targetAudience && (
                  <p className="text-slate-300"><span className="font-medium text-white">Target Audience:</span> {goals.targetAudience}</p>
                )}
              </div>
            </div>
            
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <h3 className="mb-2 text-lg font-medium text-white">Video Script</h3>
              <div className="space-y-4">
                {script.segments.map((scene, index) => {
                  const speaker = characters.find(char => char.id === scene.speakerCharacterId);
                  const charactersInSceneNames = characters
                    .filter(char => scene.charactersInScene.includes(char.id))
                    .map(char => char.name)
                    .join(', ');

                  return (
                    <div key={index} className="rounded-lg border border-slate-700 p-4 bg-slate-900">
                      <h4 className="font-medium text-white">Scene {index + 1}</h4>
                      {speaker && (
                        <p className="text-sm text-slate-300">Speaker: {speaker.name}</p>
                      )}
                      {charactersInSceneNames && (
                        <p className="text-sm text-slate-300">Characters: {charactersInSceneNames}</p>
                      )}
                      {scene.sceneDescription && (
                        <p className="text-sm text-slate-300">Scene: {scene.sceneDescription}</p>
                      )}
                      <div className="border-l-2 border-purple-400 pl-4 mt-2">
                        <p className="text-slate-300">{scene.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
    }
  };

  const handleSubmit = async () => {
    console.log("Executing handleSubmit...");
    if (currentStep === 'script') {
      const errors = validateAndProceedToReview();
      if (Object.keys(errors).length > 0) {
        setSpecificErrors(errors);
        return;
      }
      setSpecificErrors({});
      setCurrentStep('review');
    } else if (currentStep === 'review') {
      await handleSaveVideo();
    }
  };

  const handleBack = () => {
    if (currentStep === 'review') {
      setCurrentStep('script');
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(specificErrors).map(([key, error]) => (
        <div key={key} className="rounded-lg bg-red-900/50 p-4 text-red-400">
          <p>{error}</p>
        </div>
      ))}

      {renderStepContent()}
      
      <div className="flex justify-between pt-6">
        {currentStep !== 'script' && (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className="border-slate-700 text-white hover:bg-slate-700"
          >
            Back
          </Button>
        )}
        
        <Button
          className="ml-auto"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          loadingText={currentStep === 'review' ? 'Creating Video...' : 'Next'}
          rightIcon={currentStep !== 'review' ? <ArrowRight className="h-4 w-4" /> : undefined}
        >
          {currentStep === 'review' ? 'Create Video' : 'Next'}
        </Button>
      </div>
    </div>
  );
};