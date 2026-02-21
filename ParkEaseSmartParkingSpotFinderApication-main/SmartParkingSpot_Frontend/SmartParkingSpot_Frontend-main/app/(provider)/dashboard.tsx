import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    ActivityIndicator,
    BackHandler,
    Dimensions,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import api from '../../components/api/axios';
import UnifiedHeader from '../../components/UnifiedHeader';
import UnifiedSidebar from '../../components/UnifiedSidebar';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import CustomHeader from '../../components/CustomHeader';
import { Modal } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function ProviderDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [stats, setStats] = useState<any>({
        summary: {
            totalRevenue: 0,
            todayEarnings: 0,
            monthToDateEarnings: 0,
            occupancyRate: 0,
            activeCars: 0,
            totalSlots: 0,
            totalLots: 0,
            rating: 5.0,
            totalReviews: 0
        },
        revenueTrend: [],
        recentActivity: [],
        online: true,
        providerName: 'Provider'
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [isIntelligenceModalVisible, setIsIntelligenceModalVisible] = useState(false);

    const providerGradient: readonly [string, string, ...string[]] = ['#8B5CF6', '#6D28D9'];

    useFocusEffect(
        useCallback(() => {
            loadDashboard();

            // Hardware back goes to role selection page instead of login
            const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
                router.replace('/');
                return true; // Prevent default back behavior
            });

            return () => backHandler.remove();
        }, [])
    );

    const loadDashboard = async () => {
        try {
            // Real Data Fetch
            const [statsRes, profileRes] = await Promise.all([
                api.get('/provider/dashboard-stats'),
                api.get('/profile').catch(() => null)
            ]);

            if (statsRes.status === 200 && statsRes.data) {
                const data = statsRes.data;
                // Ensure summary values are never null/undefined
                if (data.summary) {
                    data.summary.totalRevenue = data.summary.totalRevenue ?? 0;
                    data.summary.todayEarnings = data.summary.todayEarnings ?? 0;
                    data.summary.monthToDateEarnings = data.summary.monthToDateEarnings ?? 0;
                    data.summary.occupancyRate = data.summary.occupancyRate ?? 0;
                    data.summary.activeCars = data.summary.activeCars ?? 0;
                    data.summary.totalSlots = data.summary.totalSlots ?? 0;
                    data.summary.totalLots = data.summary.totalLots ?? 0;
                    data.summary.rating = data.summary.rating ?? 0;
                    data.summary.totalReviews = data.summary.totalReviews ?? 0;
                }
                if (!data.revenueTrend) data.revenueTrend = [];
                if (!data.recentActivity) data.recentActivity = [];
                console.log('✅ Dashboard loaded:', JSON.stringify(data.summary));
                setStats(data);
            }
            if (profileRes?.status === 200) {
                setProfile(profileRes.data);
            }
        } catch (err: any) {
            console.error('❌ Failed to load dashboard:', err?.response?.status, err?.response?.data || err.message);
            // Keep default zeros so the UI still renders
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleStatusToggle = async (val: boolean) => {
        try {
            const response = await api.put('/provider/status',
                { is_online: val }
            );
            if (response.status === 200) {
                setStats({ ...stats, online: val });
                Alert.alert('Protocol Sync', `System is now ${val ? 'Discovery LIVE' : 'OFFLINE'}.`);
            }
        } catch (err) {
            Alert.alert('Sync Error', 'Cloud interface unreachable.');
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="small" color="#8B5CF6" />
                <Text className="mt-2 text-purple-600 font-bold uppercase tracking-[2px] text-[8px]">Syncing Real-time Flux...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <CustomHeader
                title="Hub Central"
                subtitle="NETWORK TOPOLOGY"
                onMenuPress={() => setIsSidebarOpen(true)}
                userName={profile?.name || stats.providerName}
            />

            <UnifiedSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                userName={profile?.name || stats.providerName}
                userRole="Service Provider"
                userStatus={stats.online ? "DISCOVERY LIVE" : "OFFLINE"}
                gradientColors={providerGradient}
                dark={false}
                onLogout={async () => {
                    await AsyncStorage.clear();
                    router.replace('/' as any);
                }}
                menuItems={[
                    { icon: 'grid', label: 'Dashboard', route: '/(provider)/dashboard' },
                    { icon: 'location', label: 'My Spots', route: '/(provider)/my-spots' },
                    { icon: 'calendar', label: 'Bookings', route: '/(provider)/history' },
                    { icon: 'cash', label: 'Revenue Hub', route: '/(provider)/earnings' },
                    { icon: 'analytics', label: 'Traffic', route: '/(provider)/traffic' },
                    { icon: 'person', label: 'Profile', route: '/(provider)/profile' },
                    { icon: 'settings', label: 'Settings', route: '/(provider)/settings' },
                ]}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDashboard(); }} tintColor="#8B5CF6" />
                }
            >
                {/* COMPACT KPI GRID */}
                <View className="px-4 mt-4 flex-row flex-wrap justify-between">
                    {[
                        { label: 'Total Spots', value: stats.summary?.totalLots ?? 0, icon: 'grid-outline', color: '#8B5CF6', route: '/(provider)/my-spots' },
                        { label: 'Active Load', value: stats.summary?.activeCars ?? 0, icon: 'car-sport-outline', color: '#10B981', route: '/(provider)/traffic' },
                        { label: 'Today Yield', value: `₹${(stats.summary?.todayEarnings ?? 0).toFixed(0)}`, icon: 'cash-outline', color: '#3B82F6', route: '/(provider)/earnings' },
                        { label: 'MTD Revenue', value: `₹${(stats.summary?.monthToDateEarnings ?? 0).toFixed(0)}`, icon: 'stats-chart-outline', color: '#F59E0B', route: '/(provider)/earnings' },
                    ].map((widget, i) => (
                        <Animated.View
                            key={i}
                            entering={FadeInDown.delay(i * 50)}
                            style={{ width: (width - 48) / 2 }}
                            className="mb-3"
                        >
                            <TouchableOpacity
                                onPress={() => router.push(widget.route as any)}
                                activeOpacity={0.9}
                                className="bg-white rounded-2xl p-4 border border-purple-50 shadow-sm"
                            >
                                <View className="flex-row items-center justify-between mb-2">
                                    <View style={{ backgroundColor: `${widget.color}15` }} className="w-8 h-8 rounded-lg items-center justify-center">
                                        <Ionicons name={widget.icon as any} size={16} color={widget.color} />
                                    </View>
                                    <Ionicons name="chevron-forward" size={10} color="#CBD5E1" />
                                </View>
                                <Text className="text-gray-400 text-[6px] font-black uppercase tracking-[2px] mb-0.5">{widget.label}</Text>
                                <Text className="text-gray-900 text-lg font-black tracking-tight">{widget.value}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* BUSINESS FLOW (LINE CHART MOCKUP) */}
                <View className="px-4 mt-2">
                    <Animated.View entering={ZoomIn.delay(200)} className="bg-white rounded-3xl p-5 border border-purple-50 shadow-sm">
                        <View className="flex-row justify-between items-center mb-4">
                            <View>
                                <Text className="text-gray-900 text-base font-black tracking-tight">Business Flow</Text>
                                <Text className="text-gray-400 text-[7px] font-black uppercase tracking-[2px]">30-Day Revenue Flux</Text>
                            </View>
                        </View>

                        <View className="items-center">
                            {(stats.revenueTrend && stats.revenueTrend.length > 0) ? (
                                <LineChart
                                    data={{
                                        labels: stats.revenueTrend.filter((_: any, idx: number) => idx % 5 === 0).map((d: any) => d.label || ''),
                                        datasets: [{
                                            data: stats.revenueTrend.map((d: any) => d.value ?? 0)
                                        }]
                                    }}
                                    width={width - 48}
                                    height={140}
                                    yAxisLabel="₹"
                                    yAxisSuffix=""
                                    chartConfig={{
                                        backgroundColor: '#ffffff',
                                        backgroundGradientFrom: '#ffffff',
                                        backgroundGradientTo: '#ffffff',
                                        decimalPlaces: 0,
                                        color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                                        labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                                        style: { borderRadius: 16 },
                                        propsForDots: { r: "3", strokeWidth: "2", stroke: "#8B5CF6" }
                                    }}
                                    bezier
                                    style={{ borderRadius: 16, paddingRight: 40 }}
                                />
                            ) : (
                                <View className="h-[140px] items-center justify-center">
                                    <Ionicons name="bar-chart-outline" size={32} color="#CBD5E1" />
                                    <Text className="text-gray-400 text-xs font-bold mt-2">No revenue data yet</Text>
                                </View>
                            )}
                        </View>
                    </Animated.View>
                </View>

                {/* SYSTEM HEALTH (CLICKABLE) */}
                <View className="px-5 mt-6">
                    <Text className="text-gray-900 text-sm font-black tracking-tight ml-2 mb-3">System Health</Text>
                    <TouchableOpacity
                        onPress={() => setIsIntelligenceModalVisible(true)}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#1F2937', '#111827']}
                            className="rounded-2xl p-5 flex-row justify-between items-center shadow-lg shadow-black/20"
                        >
                            <View className="flex-row items-center gap-4">
                                <View className="w-10 h-10 bg-emerald-500/20 rounded-full items-center justify-center border border-emerald-500/30">
                                    <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                                </View>
                                <View>
                                    <Text className="text-white text-base font-black tracking-tight">All Systems Operational</Text>
                                    <Text className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Version 2.4.0 • Stable</Text>
                                </View>
                            </View>
                            <View className="bg-white/10 p-2 rounded-lg">
                                <Ionicons name="chevron-forward" size={12} color="#9CA3AF" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* QUICK ACTIONS */}
                <View className="px-5 mt-4">
                    <Text className="text-gray-900 text-sm font-black tracking-tight ml-2 mb-3">Priority Protocols</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/(provider)/add-spot' as any)}
                        activeOpacity={0.9}
                        className="bg-white rounded-3xl p-1 border border-purple-100 shadow-sm"
                    >
                        <LinearGradient
                            colors={['#8B5CF6', '#7C3AED']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="rounded-[22px] p-6 flex-row items-center justify-between"
                        >
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center border border-white/30 mr-4">
                                    <Ionicons name="add-circle" size={24} color="white" />
                                </View>
                                <View>
                                    <Text className="text-white text-lg font-black tracking-tight">Add New Parking Node</Text>
                                    <Text className="text-white/60 text-[8px] font-bold uppercase tracking-widest">Register precision GPS location</Text>
                                </View>
                            </View>
                            <Ionicons name="arrow-forward" size={20} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* QUICK SUPPORT */}
                <View className="px-5 mt-6 mb-8">
                    <TouchableOpacity
                        onPress={() => router.push('/(provider)/support' as any)}
                        activeOpacity={0.8}
                        className="bg-white rounded-[24px] p-5 border border-purple-50 flex-row items-center justify-between"
                    >
                        <View className="flex-row items-center">
                            <View className="bg-purple-50 w-10 h-10 rounded-xl items-center justify-center mr-4">
                                <Ionicons name="headset" size={20} color="#8B5CF6" />
                            </View>
                            <View>
                                <Text className="text-gray-900 font-black text-sm tracking-tight">Concierge Access</Text>
                                <Text className="text-gray-400 text-[9px] font-black uppercase tracking-[2px]">Real-time assistance</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
                    </TouchableOpacity>
                </View>

            </ScrollView>

            <Modal
                visible={isIntelligenceModalVisible}
                transparent
                animationType="fade"
                statusBarTranslucent
            >
                <View className="flex-1 justify-center bg-black/60 px-6">
                    <View className="bg-white rounded-3xl p-6 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-gray-900 font-black text-lg tracking-tight">System Status</Text>
                                <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Real-time Diagnostics</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsIntelligenceModalVisible(false)} className="bg-gray-100 p-2 rounded-xl">
                                <Ionicons name="close" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <View className="mb-6 gap-3">
                            <View className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex-row items-center">
                                <Ionicons name="server-outline" size={20} color="#10B981" />
                                <View className="ml-3">
                                    <Text className="text-emerald-900 font-black text-xs uppercase tracking-wider">APIs Online</Text>
                                    <Text className="text-emerald-700/60 text-[10px] font-bold">Latency: 24ms</Text>
                                </View>
                            </View>

                            <View className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex-row items-center">
                                <Ionicons name="sync-outline" size={20} color="#3B82F6" />
                                <View className="ml-3">
                                    <Text className="text-blue-900 font-black text-xs uppercase tracking-wider">Data Sync</Text>
                                    <Text className="text-blue-700/60 text-[10px] font-bold">Last updated: Just now</Text>
                                </View>
                            </View>

                            <View className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex-row items-center">
                                <Ionicons name="wallet-outline" size={20} color="#8B5CF6" />
                                <View className="ml-3">
                                    <Text className="text-purple-900 font-black text-xs uppercase tracking-wider">Payments</Text>
                                    <Text className="text-purple-700/60 text-[10px] font-bold">Gateway Active</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setIsIntelligenceModalVisible(false)}
                            className="bg-gray-900 h-12 rounded-xl items-center justify-center shadow-xl"
                        >
                            <Text className="text-white font-black uppercase tracking-widest text-xs">Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
