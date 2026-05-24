'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Users, Pencil, Share2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/lib/utils/constants';
import { toast } from 'sonner';

export default function Home() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const createRoom = async () => {
    setIsCreating(true);

    try {
      const response = await fetch(`${API_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Room created successfully!');
        router.push(`/room/${data.data.roomId}`);
      } else {
        toast.error('Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const features = [
    {
      icon: Video,
      title: 'HD Video & Audio',
      description: 'Crystal clear communication with low latency WebRTC',
    },
    {
      icon: Share2,
      title: 'Screen Sharing',
      description: 'Share your entire screen or specific windows',
    },
    {
      icon: Pencil,
      title: 'Live Annotations',
      description: 'Draw and highlight together in real-time',
    },
    {
      icon: Users,
      title: '1-on-1 Sessions',
      description: 'Optimized for focused pair studying',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Logo/Brand */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-8 h-8 text-blue-400" />
            <h1 className="text-5xl font-bold text-white">StudySync</h1>
          </div>

          {/* Tagline */}
          <p className="text-xl text-gray-300 mb-4">
            Collaborate, Learn, and Grow Together
          </p>

          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            Real-time collaborative studying platform with screen sharing, video chat,
            and live annotations. Perfect for tutoring, pair programming, or study sessions.
          </p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Button
              size="lg"
              onClick={createRoom}
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all group"
            >
              {isCreating ? (
                'Creating Room...'
              ) : (
                <>
                  Create Study Room
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all hover:scale-105"
              >
                <feature.icon className="w-12 h-12 text-blue-400 mb-4 mx-auto" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* How it Works */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-20 text-left max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              How It Works
            </h2>
            <div className="space-y-4">
              {[
                'Click "Create Study Room" to generate a unique room',
                'Share the invite link with your study partner',
                'Enable camera, microphone, and screen sharing',
                'Use annotation tools to draw and highlight together',
                'Collaborate in real-time with low latency',
              ].map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-gray-300 pt-1">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-20 text-center text-gray-500 text-sm"
          >
            <p>
              Powered by WebRTC, Next.js, and Socket.IO
            </p>
            <p className="mt-2">
              Built for seamless collaborative learning
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
