import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import CustomHeader from '../../components/CustomHeader';
import UnifiedSidebar from '../../components/UnifiedSidebar';
import BASE_URL from '../../constants/api';
import axios from 'axios';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const API = BASE_URL;

export default function ProviderTrafficScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Provider');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [data, setData] = useState<any>({
        current: {
            totalSlots: 0,
            occupied: 0,
            available: 0,
            occupancyRate: 0,
        },
        hourlyData: [],
        peakHours: [],
    });
    const [refreshing, setRefreshing] = useState(false);

    const providerGradient: readonly [string, string, ...string[]] = ['#8B5CF6', '#6D28D9'];

    const loadTraffic = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const name = await AsyncStorage.getItem('userName');
            if (name) setUserName(name);

            const res = await axios.get(`${API}/api/provider/occupancy`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 200) {
                setData(res.data);
            }
        } catch (err) {
            console.error('Traffic load failed:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadTraffic();
    }, []);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text className="mt-4 text-purple-600 font-bold uppercase tracking-widest text-xs">Scanning Hub Sensors...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <CustomHeader
                title="Live Traffic"
                subtitle="REAL-TIME LOAD"
                onMenuPress={() => setIsSidebarOpen(true)}
                userName={userName}
            />

            <UnifiedSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                userName={userName}
                userRole="Service Provider"
                userStatus="TRAFFIC ANALYSIS"
                gradientColors={providerGradient}
                dark={false}
                onLogout={async () => {
                    await AsyncStorage.clear();
                    router.replace('/(provider)' as any);
                }}
                menuItems={[
                    { icon: 'grid', label: 'Dashboard', route: '/(provider)/dashboard' },
                    { icon: 'car-sport', label: 'My Parking', route: '/(provider)/spaces' },
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
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTraffic(); }} tintColor="#8B5CF6" />
                }
            >
                {/* HERO GAUGE */}
                <View className="px-4 mt-6">
                    <Animated.View entering={ZoomIn} className="bg-white rounded-[32px] p-6 shadow-sm border border-purple-50 items-center">
                        <View className="w-32 h-32 rounded-full border-[10px] border-purple-50 items-center justify-center relative shadow-inner">
                            <LinearGradient
                                colors={['#8B5CF6', '#6D28D9']}
                                className="absolute w-full h-full rounded-full opacity-5"
                            />
                            <View className="items-center">
                                <Text className="text-3xl font-black text-gray-900 tracking-tighter">{data.current.occupancyRate}%</Text>
                                <Text className="text-gray-400 text-[6px] font-black uppercase tracking-[2px] mt-1">Utilization</Text>
                            </View>
                        </View>

                        <View className="flex-row w-full justify-between mt-6 px-2">
                            <View className="items-center">
                                <Text className="text-purple-600 text-xl font-black">{data.current.occupied}</Text>
                                <Text className="text-gray-400 text-[6px] font-black uppercase tracking-[2px]">Occupied</Text>
                            </View>
                            <View className="w-[1px] bg-gray-100 h-6 self-center" />
                            <View className="items-center">
                                <Text className="text-emerald-500 text-xl font-black">{data.current.available}</Text>
                                <Text className="text-gray-400 text-[6px] font-black uppercase tracking-[2px]">Available</Text>
                            </View>
                            <View className="w-[1px] bg-gray-100 h-6 self-center" />
                            <View className="items-center">
                                <Text className="text-gray-900 text-xl font-black tracking-tighter">{data.current.totalSlots}</Text>
                                <Text className="text-gray-400 text-[6px] font-black uppercase tracking-[2px]">Capacity</Text>
                            </View>
                        </View>
                    </Animated.View>
                </View>

                {/* PEAK INTELLIGENCE */}
                <View className="px-5 mt-8">
                    <Text className="font-black text-lg tracking-tight mb-4 text-gray-900 ml-1">Traffic Intelligence</Text>
                    {data.peakHours.map((item: any, index: number) => (
                        <Animated.View key={index} entering={FadeInDown.delay(index * 150)}>
                            <View className="bg-white rounded-2xl p-5 mb-4 border border-purple-50 shadow-sm flex-row items-center">
                                <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${item.load === 'High' ? 'bg-rose-50' : 'bg-purple-50'}`}>
                                    <Ionicons
                                        name={item.load === 'High' ? "flame" : "flash"}
                                        size={20}
                                        color={item.load === 'High' ? "#E11D48" : "#8B5CF6"}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-black text-base text-gray-900 tracking-tight">{item.timeRange}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <View className={`w-1.5 h-1.5 rounded-full mr-2 ${item.load === 'High' ? 'bg-rose-500' : 'bg-purple-500'}`} />
                                        <Text className={`text-[8px] font-black uppercase tracking-[2px] ${item.load === 'High' ? 'text-rose-500' : 'text-purple-500'}`}>
                                            Velocity: {item.load}
                                        </Text>
                                    </View>
                                </View>
                                <View className="items-end bg-gray-50 px-4 py-2 rounded-xl">
                                    <Text className="font-black text-xl text-gray-900">{item.bookings}</Text>
                                    <Text className="text-gray-400 text-[6px] font-black uppercase mt-0.5">Bookings</Text>
                                </View>
                            </View>
                        </Animated.View>
                    ))}
                </View>

                {/* OPTIMIZATION ACTION */}
                <View className="px-5 mt-4">
                    <TouchableOpacity
                        activeOpacity={0.9}
                        className="bg-gray-900 rounded-2xl p-5 flex-row items-center justify-between border border-gray-800"
                    >
                        <View className="flex-1">
                            <Text className="text-sm font-black text-white tracking-tight">Smart Optimization</Text>
                            <Text className="text-white/40 text-[7px] mt-1 font-black uppercase tracking-[2px]">
                                {data.current.occupancyRate < 20
                                    ? "Suggestion: Lower rates by 10% to attract drivers"
                                    : data.current.occupancyRate < 50
                                        ? "Lower pricing by 5% to boost traffic"
                                        : data.current.occupancyRate > 90
                                            ? "Surge pricing active +10%"
                                            : "Optimal throughput detected"}
                            </Text>
                        </View>
                        <View className="bg-white/10 w-9 h-9 rounded-lg items-center justify-center">
                            <Ionicons name="trending-up" size={18} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
