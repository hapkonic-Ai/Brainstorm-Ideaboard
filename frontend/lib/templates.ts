import { Template } from '@/types';

export const TEMPLATES: Template[] = [
  {
    id: 'starfish',
    name: 'Starfish Retrospective',
    description: 'Reflect on team practices with 5 categories to improve collaboration.',
    icon: '⭐',
    sections: [
      { name: 'Keep Doing', color: '#22C55E' },
      { name: 'Stop Doing', color: '#EF4444' },
      { name: 'Start Doing', color: '#3B82F6' },
      { name: 'More Of', color: '#F59E0B' },
      { name: 'Less Of', color: '#8B5CF6' },
    ],
  },
  {
    id: 'six_hats',
    name: 'Six Thinking Hats',
    description: 'Explore ideas from six different perspectives for balanced thinking.',
    icon: '🎩',
    sections: [
      { name: 'White Hat (Facts)', color: '#94A3B8' },
      { name: 'Red Hat (Emotions)', color: '#EF4444' },
      { name: 'Black Hat (Caution)', color: '#1E293B' },
      { name: 'Yellow Hat (Optimism)', color: '#EAB308' },
      { name: 'Green Hat (Creativity)', color: '#22C55E' },
      { name: 'Blue Hat (Process)', color: '#3B82F6' },
    ],
  },
  {
    id: 'pros_cons',
    name: 'Pros & Cons',
    description: 'Simple and effective analysis of advantages and disadvantages.',
    icon: '⚖️',
    sections: [
      { name: 'Pros', color: '#22C55E' },
      { name: 'Cons', color: '#EF4444' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Board',
    description: 'Create your own board with custom sections tailored to your needs.',
    icon: '✨',
    sections: [],
  },
];

export const SECTION_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Gray', value: '#94A3B8' },
  { name: 'Dark', value: '#1E293B' },
];

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
