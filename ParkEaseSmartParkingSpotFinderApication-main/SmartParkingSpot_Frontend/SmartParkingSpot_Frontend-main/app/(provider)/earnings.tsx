import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../../components/CustomHeader';
import UnifiedSidebar from '../../components/UnifiedSidebar';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { BarChart } from 'react-native-chart-kit';
import BASE_URL from '../../constants/api';
import axios from 'axios';

const API = BASE_URL;
const { width } = Dimensions.get('window');

export default function ProviderEarningsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Provider');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [data, setData] = useState<any>({
        summary: {
            totalEarnings: 0,
            availableBalance: 0,
            pendingPayout: 0,
            thisMonth: 0,
            totalWithdrawals: 0,
        },
        weeklyData: [],
        transactions: [],
    });
    const [withdrawalModalVisible, setWithdrawalModalVisible] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [upiId, setUpiId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const providerGradient: readonly [string, string, ...string[]] = ['#059669', '#10B981'];

    const loadEarnings = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API}/api/provider/earnings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 200) {
                setData(res.data);
            }
        } catch (err) {
            console.error('Earnings load failed:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const name = await AsyncStorage.getItem('userName');
            if (name) setUserName(name);
            await loadEarnings();
        };
        init();
    }, []);

    const handleWithdrawal = async () => {
        const amount = parseFloat(withdrawAmount);
        if (!amount || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please specify a valid settlement volume.');
            return;
        }
        if (amount > data.summary.availableBalance) {
            Alert.alert('Insufficient Liquidity', 'The requested amount exceeds your available net balance.');
            return;
        }
        if (!upiId.trim()) {
            Alert.alert('Destination Required', 'Please provide a valid UPI identifier for the transfer.');
            return;
        }

        setSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.post(`${API}/api/provider/withdraw`, {
                amount: amount,
                upiId: upiId.trim(),
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 200 || res.status === 201) {
                Alert.alert('Protocol Initiated', 'Your withdrawal request has been queued for settlement.');
                setWithdrawalModalVisible(false);
                setWithdrawAmount('');
                loadEarnings();
            }
        } catch (err) {
            Alert.alert('Network Fault', 'Could not establish connection to the settlement gateway.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="small" color="#10B981" />
                <Text className="mt-2 text-emerald-600 font-bold uppercase tracking-[2px] text-[8px]">Syncing Financial Node...</Text>
            </View>
        );
    }

    const maxWeekly = Math.max(...(data.weeklyData?.map((d: any) => d.value) || [1]), 1);
    const summary = data.summary; // For easier access to summary data

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <CustomHeader
                title="Revenue Hub"
                subtitle="FINANCIAL OPS"
                onMenuPress={() => setIsSidebarOpen(true)}
                userName={userName}
            />

            <UnifiedSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                userName={userName}
                userRole="Service Provider"
                userStatus="FINANCIAL OPS"
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

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadEarnings(); }} tintColor="#10B981" />
                }
            >
                {/* COMPACT REVENUE HERO */}
                <View className="px-4 mt-4">
                    <Animated.View entering={ZoomIn} className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50 items-center">
                        <Text className="text-gray-400 text-[6px] font-black uppercase tracking-[3px]">Available Liquidity</Text>
                        <Text className="text-2xl font-black text-gray-900 tracking-tighter mt-1">₹{summary?.availableBalance?.toFixed(1) || '0.0'}</Text>

                        <TouchableOpacity
                            onPress={() => setWithdrawalModalVisible(true)}
                            activeOpacity={0.9}
                            className="bg-gray-900 mt-5 w-full py-3 rounded-xl items-center"
                        >
                            <Text className="text-white font-black uppercase tracking-[2px] text-[9px]">Execute Settlement</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Yield Intelligence */}
                <View className="px-4 mt-6">
                    <Text className="text-gray-900 text-sm font-black tracking-tight ml-2 mb-3">Yield Intelligence</Text>
                    <View className="flex-row gap-4">
                        <View className="flex-1 bg-white rounded-2xl p-4 border border-purple-50 shadow-sm">
                            <Text className="text-gray-400 text-[6px] font-black uppercase tracking-[2px] mb-1">Total Yield</Text>
                            <Text className="text-gray-900 text-lg font-black tracking-tight">₹{summary?.totalEarnings?.toLocaleString() || '0'}</Text>
                        </View>
                        <View className="flex-1 bg-white rounded-2xl p-4 border border-purple-50 shadow-sm">
                            <Text className="text-gray-400 text-[6px] font-black uppercase tracking-[2px] mb-1">MTD Return</Text>
                            <Text className="text-gray-900 text-lg font-black tracking-tight">₹{summary?.thisMonth?.toLocaleString() || '0'}</Text>
                        </View>
                    </View>
                </View>

                {/* VELOCITY TRACK (COMPACT BAR CHART) */}
                <View className="px-4 mt-4">
                    <View className="bg-white rounded-[32px] p-6 border border-emerald-50 shadow-sm">
                        <Text className="text-gray-900 text-sm font-black tracking-tight mb-4">Velocity Track</Text>
                        <BarChart
                            data={{
                                labels: data.weeklyData?.map((d: any) => d.label) || [],
                                datasets: [{
                                    data: data.weeklyData?.map((d: any) => d.value) || [0, 0, 0, 0, 0, 0, 0]
                                }]
                            }}
                            width={width - 56}
                            height={140}
                            yAxisLabel="₹"
                            yAxisSuffix=""
                            chartConfig={{
                                backgroundColor: '#ffffff',
                                backgroundGradientFrom: '#ffffff',
                                backgroundGradientTo: '#ffffff',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                                style: { borderRadius: 16 }
                            }}
                            style={{ borderRadius: 16, marginLeft: -12 }}
                            fromZero
                        />
                    </View>
                </View>

                {/* SETTLEMENT HISTORY NAVIGATION */}
                <View className="px-4 mt-6">
                    <Animated.View entering={FadeInUp.delay(200)}>
                        <TouchableOpacity
                            onPress={() => router.push('/(provider)/settlement-history' as any)}
                            activeOpacity={0.9}
                            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
                        >
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 items-center justify-center mr-4">
                                        <Ionicons name="receipt-outline" size={22} color="#10B981" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-black text-base text-gray-900 tracking-tight">Settlement History</Text>
                                        <Text className="text-gray-400 text-[8px] font-bold uppercase tracking-[2px] mt-1">
                                            {data.transactions?.length || 0} TRANSACTION RECORDS
                                        </Text>
                                    </View>
                                </View>
                                <View className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 items-center justify-center">
                                    <Ionicons name="chevron-forward" size={18} color="#6B7280" />
                                </View>
                            </View>

                            {/* Quick Preview - show last 2 transactions */}
                            {data.transactions?.length > 0 && (
                                <View className="mt-4 pt-4 border-t border-gray-50">
                                    {data.transactions.slice(0, 2).map((tx: any, i: number) => (
                                        <View key={tx.id || i} className="flex-row items-center justify-between py-2">
                                            <View className="flex-row items-center flex-1">
                                                <View className={`w-7 h-7 rounded-lg items-center justify-center mr-3 ${tx.amount > 0 ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                                                    <Ionicons
                                                        name={tx.amount > 0 ? "arrow-down-circle" : "arrow-up-circle"}
                                                        size={14}
                                                        color={tx.amount > 0 ? "#10B981" : "#94A3B8"}
                                                    />
                                                </View>
                                                <Text className="text-gray-500 text-[10px] font-bold">{tx.type || 'Settlement'}</Text>
                                            </View>
                                            <Text className={`text-sm font-black ${tx.amount > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                                                {tx.amount > 0 ? '+' : ''}₹{tx.amount.toFixed(2)}
                                            </Text>
                                        </View>
                                    ))}
                                    <Text className="text-emerald-600 text-[8px] font-black uppercase tracking-[2px] text-center mt-2">
                                        TAP TO VIEW ALL →
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </ScrollView>

            {/* SETTLEMENT MODAL */}
            <Modal visible={withdrawalModalVisible} transparent animationType="slide" statusBarTranslucent>
                <View className="flex-1 bg-black/80 justify-end">
                    <TouchableOpacity activeOpacity={1} className="flex-1" onPress={() => setWithdrawalModalVisible(false)} />
                    <Animated.View entering={FadeInUp} className="bg-white rounded-t-[40px] p-8 pb-12">
                        <View className="w-12 h-1 rounded-full self-center mb-8 bg-gray-100" />

                        <Text className="text-2xl font-black mb-2 text-gray-900 tracking-tighter">Settlement</Text>
                        <Text className="text-gray-400 text-[8px] font-black uppercase tracking-[3px] mb-8">Node Transfer Protocol</Text>

                        <View className="mb-6">
                            <Text className="text-gray-400 text-[8px] font-black uppercase tracking-[3px] mb-3 ml-4">Volume (₹)</Text>
                            <TextInput
                                className="bg-gray-50 rounded-2xl p-5 border border-gray-100 font-black text-2xl text-gray-900"
                                keyboardType="numeric"
                                placeholder="0.00"
                                value={withdrawAmount}
                                onChangeText={setWithdrawAmount}
                            />
                        </View>

                        <View className="mb-8">
                            <Text className="text-gray-400 text-[8px] font-black uppercase tracking-[3px] mb-3 ml-4">UPI Destination</Text>
                            <TextInput
                                className="bg-gray-50 rounded-2xl p-5 border border-gray-100 font-black text-sm text-gray-900"
                                placeholder="user@bank"
                                value={upiId}
                                autoCapitalize="none"
                                onChangeText={setUpiId}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleWithdrawal}
                            disabled={submitting}
                            activeOpacity={0.9}
                            className="bg-emerald-600 py-5 rounded-2xl items-center shadow-lg shadow-emerald-600/20"
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text className="text-white font-black uppercase tracking-[2px] text-[10px]">Execute Cloud Transfer</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}
