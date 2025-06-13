import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import StickyTopBar from '../components/ui/StickyTopBar';
import { useAuth } from '../context/AuthContext';
import mammoth from 'mammoth';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const TIME_OPTIONS = [
  { value: '10', label: '10 seconds' },
  { value: '20', label: '20 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '40', label: '40 seconds' },
  { value: '50', label: '50 seconds' },
  { value: '60', label: '1 minute' },
  { value: '120', label: '2 minutes' },
  { value: '180', label: '3 minutes' },
];

const audienceOptions = [
  // Educational Institutions
  { value: 'elementary', label: 'Elementary School Students' },
  { value: 'middle', label: 'Middle School Students' },
  { value: 'high', label: 'High School Students' },
  { value: 'college', label: 'College/University Students' },
  { value: 'professionals', label: 'Professional Development' },
  
  // Content Creators
  { value: 'youtube-beginners', label: 'YouTube Beginners' },
  { value: 'youtube-intermediate', label: 'YouTube Intermediate' },
  { value: 'youtube-advanced', label: 'YouTube Advanced' },
  { value: 'tiktok', label: 'TikTok Creators' },
  { value: 'instagram', label: 'Instagram Content' },
  { value: 'linkedin', label: 'LinkedIn Professional' },
  
  // Specific Topics
  { value: 'tech-tutorials', label: 'Tech Tutorials' },
  { value: 'cooking', label: 'Cooking & Recipes' },
  { value: 'fitness', label: 'Fitness & Health' },
  { value: 'business', label: 'Business & Finance' },
  { value: 'art', label: 'Art & Design' },
  { value: 'music', label: 'Music & Audio' },
  { value: 'language', label: 'Language Learning' },
  { value: 'science', label: 'Science & Education' },
  { value: 'history', label: 'History & Culture' },
  { value: 'history-documentary', label: 'Historical Documentary' },
  { value: 'history-educational', label: 'History Education' },
  { value: 'lifestyle', label: 'Lifestyle & Wellness' },
  { value: 'gaming', label: 'Gaming & Entertainment' },
];

const formatOptions = [
  { value: 'short-form', label: 'Short Form' },
  { value: 'long-form', label: 'Long Form' },
];

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isAI = message.sender === 'ai';
  return (
    <div className={`flex w-full ${isAI ? 'justify-start' : 'justify-end'} mb-2`}>
      <div
        className={`rounded-2xl px-4 py-2 max-w-[75%] break-words shadow-sm ${
          isAI
            ? 'bg-gradient-to-br from-[#d1cfff] via-[#fbe2d2] to-[#e0e7ff] text-slate-700 dark:from-purple-600 dark:to-orange-500 dark:text-white'
            : 'bg-[#e6f0fa] text-slate-700'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
};

const selectClass = "min-w-[140px] bg-white border-slate-300 text-slate-700 dark:bg-white dark:text-slate-700 dark:border-slate-300";

const LEADING_QUESTIONS = [
  "What's the main goal or message you want your audience to take away from this video? (e.g., teach a historical event, inspire action, explain a process, share a personal story, etc.)",
  "What tone or style do you want for your video (e.g., fun, serious, inspirational, etc.)?",
  "Are there any key points, facts, or characters you want to include?",
  "What time period or years should this story or video focus on? (e.g., 1800s, 1960-1970, present day, etc.)",
  // Story progression questions:
  "How does your story begin? (Describe the setup or introduction)",
  "What is the main conflict or challenge in your story?",
  "How does the story develop or escalate? (Key turning points)",
  "How is the conflict resolved? (Climax or resolution)",
  "How do you want the story to end? (Conclusion, takeaway, or call to action)",
];

const StoryboardPlanner: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(() => [{
    sender: 'ai',
    text: `Hi ${user?.email?.split('@')[0] || 'there'}! I'm your AI Video Assistant. I'm here to help you craft your story step by step, or you can upload a document and I'll help turn it into a compelling video. To begin, tell me what your story or video is about, or upload a document you'd like help with.`,
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(TIME_OPTIONS[0].value);
  const [audience, setAudience] = useState('science');
  const [format, setFormat] = useState(formatOptions[0].value);
  const [step, setStep] = useState(0); // 0: topic, 1: goal, ...
  const [answers, setAnswers] = useState<string[]>([]); // Store user answers for summary
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFileContent, setAttachedFileContent] = useState<string | null>(null);
  const [showFileTypeError, setShowFileTypeError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [structuredDocResponse, setStructuredDocResponse] = useState<null | {
    summary: string;
    structure: { title: string; description: string; date?: string }[];
    next_question: string;
  }>(null);
  const [canGenerateStoryboard, setCanGenerateStoryboard] = useState(false);
  const [generatedStoryboard, setGeneratedStoryboard] = useState<any[] | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getAudienceLabel = (value: string) => {
    return audienceOptions.find(opt => opt.value === value)?.label || value;
  };

  const getFormatLabel = (value: string) => {
    return formatOptions.find(opt => opt.value === value)?.label || value;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCanGenerateStoryboard(true);

    let aiMessage = '';
    let nextStep = step;

    // If still in leading questions, store answer and ask next
    if (step < LEADING_QUESTIONS.length) {
      setAnswers(prev => [...prev, input]);
      aiMessage = LEADING_QUESTIONS[step];
      nextStep = step + 1;
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai' as const, text: aiMessage },
        ]);
        setIsLoading(false);
        setStep(nextStep);
      }, 800);
      return;
    }

    // After last leading question, generate summary with ChatGPT
    if (step === LEADING_QUESTIONS.length) {
      const allAnswers = [...answers, input];
      setAnswers(allAnswers);
      // Compose a system prompt for summary
      let fileContext = '';
      if (attachedFile && attachedFileContent) {
        fileContext = `\n\nAttached file: ${attachedFile.name}\nContent:\n${attachedFileContent}`;
      } else if (attachedFile) {
        fileContext = `\n\nAttached file: ${attachedFile.name}`;
      }
      const systemPrompt = `You are an expert video content planner. Summarize the user's video plan in an organized, clear way. Include the following:
- Main topic/subject
- Goal/message
- Tone/style
- Key points/characters
- Time period/years
- Story progression (beginning, conflict, development, resolution, ending)
- Format: ${format}
- Duration: ${duration}
- Target Audience: ${audienceOptions.find(opt => opt.value === audience)?.label || audience}
${fileContext}

End with: "Click 'Generate Storyboard' when you're ready to see your story laid out as a storyboard, or let me know if you want to make changes."`;
      const summaryMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Main topic/subject: ${allAnswers[0] || ''}` },
        { role: 'user', content: `Goal/message: ${allAnswers[1] || ''}` },
        { role: 'user', content: `Tone/style: ${allAnswers[2] || ''}` },
        { role: 'user', content: `Key points/characters: ${allAnswers[3] || ''}` },
        { role: 'user', content: `Time period/years: ${allAnswers[4] || ''}` },
        { role: 'user', content: `Story beginning: ${allAnswers[5] || ''}` },
        { role: 'user', content: `Main conflict: ${allAnswers[6] || ''}` },
        { role: 'user', content: `Development/escalation: ${allAnswers[7] || ''}` },
        { role: 'user', content: `Resolution: ${allAnswers[8] || ''}` },
        { role: 'user', content: `Ending/takeaway: ${allAnswers[9] || ''}` },
      ];
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: summaryMessages,
            temperature: 0.5,
          }),
        });
        if (!response.ok) throw new Error('Failed to get summary from AI');
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        setMessages((prev) => [
          ...prev,
          { sender: 'ai' as const, text: aiResponse },
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai' as const, text: 'Sorry, I had trouble generating the summary. Please try again.' },
        ]);
      } finally {
        setIsLoading(false);
        setStep(step + 1); // Move to confirmation step
        setCanGenerateStoryboard(true);
      }
      return;
    }

    // After confirmation, proceed as before (e.g., offer to generate scenes)
    aiMessage = "Thanks for confirming! Would you like me to help outline your video or suggest scene ideas now? Just say 'yes' to proceed or let me know if you want to add more info.";
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai' as const, text: aiMessage },
      ]);
      setIsLoading(false);
      setStep(step + 1);
    }, 800);
  };

  const handleGenerateOutline = () => {
    // After planning, go to storyboard page
    navigate('/story-board');
  };

  // Handle file upload
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAttachedFile(file || null);
    if (!file) {
      setAttachedFileContent(null);
      return;
    }

    // Only allow .txt or .docx
    const isText = file.type.startsWith('text/');
    const isDocx = file.name.endsWith('.docx');
    if (!isText && !isDocx) {
      setShowFileTypeError(true);
      setTimeout(() => setShowFileTypeError(false), 3500);
      setAttachedFile(null);
      setAttachedFileContent(null);
      return;
    }

    setIsLoading(true);
    setCanGenerateStoryboard(true);
    setMessages((prev) => [
      ...prev,
      { sender: 'user' as const, text: `Attached file: ${file.name}` },
    ]);

    let fileContent: string | null = null;
    if (isText) {
      fileContent = await file.text();
      fileContent = fileContent.slice(0, 4000); // Limit to 4000 chars for context
      setAttachedFileContent(fileContent);
    } else if (isDocx) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        fileContent = result.value.slice(0, 4000); // Limit to 4000 chars for context
        setAttachedFileContent(fileContent);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai' as const, text: 'Sorry, I could not read the .docx file. Please try a different file or provide the text directly.' },
        ]);
        setIsLoading(false);
        return;
      }
    }

    // Request a structured JSON response from ChatGPT
    let prompt = `The user has uploaded a document for a video story. Please:
1. Give a brief summary of the story.
2. Suggest an organizational structure for the story as an array of scenes/sections, each with a title, description, and (if possible) date or time period.
3. Ask only one clear follow-up question to clarify or complete the story plan.

Return your response as a JSON object with the following fields:
{
  "summary": string,
  "structure": [
    { "title": string, "description": string, "date"?: string }
  ],
  "next_question": string
}

Document Content:
${fileContent}`;
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
            { role: 'system', content: 'You are an expert video content planner and story coach.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
        }),
      });
      if (!response.ok) throw new Error('Failed to get summary from AI');
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      // Try to parse JSON
      try {
        const parsed = JSON.parse(aiResponse);
        setStructuredDocResponse(parsed);
        setMessages((prev) => [
          ...prev,
          { sender: 'ai' as const, text: '[structured-doc-response]' },
        ]);
      } catch (err) {
        setStructuredDocResponse(null);
        setMessages((prev) => [
          ...prev,
          { sender: 'ai' as const, text: aiResponse },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai' as const, text: 'Sorry, I had trouble processing the attached file. Please try again or provide more details.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    setIsLoading(true);
    let context = '';
    let storyboardInfo: any = null;
    if (structuredDocResponse) {
      context = `Summary: ${structuredDocResponse.summary}\nStructure: ${structuredDocResponse.structure.map(s => `${s.title}: ${s.description}${s.date ? ` (${s.date})` : ''}`).join('\n')}`;
      storyboardInfo = structuredDocResponse;
    } else {
      context = answers.join('\n');
      storyboardInfo = { answers };
    }
    const prompt = `Based on the following story information, generate a storyboard outline as a JSON array of sections. Each section should have:
- label (e.g., 'Hook', 'Exposition', etc.)
- recommended duration (e.g., '10 sec', '1 min')
- scenes: an array of { title, description, bullets (optional) }

The sections should be:
1. Hook (Opening Image): Grabs the audience's attention—could be an intriguing question, a striking visual, or a bit of tension. It hints at the world you're about to enter and makes people want to keep reading/viewing.
2. Exposition (Setup): Introduces your protagonist, their "ordinary world," and what's at stake. You establish tone, setting, key relationships, and the status quo before things change.
3. Inciting Incident (Call to Adventure): The event that shakes up the protagonist's world and forces them into the main story. Without it, there'd be no journey.
4. Rising Action (Conflict & Complications): A series of challenges or obstacles that escalate the stakes. The hero makes choices, learns, and is pushed out of their comfort zone.
5. Midpoint (Point of No Return): A pivot where the stakes get personal: a big revelation, a victory that turns sour, or a defeat that forces a new approach. It re-energizes the narrative drive.
6. Climax (Peak Confrontation): The ultimate showdown or emotional high point. All the tension built during the rising action comes to a head.
7. Falling Action: The immediate aftermath of the climax—wrapping up subplots, showing consequences, and beginning to resolve loose ends.
8. Resolution (Denouement): Returns the story to a new equilibrium. You show how the protagonist has changed and what their "new normal" looks like.
9. (Optional) Epilogue: Offers a final glimpse beyond the resolution—perhaps a hint at future adventures or to underscore theme.

For each section, provide a recommended duration, and for each scene, include a title, description, and optionally bullet points for details. Return ONLY a JSON array like:
[
  {
    "label": string,
    "duration": string,
    "scenes": [
      { "title": string, "description": string, "bullets"?: string[] }
    ]
  }, ...
]

Story information:
${context}`;
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
            { role: 'system', content: 'You are an expert video content planner and storyboard creator.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
        }),
      });
      if (!response.ok) throw new Error('Failed to generate storyboard');
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      let sections = null;
      try {
        sections = JSON.parse(aiResponse);
      } catch (err) {
        const match = aiResponse.match(/\[.*\]/s);
        if (match) {
          sections = JSON.parse(match[0]);
        }
      }
      if (sections && Array.isArray(sections)) {
        setGeneratedStoryboard(sections);
        const payload = { storyboardInfo, sections };
        localStorage.setItem('storyboardInfo', JSON.stringify(payload));
        navigate('/story-board', { state: payload });
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai' as const, text: 'Sorry, I could not generate a storyboard. Please try again.' },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai' as const, text: 'Sorry, I had trouble generating the storyboard. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-gradient-to-br from-[#d1cfff] via-[#fbe2d2] to-[#e0e7ff] dark:from-purple-600 dark:to-orange-500">
      <div className="w-full max-w-3xl">
        <StickyTopBar
          onBack={() => navigate(-1)}
          breadcrumbTrail={['Story Planner', 'Story Board', 'Preview']}
          currentStep={0}
        />
      </div>
      {/* Main Card */}
      <div className="w-full max-w-3xl mt-8 mb-16 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-[#ece6fa] dark:border-slate-800 p-8 flex flex-col gap-8">
        <h2 className="text-2xl font-bold text-slate-700 dark:text-white mb-4">Let's plan your video!</h2>
        
        {/* Format and Duration Selectors */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-white mb-1">Format</label>
            <Select
              value={format}
              onChange={(value: string) => setFormat(value)}
              options={formatOptions}
              className={selectClass}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-white mb-1">Duration</label>
            <Select
              value={duration}
              onChange={(value: string) => setDuration(value)}
              options={TIME_OPTIONS}
              className={selectClass}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-white mb-1">Target Audience</label>
            <Select
              value={audience}
              onChange={(value: string) => setAudience(value)}
              options={audienceOptions}
              className={selectClass}
            />
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 min-h-[220px] border border-slate-100 dark:border-slate-700">
            {messages.map((message, index) => (
              message.text === '[structured-doc-response]' && structuredDocResponse ? (
                <div key={index} className="flex w-full justify-start mb-2">
                  <div className="rounded-2xl px-4 py-2 max-w-[75%] break-words shadow-sm bg-gradient-to-br from-[#d1cfff] via-[#fbe2d2] to-[#e0e7ff] text-slate-700 dark:from-purple-600 dark:to-orange-500 dark:text-white">
                    <div className="mb-2">
                      <strong>Summary:</strong> {structuredDocResponse.summary}
                    </div>
                    <div className="mb-2">
                      <strong>Suggested Structure:</strong>
                      <ol className="list-decimal ml-5">
                        {structuredDocResponse.structure.map((scene, i) => (
                          <li key={i} className="mb-1">
                            <span className="font-semibold">{scene.title}</span>
                            {scene.date && <span className="ml-2 text-xs text-slate-500">({scene.date})</span>}
                            <div>{scene.description}</div>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="mt-2">
                      <strong>Next Question:</strong> {structuredDocResponse.next_question}
                    </div>
                  </div>
                </div>
              ) : (
                <MessageBubble key={index} message={message} />
              )
            ))}
            {isLoading && (
              <div className="flex w-full justify-start mb-2">
                <div className="rounded-2xl px-4 py-2 max-w-[75%] bg-gradient-to-r from-blue-400 to-purple-400 text-white dark:from-blue-700 dark:to-purple-700 dark:text-white flex items-center">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-300 opacity-80 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-300 opacity-80 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-300 opacity-80 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
          
          {/* Input Area */}
          <div className="flex gap-2 mt-2 items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border border-[#e5e7eb] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
            />
            <label className="cursor-pointer flex items-center gap-1 px-3 py-2 rounded-lg bg-[#e6f0fa] text-slate-700 border border-[#e5e7eb] dark:border-slate-700 hover:bg-blue-100 relative">
              <span role="img" aria-label="attach">📎</span>
              <span>Attach file</span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              {showFileTypeError && (
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-red-500 text-white text-xs rounded px-3 py-1 shadow z-10 whitespace-nowrap">
                  Only .txt or .docx files are allowed.
                </span>
              )}
            </label>
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 rounded-lg bg-[#a78bfa] hover:bg-[#8b5cf6] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Message
            </Button>
            {attachedFile && (
              <span className="ml-2 text-xs text-slate-500 truncate max-w-[120px]" title={attachedFile.name}>
                {attachedFile.name}
              </span>
            )}
          </div>
          {(attachedFile || (answers.length >= 5) || structuredDocResponse) && (
            <Button
              onClick={handleGenerateStoryboard}
              disabled={isLoading}
              className="w-full mt-4 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-orange-400 text-white font-bold text-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Storyboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryboardPlanner; 