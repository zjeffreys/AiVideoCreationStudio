import React from 'react';
import { Pencil, Trash, Mic2 } from 'lucide-react';
import { Character } from '../../types';
import { Button } from '../ui/Button';

type CharacterCardProps = {
  character: Character;
  onEdit: (character: Character) => void;
  onDelete: (id: string) => void;
};

export const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 shadow-sm transition-all hover:shadow-md">
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-purple-100 text-purple-500 dark:bg-purple-900/50 dark:text-purple-400">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{character.name}</h3>
        
        <p className="mb-4 mt-1 text-sm text-slate-500 dark:text-slate-300 line-clamp-2">
          {character.personality || 'No personality traits defined.'}
        </p>
        
        {character.voice_id && (
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-400 dark:text-slate-400">
            <Mic2 className="h-4 w-4" />
            <span>Voice assigned</span>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Pencil className="h-4 w-4" />}
            onClick={() => onEdit(character)}
            className="border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-300"
            leftIcon={<Trash className="h-4 w-4" />}
            onClick={() => onDelete(character.id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};