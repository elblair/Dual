import { Activity, BookOpen, Code, Dumbbell, Globe, Leaf, Music, Palette, Utensils, type LucideIcon } from 'lucide-react-native';

/** Lucide's dumbbell is drawn diagonally; the design's is horizontal. */
export const hobbyIconRotation: Record<string, string> = { gym: '45deg' };

export const hobbyIcons: Record<string, LucideIcon> = {
  guitar: Music,
  running: Activity,
  spanish: Globe,
  gym: Dumbbell,
  reading: BookOpen,
  drawing: Palette,
  cooking: Utensils,
  coding: Code,
  meditation: Leaf,
};
