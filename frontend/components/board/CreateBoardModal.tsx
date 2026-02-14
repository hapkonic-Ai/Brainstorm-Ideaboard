'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { TEMPLATES } from '@/lib/templates';
import { boardApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CreateBoardModalProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBoardModal({ workspaceId, open, onOpenChange }: CreateBoardModalProps) {
  const { addBoard } = useAppStore();
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [customSections, setCustomSections] = useState([
    { name: '', color: '#3B82F6' },
  ]);
  const [loading, setLoading] = useState(false);

  function addCustomSection() {
    if (customSections.length >= 10) return;
    setCustomSections((prev) => [...prev, { name: '', color: '#94A3B8' }]);
  }

  function removeCustomSection(index: number) {
    setCustomSections((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCustomSection(index: number, field: string, value: string) {
    setCustomSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast({ title: 'Board name is required', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const payload: {
        workspaceId: string;
        name: string;
        templateType: string;
        customSections?: { name: string; color?: string }[];
      } = {
        workspaceId,
        name: name.trim(),
        templateType: selectedTemplate,
      };

      if (selectedTemplate === 'custom') {
        payload.customSections = customSections.filter((s) => s.name.trim());
      }

      const res = await boardApi.create(payload);
      addBoard(res.data.board);
      toast({ title: 'Board created!' });
      onOpenChange(false);
      setName('');
      setSelectedTemplate('custom');
      setCustomSections([{ name: '', color: '#3B82F6' }]);
    } catch {
      toast({ title: 'Failed to create board', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Board name */}
          <div className="space-y-2">
            <Label htmlFor="board-name">Board Name</Label>
            <Input
              id="board-name"
              placeholder="e.g. Sprint 42 Retrospective"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          {/* Template selection */}
          <div className="space-y-3">
            <Label>Choose Template</Label>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={cn(
                    'flex flex-col gap-2 p-4 rounded-xl border-2 text-left transition-all hover:border-blue-300',
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{template.icon}</span>
                    <span className="font-semibold text-sm text-gray-900">{template.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{template.description}</p>

                  {template.sections.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.sections.map((s) => (
                        <span
                          key={s.name}
                          className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                          style={{ backgroundColor: s.color }}
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom sections */}
          {selectedTemplate === 'custom' && (
            <div className="space-y-3">
              <Label>Custom Sections</Label>
              <div className="space-y-2">
                {customSections.map((section, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={section.color}
                      onChange={(e) => updateCustomSection(index, 'color', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                    <Input
                      placeholder={`Section ${index + 1} name`}
                      value={section.name}
                      onChange={(e) => updateCustomSection(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    {customSections.length > 1 && (
                      <button
                        onClick={() => removeCustomSection(index)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {customSections.length < 10 && (
                  <button
                    onClick={addCustomSection}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Section
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create Board'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
