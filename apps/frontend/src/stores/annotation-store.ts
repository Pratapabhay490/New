import { create } from 'zustand';
import { AnnotationTool, StrokeData } from '@studysync/shared-types';
import { DEFAULT_COLOR, DEFAULT_BRUSH_SIZE } from '../lib/utils/constants';

interface AnnotationState {
  activeTool: AnnotationTool;
  color: string;
  brushSize: number;
  strokes: StrokeData[];
  undoStack: string[]; // stroke IDs
  redoStack: string[]; // stroke IDs
  isDrawing: boolean;
  remoteCursor: { x: number; y: number } | null;

  setActiveTool: (tool: AnnotationTool) => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  addStroke: (stroke: StrokeData) => void;
  updateStroke: (strokeId: string, points: { x: number; y: number }[]) => void;
  removeStroke: (strokeId: string) => void;
  clearStrokes: () => void;
  undo: () => string | null;
  redo: () => string | null;
  setIsDrawing: (drawing: boolean) => void;
  setRemoteCursor: (position: { x: number; y: number } | null) => void;
  reset: () => void;
}

const initialState = {
  activeTool: 'pencil' as AnnotationTool,
  color: DEFAULT_COLOR,
  brushSize: DEFAULT_BRUSH_SIZE,
  strokes: [],
  undoStack: [],
  redoStack: [],
  isDrawing: false,
  remoteCursor: null,
};

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  ...initialState,

  setActiveTool: (activeTool) => set({ activeTool }),

  setColor: (color) => set({ color }),

  setBrushSize: (brushSize) => set({ brushSize }),

  addStroke: (stroke) =>
    set((state) => ({
      strokes: [...state.strokes, stroke],
      undoStack: [...state.undoStack, stroke.id],
      redoStack: [], // Clear redo stack on new action
    })),

  updateStroke: (strokeId, points) =>
    set((state) => ({
      strokes: state.strokes.map((s) =>
        s.id === strokeId ? { ...s, points } : s
      ),
    })),

  removeStroke: (strokeId) =>
    set((state) => ({
      strokes: state.strokes.filter((s) => s.id !== strokeId),
    })),

  clearStrokes: () =>
    set({
      strokes: [],
      undoStack: [],
      redoStack: [],
    }),

  undo: () => {
    const state = get();
    const lastStrokeId = state.undoStack[state.undoStack.length - 1];

    if (!lastStrokeId) return null;

    set({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, lastStrokeId],
      strokes: state.strokes.filter((s) => s.id !== lastStrokeId),
    });

    return lastStrokeId;
  },

  redo: () => {
    const state = get();
    const strokeId = state.redoStack[state.redoStack.length - 1];

    if (!strokeId) return null;

    // Find the stroke in the original strokes (we'd need to store removed strokes)
    // For now, just update the stacks
    set({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, strokeId],
    });

    return strokeId;
  },

  setIsDrawing: (isDrawing) => set({ isDrawing }),

  setRemoteCursor: (remoteCursor) => set({ remoteCursor }),

  reset: () => set(initialState),
}));
