import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface CustomHeaderProps {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    onMenuPress?: () => void;
    showStatusToggle?: boolean;
    isOnline?: boolean;
    onStatusToggle?: (val: boolean) => void;
    userName?: string;
    notificationCount?: number;
    role?: 'provider' | 'driver' | 'admin';
}

export default function CustomHeader({
    title,
    subtitle,
    showBackButton = false,
    onMenuPress,
    showStatusToggle = false,
    isOnline = true,
    onStatusToggle,
    userName = 'P',
    notificationCount = 0,
    role = 'provider'
}: CustomHeaderProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // MEDIUM HEIGHT
    const topPadding = Platform.OS === 'ios' ? insets.top : (StatusBar.currentHeight || 20);

    return (
        <LinearGradient
            colors={['#8B5CF6', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.container, { height: 85 + topPadding, paddingTop: topPadding }]}
        >
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <View className="flex-1 flex-row items-center px-6 justify-between">
                {/* Left Section */}
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity
                        onPress={showBackButton ? () => router.back() : onMenuPress}
                        activeOpacity={0.7}
                        className="bg-white/20 rounded-xl border border-white/30 w-10 h-10 items-center justify-center shadow-sm"
                    >
                        <Ionicons name={showBackButton ? "chevron-back" : "menu"} size={22} color="white" />
                    </TouchableOpacity>

                    <View className="ml-4 flex-1 justify-center">
                        {subtitle && (
                            <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                                {subtitle}
                            </Text>
                        )}
                        <Text className="text-white font-black tracking-tight text-xl leading-tight" numberOfLines={1}>
                            {title}
                        </Text>
                    </View>
                </View>

                {/* Right Section */}
                <View className="flex-row items-center gap-3">
                    {showStatusToggle && (
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

                    <TouchableOpacity
                        className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center border border-white/10 relative"
                        onPress={() => router.push(`/(provider)/notifications` as any)}
                    >
                        <Ionicons name="notifications-outline" size={20} color="white" />
                        {notificationCount > 0 && (
                            <View className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white/40" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center border border-white/30"
                        onPress={() => router.push(`/(provider)/profile` as any)}
                    >
                        <Text className="text-white font-black text-lg">
                            {(userName || 'U').charAt(0).toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 8,
        zIndex: 1000,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    }
});
