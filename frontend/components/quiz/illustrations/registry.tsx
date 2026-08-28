// Declarative "recipes" for the quiz's picture stand-ins — hand-authored,
// pre-seeded, flat-illustration icons that replace bare emoji. Each recipe
// is plain data (a shape list), not a component, so QuizIllustration.tsx can
// render any of them the same way. Keep new shapes to primitives only —
// no external assets, no gradients.

export type IconShape =
  | { t: "circle"; cx: number; cy: number; r: number; fill: string; stroke?: string; sw?: number; opacity?: number }
  | { t: "ellipse"; cx: number; cy: number; rx: number; ry: number; fill: string; stroke?: string; sw?: number; rotate?: number; opacity?: number }
  | { t: "rect"; x: number; y: number; w: number; h: number; rx?: number; fill: string; stroke?: string; sw?: number; opacity?: number }
  | { t: "path"; d: string; fill?: string; stroke?: string; sw?: number; cap?: "round" | "square"; opacity?: number }
  | { t: "polygon"; points: string; fill: string; stroke?: string; sw?: number; opacity?: number }
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; stroke: string; sw?: number; cap?: "round" };

export interface IconRecipe {
  viewBox?: string; // default "0 0 100 100" if omitted
  shapes: IconShape[];
}

// One shared palette for the whole set (same family as Mascot.tsx's panda —
// INK is its PANDA_BLACK, PINK its cheek color) so every icon reads as part
// of the same illustrated world, whichever category it's drawn from.
const INK = "#2B2B2B";
const WHITE = "#FFFFFF";
const RED = "#E8604C";
const ORANGE = "#F2954B";
const YELLOW = "#F7C948";
const GREEN = "#6FBF73";
const DGREEN = "#4C9A54";
const BLUE = "#5AA9E6";
const LBLUE = "#BEE3F8";
const BROWN = "#A5713A";
const TAN = "#E7C89A";
const PINK = "#FF9EB1";
const PURPLE = "#9B7EDE";
const GRAY = "#B7BCC5";

// Small builders for shapes that repeat across many icons (ground shadow,
// legs, eye dots, a little leaf) so each recipe below stays mostly data.
const shadow = (cx: number, cy: number, rx = 18, ry = 5): IconShape => ({
  t: "ellipse", cx, cy, rx, ry, fill: INK, opacity: 0.12,
});
const leg = (x: number, y: number, w = 5, h = 9, color = INK): IconShape => ({
  t: "rect", x, y, w, h, rx: 2, fill: color,
});
const eye = (cx: number, cy: number, r = 2.2, color = INK): IconShape => ({
  t: "circle", cx, cy, r, fill: color,
});
const leaf = (cx: number, cy: number, rot = 20, color = DGREEN, scale = 1): IconShape => ({
  t: "ellipse", cx, cy, rx: 5.5 * scale, ry: 3 * scale, fill: color, rotate: rot,
});

export const ICON_REGISTRY: Record<string, IconRecipe> = {
  // ---------------------------------------------------------------------
  // Shapes
  // ---------------------------------------------------------------------
  circle: {
    shapes: [
      shadow(50, 88, 26, 5),
      { t: "circle", cx: 50, cy: 50, r: 32, fill: BLUE, stroke: INK, sw: 3 },
      { t: "circle", cx: 40, cy: 40, r: 8, fill: WHITE, opacity: 0.35 },
    ],
  },
  square: {
    shapes: [
      shadow(50, 88, 26, 5),
      { t: "rect", x: 18, y: 18, w: 64, h: 64, rx: 8, fill: ORANGE, stroke: INK, sw: 3 },
      { t: "rect", x: 26, y: 26, w: 16, h: 16, rx: 3, fill: WHITE, opacity: 0.35 },
    ],
  },
  triangle: {
    shapes: [
      shadow(50, 88, 26, 5),
      { t: "polygon", points: "50,14 88,82 12,82", fill: GREEN, stroke: INK, sw: 3 },
      { t: "circle", cx: 50, cy: 54, r: 6, fill: WHITE, opacity: 0.3 },
    ],
  },
  rectangle: {
    shapes: [
      shadow(50, 84, 30, 5),
      { t: "rect", x: 8, y: 28, w: 84, h: 44, rx: 8, fill: PURPLE, stroke: INK, sw: 3 },
      { t: "rect", x: 16, y: 36, w: 18, h: 12, rx: 3, fill: WHITE, opacity: 0.3 },
    ],
  },
  oval: {
    shapes: [
      shadow(50, 84, 30, 5),
      { t: "ellipse", cx: 50, cy: 50, rx: 38, ry: 24, fill: PINK, stroke: INK, sw: 3 },
      { t: "ellipse", cx: 38, cy: 42, rx: 8, ry: 5, fill: WHITE, opacity: 0.35 },
    ],
  },
  star: {
    shapes: [
      shadow(50, 88, 26, 5),
      { t: "polygon", points: "50,12 59,38 86,38 64,55 72,81 50,65 28,81 36,55 14,38 41,38", fill: YELLOW, stroke: INK, sw: 3 },
    ],
  },
  hexagon: {
    shapes: [
      shadow(50, 90, 28, 5),
      { t: "polygon", points: "50,14 81,32 81,68 50,86 19,68 19,32", fill: RED, stroke: INK, sw: 3 },
      { t: "circle", cx: 42, cy: 32, r: 5, fill: WHITE, opacity: 0.3 },
    ],
  },
  pentagon: {
    shapes: [
      shadow(50, 86, 26, 5),
      { t: "polygon", points: "50,16 84,41 71,81 29,81 16,41", fill: DGREEN, stroke: INK, sw: 3 },
      { t: "circle", cx: 42, cy: 34, r: 5, fill: WHITE, opacity: 0.3 },
    ],
  },

  // ---------------------------------------------------------------------
  // Animals
  // ---------------------------------------------------------------------
  elephant: {
    shapes: [
      shadow(52, 90, 30, 6),
      leg(34, 74, 7, 13, GRAY),
      leg(60, 74, 7, 13, GRAY),
      { t: "ellipse", cx: 52, cy: 62, rx: 27, ry: 19, fill: GRAY, stroke: INK, sw: 2 },
      { t: "ellipse", cx: 26, cy: 40, rx: 13, ry: 15, fill: TAN, stroke: INK, sw: 1.5 },
      { t: "circle", cx: 30, cy: 38, r: 16, fill: GRAY, stroke: INK, sw: 2 },
      { t: "path", d: "M20 42 Q8 50 12 64 Q15 70 21 66", fill: GRAY, stroke: INK, sw: 2 },
      eye(26, 34, 2),
    ],
  },
  lion: {
    shapes: [
      shadow(52, 90, 28, 6),
      leg(32, 74, 6, 12, ORANGE),
      leg(60, 74, 6, 12, ORANGE),
      { t: "ellipse", cx: 52, cy: 62, rx: 24, ry: 18, fill: ORANGE, stroke: INK, sw: 2 },
      { t: "path", d: "M46 78 Q64 82 66 68", stroke: BROWN, sw: 5, fill: "none", cap: "round" },
      { t: "circle", cx: 66, cy: 66, r: 3.5, fill: BROWN },
      { t: "circle", cx: 30, cy: 38, r: 17, fill: BROWN },
      { t: "circle", cx: 30, cy: 38, r: 13, fill: TAN, stroke: INK, sw: 2 },
      eye(25, 35, 2),
      eye(35, 35, 2),
      { t: "polygon", points: "28,42 32,42 30,45", fill: INK },
    ],
  },
  tiger: {
    shapes: [
      shadow(52, 90, 28, 6),
      leg(32, 74, 6, 12, ORANGE),
      leg(60, 74, 6, 12, ORANGE),
      { t: "ellipse", cx: 52, cy: 62, rx: 24, ry: 18, fill: ORANGE, stroke: INK, sw: 2 },
      { t: "line", x1: 44, y1: 52, x2: 44, y2: 70, stroke: INK, sw: 2.5, cap: "round" },
      { t: "line", x1: 56, y1: 52, x2: 56, y2: 70, stroke: INK, sw: 2.5, cap: "round" },
      { t: "line", x1: 66, y1: 56, x2: 66, y2: 68, stroke: INK, sw: 2.5, cap: "round" },
      { t: "circle", cx: 30, cy: 38, r: 15, fill: ORANGE, stroke: INK, sw: 2 },
      { t: "ellipse", cx: 30, cy: 43, rx: 8, ry: 6, fill: WHITE },
      { t: "circle", cx: 20, cy: 26, r: 5, fill: ORANGE, stroke: INK, sw: 1.5 },
      { t: "circle", cx: 40, cy: 26, r: 5, fill: ORANGE, stroke: INK, sw: 1.5 },
      eye(25, 35, 2),
      eye(35, 35, 2),
      { t: "polygon", points: "28,42 32,42 30,44", fill: INK },
    ],
  },
  dog: {
    shapes: [
      shadow(52, 90, 26, 6),
      leg(34, 76, 6, 10, TAN),
      leg(58, 76, 6, 10, TAN),
      { t: "ellipse", cx: 52, cy: 64, rx: 22, ry: 16, fill: TAN, stroke: INK, sw: 2 },
      { t: "path", d: "M70 60 Q80 56 78 66", stroke: TAN, sw: 6, fill: "none", cap: "round" },
      { t: "circle", cx: 28, cy: 40, r: 15, fill: TAN, stroke: INK, sw: 2 },
      { t: "ellipse", cx: 16, cy: 38, rx: 6, ry: 10, fill: BROWN, stroke: INK, sw: 1.5, rotate: -15 },
      { t: "ellipse", cx: 36, cy: 48, rx: 9, ry: 7, fill: WHITE },
      eye(24, 36, 2),
      eye(33, 36, 2),
      { t: "circle", cx: 29, cy: 44, r: 2.2, fill: INK },
    ],
  },
  cat: {
    shapes: [
      shadow(52, 90, 24, 6),
      leg(36, 76, 5, 9, GRAY),
      leg(56, 76, 5, 9, GRAY),
      { t: "ellipse", cx: 50, cy: 64, rx: 19, ry: 15, fill: GRAY, stroke: INK, sw: 2 },
      { t: "path", d: "M68 62 Q80 58 76 44", stroke: GRAY, sw: 5, fill: "none", cap: "round" },
      { t: "circle", cx: 28, cy: 42, r: 14, fill: GRAY, stroke: INK, sw: 2 },
      { t: "polygon", points: "18,32 24,32 20,20", fill: GRAY, stroke: INK, sw: 1.5 },
      { t: "polygon", points: "32,32 38,32 36,20", fill: GRAY, stroke: INK, sw: 1.5 },
      eye(23, 40, 2),
      eye(33, 40, 2),
      { t: "polygon", points: "26,46 30,46 28,49", fill: PINK },
      { t: "line", x1: 16, y1: 46, x2: 6, y2: 44, stroke: INK, sw: 1, cap: "round" },
      { t: "line", x1: 40, y1: 46, x2: 50, y2: 44, stroke: INK, sw: 1, cap: "round" },
    ],
  },
  cow: {
    shapes: [
      shadow(52, 90, 28, 6),
      leg(32, 76, 6, 12, WHITE),
      leg(60, 76, 6, 12, WHITE),
      { t: "ellipse", cx: 52, cy: 64, rx: 25, ry: 18, fill: WHITE, stroke: INK, sw: 2 },
      { t: "ellipse", cx: 44, cy: 60, rx: 7, ry: 6, fill: BROWN, opacity: 0.85 },
      { t: "ellipse", cx: 64, cy: 70, rx: 6, ry: 5, fill: BROWN, opacity: 0.85 },
      { t: "circle", cx: 28, cy: 40, r: 15, fill: WHITE, stroke: INK, sw: 2 },
      { t: "path", d: "M20 28 Q18 20 24 22", stroke: INK, sw: 2.5, fill: "none", cap: "round" },
      { t: "path", d: "M36 28 Q38 20 32 22", stroke: INK, sw: 2.5, fill: "none", cap: "round" },
      { t: "ellipse", cx: 28, cy: 48, rx: 9, ry: 6, fill: PINK },
      eye(23, 38, 2),
      eye(33, 38, 2),
    ],
  },
  goat: {
    shapes: [
      shadow(50, 90, 24, 6),
      leg(34, 76, 5, 10, TAN),
      leg(56, 76, 5, 10, TAN),
      { t: "ellipse", cx: 50, cy: 64, rx: 20, ry: 15, fill: TAN, stroke: INK, sw: 2 },
      { t: "circle", cx: 28, cy: 42, r: 13, fill: TAN, stroke: INK, sw: 2 },
      { t: "path", d: "M20 32 Q14 24 20 18", stroke: BROWN, sw: 3, fill: "none", cap: "round" },
      { t: "path", d: "M34 32 Q40 24 34 18", stroke: BROWN, sw: 3, fill: "none", cap: "round" },
      { t: "line", x1: 27, y1: 50, x2: 26, y2: 56, stroke: INK, sw: 2, cap: "round" },
      eye(23, 40, 2),
      eye(33, 40, 2),
    ],
  },
  sheep: {
    shapes: [
      shadow(52, 90, 26, 6),
      leg(36, 78, 5, 9, INK),
      leg(58, 78, 5, 9, INK),
      { t: "circle", cx: 44, cy: 64, r: 14, fill: WHITE, stroke: INK, sw: 1.5 },
      { t: "circle", cx: 58, cy: 64, r: 14, fill: WHITE, stroke: INK, sw: 1.5 },
      { t: "circle", cx: 52, cy: 56, r: 15, fill: WHITE, stroke: INK, sw: 1.5 },
      { t: "circle", cx: 26, cy: 44, r: 11, fill: INK },
      { t: "circle", cx: 14, cy: 40, r: 5, fill: INK },
      { t: "circle", cx: 32, cy: 34, r: 5, fill: INK },
      eye(22, 42, 2, WHITE),
      eye(30, 42, 2, WHITE),
    ],
  },
  horse: {
    shapes: [
      shadow(52, 90, 28, 6),
      leg(34, 76, 5, 12, BROWN),
      leg(48, 76, 5, 12, BROWN),
      leg(60, 76, 5, 12, BROWN),
      leg(70, 76, 5, 12, BROWN),
      { t: "ellipse", cx: 52, cy: 64, rx: 24, ry: 15, fill: BROWN, stroke: INK, sw: 2 },
      { t: "path", d: "M76 60 Q86 66 80 78", stroke: INK, sw: 4, fill: "none", cap: "round" },
      { t: "ellipse", cx: 26, cy: 46, rx: 11, ry: 16, fill: BROWN, stroke: INK, sw: 2, rotate: -15 },
      { t: "path", d: "M20 32 Q26 24 32 32", stroke: INK, sw: 4, fill: "none", cap: "round" },
      eye(24, 42, 2),
      { t: "circle", cx: 20, cy: 52, r: 2, fill: INK },
    ],
  },
  monkey: {
    shapes: [
      shadow(52, 90, 24, 6),
      leg(38, 76, 5, 9, BROWN),
      leg(58, 76, 5, 9, BROWN),
      { t: "ellipse", cx: 50, cy: 64, rx: 18, ry: 15, fill: BROWN, stroke: INK, sw: 2 },
      { t: "path", d: "M68 62 Q82 66 78 50 Q76 44 70 46", stroke: BROWN, sw: 4, fill: "none", cap: "round" },
      { t: "circle", cx: 28, cy: 40, r: 14, fill: BROWN, stroke: INK, sw: 2 },
      { t: "circle", cx: 16, cy: 36, r: 6, fill: BROWN, stroke: INK, sw: 1.5 },
      { t: "circle", cx: 38, cy: 36, r: 6, fill: BROWN, stroke: INK, sw: 1.5 },
      { t: "ellipse", cx: 28, cy: 43, rx: 10, ry: 8, fill: TAN },
      eye(24, 40, 2),
      eye(32, 40, 2),
    ],
  },
  rabbit: {
    shapes: [
      shadow(50, 90, 22, 6),
      leg(36, 76, 5, 9, WHITE),
      leg(54, 76, 5, 9, WHITE),
      { t: "ellipse", cx: 48, cy: 64, rx: 18, ry: 14, fill: WHITE, stroke: INK, sw: 2 },
      { t: "circle", cx: 66, cy: 66, r: 6, fill: WHITE, stroke: INK, sw: 1.5 },
      { t: "circle", cx: 28, cy: 44, r: 13, fill: WHITE, stroke: INK, sw: 2 },
      { t: "ellipse", cx: 20, cy: 24, rx: 5, ry: 16, fill: WHITE, stroke: INK, sw: 1.5, rotate: -8 },
      { t: "ellipse", cx: 32, cy: 24, rx: 5, ry: 16, fill: WHITE, stroke: INK, sw: 1.5, rotate: 8 },
      { t: "ellipse", cx: 20, cy: 24, rx: 2.2, ry: 10, fill: PINK, rotate: -8 },
      { t: "ellipse", cx: 32, cy: 24, rx: 2.2, ry: 10, fill: PINK, rotate: 8 },
      eye(24, 44, 2),
      eye(33, 44, 2),
      { t: "polygon", points: "27,49 31,49 29,52", fill: PINK },
    ],
  },
  bird: {
    shapes: [
      shadow(50, 86, 16, 4),
      { t: "ellipse", cx: 50, cy: 56, rx: 18, ry: 15, fill: BLUE, stroke: INK, sw: 2 },
      { t: "circle", cx: 64, cy: 44, r: 11, fill: BLUE, stroke: INK, sw: 2 },
      { t: "path", d: "M36 54 Q22 50 34 62 Q40 60 40 54", fill: LBLUE, stroke: INK, sw: 1.5 },
      { t: "polygon", points: "74,42 84,45 74,48", fill: ORANGE },
      eye(66, 42, 2),
      { t: "line", x1: 46, y1: 72, x2: 46, y2: 78, stroke: ORANGE, sw: 2, cap: "round" },
      { t: "line", x1: 54, y1: 72, x2: 54, y2: 78, stroke: ORANGE, sw: 2, cap: "round" },
    ],
  },
  fish: {
    shapes: [
      { t: "ellipse", cx: 44, cy: 52, rx: 26, ry: 16, fill: BLUE, stroke: INK, sw: 2 },
      { t: "polygon", points: "70,52 88,38 88,66", fill: LBLUE, stroke: INK, sw: 2 },
      { t: "polygon", points: "38,40 46,40 42,28", fill: LBLUE, stroke: INK, sw: 1.5 },
      eye(28, 48, 2.4, WHITE),
      eye(28, 48, 1.2, INK),
      { t: "circle", cx: 70, cy: 26, r: 2.5, fill: LBLUE, opacity: 0.6 },
      { t: "circle", cx: 78, cy: 18, r: 1.6, fill: LBLUE, opacity: 0.6 },
    ],
  },
  frog: {
    shapes: [
      shadow(50, 84, 22, 5),
      { t: "ellipse", cx: 50, cy: 64, rx: 24, ry: 16, fill: GREEN, stroke: INK, sw: 2 },
      leg(28, 74, 8, 8, GREEN),
      leg(64, 74, 8, 8, GREEN),
      { t: "circle", cx: 34, cy: 46, r: 9, fill: GREEN, stroke: INK, sw: 2 },
      { t: "circle", cx: 56, cy: 46, r: 9, fill: GREEN, stroke: INK, sw: 2 },
      eye(34, 46, 3.4, WHITE),
      eye(56, 46, 3.4, WHITE),
      eye(34, 46, 1.6),
      eye(56, 46, 1.6),
      { t: "path", d: "M38 62 Q50 68 62 62", stroke: INK, sw: 2, fill: "none", cap: "round" },
    ],
  },
  snake: {
    shapes: [
      { t: "path", d: "M14 78 Q30 50 50 66 Q70 82 84 50", stroke: GREEN, sw: 14, fill: "none", cap: "round" },
      { t: "ellipse", cx: 30, cy: 58, rx: 5, ry: 4, fill: DGREEN },
      { t: "ellipse", cx: 50, cy: 68, rx: 5, ry: 4, fill: DGREEN },
      { t: "ellipse", cx: 68, cy: 60, rx: 5, ry: 4, fill: DGREEN },
      { t: "circle", cx: 84, cy: 50, r: 9, fill: GREEN, stroke: INK, sw: 2 },
      eye(87, 46, 1.8),
      { t: "line", x1: 93, y1: 50, x2: 99, y2: 46, stroke: RED, sw: 1.6, cap: "round" },
      { t: "line", x1: 93, y1: 50, x2: 99, y2: 54, stroke: RED, sw: 1.6, cap: "round" },
    ],
  },
  duck: {
    shapes: [
      shadow(50, 86, 20, 5),
      { t: "ellipse", cx: 48, cy: 60, rx: 20, ry: 15, fill: YELLOW, stroke: INK, sw: 2 },
      { t: "path", d: "M36 58 Q26 56 34 66 Q40 64 40 58", fill: WHITE, stroke: INK, sw: 1.5 },
      { t: "circle", cx: 66, cy: 44, r: 11, fill: YELLOW, stroke: INK, sw: 2 },
      { t: "polygon", points: "76,42 88,44 76,48", fill: ORANGE, stroke: INK, sw: 1 },
      eye(69, 41, 2),
      { t: "line", x1: 44, y1: 76, x2: 44, y2: 80, stroke: ORANGE, sw: 2, cap: "round" },
      { t: "line", x1: 52, y1: 76, x2: 52, y2: 80, stroke: ORANGE, sw: 2, cap: "round" },
    ],
  },
  hen: {
    shapes: [
      shadow(50, 86, 20, 5),
      { t: "ellipse", cx: 48, cy: 62, rx: 19, ry: 16, fill: TAN, stroke: INK, sw: 2 },
      { t: "polygon", points: "64,54 82,46 76,64", fill: TAN, stroke: INK, sw: 1.5 },
      { t: "circle", cx: 28, cy: 44, r: 11, fill: TAN, stroke: INK, sw: 2 },
      { t: "path", d: "M22 34 Q25 26 30 34 Q33 27 34 35", fill: RED, stroke: INK, sw: 1 },
      { t: "polygon", points: "18,44 8,46 18,49", fill: ORANGE },
      eye(24, 42, 2),
      { t: "line", x1: 44, y1: 78, x2: 44, y2: 82, stroke: ORANGE, sw: 2, cap: "round" },
      { t: "line", x1: 52, y1: 78, x2: 52, y2: 82, stroke: ORANGE, sw: 2, cap: "round" },
    ],
  },
  pig: {
    shapes: [
      shadow(50, 88, 24, 6),
      leg(36, 78, 5, 8, PINK),
      leg(58, 78, 5, 8, PINK),
      { t: "ellipse", cx: 50, cy: 66, rx: 22, ry: 16, fill: PINK, stroke: INK, sw: 2 },
      { t: "path", d: "M70 62 Q80 58 76 66 Q80 70 74 70", stroke: INK, sw: 2.5, fill: "none", cap: "round" },
      { t: "circle", cx: 28, cy: 46, r: 13, fill: PINK, stroke: INK, sw: 2 },
      { t: "polygon", points: "20,36 26,36 22,28", fill: PINK, stroke: INK, sw: 1.5 },
      { t: "polygon", points: "30,36 36,36 34,28", fill: PINK, stroke: INK, sw: 1.5 },
      { t: "ellipse", cx: 28, cy: 52, rx: 8, ry: 6, fill: TAN, stroke: INK, sw: 1.5 },
      eye(23, 44, 2),
      eye(33, 44, 2),
      eye(25, 52, 1),
      eye(31, 52, 1),
    ],
  },
  bear: {
    shapes: [
      shadow(50, 90, 26, 6),
      leg(34, 76, 6, 11, BROWN),
      leg(58, 76, 6, 11, BROWN),
      { t: "ellipse", cx: 50, cy: 64, rx: 23, ry: 17, fill: BROWN, stroke: INK, sw: 2 },
      { t: "circle", cx: 28, cy: 42, r: 15, fill: BROWN, stroke: INK, sw: 2 },
      { t: "circle", cx: 16, cy: 30, r: 6, fill: BROWN, stroke: INK, sw: 1.5 },
      { t: "circle", cx: 38, cy: 30, r: 6, fill: BROWN, stroke: INK, sw: 1.5 },
      { t: "ellipse", cx: 28, cy: 48, rx: 8, ry: 6, fill: TAN },
      eye(23, 40, 2),
      eye(33, 40, 2),
      { t: "circle", cx: 28, cy: 47, r: 2, fill: INK },
    ],
  },
  peacock: {
    shapes: [
      shadow(50, 90, 26, 6),
      { t: "ellipse", cx: 36, cy: 34, rx: 20, ry: 26, fill: PURPLE, opacity: 0.9, rotate: -20 },
      { t: "ellipse", cx: 50, cy: 30, rx: 20, ry: 26, fill: BLUE, opacity: 0.9 },
      { t: "ellipse", cx: 64, cy: 34, rx: 20, ry: 26, fill: GREEN, opacity: 0.9, rotate: 20 },
      { t: "circle", cx: 36, cy: 26, r: 4, fill: YELLOW },
      { t: "circle", cx: 50, cy: 20, r: 4, fill: YELLOW },
      { t: "circle", cx: 64, cy: 26, r: 4, fill: YELLOW },
      leg(46, 80, 4, 8, ORANGE),
      leg(56, 80, 4, 8, ORANGE),
      { t: "ellipse", cx: 52, cy: 66, rx: 12, ry: 16, fill: BLUE, stroke: INK, sw: 2 },
      { t: "circle", cx: 56, cy: 50, r: 8, fill: BLUE, stroke: INK, sw: 2 },
      { t: "polygon", points: "64,48 70,50 64,52", fill: ORANGE },
      { t: "line", x1: 56, y1: 42, x2: 53, y2: 36, stroke: INK, sw: 1.5, cap: "round" },
      eye(58, 48, 1.6),
    ],
  },

  // ---------------------------------------------------------------------
  // Fruits & Food
  // ---------------------------------------------------------------------
  apple: {
    shapes: [
      shadow(50, 86, 20, 4),
      { t: "circle", cx: 50, cy: 56, r: 26, fill: RED, stroke: INK, sw: 2 },
      { t: "line", x1: 50, y1: 30, x2: 50, y2: 22, stroke: BROWN, sw: 2.5, cap: "round" },
      leaf(58, 24, 35),
      { t: "ellipse", cx: 40, cy: 44, rx: 6, ry: 9, fill: WHITE, opacity: 0.3 },
    ],
  },
  banana: {
    shapes: [
      shadow(52, 84, 20, 4),
      { t: "path", d: "M28 70 Q20 40 46 24 Q70 12 78 26 Q64 24 48 34 Q30 46 34 70 Z", fill: YELLOW, stroke: INK, sw: 2 },
      { t: "ellipse", cx: 78, cy: 26, rx: 4, ry: 3, fill: BROWN, rotate: 20 },
      { t: "path", d: "M40 50 Q50 40 62 32", stroke: TAN, sw: 1.5, fill: "none", cap: "round" },
    ],
  },
  mango: {
    shapes: [
      shadow(50, 86, 18, 4),
      { t: "ellipse", cx: 48, cy: 56, rx: 20, ry: 26, fill: ORANGE, stroke: INK, sw: 2, rotate: -10 },
      { t: "ellipse", cx: 40, cy: 46, rx: 9, ry: 13, fill: RED, opacity: 0.55, rotate: -10 },
      { t: "line", x1: 56, y1: 32, x2: 60, y2: 24, stroke: BROWN, sw: 2.2, cap: "round" },
      leaf(66, 22, 15),
    ],
  },
  orange: {
    shapes: [
      shadow(50, 86, 20, 4),
      { t: "circle", cx: 50, cy: 54, r: 25, fill: ORANGE, stroke: INK, sw: 2 },
      { t: "circle", cx: 50, cy: 26, r: 3, fill: DGREEN },
      leaf(60, 24, 30),
      { t: "ellipse", cx: 40, cy: 44, rx: 6, ry: 8, fill: WHITE, opacity: 0.25 },
    ],
  },
  grapes: {
    shapes: [
      { t: "circle", cx: 40, cy: 50, r: 9, fill: PURPLE, stroke: INK, sw: 1.5 },
      { t: "circle", cx: 56, cy: 50, r: 9, fill: PURPLE, stroke: INK, sw: 1.5 },
      { t: "circle", cx: 48, cy: 62, r: 9, fill: PURPLE, stroke: INK, sw: 1.5 },
      { t: "circle", cx: 34, cy: 64, r: 8, fill: PURPLE, stroke: INK, sw: 1.5 },
      { t: "circle", cx: 62, cy: 64, r: 8, fill: PURPLE, stroke: INK, sw: 1.5 },
      { t: "circle", cx: 48, cy: 76, r: 8, fill: PURPLE, stroke: INK, sw: 1.5 },
      { t: "line", x1: 48, y1: 38, x2: 48, y2: 28, stroke: BROWN, sw: 2, cap: "round" },
      leaf(58, 26, 35),
    ],
  },
  watermelon: {
    shapes: [
      shadow(50, 86, 26, 4),
      { t: "path", d: "M14 70 Q50 90 86 70 Q70 30 50 20 Q30 30 14 70 Z", fill: GREEN, stroke: INK, sw: 2 },
      { t: "path", d: "M22 66 Q50 82 78 66 Q64 34 50 26 Q36 34 22 66 Z", fill: RED },
      eye(40, 54, 1.6),
      eye(50, 60, 1.6),
      eye(60, 54, 1.6),
      eye(50, 44, 1.6),
    ],
  },
  strawberry: {
    shapes: [
      shadow(50, 86, 16, 4),
      { t: "path", d: "M50 26 Q74 34 72 56 Q68 82 50 88 Q32 82 28 56 Q26 34 50 26 Z", fill: RED, stroke: INK, sw: 2 },
      { t: "polygon", points: "38,24 50,32 62,24 50,16", fill: DGREEN },
      eye(42, 46, 1.4, YELLOW),
      eye(56, 46, 1.4, YELLOW),
      eye(48, 58, 1.4, YELLOW),
      eye(38, 62, 1.4, YELLOW),
      eye(60, 64, 1.4, YELLOW),
      eye(50, 74, 1.4, YELLOW),
    ],
  },
  pineapple: {
    shapes: [
      shadow(50, 88, 18, 4),
      { t: "ellipse", cx: 50, cy: 60, rx: 18, ry: 24, fill: ORANGE, stroke: INK, sw: 2 },
      { t: "line", x1: 36, y1: 44, x2: 64, y2: 70, stroke: BROWN, sw: 1.5 },
      { t: "line", x1: 36, y1: 56, x2: 64, y2: 82, stroke: BROWN, sw: 1.5 },
      { t: "line", x1: 36, y1: 70, x2: 60, y2: 44, stroke: BROWN, sw: 1.5 },
      { t: "line", x1: 36, y1: 82, x2: 64, y2: 56, stroke: BROWN, sw: 1.5 },
      { t: "polygon", points: "38,36 50,10 62,36 50,28", fill: DGREEN },
      { t: "polygon", points: "44,36 50,14 56,36", fill: GREEN },
    ],
  },
  papaya: {
    shapes: [
      shadow(50, 86, 18, 4),
      { t: "ellipse", cx: 50, cy: 56, rx: 16, ry: 26, fill: YELLOW, stroke: INK, sw: 2, rotate: 8 },
      { t: "ellipse", cx: 46, cy: 50, rx: 6, ry: 14, fill: ORANGE, opacity: 0.6, rotate: 8 },
      { t: "line", x1: 54, y1: 30, x2: 56, y2: 22, stroke: BROWN, sw: 2, cap: "round" },
      leaf(62, 20, 20),
    ],
  },
  guava: {
    shapes: [
      shadow(50, 86, 18, 4),
      { t: "circle", cx: 50, cy: 56, r: 22, fill: GREEN, stroke: INK, sw: 2 },
      { t: "circle", cx: 44, cy: 50, r: 8, fill: TAN, opacity: 0.7 },
      { t: "circle", cx: 50, cy: 32, r: 3, fill: DGREEN },
      leaf(60, 30, 35),
    ],
  },
  carrot: {
    shapes: [
      { t: "polygon", points: "38,34 62,34 52,84", fill: ORANGE, stroke: INK, sw: 2 },
      { t: "line", x1: 42, y1: 40, x2: 48, y2: 70, stroke: BROWN, sw: 1.2 },
      { t: "line", x1: 58, y1: 40, x2: 52, y2: 70, stroke: BROWN, sw: 1.2 },
      { t: "line", x1: 50, y1: 34, x2: 50, y2: 14, stroke: DGREEN, sw: 3, cap: "round" },
      { t: "path", d: "M50 34 Q40 22 34 10", stroke: DGREEN, sw: 3, fill: "none", cap: "round" },
      { t: "path", d: "M50 34 Q60 22 66 10", stroke: DGREEN, sw: 3, fill: "none", cap: "round" },
    ],
  },
  tomato: {
    shapes: [
      shadow(50, 86, 18, 4),
      { t: "circle", cx: 50, cy: 56, r: 24, fill: RED, stroke: INK, sw: 2 },
      { t: "polygon", points: "50,26 54,32 60,30 57,36 62,40 55,40 54,46 50,40 46,46 45,40 38,40 43,36 40,30 46,32", fill: DGREEN },
      { t: "ellipse", cx: 40, cy: 46, rx: 6, ry: 8, fill: WHITE, opacity: 0.3 },
    ],
  },
  bread: {
    shapes: [
      shadow(50, 84, 26, 4),
      { t: "rect", x: 20, y: 44, w: 60, h: 32, rx: 14, fill: TAN, stroke: INK, sw: 2 },
      { t: "path", d: "M20 50 Q50 20 80 50", fill: BROWN, stroke: INK, sw: 2 },
      { t: "line", x1: 38, y1: 34, x2: 34, y2: 44, stroke: INK, sw: 1.5, cap: "round" },
      { t: "line", x1: 50, y1: 30, x2: 48, y2: 44, stroke: INK, sw: 1.5, cap: "round" },
      { t: "line", x1: 62, y1: 34, x2: 64, y2: 44, stroke: INK, sw: 1.5, cap: "round" },
    ],
  },
  milk: {
    shapes: [
      shadow(50, 86, 16, 4),
      { t: "path", d: "M38 20 L62 20 L62 32 L70 44 L70 82 L30 82 L30 44 L38 32 Z", fill: WHITE, stroke: INK, sw: 2 },
      { t: "rect", x: 38, y: 16, w: 24, h: 8, rx: 2, fill: BLUE, stroke: INK, sw: 1.5 },
      { t: "rect", x: 30, y: 58, w: 40, h: 20, fill: LBLUE, opacity: 0.6 },
      { t: "rect", x: 32, y: 48, w: 36, h: 10, rx: 2, fill: BLUE, opacity: 0.85 },
    ],
  },

  // ---------------------------------------------------------------------
  // Everyday Objects
  // ---------------------------------------------------------------------
  ball: {
    shapes: [
      shadow(50, 86, 20, 4),
      { t: "circle", cx: 50, cy: 54, r: 26, fill: RED, stroke: INK, sw: 2 },
      { t: "path", d: "M50 28 Q66 40 66 54 Q66 68 50 80", stroke: WHITE, sw: 3, fill: "none" },
      { t: "path", d: "M50 28 Q34 40 34 54 Q34 68 50 80", stroke: WHITE, sw: 3, fill: "none" },
      { t: "path", d: "M24 54 Q50 46 76 54", stroke: WHITE, sw: 3, fill: "none" },
      { t: "ellipse", cx: 40, cy: 42, rx: 6, ry: 4, fill: WHITE, opacity: 0.3 },
    ],
  },
  book: {
    shapes: [
      shadow(50, 86, 26, 4),
      { t: "rect", x: 18, y: 26, w: 60, h: 48, rx: 3, fill: BLUE, stroke: INK, sw: 2 },
      { t: "rect", x: 22, y: 30, w: 52, h: 40, fill: WHITE },
      { t: "line", x1: 48, y1: 30, x2: 48, y2: 70, stroke: INK, sw: 1.5 },
      { t: "rect", x: 22, y: 30, w: 14, h: 10, fill: YELLOW, opacity: 0.8 },
      { t: "line", x1: 54, y1: 38, x2: 70, y2: 38, stroke: GRAY, sw: 1.5 },
      { t: "line", x1: 54, y1: 46, x2: 70, y2: 46, stroke: GRAY, sw: 1.5 },
    ],
  },
  pencil: {
    shapes: [
      { t: "line", x1: 26, y1: 84, x2: 62, y2: 26, stroke: INK, sw: 17, cap: "round" },
      { t: "line", x1: 26, y1: 84, x2: 62, y2: 26, stroke: YELLOW, sw: 14, cap: "round" },
      { t: "line", x1: 56, y1: 34, x2: 66, y2: 22, stroke: GRAY, sw: 14, cap: "round" },
      { t: "circle", cx: 68, cy: 19, r: 7, fill: PINK, stroke: INK, sw: 1.5 },
      { t: "polygon", points: "18,92 30,86 24,76", fill: TAN, stroke: INK, sw: 1.5 },
      { t: "polygon", points: "12,98 22,92 18,84", fill: INK },
    ],
  },
  bag: {
    shapes: [
      shadow(50, 86, 22, 4),
      { t: "rect", x: 24, y: 34, w: 52, h: 44, rx: 10, fill: PURPLE, stroke: INK, sw: 2 },
      { t: "rect", x: 32, y: 22, w: 36, h: 20, rx: 8, fill: PURPLE, stroke: INK, sw: 2, opacity: 0.9 },
      { t: "rect", x: 34, y: 50, w: 32, h: 20, rx: 6, fill: PINK, opacity: 0.8 },
      { t: "path", d: "M32 34 Q32 14 50 14", stroke: INK, sw: 3, fill: "none", cap: "round" },
      { t: "path", d: "M68 34 Q68 14 50 14", stroke: INK, sw: 3, fill: "none", cap: "round" },
    ],
  },
  chair: {
    shapes: [
      shadow(50, 90, 18, 4),
      { t: "rect", x: 24, y: 20, w: 36, h: 8, rx: 2, fill: BROWN, stroke: INK, sw: 2 },
      { t: "rect", x: 26, y: 44, w: 44, h: 8, rx: 2, fill: BROWN, stroke: INK, sw: 2 },
      { t: "line", x1: 28, y1: 28, x2: 28, y2: 44, stroke: BROWN, sw: 5, cap: "round" },
      { t: "line", x1: 32, y1: 52, x2: 30, y2: 80, stroke: BROWN, sw: 5, cap: "round" },
      { t: "line", x1: 64, y1: 52, x2: 66, y2: 80, stroke: BROWN, sw: 5, cap: "round" },
    ],
  },
  table: {
    shapes: [
      shadow(50, 90, 26, 4),
      { t: "rect", x: 14, y: 36, w: 72, h: 10, rx: 2, fill: BROWN, stroke: INK, sw: 2 },
      { t: "line", x1: 22, y1: 46, x2: 20, y2: 82, stroke: BROWN, sw: 6, cap: "round" },
      { t: "line", x1: 78, y1: 46, x2: 80, y2: 82, stroke: BROWN, sw: 6, cap: "round" },
      { t: "rect", x: 14, y: 36, w: 72, h: 4, fill: TAN, opacity: 0.6 },
    ],
  },
  door: {
    shapes: [
      { t: "rect", x: 26, y: 10, w: 48, h: 82, rx: 4, fill: BROWN, stroke: INK, sw: 2 },
      { t: "rect", x: 33, y: 18, w: 34, h: 30, rx: 3, fill: TAN, opacity: 0.8 },
      { t: "rect", x: 33, y: 54, w: 34, h: 30, rx: 3, fill: TAN, opacity: 0.8 },
      { t: "circle", cx: 64, cy: 56, r: 3, fill: YELLOW, stroke: INK, sw: 1 },
    ],
  },
  window: {
    shapes: [
      { t: "rect", x: 18, y: 16, w: 64, h: 64, rx: 4, fill: BLUE, stroke: INK, sw: 2 },
      { t: "rect", x: 24, y: 22, w: 24, h: 24, fill: LBLUE },
      { t: "rect", x: 52, y: 22, w: 24, h: 24, fill: LBLUE },
      { t: "rect", x: 24, y: 50, w: 24, h: 24, fill: LBLUE },
      { t: "rect", x: 52, y: 50, w: 24, h: 24, fill: LBLUE },
      { t: "rect", x: 12, y: 80, w: 76, h: 6, rx: 2, fill: BROWN },
    ],
  },
  clock: {
    shapes: [
      shadow(50, 88, 20, 4),
      { t: "circle", cx: 50, cy: 50, r: 32, fill: WHITE, stroke: INK, sw: 3 },
      { t: "circle", cx: 50, cy: 22, r: 2, fill: INK },
      { t: "circle", cx: 50, cy: 78, r: 2, fill: INK },
      { t: "circle", cx: 22, cy: 50, r: 2, fill: INK },
      { t: "circle", cx: 78, cy: 50, r: 2, fill: INK },
      { t: "line", x1: 50, y1: 50, x2: 50, y2: 30, stroke: INK, sw: 3, cap: "round" },
      { t: "line", x1: 50, y1: 50, x2: 66, y2: 50, stroke: RED, sw: 2.5, cap: "round" },
      { t: "circle", cx: 50, cy: 50, r: 3, fill: INK },
      { t: "rect", x: 46, y: 12, w: 8, h: 6, rx: 2, fill: ORANGE },
    ],
  },
  umbrella: {
    shapes: [
      { t: "path", d: "M12 50 A38 38 0 0 1 88 50 Z", fill: RED, stroke: INK, sw: 2 },
      { t: "polygon", points: "50,14 50,50 65,50", fill: YELLOW, opacity: 0.85 },
      { t: "polygon", points: "50,14 50,50 35,50", fill: ORANGE, opacity: 0.85 },
      { t: "line", x1: 50, y1: 50, x2: 50, y2: 86, stroke: BROWN, sw: 3, cap: "round" },
      { t: "path", d: "M50 86 Q58 92 52 96", stroke: BROWN, sw: 3, fill: "none", cap: "round" },
      { t: "circle", cx: 12, cy: 50, r: 2.5, fill: INK },
      { t: "circle", cx: 88, cy: 50, r: 2.5, fill: INK },
    ],
  },
  kite: {
    shapes: [
      { t: "polygon", points: "50,10 78,42 50,86 22,42", fill: BLUE, stroke: INK, sw: 2 },
      { t: "polygon", points: "50,10 78,42 50,42", fill: LBLUE, opacity: 0.8 },
      { t: "line", x1: 22, y1: 42, x2: 78, y2: 42, stroke: INK, sw: 1.5 },
      { t: "line", x1: 50, y1: 10, x2: 50, y2: 86, stroke: INK, sw: 1.5 },
      { t: "path", d: "M50 86 Q47 90 50 93 Q53 96 50 99", stroke: YELLOW, sw: 2, fill: "none", cap: "round" },
      { t: "circle", cx: 47, cy: 90, r: 2.2, fill: RED },
      { t: "circle", cx: 50, cy: 97, r: 2.2, fill: RED },
    ],
  },
  bicycle: {
    shapes: [
      { t: "circle", cx: 26, cy: 70, r: 16, fill: "none", stroke: INK, sw: 3.5 },
      { t: "circle", cx: 74, cy: 70, r: 16, fill: "none", stroke: INK, sw: 3.5 },
      { t: "circle", cx: 26, cy: 70, r: 2, fill: INK },
      { t: "circle", cx: 74, cy: 70, r: 2, fill: INK },
      { t: "line", x1: 26, y1: 70, x2: 50, y2: 40, stroke: BLUE, sw: 3.5, cap: "round" },
      { t: "line", x1: 50, y1: 40, x2: 74, y2: 70, stroke: BLUE, sw: 3.5, cap: "round" },
      { t: "line", x1: 26, y1: 70, x2: 60, y2: 70, stroke: BLUE, sw: 3.5, cap: "round" },
      { t: "line", x1: 60, y1: 70, x2: 50, y2: 40, stroke: BLUE, sw: 3.5, cap: "round" },
      { t: "line", x1: 50, y1: 40, x2: 44, y2: 30, stroke: INK, sw: 3, cap: "round" },
      { t: "ellipse", cx: 40, cy: 28, rx: 7, ry: 3, fill: INK },
      { t: "line", x1: 60, y1: 70, x2: 66, y2: 52, stroke: INK, sw: 3, cap: "round" },
      { t: "line", x1: 58, y1: 50, x2: 74, y2: 50, stroke: INK, sw: 3, cap: "round" },
    ],
  },
  car: {
    shapes: [
      shadow(50, 90, 32, 5),
      { t: "rect", x: 12, y: 52, w: 76, h: 24, rx: 8, fill: RED, stroke: INK, sw: 2 },
      { t: "path", d: "M26 52 Q34 30 50 30 L64 30 Q76 30 78 52 Z", fill: RED, stroke: INK, sw: 2 },
      { t: "rect", x: 38, y: 34, w: 16, h: 16, rx: 2, fill: LBLUE },
      { t: "rect", x: 58, y: 34, w: 14, h: 16, rx: 2, fill: LBLUE },
      { t: "circle", cx: 30, cy: 78, r: 10, fill: INK },
      { t: "circle", cx: 70, cy: 78, r: 10, fill: INK },
      { t: "circle", cx: 30, cy: 78, r: 4, fill: GRAY },
      { t: "circle", cx: 70, cy: 78, r: 4, fill: GRAY },
      { t: "circle", cx: 84, cy: 60, r: 2.4, fill: YELLOW },
    ],
  },
  bus: {
    shapes: [
      shadow(50, 90, 32, 5),
      { t: "rect", x: 10, y: 26, w: 80, h: 44, rx: 8, fill: YELLOW, stroke: INK, sw: 2 },
      { t: "rect", x: 16, y: 34, w: 16, h: 14, rx: 2, fill: LBLUE },
      { t: "rect", x: 36, y: 34, w: 16, h: 14, rx: 2, fill: LBLUE },
      { t: "rect", x: 56, y: 34, w: 16, h: 14, rx: 2, fill: LBLUE },
      { t: "rect", x: 16, y: 52, w: 58, h: 12, rx: 2, fill: ORANGE, opacity: 0.8 },
      { t: "circle", cx: 28, cy: 76, r: 9, fill: INK },
      { t: "circle", cx: 70, cy: 76, r: 9, fill: INK },
      { t: "circle", cx: 28, cy: 76, r: 3.5, fill: GRAY },
      { t: "circle", cx: 70, cy: 76, r: 3.5, fill: GRAY },
    ],
  },
  boat: {
    shapes: [
      { t: "path", d: "M14 66 Q50 84 86 66 L76 78 Q50 88 24 78 Z", fill: BROWN, stroke: INK, sw: 2 },
      { t: "line", x1: 50, y1: 66, x2: 50, y2: 20, stroke: BROWN, sw: 2.5, cap: "round" },
      { t: "polygon", points: "50,22 50,60 26,60", fill: WHITE, stroke: INK, sw: 1.5 },
      { t: "polygon", points: "50,30 50,60 68,58", fill: BLUE, stroke: INK, sw: 1.5 },
      { t: "path", d: "M6 74 Q16 70 26 74 Q36 78 46 74", stroke: LBLUE, sw: 2.5, fill: "none", cap: "round" },
      { t: "path", d: "M54 76 Q64 72 74 76 Q84 80 94 76", stroke: LBLUE, sw: 2.5, fill: "none", cap: "round" },
    ],
  },
  key: {
    shapes: [
      { t: "circle", cx: 28, cy: 32, r: 16, fill: "none", stroke: YELLOW, sw: 8 },
      { t: "circle", cx: 28, cy: 32, r: 16, fill: "none", stroke: INK, sw: 2 },
      { t: "rect", x: 42, y: 28, w: 44, h: 8, rx: 2, fill: YELLOW, stroke: INK, sw: 2 },
      { t: "rect", x: 66, y: 36, w: 6, h: 10, fill: YELLOW, stroke: INK, sw: 1.5 },
      { t: "rect", x: 76, y: 36, w: 6, h: 14, fill: YELLOW, stroke: INK, sw: 1.5 },
    ],
  },

  // ---------------------------------------------------------------------
  // Nature & Weather
  // ---------------------------------------------------------------------
  sun: {
    shapes: [
      { t: "circle", cx: 50, cy: 50, r: 22, fill: YELLOW, stroke: INK, sw: 2 },
      { t: "line", x1: 50, y1: 10, x2: 50, y2: 2, stroke: YELLOW, sw: 5, cap: "round" },
      { t: "line", x1: 50, y1: 90, x2: 50, y2: 98, stroke: YELLOW, sw: 5, cap: "round" },
      { t: "line", x1: 10, y1: 50, x2: 2, y2: 50, stroke: YELLOW, sw: 5, cap: "round" },
      { t: "line", x1: 90, y1: 50, x2: 98, y2: 50, stroke: YELLOW, sw: 5, cap: "round" },
      { t: "line", x1: 22, y1: 22, x2: 16, y2: 16, stroke: YELLOW, sw: 5, cap: "round" },
      { t: "line", x1: 78, y1: 22, x2: 84, y2: 16, stroke: YELLOW, sw: 5, cap: "round" },
      { t: "line", x1: 22, y1: 78, x2: 16, y2: 84, stroke: YELLOW, sw: 5, cap: "round" },
      { t: "line", x1: 78, y1: 78, x2: 84, y2: 84, stroke: YELLOW, sw: 5, cap: "round" },
    ],
  },
  moon: {
    shapes: [
      { t: "path", d: "M62 14 A36 36 0 1 0 62 86 A28 28 0 1 1 62 14 Z", fill: YELLOW, stroke: INK, sw: 2 },
      { t: "circle", cx: 44, cy: 36, r: 2, fill: WHITE, opacity: 0.5 },
      { t: "circle", cx: 50, cy: 60, r: 1.4, fill: WHITE, opacity: 0.5 },
    ],
  },
  cloud: {
    shapes: [
      { t: "ellipse", cx: 50, cy: 60, rx: 34, ry: 18, fill: WHITE, stroke: INK, sw: 2 },
      { t: "circle", cx: 32, cy: 48, r: 16, fill: WHITE, stroke: INK, sw: 2 },
      { t: "circle", cx: 54, cy: 40, r: 20, fill: WHITE, stroke: INK, sw: 2 },
      { t: "circle", cx: 72, cy: 50, r: 14, fill: WHITE, stroke: INK, sw: 2 },
    ],
  },
  rain: {
    shapes: [
      { t: "ellipse", cx: 50, cy: 38, rx: 30, ry: 15, fill: GRAY, stroke: INK, sw: 2 },
      { t: "circle", cx: 34, cy: 30, r: 13, fill: GRAY, stroke: INK, sw: 2 },
      { t: "circle", cx: 56, cy: 26, r: 16, fill: GRAY, stroke: INK, sw: 2 },
      { t: "circle", cx: 72, cy: 34, r: 11, fill: GRAY, stroke: INK, sw: 2 },
      { t: "line", x1: 32, y1: 58, x2: 26, y2: 76, stroke: BLUE, sw: 3, cap: "round" },
      { t: "line", x1: 50, y1: 58, x2: 44, y2: 80, stroke: BLUE, sw: 3, cap: "round" },
      { t: "line", x1: 68, y1: 58, x2: 62, y2: 76, stroke: BLUE, sw: 3, cap: "round" },
    ],
  },
  tree: {
    shapes: [
      shadow(50, 92, 20, 4),
      { t: "rect", x: 44, y: 56, w: 12, h: 34, rx: 3, fill: BROWN, stroke: INK, sw: 2 },
      { t: "circle", cx: 38, cy: 44, r: 18, fill: GREEN, stroke: INK, sw: 2 },
      { t: "circle", cx: 60, cy: 42, r: 20, fill: DGREEN, stroke: INK, sw: 2 },
      { t: "circle", cx: 50, cy: 26, r: 16, fill: GREEN, stroke: INK, sw: 2 },
    ],
  },
  flower: {
    shapes: [
      { t: "line", x1: 50, y1: 56, x2: 50, y2: 92, stroke: DGREEN, sw: 3, cap: "round" },
      { t: "ellipse", cx: 40, cy: 76, rx: 8, ry: 4, fill: GREEN, rotate: -20 },
      { t: "ellipse", cx: 60, cy: 80, rx: 8, ry: 4, fill: GREEN, rotate: 20 },
      { t: "ellipse", cx: 50, cy: 34, rx: 9, ry: 14, fill: PINK },
      { t: "ellipse", cx: 50, cy: 58, rx: 9, ry: 14, fill: PINK },
      { t: "ellipse", cx: 32, cy: 46, rx: 14, ry: 9, fill: PINK },
      { t: "ellipse", cx: 68, cy: 46, rx: 14, ry: 9, fill: PINK },
      { t: "circle", cx: 50, cy: 46, r: 10, fill: YELLOW, stroke: INK, sw: 1.5 },
    ],
  },
  leaf: {
    shapes: [
      { t: "path", d: "M50 14 Q86 34 66 66 Q50 90 34 66 Q14 34 50 14 Z", fill: GREEN, stroke: INK, sw: 2 },
      { t: "line", x1: 50, y1: 22, x2: 50, y2: 82, stroke: DGREEN, sw: 2, cap: "round" },
      { t: "line", x1: 50, y1: 36, x2: 36, y2: 30, stroke: DGREEN, sw: 1.4, cap: "round" },
      { t: "line", x1: 50, y1: 50, x2: 32, y2: 48, stroke: DGREEN, sw: 1.4, cap: "round" },
      { t: "line", x1: 50, y1: 36, x2: 64, y2: 30, stroke: DGREEN, sw: 1.4, cap: "round" },
      { t: "line", x1: 50, y1: 50, x2: 68, y2: 48, stroke: DGREEN, sw: 1.4, cap: "round" },
    ],
  },
  mountain: {
    shapes: [
      { t: "polygon", points: "14,86 42,30 70,86", fill: GRAY, stroke: INK, sw: 2 },
      { t: "polygon", points: "36,86 64,22 92,86", fill: BROWN, stroke: INK, sw: 2 },
      { t: "polygon", points: "42,30 36,42 48,42", fill: WHITE },
      { t: "polygon", points: "64,22 56,36 72,36", fill: WHITE },
    ],
  },
  river: {
    shapes: [
      { t: "path", d: "M22 8 Q46 26 26 50 Q6 74 34 92", stroke: BLUE, sw: 16, fill: "none", cap: "round" },
      { t: "path", d: "M22 8 Q46 26 26 50 Q6 74 34 92", stroke: LBLUE, sw: 6, fill: "none", cap: "round", opacity: 0.7 },
      { t: "ellipse", cx: 70, cy: 20, rx: 8, ry: 4, fill: GREEN },
      { t: "ellipse", cx: 74, cy: 80, rx: 8, ry: 4, fill: GREEN },
    ],
  },
  night_star: {
    shapes: [
      { t: "path", d: "M50 10 L58 42 L90 50 L58 58 L50 90 L42 58 L10 50 L42 42 Z", fill: YELLOW, stroke: INK, sw: 2 },
      { t: "circle", cx: 76, cy: 24, r: 2.4, fill: YELLOW },
      { t: "circle", cx: 22, cy: 74, r: 2, fill: YELLOW },
      { t: "circle", cx: 80, cy: 70, r: 1.6, fill: YELLOW },
    ],
  },

  // ---------------------------------------------------------------------
  // Home & Misc
  // ---------------------------------------------------------------------
  house: {
    shapes: [
      shadow(50, 90, 26, 4),
      { t: "polygon", points: "50,16 88,50 12,50", fill: RED, stroke: INK, sw: 2 },
      { t: "rect", x: 20, y: 50, w: 60, h: 36, rx: 2, fill: TAN, stroke: INK, sw: 2 },
      { t: "rect", x: 44, y: 64, w: 14, h: 22, rx: 2, fill: BROWN, stroke: INK, sw: 1.5 },
      { t: "rect", x: 26, y: 58, w: 14, h: 14, rx: 2, fill: LBLUE, stroke: INK, sw: 1.5 },
      { t: "rect", x: 60, y: 58, w: 14, h: 14, rx: 2, fill: LBLUE, stroke: INK, sw: 1.5 },
      { t: "rect", x: 66, y: 24, w: 8, h: 16, fill: GRAY, stroke: INK, sw: 1.5 },
    ],
  },
  flag: {
    shapes: [
      { t: "line", x1: 24, y1: 10, x2: 24, y2: 90, stroke: BROWN, sw: 4, cap: "round" },
      { t: "polygon", points: "24,14 78,26 24,40", fill: ORANGE, stroke: INK, sw: 2 },
      { t: "circle", cx: 24, cy: 10, r: 3, fill: YELLOW },
    ],
  },
  lamp: {
    shapes: [
      { t: "rect", x: 34, y: 88, w: 32, h: 6, rx: 2, fill: BROWN, stroke: INK, sw: 1.5 },
      { t: "line", x1: 50, y1: 88, x2: 50, y2: 44, stroke: BROWN, sw: 4, cap: "round" },
      { t: "polygon", points: "30,44 70,44 60,18 40,18", fill: YELLOW, stroke: INK, sw: 2 },
      { t: "circle", cx: 50, cy: 44, r: 10, fill: YELLOW, opacity: 0.5 },
    ],
  },
  bed: {
    shapes: [
      { t: "rect", x: 14, y: 66, w: 72, h: 8, rx: 2, fill: BROWN, stroke: INK, sw: 2 },
      { t: "rect", x: 14, y: 34, w: 10, h: 40, rx: 2, fill: BROWN, stroke: INK, sw: 2 },
      { t: "rect", x: 24, y: 48, w: 62, h: 20, rx: 4, fill: BLUE, stroke: INK, sw: 2 },
      { t: "rect", x: 26, y: 38, w: 20, h: 14, rx: 4, fill: WHITE, stroke: INK, sw: 1.5 },
    ],
  },
  drum: {
    shapes: [
      { t: "rect", x: 24, y: 38, w: 52, h: 38, fill: RED, stroke: INK, sw: 2 },
      { t: "ellipse", cx: 50, cy: 38, rx: 26, ry: 10, fill: WHITE, stroke: INK, sw: 2 },
      { t: "ellipse", cx: 50, cy: 76, rx: 26, ry: 10, fill: BROWN, stroke: INK, sw: 2 },
      { t: "line", x1: 28, y1: 44, x2: 24, y2: 70, stroke: YELLOW, sw: 2 },
      { t: "line", x1: 72, y1: 44, x2: 76, y2: 70, stroke: YELLOW, sw: 2 },
      { t: "line", x1: 36, y1: 20, x2: 46, y2: 34, stroke: BROWN, sw: 3, cap: "round" },
      { t: "line", x1: 64, y1: 16, x2: 56, y2: 32, stroke: BROWN, sw: 3, cap: "round" },
    ],
  },
  bell: {
    shapes: [
      { t: "path", d: "M50 18 Q26 22 26 54 L18 70 L82 70 L74 54 Q74 22 50 18 Z", fill: YELLOW, stroke: INK, sw: 2 },
      { t: "rect", x: 14, y: 70, w: 72, h: 8, rx: 3, fill: ORANGE, stroke: INK, sw: 2 },
      { t: "circle", cx: 50, cy: 86, r: 5, fill: ORANGE, stroke: INK, sw: 1.5 },
      { t: "circle", cx: 50, cy: 12, r: 5, fill: GRAY, stroke: INK, sw: 1.5 },
    ],
  },
};
