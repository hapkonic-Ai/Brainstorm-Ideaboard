'use client';

import { useState, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react';
import { Section } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { sectionApi } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { getSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { CardItem } from '@/components/cards/CardItem';
import { AddCardButton } from '@/components/cards/AddCardButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SectionColumnProps {
  section: Section;
  boardId: string;
  isDragOverlay?: boolean;
}

export function SectionColumn({ section, boardId, isDragOverlay = false }: SectionColumnProps) {
  const { updateSection, removeSection } = useAppStore();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(section.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: { type: 'section', section },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: section.id,
    data: { type: 'section', sectionId: section.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardIds = section.cards.map((c) => c.id);

  function setRef(el: HTMLElement | null) {
    setSortableRef(el);
    setDropRef(el);
  }

  async function handleRename() {
    if (!newName.trim() || newName === section.name) {
      setIsRenaming(false);
      setNewName(section.name);
      return;
    }
    try {
      const res = await sectionApi.update(section.id, { name: newName.trim() });
      updateSection(res.data.section);
      getSocket()?.emit('section:update', { boardId, section: res.data.section });
      setIsRenaming(false);
    } catch {
      toast({ title: 'Failed to rename section', variant: 'destructive' });
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${section.name}" and all its cards?`)) return;
    try {
      await sectionApi.delete(section.id);
      removeSection(section.id);
      getSocket()?.emit('section:delete', { boardId, sectionId: section.id });
    } catch {
      toast({ title: 'Failed to delete section', variant: 'destructive' });
    }
  }

  if (isDragging && !isDragOverlay) {
    return (
      <div
        ref={setSortableRef}
        style={style}
        className="w-72 shrink-0 h-24 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/30"
      />
    );
  }

  return (
    <div
      ref={setRef}
      style={style}
      className={cn(
        'w-72 shrink-0 flex flex-col rounded-2xl bg-gray-50 border border-gray-200 shadow-sm max-h-full',
        isDragOverlay && 'shadow-2xl rotate-1 opacity-95',
        isOver && !isDragOverlay && 'ring-2 ring-blue-400 ring-offset-1'
      )}
    >
      {/* Section header */}
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-t-2xl border-b border-gray-200"
        style={{ borderTopColor: section.color || '#94A3B8' }}
      >
        {/* Color stripe */}
        <div
          className="w-1 h-6 rounded-full shrink-0"
          style={{ backgroundColor: section.color || '#94A3B8' }}
        />

        {/* Drag handle for section */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Name */}
        {isRenaming ? (
          <div className="flex-1 flex items-center gap-1">
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 text-sm font-semibold bg-white border border-blue-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') { setIsRenaming(false); setNewName(section.name); }
              }}
              autoFocus
            />
            <button onClick={handleRename} className="p-0.5 text-green-600 hover:text-green-700">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setIsRenaming(false); setNewName(section.name); }}
              className="p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <h3 className="flex-1 text-sm font-semibold text-gray-800 truncate">{section.name}</h3>
        )}

        {/* Card count badge */}
        <span className="text-xs font-medium text-gray-500 bg-gray-200 rounded-full px-2 py-0.5 shrink-0">
          {section.cards.length}
        </span>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => { setIsRenaming(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[60px]">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {section.cards
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((card) => (
              <CardItem key={card.id} card={card} boardId={boardId} />
            ))}
        </SortableContext>

        {/* Drop zone visual when empty */}
        {section.cards.length === 0 && (
          <div
            className={cn(
              'h-12 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400',
              isOver && 'border-blue-300 bg-blue-50/40 text-blue-500'
            )}
          >
            {isOver ? 'Drop here' : 'Empty'}
          </div>
        )}
      </div>

      {/* Add card */}
      <div className="p-2 border-t border-gray-200">
        <AddCardButton sectionId={section.id} boardId={boardId} />
      </div>
    </div>
  );
}
