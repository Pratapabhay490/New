'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  MonitorX,
  Phone,
  Loader2,
  Users,
  Pencil,
  Eraser,
  Trash2,
  Undo,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRoom } from '@/hooks/useRoom';
import { useRoomStore } from '@/stores/room-store';
import { useMediaStore } from '@/stores/media-store';
import { useAnnotationStore } from '@/stores/annotation-store';
import { CanvasManager } from '@/lib/annotations/canvas-manager';
import { toast } from 'sonner';
import { ANNOTATION_COLORS, DEFAULT_BRUSH_SIZE } from '@/lib/utils/constants';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RoomPage({ params }: PageProps) {
  const { id: roomId } = use(params);
  const router = useRouter();
  const { peerConnection, socket, leaveRoom } = useRoom(roomId);
  
  const { roomStatus, error, userId } = useRoomStore();
  const {
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    setVideoEnabled,
    setAudioEnabled,
    setScreenSharing,
  } = useMediaStore();
  
  const {
    activeTool,
    color,
    brushSize,
    setActiveTool,
    setColor,
    setBrushSize,
    clearStrokes,
    undo,
  } = useAnnotationStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasManagerRef = useRef<CanvasManager | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Setup video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Setup canvas
  useEffect(() => {
    if (canvasRef.current && socket && userId && roomStatus === 'active') {
      canvasManagerRef.current = new CanvasManager(canvasRef.current, socket, userId);
      
      // Resize canvas
      const resizeCanvas = () => {
        if (canvasRef.current) {
          canvasRef.current.width = window.innerWidth;
          canvasRef.current.height = window.innerHeight;
          canvasManagerRef.current?.resize(window.innerWidth, window.innerHeight);
        }
      };
      
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      
      return () => {
        window.removeEventListener('resize', resizeCanvas);
        canvasManagerRef.current?.destroy();
      };
    }
  }, [socket, userId, roomStatus]);

  // Canvas drawing handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !canvasManagerRef.current) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    canvasManagerRef.current.startDrawing(activeTool, color, brushSize, { x, y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !canvasManagerRef.current) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    canvasManagerRef.current.continueDrawing({ x, y });
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawingMode || !canvasManagerRef.current) return;
    canvasManagerRef.current.endDrawing();
  };

  // Media controls
  const toggleVideo = () => {
    if (!peerConnection) return;
    const newState = !isVideoEnabled;
    peerConnection.toggleVideo(newState);
    setVideoEnabled(newState);
    socket?.emit('media:toggle-video', { userId: userId!, type: 'video', enabled: newState });
  };

  const toggleAudio = () => {
    if (!peerConnection) return;
    const newState = !isAudioEnabled;
    peerConnection.toggleAudio(newState);
    setAudioEnabled(newState);
    socket?.emit('media:toggle-audio', { userId: userId!, type: 'audio', enabled: newState });
  };

  const toggleScreenShare = async () => {
    if (!peerConnection) return;
    
    try {
      if (isScreenSharing) {
        await peerConnection.stopScreenShare();
        setScreenSharing(false);
        socket?.emit('media:screen-share-stop', { userId: userId!, isSharing: false });
        toast.success('Screen sharing stopped');
      } else {
        await peerConnection.startScreenShare();
        setScreenSharing(true);
        socket?.emit('media:screen-share-start', { userId: userId!, isSharing: true });
        toast.success('Screen sharing started');
      }
    } catch (error) {
      console.error('Screen share error:', error);
      toast.error('Failed to toggle screen sharing');
    }
  };

  const handleUndo = () => {
    const strokeId = undo();
    if (strokeId) {
      canvasManagerRef.current?.undo(strokeId);
    }
  };

  const handleClearCanvas = () => {
    clearStrokes();
    canvasManagerRef.current?.clearCanvas();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <p className="text-gray-400">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  if (roomStatus === 'connecting' || roomStatus === 'idle') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Main video area */}
      <div className="absolute inset-0">
        {/* Remote video (full screen) */}
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain bg-gray-800"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {roomStatus === 'waiting'
                  ? 'Waiting for participant to join...'
                  : 'No remote video'}
              </p>
            </div>
          </div>
        )}

        {/* Annotation canvas overlay */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 ${isDrawingMode ? 'cursor-crosshair' : 'pointer-events-none'}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />
      </div>

      {/* Local video (picture-in-picture) */}
      {localStream && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-4 right-4 w-64 h-48 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-700 z-10"
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
            You
          </div>
        </motion.div>
      )}

      {/* Control toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800/90 backdrop-blur-md rounded-2xl px-6 py-4 shadow-2xl border border-gray-700 z-20"
      >
        <div className="flex items-center gap-4">
          {/* Video toggle */}
          <Button
            size="icon"
            variant={isVideoEnabled ? 'default' : 'destructive'}
            onClick={toggleVideo}
            className="rounded-full h-12 w-12"
          >
            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </Button>

          {/* Audio toggle */}
          <Button
            size="icon"
            variant={isAudioEnabled ? 'default' : 'destructive'}
            onClick={toggleAudio}
            className="rounded-full h-12 w-12"
          >
            {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </Button>

          {/* Screen share */}
          <Button
            size="icon"
            variant={isScreenSharing ? 'secondary' : 'outline'}
            onClick={toggleScreenShare}
            className="rounded-full h-12 w-12"
          >
            {isScreenSharing ? <MonitorX size={20} /> : <MonitorUp size={20} />}
          </Button>

          <div className="w-px h-8 bg-gray-600" />

          {/* Drawing mode toggle */}
          <Button
            size="icon"
            variant={isDrawingMode ? 'secondary' : 'outline'}
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className="rounded-full h-12 w-12"
          >
            {isDrawingMode ? <Eye size={20} /> : <Pencil size={20} />}
          </Button>

          {/* Undo */}
          <Button
            size="icon"
            variant="outline"
            onClick={handleUndo}
            className="rounded-full h-12 w-12"
            disabled={!isDrawingMode}
          >
            <Undo size={20} />
          </Button>

          {/* Clear */}
          <Button
            size="icon"
            variant="outline"
            onClick={handleClearCanvas}
            className="rounded-full h-12 w-12"
            disabled={!isDrawingMode}
          >
            <Trash2 size={20} />
          </Button>

          <div className="w-px h-8 bg-gray-600" />

          {/* Leave call */}
          <Button
            size="icon"
            variant="destructive"
            onClick={leaveRoom}
            className="rounded-full h-12 w-12"
          >
            <Phone size={20} className="rotate-135" />
          </Button>
        </div>
      </motion.div>

      {/* Color palette (show when drawing mode is active) */}
      {isDrawingMode && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-800/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-gray-700 z-20"
        >
          <div className="flex flex-col gap-2">
            {ANNOTATION_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-full border-2 ${
                  color === c ? 'border-white scale-110' : 'border-transparent'
                } transition-all`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Room info */}
      <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-md rounded-lg px-4 py-2 shadow-lg border border-gray-700 z-10">
        <p className="text-white text-sm font-medium">Room: {roomId.slice(0, 8)}...</p>
        <p className="text-gray-400 text-xs">{roomStatus}</p>
      </div>
    </div>
  );
}
