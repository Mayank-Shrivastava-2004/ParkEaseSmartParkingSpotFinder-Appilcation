import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, TextInput, Linking, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../../components/CustomHeader';
import { StatusBar } from 'expo-status-bar';
import Svg, { Line, Rect } from 'react-native-svg';
import Reanimated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import api from '../../components/api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../../constants/api';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const API = BASE_URL;

export default function FindParkingScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [spots, setSpots] = useState<any[]>([]);
    const [filteredSpots, setFilteredSpots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedSpot, setSelectedSpot] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [userLocation, setUserLocation] = useState({ x: width / 2, y: height / 2 });
    const [zoom, setZoom] = useState(1);

    const scale = useSharedValue(1);

    useEffect(() => {
        loadSpots();
        startPulse();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredSpots(spots);
        } else {
            const lower = searchQuery.toLowerCase();
            const filtered = spots.filter(s =>
                (s.name && s.name.toLowerCase().includes(lower)) ||
                (s.location && s.location.toLowerCase().includes(lower)) ||
                (s.type && s.type.toLowerCase().includes(lower))
            );
            setFilteredSpots(filtered);
        }
    }, [searchQuery, spots]);

    const startPulse = () => {
        scale.value = withSpring(1.2, { damping: 2, stiffness: 80 }, () => {
            scale.value = withSpring(1);
        });
    };

    const loadSpots = async (isRefreshing = false) => {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            const token = await AsyncStorage.getItem('token');
            console.log(`DEBUG: Fetching parking spots from ${API}/api/parking/all`);
            const res = await api.get('/parking/all', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 200) {
                console.log(`DEBUG: Successfully fetched ${res.data.length} spots`);
                setSpots(res.data);
                setFilteredSpots(res.data);
            }
        } catch (err: any) {
            console.error("CRITICAL Map Fetch Error:");
            if (err.response) {
                console.log("- Status:", err.response.status);
                console.log("- Data:", err.response.data);
            } else if (err.request) {
                console.log("- No response received. Check if backend is reachable at:", API);
                console.log("- Error Details:", err.message);
            } else {
                console.log("- Request Setup Error:", err.message);
            }
            Alert.alert(
                "Connection Error",
                `Could not fetch parking data.\n\nTarget: ${API}\n\n1. Check if backend is running.\n2. Ensure phone is on same Wi-Fi.\n3. Verify your PC IP matches the target above.`
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSpotPress = (spot: any) => {
        setSelectedSpot(spot);
    };

    const handleNavigate = () => {
        if (!selectedSpot) return;
        const query = encodeURIComponent(selectedSpot.location);
        const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        Linking.openURL(url).catch(() => {
            Alert.alert("Error", "Could not open Maps application.");
        });
    };

    const handleBook = () => {
        if (!selectedSpot) return;
        router.push({
            pathname: '/(driver)/book-charging',
            params: {
                // Backend is H2 (id) but user requested _id (Mongo). We support both.
                spotId: selectedSpot.id || selectedSpot._id,
                name: selectedSpot.name,
                price: selectedSpot.price,
                type: selectedSpot.type || 'Parking',
                location: selectedSpot.location
            }
        } as any);
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

    if (loading) {
        return (
            <View className={`flex-1 justify-center items-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-4 text-gray-400 font-bold uppercase tracking-widest text-xs">Scanning Grid...</Text>
            </View>
        );
    }

    return (
        <View className={`flex-1 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            <StatusBar style={isDark ? "light" : "dark"} />

            <CustomHeader
                title="Parking Grid"
                subtitle="Live Map"
                role="driver"
                onMenuPress={() => router.back()}
                userName="Driver"
                showBackButton={true}
            />

            {/* Floating Search Bar */}
            <View className="absolute top-[120px] left-5 right-5 z-20">
                <View className={`${isDark ? 'bg-slate-900 border-slate-800 shadow-black' : 'bg-white border-gray-100 shadow-md'} flex-row items-center rounded-2xl px-4 h-12 border shadow-md`}>
                    <Ionicons name="search" size={20} color="#94A3B8" />
                    <TextInput
                        placeholder="Search location..."
                        placeholderTextColor="#94A3B8"
                        className={`flex-1 ml-3 font-bold ${isDark ? 'text-white' : 'text-gray-900'} h-full`}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* INTERACTIVE MAP */}
            <View className={`flex-1 ${isDark ? 'bg-slate-950' : 'bg-[#F8FAFC]'} relative overflow-hidden`}>
                <Animated.View style={{ flex: 1, transform: [{ scale: zoom }] }}>
                    <Svg height="100%" width="100%" viewBox={`0 0 ${width} ${height}`}>
                        <Rect x="0" y="0" width={width} height={height} fill={isDark ? "#020617" : "#F8FAFC"} />
                        <Line x1={width / 3} y1={0} x2={width / 3} y2={height} stroke={isDark ? "#1E293B" : "white"} strokeWidth="40" />
                        <Line x1={width * 0.66} y1={0} x2={width * 0.66} y2={height} stroke={isDark ? "#1E293B" : "white"} strokeWidth="40" />
                        <Line x1={0} y1={height / 3} x2={width} y2={height / 3} stroke={isDark ? "#1E293B" : "white"} strokeWidth="40" />
                        <Line x1={0} y1={height * 0.66} x2={width} y2={height * 0.66} stroke={isDark ? "#1E293B" : "white"} strokeWidth="40" />
                    </Svg>

                    {filteredSpots.map((spot) => {
                        // Calculate positions (Support both real lat/lng and SVG coords)
                        const posX = spot.coords?.x || (spot.longitude ? (spot.longitude % 1) * 3000 : Math.random() * 300);
                        const posY = spot.coords?.y || (spot.latitude ? (spot.latitude % 1) * 6000 : Math.random() * 600);

                        return (
                            <TouchableOpacity
                                key={spot._id || spot.id}
                                onPress={() => handleSpotPress(spot)}
                                activeOpacity={0.9}
                                style={{
                                    position: 'absolute',
                                    left: posX * (width / 350),
                                    top: posY * (height / 700),
                                    alignItems: 'center',
                                    transform: [{ scale: 1 / zoom }]
                                }}
                            >
                                <Reanimated.View entering={ZoomIn.delay(Math.random() * 500)}>
                                    <View className={`p-3 rounded-2xl shadow-lg border-2 ${isDark ? 'border-slate-800' : 'border-white'} ${spot.status === 'available' ? 'bg-blue-600' : 'bg-rose-500'}`}>
                                        <Text className="text-white font-black text-xs">P</Text>
                                    </View>
                                    {zoom > 0.8 && (
                                        <View className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'} px-2 py-1 rounded-lg shadow-sm mt-1 border max-w-[80px]`}>
                                            <Text numberOfLines={1} className={`text-[8px] font-black uppercase ${isDark ? 'text-slate-300' : 'text-slate-800'} text-center`}>{spot.name}</Text>
                                            <Text className="text-[8px] font-bold text-emerald-600 text-center">₹{spot.price}/hr</Text>
                                        </View>
                                    )}
                                </Reanimated.View>
                            </TouchableOpacity>
                        );
                    })}

                    <View
                        style={{
                            position: 'absolute',
                            left: userLocation.x - 20,
                            top: userLocation.y - 20,
                            transform: [{ scale: 1 / zoom }]
                        }}
                    >
                        <View className="w-10 h-10 bg-blue-500/20 rounded-full border border-blue-400 items-center justify-center animate-ping" />
                        <View className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg absolute top-3 left-3" />
                    </View>
                </Animated.View>

                {/* MAP CONTROLS */}
                <View className="absolute bottom-60 right-6 gap-3">
                    <TouchableOpacity
                        className={`${isDark ? 'bg-blue-600 border-blue-500' : 'bg-blue-600 border-blue-500'} w-12 h-12 rounded-2xl items-center justify-center shadow-xl border`}
                        onPress={() => loadSpots(true)}
                        disabled={refreshing}
                    >
                        {refreshing ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Ionicons name="refresh" size={24} color="white" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} w-12 h-12 rounded-2xl items-center justify-center shadow-xl border mt-2`} onPress={handleZoomIn}>
                        <Ionicons name="add" size={24} color={isDark ? "#F8FAFC" : "#1E293B"} />
                    </TouchableOpacity>
                    <TouchableOpacity className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} w-12 h-12 rounded-2xl items-center justify-center shadow-xl border`} onPress={handleZoomOut}>
                        <Ionicons name="remove" size={24} color={isDark ? "#F8FAFC" : "#1E293B"} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* SELECTED SPOT DETAILS */}
            {selectedSpot && (
                <Reanimated.View
                    entering={FadeInDown.springify()}
                    className={`absolute bottom-0 left-0 right-0 ${isDark ? 'bg-slate-950 border-slate-800 shadow-black' : 'bg-white border-gray-100 shadow-2xl'} rounded-t-[40px] p-6 border-t z-30 pb-10`}
                >
                    <View className="flex-row justify-between items-start mb-6">
                        <View className="flex-1 pr-4">
                            <View className="flex-row items-center mb-2">
                                <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                                    <Text className="text-blue-500 font-black text-[9px] uppercase tracking-widest">Parking Spot</Text>
                                </View>
                                <View className={`${isDark ? 'bg-amber-500/10' : 'bg-amber-50'} px-3 py-1 rounded-full ml-2`}>
                                    <Text className="text-amber-500 font-black text-[9px] uppercase tracking-widest">★ {selectedSpot.rating?.toFixed(1) || '4.0'}</Text>
                                </View>
                            </View>
                            <Text className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'} tracking-tight`}>{selectedSpot.name}</Text>
                            <Text className="text-gray-400 text-xs font-bold mt-1 max-w-[90%]">{selectedSpot.location}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedSpot(null)} className={`${isDark ? 'bg-slate-900' : 'bg-gray-50'} w-10 h-10 rounded-full items-center justify-center`}>
                            <Ionicons name="close" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row gap-4 mb-8">
                        <View className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-100'} flex-1 p-4 rounded-2xl border items-center`}>
                            <Text className={`font-black text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSpot.availableSlots}</Text>
                            <Text className="text-gray-400 font-black text-[8px] uppercase tracking-widest">Available</Text>
                        </View>
                        <View className={`${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'} flex-1 p-4 rounded-2xl border items-center`}>
                            <Text className="text-blue-600 font-black text-xl">₹{selectedSpot.price}</Text>
                            <Text className="text-blue-500/60 font-black text-[8px] uppercase tracking-widest">/ Hour</Text>
                        </View>
                    </View>

                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={handleNavigate}
                            className={`${isDark ? 'bg-slate-800' : 'bg-gray-900'} flex-1 h-14 rounded-2xl shadow-lg flex-row items-center justify-center`}
                        >
                            <Ionicons name="navigate" size={18} color="white" />
                            <Text className="text-white font-black ml-2 uppercase tracking-widest text-xs">Navigate</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleBook}
                            className="flex-1 bg-blue-600 h-14 rounded-2xl shadow-lg flex-row items-center justify-center"
                        >
                            <Ionicons name="calendar" size={18} color="white" />
                            <Text className="text-white font-black ml-2 uppercase tracking-widest text-xs">Book Now</Text>
                        </TouchableOpacity>
                    </View>
                </Reanimated.View>
            )}
        </View>
    );
}
