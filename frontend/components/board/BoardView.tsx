'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { Plus, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { boardApi, sectionApi, cardApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { toast } from '@/components/ui/use-toast';
import { SectionColumn } from '@/components/section/SectionColumn';
import { CardItem } from '@/components/cards/CardItem';
import { Section, Card } from '@/types';

const DROP_ANIMATION: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.5' } },
  }),
};

interface BoardViewProps {
  boardId: string;
}

export function BoardView({ boardId }: BoardViewProps) {
  const {
    sections,
    setSections,
    addSection,
    reorderSections,
    moveCard,
    reorderCards,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  // DnD active item tracking
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Load board data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await boardApi.getOne(boardId);
        setSections(res.data.board.sections || []);
      } catch {
        toast({ title: 'Failed to load board', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    load();

    // Join socket room
    const socket = getSocket();
    socket?.emit('board:join', { boardId });

    return () => {
      socket?.emit('board:leave', { boardId });
    };
  }, [boardId]);

  const sectionIds = sections.map((s) => s.id);

  // ─── DnD Handlers ─────────────────────────────────────────────────────────

  function onDragStart({ active }: DragStartEvent) {
    const data = active.data.current;
    if (data?.type === 'section') setActiveSection(data.section as Section);
    if (data?.type === 'card') setActiveCard(data.card as Card);
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData) return;

    // Card being dragged over a different section
    if (activeData.type === 'card' && overData?.type === 'section') {
      const card = activeData.card as Card;
      const targetSectionId = over.id as string;

      if (card.sectionId !== targetSectionId) {
        moveCard({ ...card, sectionId: targetSectionId }, card.sectionId, targetSectionId);
        // Update the active card's section reference for subsequent events
        activeData.card = { ...card, sectionId: targetSectionId };
      }
    }

    // Card being dragged over another card in a different section
    if (activeData.type === 'card' && overData?.type === 'card') {
      const activeCard = activeData.card as Card;
      const overCard = overData.card as Card;

      if (activeCard.sectionId !== overCard.sectionId) {
        moveCard(
          { ...activeCard, sectionId: overCard.sectionId },
          activeCard.sectionId,
          overCard.sectionId
        );
        activeData.card = { ...activeCard, sectionId: overCard.sectionId };
      }
    }
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveSection(null);
    setActiveCard(null);

    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Reorder sections
    if (activeData?.type === 'section' && overData?.type === 'section') {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(sections, oldIndex, newIndex);
        reorderSections(reordered.map((s) => s.id));

        try {
          await sectionApi.reorder({
            boardId,
            orderedIds: reordered.map((s) => s.id),
          });
          getSocket()?.emit('section:reorder', {
            boardId,
            orderedIds: reordered.map((s) => s.id),
          });
        } catch {
          toast({ title: 'Failed to save section order', variant: 'destructive' });
        }
      }
      return;
    }

    // Reorder cards within section or move between sections
    if (activeData?.type === 'card') {
      const card = activeData.card as Card;
      const targetSection = sections.find((s) => s.id === card.sectionId);
      if (!targetSection) return;

      const cards = targetSection.cards.slice().sort((a, b) => a.position - b.position);
      const activeIdx = cards.findIndex((c) => c.id === active.id);
      const overIdx = overData?.type === 'card'
        ? cards.findIndex((c) => c.id === over.id)
        : cards.length - 1;

      if (activeIdx !== -1 && overIdx !== -1 && activeIdx !== overIdx) {
        const reordered = arrayMove(cards, activeIdx, overIdx);
        reorderCards(card.sectionId, reordered.map((c) => c.id));

        try {
          await cardApi.reorder({
            sectionId: card.sectionId,
            orderedIds: reordered.map((c) => c.id),
          });
          getSocket()?.emit('card:reorder', {
            boardId,
            sectionId: card.sectionId,
            orderedIds: reordered.map((c) => c.id),
          });
        } catch {
          // Try move API if different section
          try {
            const res = await cardApi.move(card.id, {
              sectionId: card.sectionId,
              position: overIdx,
            });
            getSocket()?.emit('card:move', {
              boardId,
              card: res.data.card,
              fromSectionId: activeData.sectionId,
              toSectionId: card.sectionId,
            });
          } catch {
            toast({ title: 'Failed to move card', variant: 'destructive' });
          }
        }
      } else if (activeData.sectionId !== card.sectionId) {
        // Cross-section move without overlap
        try {
          const res = await cardApi.move(card.id, {
            sectionId: card.sectionId,
            position: cards.length,
          });
          getSocket()?.emit('card:move', {
            boardId,
            card: res.data.card,
            fromSectionId: activeData.sectionId,
            toSectionId: card.sectionId,
          });
        } catch {
          toast({ title: 'Failed to move card', variant: 'destructive' });
        }
      }
    }
  }

  async function handleAddSection() {
    if (!newSectionName.trim()) {
      setAddingSection(false);
      return;
    }
    try {
      const res = await sectionApi.create({ boardId, name: newSectionName.trim() });
      addSection(res.data.section);
      getSocket()?.emit('section:create', { boardId, section: res.data.section });
      setNewSectionName('');
      setAddingSection(false);
    } catch {
      toast({ title: 'Failed to add section', variant: 'destructive' });
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 p-6 h-full items-start min-w-max">
          <SortableContext items={sectionIds} strategy={horizontalListSortingStrategy}>
            {sections
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((section) => (
                <SectionColumn key={section.id} section={section} boardId={boardId} />
              ))}
          </SortableContext>

          {/* Add section */}
          {addingSection ? (
            <div className="w-72 shrink-0 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-4 space-y-3">
              <input
                autoFocus
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Section name..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSection();
                  if (e.key === 'Escape') { setAddingSection(false); setNewSectionName(''); }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddSection}
                  className="flex-1 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Section
                </button>
                <button
                  onClick={() => { setAddingSection(false); setNewSectionName(''); }}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingSection(true)}
              className="w-72 shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all group"
            >
              <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Add Section</span>
            </button>
          )}
        </div>

        {/* Drag overlay */}
        {typeof document !== 'undefined' &&
          createPortal(
            <DragOverlay dropAnimation={DROP_ANIMATION}>
              {activeSection && (
                <SectionColumn section={activeSection} boardId={boardId} isDragOverlay />
              )}
              {activeCard && (
                <CardItem card={activeCard} boardId={boardId} isDragOverlay />
              )}
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </div>
  );
}
