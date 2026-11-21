import {
  Activity,
  Bike,
  BookOpen,
  Cake,
  Camera,
  Code,
  Drum,
  Dumbbell,
  Flower2,
  Globe,
  GraduationCap,
  Languages,
  Leaf,
  Mic,
  Music,
  NotebookPen,
  Palette,
  PenLine,
  Piano,
  PersonStanding,
  Scissors,
  Utensils,
  Waves,
  type LucideIcon,
} from 'lucide-react-native';

/** Lucide's dumbbell is drawn diagonally; the design's is horizontal. */
export const hobbyIconRotation: Record<string, string> = { gym: '45deg' };
export const categoryIconRotation: Record<string, string> = { fitness: '45deg' };

/** One icon per hobby id (Today and Duel cards). Every id in the catalog needs one. */
export const hobbyIcons: Record<string, LucideIcon> = {
  guitar: Music,
  piano: Piano,
  singing: Mic,
  drums: Drum,
  running: Activity,
  gym: Dumbbell,
  yoga: PersonStanding,
  cycling: Bike,
  swimming: Waves,
  spanish: Globe,
  french: Languages,
  japanese: Languages,
  mandarin: Languages,
  german: Languages,
  drawing: Palette,
  writing: PenLine,
  photography: Camera,
  crafts: Scissors,
  reading: BookOpen,
  coding: Code,
  studying: GraduationCap,
  meditation: Leaf,
  journaling: NotebookPen,
  stretching: Flower2,
  cooking: Utensils,
  baking: Cake,
};

/** One icon per category id (the tiles on the Hobby step). */
export const categoryIcons: Record<string, LucideIcon> = {
  music: Music,
  fitness: Dumbbell,
  languages: Globe,
  creative: Palette,
  learning: BookOpen,
  wellness: Leaf,
  food: Utensils,
};
