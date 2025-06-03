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

  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);

  const [script, setScript] = useState<VideoScript>({
    segments: [{ text: '', character: undefined }],
    style: '',
    musicId: '',
  });

  const enhanceDescription = async () => {
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
        throw new Error('Failed to enhance description');
      }

      const data = await response.json();
      const enhancedDescription = data.choices[0].message.content;

      setGoals(prev => ({
        ...prev,
        description: enhancedDescription.replace(/^["']|["']$/g, ''),
      }));
    } catch (error) {
      setError('Failed to enhance description. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGoalsSubmit = async () => {
    if (!goals.title || !goals.description) {
      setError('Please fill in all required fields');
      return;
    }
    setCurrentStep('characters');
  };

  const handleCharactersSubmit = () => {
    if (selectedCharacters.length === 0) {
      setError('Please select at least one character');
      return;
    }
    setCurrentStep('script');
  };

  const handleScriptSubmit = () => {
    if (script.segments.some(segment => !segment.text)) {
      setError('Please fill in all script segments');
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
          characters: selectedCharacters,
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
        character_id: segment.character,
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

      case 'characters':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900">Select Characters</h3>
              <p className="text-sm text-slate-500">
                Choose the characters that will appear in your video
              </p>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {characters.map((character) => (
                  <div
                    key={character.id}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                      selectedCharacters.includes(character.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-200'
                    }`}
                    onClick={() => {
                      setSelectedCharacters(
                        selectedCharacters.includes(character.id)
                          ? selectedCharacters.filter(id => id !== character.id)
                          : [...selectedCharacters, character.id]
                      );
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {character.avatar_url ? (
                        <img
                          src={character.avatar_url}
                          alt={character.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                          <span className="text-lg font-medium text-purple-700">
                            {character.name[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-slate-900">{character.name}</h4>
                        {character.personality && (
                          <p className="text-sm text-slate-500">{character.personality}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                  
                  <Select
                    label="Character"
                    options={[
                      { value: '', label: 'Select character' },
                      ...characters
                        .filter(char => selectedCharacters.includes(char.id))
                        .map(char => ({
                          value: char.id,
                          label: char.name,
                        }))
                    ]}
                    value={segment.character || ''}
                    onChange={(value) => {
                      const newSegments = [...script.segments];
                      newSegments[index] = { ...segment, character: value };
                      setScript({ ...script, segments: newSegments });
                    }}
                    fullWidth
                  />
                  
                  <Textarea
                    label="Script"
                    value={segment.text}
                    onChange={(e) => {
                      const newSegments = [...script.segments];
                      newSegments[index] = { ...segment, text: e.target.value };
                      setScript({ ...script, segments: newSegments });
                    }}
                    placeholder="What should the character say in this segment?"
                    fullWidth
                  />
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setScript({
                  ...script,
                  segments: [...script.segments, { text: '', character: undefined }]
                })}
                fullWidth
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Segment
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
              <h3 className="mb-2 text-lg font-medium text-slate-900">Characters</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCharacters.map(charId => {
                  const character = characters.find(c => c.id === charId);
                  return character ? (
                    <span
                      key={charId}
                      className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-900"
                    >
                      {character.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
            
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="mb-2 text-lg font-medium text-slate-900">Script</h3>
              <div className="space-y-4">
                {script.segments.map((segment, index) => {
                  const character = characters.find(c => c.id === segment.character);
                  return (
                    <div key={index} className="border-l-2 border-purple-200 pl-4">
                      <p className="text-sm font-medium text-purple-900">
                        {character ? character.name : 'No character selected'}
                      </p>
                      <p className="text-slate-900">{segment.text}</p>
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
            {['goals', 'characters', 'script', 'review'].map((step, index) => (
              <React.Fragment key={step}>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    currentStep === step
                      ? 'bg-purple-600 text-white'
                      : index < ['goals', 'characters', 'script', 'review'].indexOf(currentStep)
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`h-0.5 w-8 ${
                      index < ['goals', 'characters', 'script'].indexOf(currentStep)
                        ? 'bg-purple-200'
                        : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-sm font-medium text-slate-500">
            Step {['goals', 'characters', 'script', 'review'].indexOf(currentStep) + 1} of 4
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
                  case 'characters': return 'goals';
                  case 'script': return 'characters';
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
              case 'characters': return handleCharactersSubmit();
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