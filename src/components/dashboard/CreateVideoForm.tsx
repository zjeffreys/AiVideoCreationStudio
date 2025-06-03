import React, { useState } from 'react';
import { PlusCircle, ArrowLeft, ArrowRight, Wand2 } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState<VideoCreationStep>('goals');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [goals, setGoals] = useState<VideoGoals>({
    title: '',
    description: '',
    targetAudience: '',
    learningObjectives: [''],
    duration: 120,
  });

  const [script, setScript] = useState<VideoScript>({
    segments: Array(3).fill({
      text: '',
      sceneDescription: '',
      charactersInScene: [],
      speakerCharacterId: undefined,
    }),
    style: '',
    musicId: '',
  });

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

  const generateSceneDescription = async (index: number) => {
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
              content: `Create a scene description for an educational video about "${goals.title}". The scene should be engaging and appropriate for the target audience: "${goals.targetAudience}"`
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

  const handleGoalsSubmit = async () => {
    if (!goals.title || !goals.description) {
      setError('Please fill in all required fields');
      return;
    }
    setCurrentStep('script');
  };

  const handleScriptSubmit = () => {
    if (script.segments.some(segment => !segment.text || !segment.speakerCharacterId || !segment.sceneDescription)) {
      setError('Please fill in all script segments, including scene descriptions and speaking characters');
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

      const segments = script.segments.map((segment, index) => ({
        video_id: videoData.id,
        start_time: index * 6,
        end_time: (index + 1) * 6,
        text: segment.text,
        character_id: segment.speakerCharacterId,
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 'goals':
        return (
          <div className="space-y-6">
            <Input
              label="Video Title"
              value={goals.title}
              onChange={(e) => setGoals({ ...goals, title: e.target.value })}
              placeholder="Enter a title for your educational video"
              required
              fullWidth
            />
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-900">
                Description
              </label>
              <Textarea
                value={goals.description}
                onChange={(e) => setGoals({ ...goals, description: e.target.value })}
                placeholder="Describe what you want to teach in this video. For example: 'This video explains the water cycle for middle school students, covering evaporation, condensation, and precipitation through engaging animations and real-world examples.'"
                required
                fullWidth
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500">
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
            />
            
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-900">
                Learning Objectives
              </label>
              {goals.learningObjectives.map((objective, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={objective}
                    onChange={(e) => {
                      const newObjectives = [...goals.learningObjectives];
                      newObjectives[index] = e.target.value;
                      setGoals({ ...goals, learningObjectives: newObjectives });
                    }}
                    placeholder={`Objective ${index + 1}`}
                    fullWidth
                  />
                  {index === goals.learningObjectives.length - 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setGoals({
                        ...goals,
                        learningObjectives: [...goals.learningObjectives, '']
                      })}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'script':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900">Create Script</h3>
              <p className="text-sm text-slate-500">
                Break down your video into segments. Each segment should be about 6 seconds long.
              </p>
              
              {script.segments.map((segment, index) => (
                <div key={index} className="space-y-4 rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900">Segment {index + 1}</h4>
                    <span className="text-sm text-slate-500">~6 seconds</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-900">
                          Scene Description
                        </label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateSceneDescription(index)}
                          isLoading={isEnhancing}
                          loadingText="Generating..."
                          leftIcon={!isEnhancing ? <Wand2 className="h-4 w-4" /> : undefined}
                        >
                          Generate Scene
                        </Button>
                      </div>
                      <Textarea
                        value={segment.sceneDescription}
                        onChange={(e) => {
                          const newSegments = [...script.segments];
                          newSegments[index] = {
                            ...segment,
                            sceneDescription: e.target.value,
                          };
                          setScript({ ...script, segments: newSegments });
                        }}
                        placeholder="Describe the scene setting and what's happening (e.g., 'In a modern classroom, a teacher stands next to an interactive whiteboard showing a diagram of the water cycle.')"
                        fullWidth
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-900">
                        Characters in Scene (Max 3)
                      </label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {characters.map(character => (
                          <div
                            key={character.id}
                            onClick={() => {
                              const isSelected = segment.charactersInScene.includes(character.id);
                              let newCharacters = [...segment.charactersInScene];
                              
                              if (isSelected) {
                                newCharacters = newCharacters.filter(id => id !== character.id);
                                if (segment.speakerCharacterId === character.id) {
                                  segment.speakerCharacterId = undefined;
                                }
                              } else if (newCharacters.length < 3) {
                                newCharacters.push(character.id);
                              }
                              
                              const newSegments = [...script.segments];
                              newSegments[index] = {
                                ...segment,
                                charactersInScene: newCharacters,
                              };
                              setScript({ ...script, segments: newSegments });
                            }}
                            className={`cursor-pointer rounded-lg border p-2 transition-colors ${
                              segment.charactersInScene.includes(character.id)
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-slate-200 hover:border-purple-200'
                            } ${segment.charactersInScene.length >= 3 && !segment.charactersInScene.includes(character.id)
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {character.avatar_url ? (
                                <img
                                  src={character.avatar_url}
                                  alt={character.name}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                                  <span className="text-sm font-medium text-purple-700">
                                    {character.name[0]}
                                  </span>
                                </div>
                              )}
                              <span className="text-sm font-medium text-slate-900">
                                {character.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Select
                      label="Speaking Character"
                      options={[
                        { value: '', label: 'Select speaking character' },
                        ...segment.charactersInScene.map(charId => {
                          const character = characters.find(c => c.id === charId);
                          return {
                            value: charId,
                            label: character?.name || '',
                          };
                        })
                      ]}
                      value={segment.speakerCharacterId || ''}
                      onChange={(value) => {
                        const newSegments = [...script.segments];
                        newSegments[index] = {
                          ...segment,
                          speakerCharacterId: value,
                        };
                        setScript({ ...script, segments: newSegments });
                      }}
                      fullWidth
                    />
                    
                    <Textarea
                      label="Script"
                      value={segment.text}
                      onChange={(e) => {
                        const newSegments = [...script.segments];
                        newSegments[index] = {
                          ...segment,
                          text: e.target.value,
                        };
                        setScript({ ...script, segments: newSegments });
                      }}
                      placeholder="What should the character say in this segment?"
                      fullWidth
                    />
                  </div>
                </div>
              ))}
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
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="mb-2 text-lg font-medium text-slate-900">Video Goals</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Title</dt>
                  <dd className="text-slate-900">{goals.title}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Description</dt>
                  <dd className="text-slate-900">{goals.description}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Target Audience</dt>
                  <dd className="text-slate-900">{goals.targetAudience}</dd>
                </div>
              </dl>
            </div>
            
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="mb-2 text-lg font-medium text-slate-900">Script</h3>
              <div className="space-y-6">
                {script.segments.map((segment, index) => {
                  const speaker = characters.find(c => c.id === segment.speakerCharacterId);
                  const sceneCharacters = segment.charactersInScene
                    .map(id => characters.find(c => c.id === id))
                    .filter((c): c is Character => c !== undefined);
                  
                  return (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-slate-900">Scene {index + 1}</h4>
                        <span className="text-sm text-slate-500">~6 seconds</span>
                      </div>
                      
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-sm text-slate-600">{segment.sceneDescription}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {sceneCharacters.map(character => (
                          <span
                            key={character.id}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                              character.id === segment.speakerCharacterId
                                ? 'bg-purple-100 text-purple-900'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {character.name}
                            {character.id === segment.speakerCharacterId && ' (Speaking)'}
                          </span>
                        ))}
                      </div>

                      <div className="border-l-2 border-purple-200 pl-4">
                        <p className="text-slate-900">{segment.text}</p>
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
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}
      
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {['goals', 'script', 'review'].map((step, index) => (
              <React.Fragment key={step}>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    currentStep === step
                      ? 'bg-purple-600 text-white'
                      : index < ['goals', 'script', 'review'].indexOf(currentStep)
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 2 && (
                  <div
                    className={`h-0.5 w-8 ${
                      index < ['goals', 'script'].indexOf(currentStep)
                        ? 'bg-purple-200'
                        : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-sm font-medium text-slate-500">
            Step {['goals', 'script', 'review'].indexOf(currentStep) + 1} of 3
          </div>
        </div>
      </div>

      {renderStepContent()}
      
      <div className="flex justify-between pt-6">
        {currentStep !== 'goals' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError(null);
              setCurrentStep(prev => {
                switch (prev) {
                  case 'script': return 'goals';
                  case 'review': return 'script';
                  default: return prev;
                }
              });
            }}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
        )}
        
        <Button
          className="ml-auto"
          onClick={() => {
            setError(null);
            switch (currentStep) {
              case 'goals': return handleGoalsSubmit();
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