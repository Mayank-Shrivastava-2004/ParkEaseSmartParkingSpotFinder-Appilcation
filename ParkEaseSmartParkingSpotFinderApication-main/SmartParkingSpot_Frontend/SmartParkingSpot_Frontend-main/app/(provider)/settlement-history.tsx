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
import Animated, { FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import BASE_URL from '../../constants/api';
import axios from 'axios';

const API = BASE_URL;

export default function SettlementHistoryScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userName, setUserName] = useState('Provider');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [summary, setSummary] = useState({
        totalSettled: 0,
        pendingCount: 0,
        totalCredits: 0,
        totalDebits: 0,
    });

    const providerGradient: readonly [string, string, ...string[]] = ['#059669', '#10B981'];

    const loadTransactions = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API}/api/provider/earnings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 200) {
                const txns = res.data.transactions || [];
                setTransactions(txns);

                // Calculate summary stats
                let totalCredits = 0;
                let totalDebits = 0;
                let pendingCount = 0;
                txns.forEach((tx: any) => {
                    if (tx.amount > 0) totalCredits += tx.amount;
                    else totalDebits += Math.abs(tx.amount);
                    if (tx.status?.toLowerCase() === 'pending') pendingCount++;
                });
                setSummary({
                    totalSettled: txns.length,
                    pendingCount,
                    totalCredits,
                    totalDebits,
                });
            }
        } catch (err) {
            console.error('Settlement history load failed:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const name = await AsyncStorage.getItem('userName');
            if (name) setUserName(name);
        };
        init();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadTransactions();
        }, [])
    );

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase();
        if (s === 'completed' || s === 'settled') return { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' };
        if (s === 'pending') return { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600' };
        if (s === 'failed' || s === 'rejected') return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600' };
        return { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-600' };
    };

    const renderTransaction = ({ item, index }: { item: any; index: number }) => {
        const isCredit = item.amount > 0;
        const statusColors = getStatusColor(item.status);

        return (
            <Animated.View entering={FadeInUp.delay(index * 40)} className="px-5">
                <TouchableOpacity
                    activeOpacity={0.9}
                    className="bg-white p-5 mb-3 rounded-2xl border border-gray-50 shadow-sm"
                >
                    <View className="flex-row items-center">
                        {/* Icon */}
                        <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${isCredit ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50 border border-gray-100'}`}>
                            <Ionicons
                                name={isCredit ? "arrow-down-circle" : "arrow-up-circle"}
                                size={24}
                                color={isCredit ? "#10B981" : "#94A3B8"}
                            />
                        </View>

                        {/* Details */}
                        <View className="flex-1">
                            <Text className="font-black text-sm text-gray-900 tracking-tight">
                                {item.type || 'Booking Settlement'}
                            </Text>
                            <View className="flex-row items-center mt-1.5 gap-2">
                                <View className="flex-row items-center">
                                    <Ionicons name="calendar-outline" size={10} color="#94A3B8" />
                                    <Text className="text-gray-400 text-[9px] font-bold ml-1">{item.date}</Text>
                                </View>
                                <View className={`px-2 py-0.5 rounded-full ${statusColors.bg} border ${statusColors.border}`}>
                                    <Text className={`text-[7px] font-black uppercase tracking-[1.5px] ${statusColors.text}`}>
                                        {item.status}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Amount */}
                        <View className="items-end">
                            <Text className={`text-lg font-black ${isCredit ? 'text-emerald-600' : 'text-gray-900'}`}>
                                {isCredit ? '+' : ''}₹{Math.abs(item.amount).toFixed(2)}
                            </Text>
                            <Text className="text-[7px] font-black uppercase text-gray-300 mt-0.5 tracking-[1px]">
                                {isCredit ? 'CREDIT' : 'DEBIT'}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="small" color="#10B981" />
                <Text className="mt-2 text-emerald-600 font-bold uppercase tracking-[2px] text-[8px]">Loading Settlement Records...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <CustomHeader
                title="Settlement History"
                subtitle="TRANSACTION LEDGER"
                onMenuPress={() => setIsSidebarOpen(true)}
                userName={userName}
            />

            <UnifiedSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                userName={userName}
                userRole="Service Provider"
                userStatus="TRANSACTION LEDGER"
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

            <FlatList
                data={transactions}
                keyExtractor={(item, index) => (item.id || index).toString()}
                renderItem={renderTransaction}
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); loadTransactions(); }}
                        tintColor="#10B981"
                    />
                }
                ListHeaderComponent={() => (
                    <View className="px-5 mb-4">
                        {/* Summary Cards - 2x2 Grid */}
                        <Animated.View entering={FadeInDown.delay(100)} className="mb-5">
                            <View className="flex-row gap-3 mb-3">
                                <View className="flex-1 bg-white rounded-2xl p-4 border border-emerald-50 shadow-sm items-center">
                                    <Ionicons name="checkmark-done-circle" size={22} color="#10B981" />
                                    <Text className="text-lg font-black text-gray-900 mt-1">{summary.totalSettled}</Text>
                                    <Text className="text-gray-400 text-[6px] font-black uppercase tracking-[2px] mt-0.5">Total Txns</Text>
                                </View>
                                <View className="flex-1 bg-white rounded-2xl p-4 border border-emerald-50 shadow-sm items-center">
                                    <Ionicons name="trending-up" size={22} color="#059669" />
                                    <Text className="text-lg font-black text-emerald-600 mt-1">₹{summary.totalCredits.toFixed(0)}</Text>
                                    <Text className="text-gray-400 text-[6px] font-black uppercase tracking-[2px] mt-0.5">Earnings</Text>
                                </View>
                            </View>
                            <View className="flex-row gap-3">
                                <View className="flex-1 bg-white rounded-2xl p-4 border border-red-50 shadow-sm items-center">
                                    <Ionicons name="trending-down" size={22} color="#EF4444" />
                                    <Text className="text-lg font-black text-red-500 mt-1">₹{summary.totalDebits.toFixed(0)}</Text>
                                    <Text className="text-gray-400 text-[6px] font-black uppercase tracking-[2px] mt-0.5">Withdrawals</Text>
                                </View>
                                <View className="flex-1 bg-white rounded-2xl p-4 border border-amber-50 shadow-sm items-center">
                                    <Ionicons name="time-outline" size={22} color="#F59E0B" />
                                    <Text className="text-lg font-black text-amber-600 mt-1">{summary.pendingCount}</Text>
                                    <Text className="text-gray-400 text-[6px] font-black uppercase tracking-[2px] mt-0.5">Pending</Text>
                                </View>
                            </View>
                        </Animated.View>

                        {/* Section Title */}
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="font-black text-lg text-gray-900 tracking-tight">All Transactions</Text>
                            <View className="bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                                <Text className="text-gray-400 text-[8px] font-black uppercase tracking-widest">{transactions.length} RECORDS</Text>
                            </View>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <Animated.View entering={ZoomIn} className="items-center justify-center mt-20 px-12">
                        <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-6 shadow-sm border border-gray-50">
                            <Ionicons name="receipt-outline" size={32} color="#E2E8F0" />
                        </View>
                        <Text className="text-gray-900 font-black text-base tracking-tight text-center mb-2">No Settlements Yet</Text>
                        <Text className="text-gray-400 font-bold text-[9px] uppercase tracking-[2px] text-center leading-relaxed">
                            Your transaction history will appear here once bookings are settled.
                        </Text>
                    </Animated.View>
                }
            />
        </View>
    );
}
