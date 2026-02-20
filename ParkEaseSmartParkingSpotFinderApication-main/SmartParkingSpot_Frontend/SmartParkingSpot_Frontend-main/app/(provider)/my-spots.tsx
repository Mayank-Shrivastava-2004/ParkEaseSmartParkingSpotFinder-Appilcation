import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    RefreshControl,
    Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import axios from 'axios';
import BASE_URL from '../../constants/api';
import UnifiedHeader from '../../components/UnifiedHeader';
import UnifiedSidebar from '../../components/UnifiedSidebar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const API = BASE_URL;

interface ParkingSpot {
    id: number;
    title: string;
    location: string;
    price: number;
    totalSlots: number;
    status: string;
    isActive: boolean;
    createdAt: string | null;
}

export default function MySpotsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [spots, setSpots] = useState<ParkingSpot[]>([]);
    const [providerName, setProviderName] = useState('Provider');
    const [sidebarVisible, setSidebarVisible] = useState(false);

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editSpot, setEditSpot] = useState<ParkingSpot | null>(null);
    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const providerGradient: readonly [string, string, ...string[]] = ['#8B5CF6', '#6D28D9'];

    const menuItems = [
        { icon: 'grid', label: 'Dashboard', route: '/(provider)/dashboard' },
        { icon: 'location', label: 'My Spots', route: '/(provider)/my-spots' },
        { icon: 'car-sport', label: 'Spot Control', route: '/(provider)/spaces' },
        { icon: 'calendar', label: 'Bookings', route: '/(provider)/history' },
        { icon: 'cash', label: 'Revenue Hub', route: '/(provider)/earnings' },
        { icon: 'person', label: 'Profile', route: '/(provider)/profile' },
        { icon: 'settings', label: 'Settings', route: '/(provider)/settings' },
    ];

    const fetchSpots = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                router.replace('/');
                return;
            }

            const [spotsRes, profileRes] = await Promise.all([
                axios.get(`${API}/api/provider/spaces`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API}/api/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => null)
            ]);

            if (spotsRes.status === 200) {
                setSpots(spotsRes.data || []);
            }
            if (profileRes?.status === 200) {
                setProviderName(profileRes.data?.name || 'Provider');
            }
        } catch (err) {
            console.error('My Spots fetch failed:', err);
            Alert.alert('Sync Error', 'Failed to retrieve parking inventory.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSpots();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSpots();
    }, []);

    const handleEdit = (spot: ParkingSpot) => {
        setEditSpot(spot);
        setEditName(spot.title || '');
        setEditPrice(String(spot.price || 0));
        setEditModalVisible(true);
    };

    const handleEditSave = async () => {
        if (!editSpot) return;
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.put(`${API}/api/provider/space/${editSpot.id}`, {
                name: editName,
                price: Number(editPrice),
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Alert.alert('Success', 'Spot updated successfully.');
            setEditModalVisible(false);
            fetchSpots();
        } catch (err) {
            Alert.alert('Update Failed', 'Could not sync changes to the server.');
        }
    };

    const handleDelete = (spot: ParkingSpot) => {
        Alert.alert(
            'Remove Spot',
            `Are you sure you want to permanently remove "${spot.title}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'DELETE',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.delete(`${API}/api/provider/space/${spot.id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert('Removed', 'Parking spot has been decommissioned.');
                            fetchSpots();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to remove the parking spot.');
                        }
                    }
                }
            ]
        );
    };

    // Summary statistics
    const totalSlots = spots.reduce((sum, s) => sum + (s.totalSlots || 0), 0);
    const activeSpots = spots.filter(s => s.isActive).length;
    const offlineSpots = spots.length - activeSpots;

    const renderSpotCard = ({ item, index }: { item: ParkingSpot; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 80)} className="px-5 mb-4">
            <View className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} rounded-[28px] p-5 border shadow-sm`}>
                {/* Top Row: Name + Status */}
                <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-1 mr-3">
                        <Text className={`font-black text-base tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={1}>
                            {item.title || 'Unnamed Spot'}
                        </Text>
                        <View className="flex-row items-center mt-1.5">
                            <Ionicons name="location-outline" size={12} color="#94A3B8" />
                            <Text className="text-gray-400 text-[10px] font-bold ml-1 flex-1" numberOfLines={1}>
                                {item.location || 'No address'}
                            </Text>
                        </View>
                    </View>
                    <View className={`px-3 py-1.5 rounded-full ${item.isActive ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
                        <Text className={`text-[8px] font-black uppercase tracking-widest ${item.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {item.isActive ? 'LIVE' : 'OFFLINE'}
                        </Text>
                    </View>
                </View>

                {/* Stats Row */}
                <View className="flex-row gap-3 mb-5">
                    <View className={`flex-1 ${isDark ? 'bg-slate-800' : 'bg-purple-50'} rounded-2xl p-3 items-center`}>
                        <Text className="text-gray-400 text-[7px] font-black uppercase tracking-widest">Slots</Text>
                        <Text className={`font-black text-lg ${isDark ? 'text-white' : 'text-purple-700'}`}>{item.totalSlots || 0}</Text>
                    </View>
                    <View className={`flex-1 ${isDark ? 'bg-slate-800' : 'bg-indigo-50'} rounded-2xl p-3 items-center`}>
                        <Text className="text-gray-400 text-[7px] font-black uppercase tracking-widest">Price/Hr</Text>
                        <Text className={`font-black text-lg ${isDark ? 'text-white' : 'text-indigo-700'}`}>₹{item.price || 0}</Text>
                    </View>
                    <View className={`flex-1 ${isDark ? 'bg-slate-800' : 'bg-amber-50'} rounded-2xl p-3 items-center`}>
                        <Text className="text-gray-400 text-[7px] font-black uppercase tracking-widest">Status</Text>
                        <Text className={`font-black text-sm ${item.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>{item.status}</Text>
                    </View>
                </View>

                {/* Action Row */}
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={() => handleEdit(item)}
                        activeOpacity={0.8}
                        className={`flex-1 flex-row items-center justify-center py-3.5 rounded-2xl ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}
                    >
                        <Ionicons name="create-outline" size={16} color="#6366F1" />
                        <Text className="text-indigo-600 font-black text-[10px] uppercase tracking-widest ml-2">Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDelete(item)}
                        activeOpacity={0.8}
                        className={`flex-1 flex-row items-center justify-center py-3.5 rounded-2xl ${isDark ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-rose-50 border border-rose-100'}`}
                    >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        <Text className="text-rose-500 font-black text-[10px] uppercase tracking-widest ml-2">Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );

    const ListHeader = () => (
        <View className="px-5 mt-4 mb-6">
            {/* Summary Banner */}
            <Animated.View entering={ZoomIn.delay(100)} className={`${isDark ? 'bg-gradient-to-r from-purple-900 to-indigo-900' : ''} rounded-[32px] overflow-hidden mb-6`}>
                <View className="bg-purple-600 rounded-[32px] p-6">
                    <View className="flex-row items-center mb-4">
                        <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mr-4">
                            <Ionicons name="layers" size={24} color="white" />
                        </View>
                        <View>
                            <Text className="text-white/70 text-[9px] font-black uppercase tracking-widest">Registered Fleet</Text>
                            <Text className="text-white text-3xl font-black">{spots.length}</Text>
                        </View>
                    </View>

                    <View className="flex-row gap-3">
                        <View className="flex-1 bg-white/10 rounded-2xl p-3 items-center">
                            <Text className="text-white/60 text-[7px] font-black uppercase tracking-widest">Total Capacity</Text>
                            <Text className="text-white font-black text-lg mt-0.5">{totalSlots}</Text>
                        </View>
                        <View className="flex-1 bg-white/10 rounded-2xl p-3 items-center">
                            <Text className="text-white/60 text-[7px] font-black uppercase tracking-widest">Active</Text>
                            <Text className="text-emerald-300 font-black text-lg mt-0.5">{activeSpots}</Text>
                        </View>
                        <View className="flex-1 bg-white/10 rounded-2xl p-3 items-center">
                            <Text className="text-white/60 text-[7px] font-black uppercase tracking-widest">Offline</Text>
                            <Text className="text-rose-300 font-black text-lg mt-0.5">{offlineSpots}</Text>
                        </View>
                    </View>
                </View>
            </Animated.View>

            {/* Section Title */}
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <View className="w-1.5 h-6 bg-purple-600 rounded-full mr-3" />
                    <Text className={`font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>All Spots</Text>
                </View>
                <TouchableOpacity
                    onPress={() => router.push('/(provider)/spaces' as any)}
                    className="bg-purple-100 px-4 py-2 rounded-full"
                >
                    <Text className="text-purple-600 text-[9px] font-black uppercase tracking-widest">+ Add New</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const EmptyState = () => (
        <View className="items-center justify-center py-20">
            <View className={`w-24 h-24 ${isDark ? 'bg-slate-800' : 'bg-purple-50'} rounded-full items-center justify-center mb-6`}>
                <Ionicons name="car-outline" size={40} color="#8B5CF6" />
            </View>
            <Text className={`font-black text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>No Spots Registered</Text>
            <Text className="text-gray-400 text-sm mt-2 text-center px-10">Deploy your first parking node to start earning revenue.</Text>
            <TouchableOpacity
                onPress={() => router.push('/(provider)/spaces' as any)}
                className="bg-purple-600 px-8 py-4 rounded-2xl mt-8 shadow-lg shadow-purple-200"
            >
                <Text className="text-white font-black text-xs uppercase tracking-widest">Deploy First Spot</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View className={`flex-1 justify-center items-center ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text className="mt-4 text-purple-600 font-black uppercase tracking-widest text-[8px]">Loading Inventory...</Text>
            </View>
        );
    }

    return (
        <View className={`flex-1 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            <StatusBar barStyle="light-content" />

            <UnifiedHeader
                title="My Spots"
                subtitle="PARKING INFRASTRUCTURE"
                role="provider"
                gradientColors={providerGradient}
                onMenuPress={() => setSidebarVisible(true)}
                userName={providerName}
                showBackButton={true}
            />

            <UnifiedSidebar
                isOpen={sidebarVisible}
                onClose={() => setSidebarVisible(false)}
                userName={providerName}
                userRole="Spot Operator"
                userStatus="SYNC ACTIVE"
                menuItems={menuItems}
                onLogout={async () => {
                    await AsyncStorage.clear();
                    router.replace('/(provider)' as any);
                }}
                gradientColors={providerGradient}
                dark={isDark}
            />

            <FlatList
                data={spots}
                renderItem={renderSpotCard}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={<ListHeader />}
                ListEmptyComponent={<EmptyState />}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#8B5CF6"
                    />
                }
            />

            {/* EDIT MODAL */}
            <Modal visible={editModalVisible} transparent animationType="fade">
                <View className="flex-1 bg-black/60 justify-center px-6">
                    <View className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'} rounded-[36px] p-8 border`}>
                        <View className="items-center mb-6">
                            <View className="w-16 h-1 bg-gray-200 rounded-full mb-6" />
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-[5px]">Edit Spot Configuration</Text>
                        </View>

                        <Text className={`text-2xl font-black mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {editSpot?.title || 'Spot'}
                        </Text>

                        <View className="gap-4 mb-8">
                            <View className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                                <Text className="text-gray-400 text-[8px] font-black uppercase mb-2 tracking-widest">Spot Name</Text>
                                <TextInput
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="Enter spot name"
                                    placeholderTextColor="#94A3B8"
                                    className={`font-black ${isDark ? 'text-white' : 'text-gray-900'}`}
                                />
                            </View>
                            <View className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                                <Text className="text-gray-400 text-[8px] font-black uppercase mb-2 tracking-widest">Price Per Hour (₹)</Text>
                                <TextInput
                                    value={editPrice}
                                    onChangeText={setEditPrice}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#94A3B8"
                                    className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}
                                />
                            </View>
                        </View>

                        <View className="flex-row gap-4">
                            <TouchableOpacity
                                onPress={() => setEditModalVisible(false)}
                                className={`flex-1 py-5 rounded-3xl items-center border ${isDark ? 'border-slate-800' : 'border-gray-200'}`}
                            >
                                <Text className={`font-black text-xs uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleEditSave}
                                className="flex-1 py-5 bg-purple-600 rounded-3xl items-center shadow-lg shadow-purple-200"
                            >
                                <Text className="text-white font-black text-xs uppercase tracking-widest">Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
