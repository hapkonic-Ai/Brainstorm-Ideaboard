'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { cardApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/components/ui/use-toast';
import { getSocket } from '@/lib/socket';

interface AddCardButtonProps {
  sectionId: string;
  boardId: string;
}

export function AddCardButton({ sectionId, boardId }: AddCardButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addCard } = useAppStore();

  useEffect(() => {
    if (isAdding) {
      textareaRef.current?.focus();
    }
  }, [isAdding]);

  async function handleSubmit() {
    if (!content.trim()) {
      setIsAdding(false);
      return;
    }

    setLoading(true);
    try {
      const res = await cardApi.create({ sectionId, content: content.trim() });
      addCard(res.data.card);
      getSocket()?.emit('card:create', { boardId, card: res.data.card });
      setContent('');
      setIsAdding(false);
    } catch {
      toast({ title: 'Failed to add card', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  if (isAdding) {
    return (
      <div className="p-2 space-y-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your idea..."
          className="w-full p-3 text-sm border border-blue-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
            if (e.key === 'Escape') {
              setIsAdding(false);
              setContent('');
            }
          }}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className="flex-1 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Card'}
          </button>
          <button
            onClick={() => { setIsAdding(false); setContent(''); }}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsAdding(true)}
      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors group"
    >
      <Plus className="h-4 w-4 group-hover:text-blue-600 transition-colors" />
      <span>Add a card</span>
    </button>
  );
}
