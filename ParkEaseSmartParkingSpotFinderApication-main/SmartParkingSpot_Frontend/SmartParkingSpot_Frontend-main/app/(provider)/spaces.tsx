import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
    Image,
    Animated as RNAnimated,
    Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../../components/CustomHeader';
import UnifiedSidebar from '../../components/UnifiedSidebar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import axios from 'axios';
import BASE_URL from '../../constants/api';
import Svg, { Circle, Rect, G, Line } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const API = BASE_URL;

export default function MySpacesScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [spaces, setSpaces] = useState<any[]>([]);
    const [providerName, setProviderName] = useState('Provider');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
    const [selectedSpot, setSelectedSpot] = useState<any>(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editPrice, setEditPrice] = useState('');
    const [zoom, setZoom] = useState(1);
    const flatListRef = useRef<FlatList>(null);

    const providerGradient: readonly [string, string, ...string[]] = ['#8B5CF6', '#6D28D9'];

    useEffect(() => {
        loadSpaces();
    }, []);

    const loadSpaces = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                const res = await axios.get(`${API}/api/provider/spaces`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.status === 200) {
                    setSpaces(res.data || []);
                }
            }
        } catch (err) {
            console.error("Failed to load spaces", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleEditSave = async () => {
        if (!selectedSpot) return;
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.put(`${API}/api/provider/space/${selectedSpot.id}`,
                { price: Number(editPrice) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            loadSpaces();
            setIsEditModalVisible(false);
        } catch (err) {
            Alert.alert("Sync Error", "Failed to update price on server");
        }
    };

    const toggleActiveStatus = async (id: number, currentActive: boolean) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const newActive = !currentActive;

            // Optimistic Update
            setSpaces(prev => prev.map(s => s.id === id ? { ...s, isActive: newActive } : s));

            const res = await axios.put(`${API}/api/provider/space/${id}/status`,
                { isActive: newActive },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.status === 200) {
                // Confirm sync
                if (selectedSpot?.id === id) setSelectedSpot({ ...selectedSpot, isActive: newActive });
            }
        } catch (err) {
            Alert.alert("Error", "Cloud sync failed for node status");
            loadSpaces(); // Revert
        }
    };

    const renderItem = ({ item, index }: { item: any; index: number }) => (
        <Animated.View entering={FadeInUp.delay(index * 50)} className="px-5 mb-3">
            <TouchableOpacity
                onPress={() => setSelectedSpot(item)}
                activeOpacity={0.9}
                className={`${(item.isActive === false) ? 'bg-gray-100 opacity-80' : 'bg-white'} rounded-[24px] p-4 flex-row items-center border border-gray-100 shadow-sm`}
            >
                <Image
                    source={{ uri: item.image || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=300' }}
                    style={{ width: 60, height: 60, borderRadius: 16 }}
                    className="mr-4 bg-gray-200"
                />
                <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-gray-900 font-black text-sm tracking-tight flex-1 mr-2" numberOfLines={1}>{item.title || item.slotCode}</Text>
                        <Switch
                            value={item.isActive !== false}
                            onValueChange={() => toggleActiveStatus(item.id, item.isActive !== false)}
                            trackColor={{ false: '#CBD5E1', true: '#C4B5FD' }}
                            thumbColor={(item.isActive !== false) ? '#8B5CF6' : '#64748B'}
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                        />
                    </View>

                    <Text className="text-gray-400 text-[8px] font-black uppercase tracking-widest mt-0.5" numberOfLines={1}>{item.location || 'Unknown Coordinates'}</Text>

                    <View className="flex-row items-center mt-2">
                        <View className={`px-2 py-0.5 rounded-md mr-2 ${(item.isActive === false) ? 'bg-rose-100' : 'bg-emerald-50'}`}>
                            <Text className={`text-[7px] font-black uppercase tracking-widest ${(item.isActive === false) ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {(item.isActive === false) ? 'OFFLINE' : item.status}
                            </Text>
                        </View>
                        <Text className="text-gray-900 text-[10px] font-black">₹{item.price || 0}/hr</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text className="mt-4 text-purple-600 font-black uppercase tracking-widest text-[8px]">Syncing Topology...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="light-content" />

            <CustomHeader
                title="Node Control"
                subtitle="INVENTORY MANAGEMENT"
                onMenuPress={() => setIsSidebarOpen(true)}
                userName={providerName}
            />

            <UnifiedSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                userName={providerName}
                userRole="System Administrator"
                userStatus="SYNC ACTIVE"
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
                    { icon: 'person', label: 'Profile', route: '/(provider)/profile' },
                    { icon: 'settings', label: 'Settings', route: '/(provider)/settings' },
                ]}
            />

            <View className="flex-row bg-white mx-5 mt-4 p-1.5 rounded-2xl border border-purple-50">
                <TouchableOpacity onPress={() => setActiveTab('list')} className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'list' ? 'bg-purple-600 shadow-lg shadow-purple-200' : ''}`}>
                    <Text className={`font-black text-[9px] uppercase tracking-widest ${activeTab === 'list' ? 'text-white' : 'text-gray-400'}`}>Terminal List</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('map')} className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'map' ? 'bg-purple-600 shadow-lg shadow-purple-200' : ''}`}>
                    <Text className={`font-black text-[9px] uppercase tracking-widest ${activeTab === 'map' ? 'text-white' : 'text-gray-400'}`}>Mapping Mesh</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-1 mt-4">
                {activeTab === 'list' ? (
                    <FlatList
                        ref={flatListRef}
                        data={spaces}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingTop: 10, paddingBottom: 120 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadSpaces(); }} tintColor="#8B5CF6" />}
                    />
                ) : (
                    <View className="flex-1 bg-white relative overflow-hidden">
                        <RNAnimated.View style={{ flex: 1, transform: [{ scale: zoom }] }}>
                            <Svg height="100%" width="100%" viewBox={`0 0 ${width} ${height * 0.6}`}>
                                {/* Map Grid Background */}
                                <Rect x="0" y="0" width={width} height={height} fill="#F8FAFC" />
                                {spaces.map((spot, i) => (
                                    <G key={spot.id} x={(spot.lat || 0.5) * width} y={(spot.lng || 0.4) * 400}>
                                        <Circle r="15" fill={spot.isActive === false ? '#F43F5E' : (spot.status === 'AVAILABLE' ? '#10B981' : '#F59E0B')} stroke="white" strokeWidth="3" />
                                    </G>
                                ))}
                            </Svg>

                            {/* UI Overlay Markers */}
                            {spaces.map((spot) => (
                                <TouchableOpacity
                                    key={spot.id}
                                    onPress={() => setSelectedSpot(spot)}
                                    style={{
                                        position: 'absolute',
                                        left: (spot.lat || 0.5) * width - 15,
                                        top: (spot.lng || 0.4) * 400 - 15,
                                        width: 30, height: 30,
                                        transform: [{ scale: 1 / zoom }]
                                    }}
                                />
                            ))}
                        </RNAnimated.View>

                        <View className="absolute bottom-6 right-6 gap-3">
                            <TouchableOpacity className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-xl border border-gray-100" onPress={() => setZoom(prev => Math.min(prev + 0.2, 2.5))}>
                                <Ionicons name="add" size={24} color="#1E293B" />
                            </TouchableOpacity>
                            <TouchableOpacity className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-xl border border-gray-100" onPress={() => setZoom(prev => Math.max(prev - 0.2, 0.4))}>
                                <Ionicons name="remove" size={24} color="#1E293B" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {/* SELECTION OVERLAY */}
            {selectedSpot && (
                <Animated.View entering={FadeInUp} className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-6 shadow-2xl border-t border-purple-50 pb-10">
                    <View className="flex-row justify-between items-start mb-6">
                        <View className="flex-1 mr-4">
                            <Text className="text-2xl font-black text-gray-900 leading-tight">{selectedSpot.title || selectedSpot.slotCode}</Text>
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">{selectedSpot.location}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedSpot(null)} className="bg-gray-100 p-2 rounded-full">
                            <Ionicons name="close" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row gap-4 mb-4">
                        <View className={`flex-1 p-4 rounded-3xl border ${selectedSpot.isActive === false ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                            <Text className={`text-[8px] font-black uppercase tracking-widest mb-1 ${selectedSpot.isActive === false ? 'text-rose-500' : 'text-emerald-500'}`}>Status Flux</Text>
                            <Text className={`text-xl font-black ${selectedSpot.isActive === false ? 'text-rose-700' : 'text-emerald-700'}`}>
                                {selectedSpot.isActive === false ? 'DISABLED' : (selectedSpot.status || 'AVAILABLE')}
                            </Text>
                        </View>
                        <View className="flex-1 p-4 rounded-3xl bg-blue-50 border border-blue-100">
                            <Text className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">Pricing Node</Text>
                            <Text className="text-xl font-black text-blue-700">₹{selectedSpot.price}/hr</Text>
                        </View>
                    </View>

                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => toggleActiveStatus(selectedSpot.id, selectedSpot.isActive !== false)}
                            className={`flex-1 h-14 rounded-2xl items-center justify-center shadow-lg ${selectedSpot.isActive === false ? 'bg-emerald-600 shadow-emerald-200' : 'bg-rose-600 shadow-rose-200'}`}
                        >
                            <Text className="text-white font-black uppercase tracking-widest text-[11px]">
                                {selectedSpot.isActive === false ? 'Activate Node' : 'Deactivate Node'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => { setEditPrice(selectedSpot.price.toString()); setIsEditModalVisible(true); }}
                            className="w-14 h-14 bg-gray-900 rounded-2xl items-center justify-center"
                        >
                            <Ionicons name="settings-outline" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}

            <Modal visible={isEditModalVisible} transparent animationType="fade">
                <View className="flex-1 bg-black/60 justify-center px-6">
                    <View className="bg-white rounded-[32px] p-8">
                        <Text className="text-xl font-black text-gray-900 mb-2">Configure Pricing</Text>
                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-6">Update terminal tariff frequency</Text>
                        <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-8">
                            <TextInput
                                value={editPrice} onChangeText={setEditPrice} keyboardType="numeric"
                                className="text-2xl font-black text-gray-900" placeholder="0.00"
                            />
                        </View>
                        <View className="flex-row gap-3">
                            <TouchableOpacity onPress={() => setIsEditModalVisible(false)} className="flex-1 h-14 bg-gray-100 rounded-2xl items-center justify-center">
                                <Text className="text-gray-500 font-bold uppercase tracking-widest text-xs">Abort</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleEditSave} className="flex-1 h-14 bg-purple-600 rounded-2xl items-center justify-center shadow-lg shadow-purple-200">
                                <Text className="text-white font-black uppercase tracking-widest text-xs">Sync Tarif</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
