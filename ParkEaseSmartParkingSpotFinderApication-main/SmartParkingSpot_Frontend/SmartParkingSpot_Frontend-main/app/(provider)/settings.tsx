import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
    Switch,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Animated, { FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import CustomHeader from '../../components/CustomHeader';
import UnifiedSidebar from '../../components/UnifiedSidebar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProviderSettingsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState(true);
    const [instantBooking, setInstantBooking] = useState(true);
    const [visibleToPublic, setVisibleToPublic] = useState(true);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Provider');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const providerGradient: readonly [string, string, ...string[]] = ['#8B5CF6', '#6D28D9'];

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await AsyncStorage.getItem('admin_settings');
            const storedName = await AsyncStorage.getItem('userName');
            if (storedName) setUserName(storedName);

            if (settings) {
                const parsed = JSON.parse(settings);
                setNotifications(parsed.notifications ?? true);
                setInstantBooking(parsed.instantBooking ?? true);
                setVisibleToPublic(parsed.visibleToPublic ?? true);
            }
        } catch (err) {
            console.error('Failed to load settings', err);
        } finally {
            setLoading(false);
        }
    };

    const saveSetting = async (key: string, value: any) => {
        try {
            const settings = await AsyncStorage.getItem('admin_settings');
            const current = settings ? JSON.parse(settings) : {};
            const updated = { ...current, [key]: value };
            await AsyncStorage.setItem('admin_settings', JSON.stringify(updated));
        } catch (err) {
            console.error('Failed to save setting', err);
        }
    };

    const handleLogout = async () => {
        Alert.alert("Terminating Session", "Are you sure you want to disconnect from the Provider Hub?", [
            { text: "Abort", style: "cancel" },
            {
                text: "Disconnect", style: "destructive", onPress: async () => {
                    await AsyncStorage.clear();
                    router.replace('/' as any);
                }
            }
        ]);
    };

    const SettingItem = ({ icon, label, description, value, onToggle, color = "#8B5CF6" }: any) => (
        <View style={{ height: 60 }} className="flex-row items-center justify-between px-4 border-b border-gray-50 bg-white">
            <View className="flex-row items-center flex-1">
                <View style={{ backgroundColor: `${color}10` }} className="w-10 h-10 rounded-xl items-center justify-center mr-4">
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <View className="flex-1">
                    <Text className="font-bold text-gray-900 text-[15px]">{label}</Text>
                    <Text className="text-gray-400 text-[10px] uppercase tracking-wider">{description}</Text>
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: '#E2E8F0', true: '#C4B5FD' }}
                thumbColor={value ? '#8B5CF6' : '#94A3B8'}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
        </View>
    );

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="small" color="#8B5CF6" />
                <Text className="mt-4 text-purple-600 font-bold uppercase tracking-widest text-[8px]">Syncing Protocol...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <CustomHeader
                title="Configuration"
                subtitle="SYSTEM PREFS"
                onMenuPress={() => setIsSidebarOpen(true)}
                userName={userName}
            />

            <UnifiedSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                userName={userName}
                userRole="Service Provider"
                userStatus="OPERATIONS CONTROL"
                gradientColors={providerGradient}
                dark={false}
                onLogout={async () => {
                    await AsyncStorage.clear();
                    router.replace('/' as any);
                }}
                menuItems={[
                    { icon: 'grid', label: 'Dashboard', route: '/(provider)/dashboard' },
                    { icon: 'calendar', label: 'Bookings', route: '/(provider)/history' },
                    { icon: 'cash', label: 'Revenue Hub', route: '/(provider)/earnings' },
                    { icon: 'analytics', label: 'Traffic', route: '/(provider)/traffic' },
                    { icon: 'person', label: 'Profile', route: '/(provider)/profile' },
                    { icon: 'settings', label: 'Settings', route: '/(provider)/settings' },
                ]}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* ACCOUNT HERO */}
                <View className="px-5 -mt-6">
                    <Animated.View
                        entering={ZoomIn.duration(400)}
                        className="bg-white rounded-xl p-4 border border-white shadow-sm flex-row items-center"
                    >
                        <LinearGradient colors={['#8B5CF6', '#6D28D9']} className="w-12 h-12 rounded-xl items-center justify-center mr-4">
                            <Text className="text-white text-xl font-black">{userName.charAt(0).toUpperCase()}</Text>
                        </LinearGradient>
                        <View className="flex-1">
                            <Text className="text-xl font-black text-gray-900 tracking-tight">{userName}</Text>
                            <Text className="text-purple-600 text-[10px] font-bold uppercase tracking-widest">Verified Partner</Text>
                        </View>
                    </Animated.View>
                </View>

                {/* SYSTEM SETTINGS */}
                <View className="mt-8">
                    <Text className="text-gray-900 text-sm font-black tracking-tight ml-6 mb-3">Operations Control</Text>
                    <View className="bg-white border-t border-b border-gray-100">
                        <SettingItem
                            icon="notifications"
                            label="Neuro Link"
                            description="Real-time hub alerts"
                            value={notifications}
                            onToggle={(v: any) => { setNotifications(v); saveSetting('notifications', v); }}
                        />
                        <SettingItem
                            icon="flash"
                            label="Instant Flow"
                            description="Auto-approve credentials"
                            value={instantBooking}
                            onToggle={(v: any) => { setInstantBooking(v); saveSetting('instantBooking', v); }}
                            color="#F59E0B"
                        />
                        <SettingItem
                            icon="eye"
                            label="Node Visibility"
                            description="Public listing on grid"
                            value={visibleToPublic}
                            onToggle={(v: any) => { setVisibleToPublic(v); saveSetting('visibleToPublic', v); }}
                            color="#10B981"
                        />

                        <TouchableOpacity
                            onPress={() => Alert.alert('Security Protocol', 'Updating encryption keys...')}
                            style={{ height: 60 }}
                            className="flex-row items-center justify-between px-4 bg-white"
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="bg-rose-50 w-10 h-10 rounded-xl items-center justify-center mr-4">
                                    <Ionicons name="shield-checkmark" size={20} color="#F43F5E" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-gray-900 text-[15px]">Access Integrity</Text>
                                    <Text className="text-gray-400 text-[10px] uppercase tracking-wider">Security Certificates</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                        </TouchableOpacity>
                    </View>

                    {/* DANGER ZONE */}
                    <Text className="text-rose-500 text-sm font-black tracking-tight ml-6 mt-8 mb-3">Terminal Exit</Text>
                    <TouchableOpacity
                        onPress={handleLogout}
                        activeOpacity={0.9}
                        style={{ height: 70 }}
                        className="bg-white border-t border-b border-gray-100 flex-row items-center px-6"
                    >
                        <View className="bg-rose-50 w-10 h-10 rounded-xl items-center justify-center mr-4">
                            <Ionicons name="power" size={20} color="#F43F5E" />
                        </View>
                        <View>
                            <Text className="text-rose-600 font-bold text-base">Shut Down Hub</Text>
                            <Text className="text-rose-400 text-[10px] uppercase tracking-widest">Terminate all sessions</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
