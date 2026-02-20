import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    ActivityIndicator,
    FlatList,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
    RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../../components/CustomHeader';
import UnifiedSidebar from '../../components/UnifiedSidebar';
import BASE_URL from '../../constants/api';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import axios from 'axios';
import { BookingStatus } from '../../constants/types';

const API = BASE_URL;

export default function ProviderHistoryScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userName, setUserName] = useState('Provider');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    const providerGradient: readonly [string, string, ...string[]] = ['#8B5CF6', '#6D28D9'];

    const loadHistory = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API}/api/provider/history`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 200) {
                setHistory(res.data);
            }
        } catch (err) {
            console.error('History load failed:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [])
    );

    const renderItem = ({ item, index }: { item: any; index: number }) => (
        <Animated.View entering={FadeInUp.delay(index * 50)} className="px-5">
            <TouchableOpacity
                activeOpacity={0.9}
                className="bg-white p-5 mb-3 rounded-2xl border border-purple-50 shadow-sm"
            >
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-purple-50 border border-purple-100">
                            <Ionicons name="car-sport" size={20} color="#8B5CF6" />
                        </View>
                        <View className="flex-1">
                            <Text className="font-black text-base text-gray-900 tracking-tight">{item.customer || 'Guest User'}</Text>
                            <Text className="text-gray-400 text-[8px] font-black uppercase tracking-[2px] mt-0.5">{item.vehicleNumber || 'N/A'}</Text>
                        </View>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${item.status === 'completed' ? 'bg-emerald-50' : 'bg-amber-50'} border ${item.status === 'completed' ? 'border-emerald-100' : 'border-amber-100'}`}>
                        <Text className={`text-[8px] font-black uppercase tracking-[2px] ${item.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                <View className="flex-row justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    <View>
                        <Text className="text-gray-400 text-[8px] font-black uppercase tracking-[2px] mb-1">Date</Text>
                        <Text className="font-black text-gray-900 text-[10px] tracking-tight">{item.date}</Text>
                    </View>
                    <View>
                        <Text className="text-gray-400 text-[8px] font-black uppercase tracking-[2px] mb-1 text-center">Slot</Text>
                        <Text className="font-black text-gray-900 text-[10px] text-center tracking-tight">{item.slot}</Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-gray-400 text-[8px] font-black uppercase tracking-[2px] mb-1">Yield</Text>
                        <Text className="font-black text-lg text-purple-600">₹{item.amount}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="small" color="#8B5CF6" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <CustomHeader
                title="Business Logs"
                subtitle="HISTORICAL ARCHIVE"
                onMenuPress={() => setIsSidebarOpen(true)}
                userName={userName}
            />

            <UnifiedSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                userName={userName}
                userRole="Service Provider"
                userStatus="HISTORICAL ARCHIVE"
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

            <FlatList
                data={history}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 20 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadHistory(); }} tintColor="#8B5CF6" />
                }
                ListHeaderComponent={() => (
                    <View className="px-5 mb-4 flex-row justify-between items-center">
                        <Text className="font-black text-lg text-gray-900 tracking-tight">Records</Text>
                        <View className="bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                            <Text className="text-gray-400 text-[8px] font-black uppercase tracking-widest">{history.length} ITEMS</Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <Animated.View entering={ZoomIn} className="items-center justify-center mt-20 px-12">
                        <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-6 shadow-sm border border-gray-50">
                            <Ionicons name="folder-open-outline" size={32} color="#E2E8F0" />
                        </View>
                        <Text className="text-gray-400 font-black uppercase tracking-[2px] text-[8px] text-center leading-relaxed">No historical records detected.</Text>
                    </Animated.View>
                }
            />
        </View>
    );
}
