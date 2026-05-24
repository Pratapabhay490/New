import { fabric } from 'fabric';
import { AnnotationTool, Point, StrokeData } from '@studysync/shared-types';
import type { TypedSocket } from '../socket/socket-manager';
import { STROKE_BATCH_INTERVAL } from '../utils/constants';

export class CanvasManager {
  private canvas: fabric.Canvas;
  private socket: TypedSocket;
  private userId: string;
  private currentStroke: fabric.Path | null = null;
  private currentStrokeId: string | null = null;
  private currentPoints: Point[] = [];
  private isDrawing = false;
  private batchedPoints: Point[] = [];
  private batchInterval: NodeJS.Timeout | null = null;

  constructor(
    canvasElement: HTMLCanvasElement,
    socket: TypedSocket,
    userId: string
  ) {
    this.canvas = new fabric.Canvas(canvasElement, {
      isDrawingMode: false,
      selection: false,
      backgroundColor: 'transparent',
    });

    this.socket = socket;
    this.userId = userId;

    this.setupSocketListeners();
    this.startBatchInterval();
  }

  private startBatchInterval(): void {
    this.batchInterval = setInterval(() => {
      if (this.batchedPoints.length > 0 && this.currentStrokeId) {
        this.socket.emit('annotation:stroke-update', {
          strokeId: this.currentStrokeId,
          points: this.batchedPoints,
          timestamp: Date.now(),
          userId: this.userId,
        });
        this.batchedPoints = [];
      }
    }, STROKE_BATCH_INTERVAL);
  }

  private setupSocketListeners(): void {
    this.socket.on('annotation:stroke-start', (data) => {
      if (data.userId === this.userId) return;
      this.handleRemoteStrokeStart(data);
    });

    this.socket.on('annotation:stroke-update', (data) => {
      if (data.userId === this.userId) return;
      this.handleRemoteStrokeUpdate(data);
    });

    this.socket.on('annotation:stroke-end', (data) => {
      if (data.userId === this.userId) return;
      this.handleRemoteStrokeEnd(data);
    });

    this.socket.on('annotation:clear', (data) => {
      if (data.userId === this.userId) return;
      this.clearCanvas();
    });

    this.socket.on('annotation:undo', (data) => {
      if (data.userId === this.userId) return;
      this.removeStrokeById(data.strokeId);
    });
  }

  private handleRemoteStrokeStart(data: any): void {
    const path = new fabric.Path(`M ${data.point.x} ${data.point.y}`, {
      stroke: data.color,
      strokeWidth: data.width,
      fill: '',
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      opacity: data.tool === 'highlighter' ? 0.5 : 1,
      selectable: false,
      evented: false,
      data: { id: data.strokeId, userId: data.userId },
    });

    this.canvas.add(path);
  }

  private handleRemoteStrokeUpdate(data: any): void {
    const objects = this.canvas.getObjects();
    const stroke = objects.find(
      (obj: any) => obj.data?.id === data.strokeId
    ) as fabric.Path;

    if (stroke) {
      const pathData = data.points
        .map((p: Point) => `L ${p.x} ${p.y}`)
        .join(' ');
      stroke.path = fabric.util.parsePath(stroke.path[0][0] + ' ' + pathData);
      stroke.setCoords();
      this.canvas.renderAll();
    }
  }

  private handleRemoteStrokeEnd(data: any): void {
    // Nothing special needed, stroke is already rendered
    this.canvas.renderAll();
  }

  startDrawing(
    tool: AnnotationTool,
    color: string,
    width: number,
    point: Point
  ): string {
    this.isDrawing = true;
    this.currentStrokeId = `stroke-${Date.now()}-${Math.random()}`;
    this.currentPoints = [point];
    this.batchedPoints = [point];

    const pathString = `M ${point.x} ${point.y}`;
    this.currentStroke = new fabric.Path(pathString, {
      stroke: color,
      strokeWidth: width,
      fill: '',
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      opacity: tool === 'highlighter' ? 0.5 : 1,
      selectable: false,
      evented: false,
      data: { id: this.currentStrokeId, userId: this.userId },
    });

    this.canvas.add(this.currentStroke);

    // Emit stroke start event
    this.socket.emit('annotation:stroke-start', {
      strokeId: this.currentStrokeId,
      tool,
      color,
      width,
      point,
      timestamp: Date.now(),
      userId: this.userId,
    });

    return this.currentStrokeId;
  }

  continueDrawing(point: Point): void {
    if (!this.isDrawing || !this.currentStroke) return;

    this.currentPoints.push(point);
    this.batchedPoints.push(point);

    // Update path
    const pathData = this.currentPoints
      .map((p) => `L ${p.x} ${p.y}`)
      .join(' ');
    this.currentStroke.path = fabric.util.parsePath(
      this.currentStroke.path[0][0] + ' ' + pathData
    );
    this.currentStroke.setCoords();
    this.canvas.renderAll();
  }

  endDrawing(): StrokeData | null {
    if (!this.isDrawing || !this.currentStrokeId) return null;

    this.isDrawing = false;

    // Send any remaining batched points
    if (this.batchedPoints.length > 0) {
      this.socket.emit('annotation:stroke-update', {
        strokeId: this.currentStrokeId,
        points: this.batchedPoints,
        timestamp: Date.now(),
        userId: this.userId,
      });
      this.batchedPoints = [];
    }

    // Emit stroke end event
    this.socket.emit('annotation:stroke-end', {
      strokeId: this.currentStrokeId,
      timestamp: Date.now(),
      userId: this.userId,
    });

    const strokeData: StrokeData = {
      id: this.currentStrokeId,
      tool: 'pencil', // Get from current settings
      color: this.currentStroke?.stroke as string,
      width: this.currentStroke?.strokeWidth || 4,
      points: this.currentPoints,
      timestamp: Date.now(),
      userId: this.userId,
    };

    this.currentStroke = null;
    this.currentStrokeId = null;
    this.currentPoints = [];

    return strokeData;
  }

  clearCanvas(): void {
    this.canvas.clear();
    this.socket.emit('annotation:clear', {
      userId: this.userId,
      timestamp: Date.now(),
    });
  }

  removeStrokeById(strokeId: string): void {
    const objects = this.canvas.getObjects();
    const stroke = objects.find((obj: any) => obj.data?.id === strokeId);

    if (stroke) {
      this.canvas.remove(stroke);
      this.canvas.renderAll();
    }
  }

  undo(strokeId: string): void {
    this.removeStrokeById(strokeId);
    this.socket.emit('annotation:undo', {
      userId: this.userId,
      strokeId,
      timestamp: Date.now(),
    });
  }

  resize(width: number, height: number): void {
    this.canvas.setDimensions({ width, height });
    this.canvas.renderAll();
  }

  destroy(): void {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
    }
    this.canvas.dispose();
  }

  getCanvas(): fabric.Canvas {
    return this.canvas;
  }
}
