import React, { useState } from 'react';
import { PlusCircle, ArrowLeft, ArrowRight, Wand2, ChevronDown } from 'lucide-react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Character, MusicStyle, VideoCreationStep, VideoGoals, VideoScript } from '../../types';

type Props = {
  characters: Character[];
  musicStyles: MusicStyle[];
  onVideoCreated: () => void;
};

export const CreateVideoForm: React.FC<Props> = ({ 
  characters, 
  musicStyles,
  onVideoCreated 
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<VideoCreationStep>('script');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [goals, setGoals] = useState<VideoGoals>({
    title: '',
    description: '',
    targetAudience: '',
    learningObjectives: [''],
    duration: 120,
    isDetailsOpen: false,
  });

  const [script, setScript] = useState<VideoScript>({
    segments: [{
      text: '',
      sceneDescription: '',
      charactersInScene: [],
      speakerCharacterId: undefined,
      isOpen: false,
    }],
    style: '',
    musicId: '',
  });

  const deleteSegment = (index: number) => {
    setScript(prev => ({
      ...prev,
      segments: prev.segments.filter((_, i) => i !== index),
    }));
  };

  const generateSuggestedScenes = async () => {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      setError('OpenAI API key is required for scene generation.');
      return;
    }

    if (!goals.description.trim()) {
      setError('Please provide a video description before generating scenes.');
      return;
    }

    setIsEnhancing(true);
    setError(null);

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
        setError(error.message);
      } else {
        setError('An error occurred while generating scenes');
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const generateScript = async (index: number) => {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      setError('OpenAI API key is required for script generation');
      return;
    }

    const scene = script.segments[index];
    if (!scene.charactersInScene.length || !scene.speakerCharacterId) {
      setError('Please select characters and a speaking character first');
      return;
    }

    const speaker = characters.find(c => c.id === scene.speakerCharacterId);
    if (!speaker) {
      setError('Selected speaking character not found');
      return;
    }

    setIsEnhancing(true);
    setError(null);

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
        setError(error.message);
      } else {
        setError('Failed to generate script');
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const enhanceDescription = async () => {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      setError('OpenAI API key is required for description enhancement. Please add it to your environment variables.');
      return;
    }

    if (!goals.description.trim()) {
      setError('Please enter a description before enhancing');
      return;
    }

    setIsEnhancing(true);
    setError(null);

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
        setError(`Failed to enhance description: ${error.message}`);
      } else {
        setError('Failed to enhance description. Please try again.');
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const generateSceneDescription = async (index: number, userInput: string = '') => {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      setError('OpenAI API key is required for scene generation');
      return;
    }

    setIsEnhancing(true);
    setError(null);

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
        setError(error.message);
      } else {
        setError('Failed to generate scene description');
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleScriptSubmit = () => {
    if (!goals.title || !goals.description) {
      setError('Please fill in the video title and description');
      return;
    }
    if (script.segments.some(scene => !scene.text || !scene.speakerCharacterId || !scene.sceneDescription)) {
      setError('Please fill in all script scenes, including scene descriptions and speaking characters');
      return;
    }
    setCurrentStep('review');
  };

  const handleFinalSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          user_id: user!.id,
          title: goals.title,
          description: goals.description,
          status: 'processing',
        })
        .select()
        .single();
      
      if (videoError) throw videoError;

      const { error: scriptError } = await supabase
        .from('video_scripts')
        .insert({
          video_id: videoData.id,
          title: goals.title,
          description: goals.description,
          style: script.style,
          music_id: script.musicId || null,
        });
      
      if (scriptError) throw scriptError;

      const segments = script.segments.map((scene, index) => ({
        video_id: videoData.id,
        start_time: index * 6,
        end_time: (index + 1) * 6,
        text: scene.text,
        character_id: scene.speakerCharacterId,
        status: 'pending',
      }));

      const { error: segmentsError } = await supabase
        .from('video_segments')
        .insert(segments);
      
      if (segmentsError) throw segmentsError;
      
      onVideoCreated();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
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
      }],
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'script':
        return (
          <div className="space-y-6">
            {/* Video Details Section */}
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
                  <Input
                    label="Video Title"
                    value={goals.title}
                    onChange={(e) => setGoals({ ...goals, title: e.target.value })}
                    placeholder="Enter a title for your educational video"
                    required
                    fullWidth
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-300"
                  />
                  
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

            {/* Script Section */}
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

                        <div>
                          <Select
                            label="Who is speaking in this scene?"
                            options={characters.map(char => ({ value: char.id, label: char.name }))}
                            value={scene.speakerCharacterId || ''}
                            onChange={(value) => {
                              const newScenes = [...script.segments];
                              newScenes[index] = {
                                ...scene,
                                speakerCharacterId: value,
                              };
                              setScript({ ...script, segments: newScenes });
                            }}
                            fullWidth
                            className="bg-slate-800 border-slate-700 text-white"
                          />
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
              
              <div className="space-y-4">
                <Select
                  label="Music Style"
                  options={[
                    { value: '', label: 'Select music style' },
                    ...musicStyles.map(style => ({
                      value: style.id,
                      label: style.name,
                    }))
                  ]}
                  value={script.musicId || ''}
                  onChange={(value) => setScript({ ...script, musicId: value })}
                  fullWidth
                />
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-900/50 p-4 text-red-400">
          <p>{error}</p>
        </div>
      )}

      {renderStepContent()}
      
      <div className="flex justify-between pt-6">
        {currentStep !== 'script' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError(null);
              setCurrentStep('script');
            }}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className="border-slate-700 text-white hover:bg-slate-700"
          >
            Back
          </Button>
        )}
        
        <Button
          className="ml-auto"
          onClick={() => {
            setError(null);
            switch (currentStep) {
              case 'script': return handleScriptSubmit();
              case 'review': return handleFinalSubmit();
            }
          }}
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