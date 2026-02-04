import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function RoleSelectionScreen() {
  const router = useRouter();

  const panels = [
    {
      title: 'Admin Console',
      description: 'System control center',
      route: '/(admin)',
      icon: 'shield-checkmark',
      colors: ['#2D3436', '#636E72'], // Corporate Slate
      iconColor: '#74B9FF',
      shadow: 'shadow-gray-400',
    },
    {
      title: 'Driver App',
      description: 'Book spots & navigate',
      route: '/(driver)',
      icon: 'car-sport',
      colors: ['#00B894', '#55EFC4'], // Energetic Teal
      iconColor: '#FFFFFF',
      shadow: 'shadow-teal-200',
    },
    {
      title: 'Provider Portal',
      description: 'Manage assets & revenue',
      route: '/(provider)',
      icon: 'business',
      colors: ['#6C5CE7', '#a29bfe'], // Premium Indigo
      iconColor: '#FFFFFF',
      shadow: 'shadow-indigo-200',
    },
  ];

  return (
    <View className="flex-1 bg-white">
      {/* Abstract Background Shapes */}
      <View className="absolute top-0 left-0 w-full h-[60%] bg-gray-50 -z-10 rounded-b-[60px] transform scale-x-110" />
      <View className="absolute -top-20 -right-20 w-64 h-64 bg-teal-50 rounded-full opacity-50 blur-3xl" />
      <View className="absolute top-40 -left-20 w-72 h-72 bg-indigo-50 rounded-full opacity-50 blur-3xl" />

      <View className="flex-1 px-6 pt-24">
        <Animated.View entering={FadeInUp.delay(200).duration(1000)} className="items-center mb-12">
          <View className="w-20 h-20 bg-dark-900 rounded-2xl justify-center items-center mb-6 shadow-xl shadow-gray-300 transform rotate-3">
            <Ionicons name="layers" size={36} color="#00B894" />
          </View>
          <Text className="text-4xl font-black text-dark-900 tracking-tight">ParkEase</Text>
          <Text className="text-gray-500 mt-2 text-base font-medium uppercase tracking-widest">Select Workspace</Text>
        </Animated.View>

        <View className="gap-5">
          {panels.map((panel, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(400 + (index * 200)).duration(800)}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push(panel.route as any)}
                className={`shadow-lg ${panel.shadow}`}
              >
                <LinearGradient
                  colors={panel.colors as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-6 rounded-2xl flex-row items-center relative overflow-hidden"
                >
                  {/* Subtle noise/texture overlay circle */}
                  <View className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />

                  <View className="w-14 h-14 bg-white/20 rounded-xl justify-center items-center backdrop-blur-md border border-white/10">
                    <Ionicons name={panel.icon as any} size={26} color={panel.iconColor} />
                  </View>

                  <View className="ml-5 flex-1">
                    <Text className="text-white text-lg font-bold">{panel.title}</Text>
                    <Text className="text-white/70 text-xs font-medium mt-1 uppercase tracking-wide">{panel.description}</Text>
                  </View>

                  <Ionicons name="chevron-forward" size={24} color="white" className="opacity-80" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>

      <View className="items-center pb-8">
        <Text className="text-gray-300 text-[10px] font-bold tracking-[4px] uppercase">Professional Edition</Text>
      </View>
    </View>
  );
}
