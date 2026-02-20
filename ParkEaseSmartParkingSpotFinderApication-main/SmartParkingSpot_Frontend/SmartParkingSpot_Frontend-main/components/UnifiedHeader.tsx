import React from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface UnifiedHeaderProps {
    title: string;
    subtitle: string;
    role: 'admin' | 'driver' | 'provider';
    gradientColors: readonly [string, string, ...string[]];
    onMenuPress: () => void;
    userName: string;
    notificationCount?: number;
    showBackButton?: boolean;
    onBackPress?: () => void;
    compact?: boolean;
    // New Props for Provider Status
    showStatusToggle?: boolean;
    isOnline?: boolean;
    onStatusToggle?: (val: boolean) => void;
}

export default function UnifiedHeader({
    title,
    subtitle,
    role,
    gradientColors,
    onMenuPress,
    userName,
    notificationCount = 0,
    showBackButton = false,
    onBackPress,
    compact = false,
    showStatusToggle = false,
    isOnline = true,
    onStatusToggle
}: UnifiedHeaderProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const topPadding = Platform.OS === 'android' ? Math.max(insets.top, StatusBar.currentHeight || 20) : insets.top;

    // MEDIUM HEIGHT
    const headerHeight = 85 + topPadding;

    return (
        <LinearGradient
            colors={gradientColors}
            className="rounded-b-[24px] shadow-sm shadow-indigo-950/15"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ height: headerHeight, paddingTop: topPadding }}
        >
            <View className="px-5 flex-1 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={showBackButton ? (onBackPress || (() => router.back())) : onMenuPress}
                        className="w-10 h-10 bg-white/20 rounded-xl justify-center items-center border border-white/30 mr-4 shadow-sm"
                    >
                        <Ionicons
                            name={showBackButton ? "chevron-back" : "menu"}
                            size={22}
                            color="white"
                        />
                    </TouchableOpacity>

                    <View className="flex-1 justify-center">
                        <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">{subtitle}</Text>
                        <Text className="text-white font-black tracking-tight text-xl leading-tight" numberOfLines={1}>{title}</Text>
                    </View>
                </View>

                <View className="flex-row items-center gap-3">
                    {showStatusToggle && role === 'provider' && (
                        <View className="flex-row items-center bg-black/20 px-2 py-1 rounded-lg border border-white/10">
                            <Text className={`text-[9px] font-black uppercase tracking-widest mr-1.5 ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isOnline ? 'ON' : 'OFF'}
                            </Text>
                            <Switch
                                value={isOnline}
                                onValueChange={onStatusToggle}
                                trackColor={{ false: '#4B5563', true: '#10B981' }}
                                thumbColor="#ffffff"
                                style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
                            />
                        </View>
                    )}

                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => router.push(`/(${role})/notifications` as any)}
                            className="w-10 h-10 bg-white/10 rounded-xl justify-center items-center relative border border-white/10"
                        >
                            <Ionicons name="notifications-outline" size={20} color="white" />
                            {notificationCount > 0 && (
                                <View className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white/40" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => router.push(`/(${role})/profile` as any)}
                            className="w-10 h-10 bg-white/30 rounded-xl justify-center items-center border border-white/40"
                        >
                            <Text className="text-white font-black text-lg">
                                {userName.charAt(0).toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
}
