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
    Alert,
    RefreshControl,
    Dimensions,
    Modal,
    FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, PieChart } from 'react-native-chart-kit';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

import BASE_URL from '../../constants/api';
import UnifiedHeader from '../../components/UnifiedHeader';
import UnifiedSidebar from '../../components/UnifiedSidebar';
import { useTheme } from '../../context/ThemeContext';

const API = BASE_URL;
const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Core data states
    const [overview, setOverview] = useState<any>({
        totalRevenue: 0,
        bookingSuccessRate: 0,
        occupancyRate: 0,
        userGrowth: 0
    });
    const [revenueTrend, setRevenueTrend] = useState<any>({
        labels: [],
        data: []
    });
    const [roleDist, setRoleDist] = useState<any>({
        admin: 0,
        provider: 0,
        driver: 0
    });
    const [insights, setInsights] = useState<any>({
        highDemandZones: [],
        underperformingSpots: [],
        revenueAnomalies: [],
        averageTransactionValue: 0,
        peakBookingHours: [],
        userRetentionRate: 0,
        activeOccupancy: 0,
        revenueByCategory: [],
        loyalDrivers: []
    });

    const [adminProfile, setAdminProfile] = useState<any>(null);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const adminGradient: readonly [string, string, ...string[]] = ['#4F46E5', '#312E81'];

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                router.replace('/');
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            const [overRes, trendRes, roleRes, profRes, insightRes] = await Promise.all([
                fetch(`${API}/api/admin/analytics/overview`, { headers }),
                fetch(`${API}/api/admin/analytics/velocity`, { headers }), // Updated endpoint
                fetch(`${API}/api/admin/analytics/role-distribution`, { headers }),
                fetch(`${API}/api/profile`, { headers }),
                fetch(`${API}/api/admin/analytics/insights`, { headers })
            ]);

            if (overRes.ok) setOverview(await overRes.json());
            if (trendRes.ok) setRevenueTrend(await trendRes.json());
            if (roleRes.ok) setRoleDist(await roleRes.json());
            if (profRes.ok) setAdminProfile(await profRes.json());
            if (insightRes.ok) setInsights(await insightRes.json());

        } catch (err) {
            console.error('Analytics Fetch Error:', err);
            Alert.alert('Cloud Sync Failure', 'Unable to retrieve real-time intelligence feeds.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, []);

    const chartConfig = {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        backgroundGradientFrom: isDark ? '#1e293b' : '#ffffff',
        backgroundGradientTo: isDark ? '#0f172a' : '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        labelColor: (opacity = 1) => isDark ? `rgba(148, 163, 184, ${opacity})` : `rgba(71, 85, 105, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: { r: "5", strokeWidth: "2", stroke: "#6366F1" }
    };

    const pieData = [
        { name: 'Drivers', population: roleDist.driver || 0, color: '#6366F1', legendFontColor: isDark ? '#94A3B8' : '#64748B', legendFontSize: 10 },
        { name: 'Providers', population: roleDist.provider || 0, color: '#10B981', legendFontColor: isDark ? '#94A3B8' : '#64748B', legendFontSize: 10 },
        { name: 'Admins', population: roleDist.admin || 0, color: '#F59E0B', legendFontColor: isDark ? '#94A3B8' : '#64748B', legendFontSize: 10 },
    ];

    const StatCard = ({ label, value, icon, color, delay, suffix = "" }: any) => (
        <Animated.View
            entering={FadeInDown.delay(delay)}
            className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-50'} rounded-[32px] p-5 shadow-sm border mb-4`}
            style={{ width: (width - 48) / 2 }}
        >
            <View className="flex-row items-center justify-between mb-3">
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <Ionicons name="stats-chart" size={12} color={color} />
            </View>
            <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest">{label}</Text>
            <Text className={`text-xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight`}>{value}{suffix}</Text>
        </Animated.View>
    );

    return (
        <View className={`flex-1 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`} >
            <StatusBar barStyle="light-content" />

            <UnifiedHeader
                title="Ecosystem Core"
                subtitle="PLATFORM AGGREGATE"
                role="admin"
                gradientColors={adminGradient}
                onMenuPress={() => setSidebarVisible(true)}
                userName={adminProfile?.name || "Administrator"}
                showBackButton={true}
            />

            <UnifiedSidebar
                isOpen={sidebarVisible}
                onClose={() => setSidebarVisible(false)}
                userName={adminProfile?.name || "Administrator"}
                userRole="Root Access"
                userStatus="Mainframe Authorized"
                menuItems={[
                    { icon: 'grid', label: 'Dashboard', route: '/(admin)/dashboard' },
                    { icon: 'people', label: 'Drivers', route: '/(admin)/drivers' },
                    { icon: 'business', label: 'Providers', route: '/(admin)/providers' },
                    { icon: 'analytics', label: 'Precision Intel', route: '/(admin)/analytics' },
                    { icon: 'settings', label: 'System Hub', route: '/(admin)/settings' },
                ]}
                onLogout={async () => {
                    await AsyncStorage.clear();
                    router.replace('/' as any);
                }}
                gradientColors={adminGradient}
                dark={isDark}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
            >
                {/* 2X2 CORE METRIC GRID */}
                <View className="px-5 mt-6 flex-row flex-wrap justify-between">
                    <StatCard
                        label="Total Revenue"
                        value={`₹${(overview.totalRevenue || 0).toLocaleString()}`}
                        icon="cash-outline"
                        color="#6366F1"
                        delay={100}
                    />
                    <StatCard
                        label="Success Rate"
                        value={(overview.bookingSuccessRate || 0).toFixed(1)}
                        suffix="%"
                        icon="checkmark-circle-outline"
                        color="#10B981"
                        delay={200}
                    />
                    <StatCard
                        label="Occupancy"
                        value={(insights?.activeOccupancy || 0).toFixed(1)}
                        suffix="%"
                        icon="car-sport-outline"
                        color="#F59E0B"
                        delay={300}
                    />
                    <StatCard
                        label="User Growth"
                        value={(overview.userGrowth || 0).toLocaleString()}
                        suffix="+"
                        icon="trending-up-outline"
                        color="#EC4899"
                        delay={400}
                    />
                </View>

                {/* REVENUE TREND (14 DAYS) */}
                <View className="px-5 mt-6">
                    <Animated.View entering={FadeInUp.delay(500)} className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-50'} rounded-[40px] p-6 border shadow-sm`}>
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Revenue Velocity</Text>
                                <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>14-Day Performance</Text>
                            </View>
                            <View className="bg-indigo-500/10 px-3 py-1 rounded-full">
                                <Text className="text-indigo-500 text-[8px] font-black uppercase">LIVE FEED</Text>
                            </View>
                        </View>

                        <LineChart
                            data={{
                                labels: revenueTrend.labels.length > 0 ? revenueTrend.labels : [''],
                                datasets: [{
                                    data: revenueTrend.data.length > 0 ? revenueTrend.data : [0]
                                }]
                            }}
                            width={width - 80}
                            height={220}
                            chartConfig={{
                                ...chartConfig,
                                propsForBackgroundLines: { strokeDasharray: "" },
                                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`, // Indigo
                                fillShadowGradient: '#6366F1',
                                fillShadowGradientOpacity: 0.2,
                            }}
                            bezier
                            onDataPointClick={({ value, getColor }) => {
                                Alert.alert("Revenue Insight", `Daily Earnings: ₹${value}`);
                            }}
                            style={{ marginVertical: 8, borderRadius: 16 }}
                            formatYLabel={(val) => Math.abs(Number(val)) >= 1000 ? `${(Number(val) / 1000).toFixed(0)}k` : val}
                        />
                    </Animated.View>
                </View>

                {/* USER BASE COMPOSITION */}
                <View className="px-5 mt-6">
                    <Animated.View entering={ZoomIn.delay(600)} className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-50'} rounded-[40px] p-6 border shadow-sm`}>
                        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">User Base Composition</Text>
                        <PieChart
                            data={pieData}
                            width={width - 80}
                            height={180}
                            chartConfig={chartConfig}
                            accessor="population"
                            backgroundColor="transparent"
                            paddingLeft="15"
                            absolute
                        />
                        <View className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-gray-50'}`}>
                            <Text className="text-center text-gray-400 text-[9px] font-bold uppercase tracking-widest">Total Active Nodes: {(roleDist.admin + roleDist.provider + roleDist.driver).toLocaleString()}</Text>
                        </View>
                    </Animated.View>
                </View>

                {/* MAINFRAME INSIGHTS SECTION */}
                <View className="px-5 mt-10">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className={`font-black text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>Mainframe Insights</Text>
                        <TouchableOpacity className="bg-emerald-500/10 px-4 py-2 rounded-2xl flex-row items-center">
                            <Ionicons name="download-outline" size={16} color="#10B981" />
                            <Text className="text-emerald-500 text-[10px] font-black uppercase ml-2">Export PDF</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row flex-wrap justify-between">
                        <View
                            className={`${isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'} rounded-[32px] p-6 border mb-4 items-center`}
                            style={{ width: (width - 50) / 2 }}
                        >
                            <View className="w-12 h-12 bg-indigo-600 rounded-2xl items-center justify-center mb-4 shadow-lg">
                                <Ionicons name="flame" size={24} color="white" />
                            </View>
                            <Text className={`font-black text-xs text-center ${isDark ? 'text-indigo-400' : 'text-indigo-900'}`}>High Demand</Text>
                            <Text className="text-gray-400 text-[9px] font-bold mt-1 uppercase">Occupancy &gt; 80%</Text>
                        </View>

                        <View
                            className={`${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100'} rounded-[32px] p-6 border mb-4 items-center`}
                            style={{ width: (width - 50) / 2 }}
                        >
                            <View className="w-12 h-12 bg-amber-500 rounded-2xl items-center justify-center mb-4 shadow-lg">
                                <Ionicons name="trending-down" size={24} color="white" />
                            </View>
                            <Text className={`font-black text-xs text-center ${isDark ? 'text-amber-600' : 'text-amber-900'}`}>Underperforming</Text>
                            <Text className="text-gray-400 text-[9px] font-bold mt-1 uppercase">Bookings &lt; 5/mo</Text>
                        </View>

                        <View
                            className={`${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'} rounded-[32px] p-6 border mb-4 items-center`}
                            style={{ width: width - 40 }}
                        >
                            <View className="flex-row items-center gap-4">
                                <View className="w-12 h-12 bg-rose-500 rounded-2xl items-center justify-center shadow-lg">
                                    <Ionicons name="alert-circle" size={24} color="white" />
                                </View>
                                <View>
                                    <Text className={`font-black text-xs ${isDark ? 'text-rose-400' : 'text-rose-900'}`}>Revenue Anomalies</Text>
                                    <Text className="text-gray-400 text-[9px] font-bold mt-1 uppercase">Spikes or Drops Detected</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ADVANCED METRICS SYNC */}
                <View className="px-5 mt-4">
                    <View className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-50'} rounded-[40px] p-8 border shadow-sm`}>
                        <View className="flex-row justify-between mb-8">
                            <View className="items-center flex-1">
                                <Text className="text-gray-400 text-[8px] font-black uppercase tracking-widest mb-1">ATV</Text>
                                <Text className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>₹{Math.ceil(insights?.averageTransactionValue || 0)}</Text>
                            </View>
                            <View className="w-[1px] h-full bg-gray-200" />
                            <View className="items-center flex-1">
                                <Text className="text-gray-400 text-[8px] font-black uppercase tracking-widest mb-1">Retention</Text>
                                <Text className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{Math.ceil(insights?.userRetentionRate || 0)}%</Text>
                            </View>
                        </View>

                        <Text className="text-gray-400 text-[8px] font-black uppercase tracking-[4px] mb-4 text-center">Peak Booking Matrix</Text>
                        {insights.peakBookingHours?.length === 0 ? (
                            <Text className="text-center text-gray-400 text-[10px] my-4 font-bold">Waiting for booking pulse...</Text>
                        ) : insights.peakBookingHours?.map((ph: any, idx: number) => (
                            <View key={idx} className="flex-row items-center justify-between mb-3">
                                <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{ph.hour}</Text>
                                <View className="flex-1 mx-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <View className="h-full bg-indigo-500" style={{ width: `${(ph.count / (insights?.peakBookingHours[0]?.count || 1)) * 100}%` }} />
                                </View>
                                <Text className="text-[10px] font-black text-indigo-500">{ph.count} BKGS</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View >
    );
}
