import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
    RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../../constants/api';
import CustomHeader from '../../components/CustomHeader';
import UnifiedSidebar from '../../components/UnifiedSidebar';
import StatsCard from '../../components/StatsCard';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import api from '../../components/api/axios';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

const API = BASE_URL;

export default function DriverDashboard() {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);


    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userName, setUserName] = useState('Driver');
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [stats, setStats] = useState<any>({
        todaySpent: 0,
        walletBalance: 0,
        recentSpots: [],
        spendingTrend: []
    });
    const [unreadCount, setUnreadCount] = useState(0);

    const driverGradient: readonly [string, string, ...string[]] = ['#3B82F6', '#1D4ED8'];

    const menuItems = [
        { icon: 'grid', label: 'Dashboard', route: '/(driver)/dashboard' },
        { icon: 'search', label: 'Find Parking', route: '/(driver)/find' },
        { icon: 'time', label: 'My Bookings', route: '/(driver)/bookings' },
        { icon: 'card', label: 'Payments', route: '/(driver)/payments' },
        { icon: 'settings', label: 'Settings', route: '/(driver)/settings' },
        { icon: 'person-circle', label: 'Account Profile', route: '/(driver)/profile' },
        { icon: 'headset', label: 'Support', route: '/(driver)/support' },
    ];

    const loadDashboardData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const storedName = await AsyncStorage.getItem('userName');
            if (storedName) setUserName(storedName);

            // 1. Wallet Balance & Transactions (Single Source of Truth)
            let balance = 0;
            try {
                const walletRes = await api.get('/driver/wallet', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                balance = walletRes.data.balance || 0;
            } catch (e) {
                console.log("Wallet fetch error", e);
            }

            // 2. Today's Spending (New Optimized API)
            let todaySpent = 0;
            try {
                const spendsRes = await api.get('/driver/bookings/spends/today', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                todaySpent = spendsRes.data || 0;
            } catch (e) {
                console.log("Today spends fetch error", e);
            }

            // 3. Bookings
            let allBookings: any[] = [];
            try {
                const bookingsRes = await api.get('/driver/bookings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                allBookings = bookingsRes.data || [];
            } catch (e) {
                console.log("Bookings fetch error", e);
            }

            // Calculate Spending Trend (Last 6 Months)
            const trendMap = new Map<string, number>();
            allBookings.forEach((b: any) => {
                const dateRaw = b.date || b.startTime;
                if (dateRaw) {
                    const date = new Date(dateRaw);
                    const month = date.toLocaleString('default', { month: 'short' });
                    trendMap.set(month, (trendMap.get(month) || 0) + (Number(b.amount) || Number(b.totalAmount) || 0));
                }
            });

            const spendingTrend = Array.from(trendMap.entries()).map(([label, value]) => ({ label, value }));
            if (spendingTrend.length === 0) {
                spendingTrend.push({ label: 'No Data', value: 0 });
            }

            // Recent Spots
            const uniqueProviders = new Map();
            allBookings.forEach((b: any) => {
                const pName = b.providerName || b.parkingLot?.name;
                if (pName && !uniqueProviders.has(pName)) {
                    uniqueProviders.set(pName, {
                        id: b.providerId || b.parkingLot?.id || Math.random(),
                        name: pName,
                        location: b.location || b.parkingLot?.location || 'Unknown Location',
                        lastVisited: b.date || b.startTime ? new Date(b.date || b.startTime).toLocaleDateString() : 'N/A'
                    });
                }
            });
            const recentSpots = Array.from(uniqueProviders.values()).slice(0, 5);

            setStats({
                todaySpent: todaySpent.toFixed(0),
                walletBalance: balance.toFixed(2),
                recentSpots,
                spendingTrend
            });

            // Fetch Notification Count
            const notifRes = await api.get('/notifications/unread-count', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (notifRes.status === 200) {
                setUnreadCount(notifRes.data);
            }

        } catch (err) {
            console.error('Driver dashboard load failed:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.replace('/' as any);
    };


    if (!isMounted) return null;

    if (loading) {
        return (
            <View className={`flex-1 justify-center items-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-4 text-blue-600 font-bold uppercase tracking-widest text-xs">Syncing Driver Profile...</Text>
            </View>
        );
    }

    return (
        <View className={`flex-1 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            <StatusBar barStyle="light-content" />

            <CustomHeader
                title="Smart Deck"
                subtitle="Autonomous Mobility"
                role="driver"
                onMenuPress={() => setSidebarOpen(true)}
                userName={userName}
                notificationCount={unreadCount}
            />

            <UnifiedSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                userName={userName}
                userRole="Pro Driver"
                userStatus="Journey Ready"
                menuItems={menuItems}
                onLogout={handleLogout}
                gradientColors={driverGradient}
                dark={isDark}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
                }
            >
                {/* SECTION 1: FINANCIAL STATS (At Top) */}
                <View className="px-5 mt-6 mb-[20px]">
                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <StatsCard
                                icon="cash"
                                iconColor="#F59E0B"
                                iconBgColor={isDark ? 'bg-amber-500/10' : 'bg-amber-50'}
                                label="Today Spends"
                                value={`₹${stats.todaySpent}`}
                                dark={isDark}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={() => router.push('/(driver)/payments')}
                            className="flex-1"
                        >
                            <StatsCard
                                icon="wallet"
                                iconColor="#10B981"
                                iconBgColor={isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}
                                label="Wallet Balance"
                                value={`₹${stats.walletBalance}`}
                                dark={isDark}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* SECTION 2: LIVE MAP WIDGET */}
                <View className="px-5 mb-[20px]">
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => router.push('/(driver)/find')}
                        className={`rounded-[32px] overflow-hidden shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800 shadow-black' : 'bg-white border-gray-100 shadow-md'}`}
                    >
                        <View className="h-[200px] bg-gray-200 relative overflow-hidden">
                            {/* Mock Map Visuals */}
                            <View className={`absolute inset-0 ${isDark ? 'bg-slate-800' : 'bg-blue-50'}`} />

                            <View className="absolute top-1/2 left-1/2 -ml-3 -mt-3">
                                <View className="bg-blue-600 w-8 h-8 rounded-full border-2 border-white shadow-lg items-center justify-center">
                                    <Ionicons name="navigate" size={16} color="white" />
                                </View>
                            </View>

                            <View className="absolute bottom-4 left-4 right-4 bg-white/90 py-3 px-4 rounded-2xl flex-row justify-between items-center shadow-sm">
                                <View className="flex-row items-center">
                                    <View className="w-2 h-2 bg-emerald-500 rounded-full mr-2" />
                                    <Text className="text-gray-900 font-black text-[10px] uppercase tracking-widest">Global GPS Active</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* SECTION 3: QUICK COMMANDS (Tools) */}
                <View className="px-5 mb-[20px]">
                    <Text className={`font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-gray-900'} mb-6 px-2`}>Quick Commands</Text>
                    <View className="flex-row flex-wrap justify-between gap-y-4">
                        {[
                            { label: 'Find Parking', icon: 'map', color: '#3B82F6', bg: '#EFF6FF', route: '/(driver)/find' },
                            { label: 'My Bookings', icon: 'calendar', color: '#6366F1', bg: '#EEF2FF', route: '/(driver)/bookings' },
                            { label: 'Payments', icon: 'card', color: '#8B5CF6', bg: '#F5F3FF', route: '/(driver)/payments' },
                            { label: 'Support', icon: 'headset', color: '#EF4444', bg: '#FEF2F2', route: '/(driver)/support' },
                        ].map((tool, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => router.push(tool.route as any)}
                                activeOpacity={0.7}
                                className={`${isDark ? 'bg-slate-900 border-slate-800 shadow-black' : 'bg-white border-gray-100 shadow-sm'} w-[48%] py-8 rounded-[32px] items-center justify-center border`}
                            >
                                <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : tool.bg }} className="w-14 h-14 rounded-[20px] items-center justify-center mb-3">
                                    <Ionicons name={tool.icon as any} size={24} color={tool.color} />
                                </View>
                                <Text className={`${isDark ? 'text-slate-300' : 'text-gray-900'} font-black text-[10px] uppercase tracking-widest`}>{tool.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* SECTION 4: SPENDING TREND (Analytics) */}
                <View className="px-5 mb-[40px]" style={{ minHeight: 320 }}>
                    <View className={`${isDark ? 'bg-slate-900 border-slate-800 shadow-black' : 'bg-white border-white shadow-md'} rounded-[40px] p-6 border`}>
                        <View className="flex-row items-center justify-between mb-4 px-2">
                            <Text className={`font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Spending Trend</Text>
                            <Ionicons name="stats-chart" size={18} color="#3B82F6" />
                        </View>

                        <View style={{ height: 220, minHeight: 220, justifyContent: 'center', alignItems: 'center' }}>
                            <LineChart
                                data={{
                                    labels: stats.spendingTrend?.length > 0 ? stats.spendingTrend.map((d: any) => d.label) : ["Mon", "Tue", "Wed"],
                                    datasets: [{
                                        data: stats.spendingTrend?.length > 0 ? stats.spendingTrend.map((d: any) => d.value) : [0, 0, 0]
                                    }]
                                }}
                                width={Dimensions.get("window").width - 70}
                                height={220}
                                chartConfig={{
                                    backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                                    backgroundGradientFrom: isDark ? "#0F172A" : "#FFFFFF",
                                    backgroundGradientTo: isDark ? "#0F172A" : "#FFFFFF",
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                                    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
                                    style: { borderRadius: 16 },
                                    propsForDots: { r: "6", strokeWidth: "2", stroke: "#3B82F6" }
                                }}
                                bezier
                                style={{ marginVertical: 8, borderRadius: 16 }}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
