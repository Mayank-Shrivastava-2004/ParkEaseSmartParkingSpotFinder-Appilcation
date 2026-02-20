import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Dimensions,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import axios from 'axios';
import BASE_URL from '../../constants/api';
import UnifiedHeader from '../../components/UnifiedHeader';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const API = BASE_URL;

export default function AddSpotScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [detecting, setDetecting] = useState(false);

    const [profile, setProfile] = useState<any>(null);
    const [spotName, setSpotName] = useState('');
    const [address, setAddress] = useState('');
    const [pricePerHour, setPricePerHour] = useState('');
    const [totalSlots, setTotalSlots] = useState('');
    const [location, setLocation] = useState<{ lat: number | null, lng: number | null }>({ lat: null, lng: null });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                const res = await axios.get(`${API}/api/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.status === 200) {
                    setProfile(res.data);
                }
            }
        } catch (err) {
            console.error("Failed to load profile", err);
        }
    };

    const handleDetectLocation = async () => {
        setDetecting(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location access is required to pin your spot on the map.');
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation({
                lat: loc.coords.latitude,
                lng: loc.coords.longitude
            });

            // Reverse Geocoding to suggest address if empty
            const reverse = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
            });

            if (reverse[0] && !address) {
                const addr = `${reverse[0].name || ''} ${reverse[0].street || ''}, ${reverse[0].city || ''}, ${reverse[0].region || ''}`;
                setAddress(addr.trim());
            }

            Alert.alert('Success', 'Current coordinates localized successfully.');
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Could not detect precision coordinates.');
        } finally {
            setDetecting(false);
        }
    };

    const handleSaveSpot = async () => {
        if (!spotName || !address || !pricePerHour || !totalSlots || !location.lat) {
            Alert.alert('Incomplete Protocol', 'All fields including GPS coordinates are mandatory.');
            return;
        }

        if (!profile?.id) {
            Alert.alert('Identity Error', 'Provider profile not synchronized. Please try again.');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.post(`${API}/api/provider/parking/add`, {
                providerId: profile.id,
                name: spotName,
                address: address,
                pricePerHour: Number(pricePerHour),
                totalSpots: Number(totalSlots),
                latitude: location.lat,
                longitude: location.lng,
                status: 'active'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 200 || res.status === 201) {
                Alert.alert('System Update', 'New parking node deployed successfully.', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (err: any) {
            console.error(err);
            Alert.alert('Deployment Error', err.response?.data?.message || 'Failed to sync with central node.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="light-content" />

            <UnifiedHeader
                title="Add New Spot"
                subtitle="TERMINAL DEPLOYMENT"
                userName="Provider"
                role="provider"
                gradientColors={['#8B5CF6', '#6D28D9']}
                compact={true}
                showBackButton={true}
                onBackPress={() => router.back()}
                onMenuPress={() => { }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 px-6"
                    contentContainerStyle={{ paddingTop: 30, paddingBottom: 50 }}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeInUp.delay(100)} className="mb-6">
                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Terminal Identity</Text>
                        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-row items-center">
                            <Ionicons name="business-outline" size={20} color="#8B5CF6" className="mr-3" />
                            <TextInput
                                placeholder="Spot Name (e.g., Downtown Plaza)"
                                value={spotName}
                                onChangeText={setSpotName}
                                className="flex-1 font-bold text-gray-900 ml-2"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(200)} className="mb-6">
                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Physical Address</Text>
                        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-row items-start">
                            <Ionicons name="location-outline" size={20} color="#8B5CF6" className="mr-3 mt-1" />
                            <TextInput
                                placeholder="Full street address and city"
                                value={address}
                                onChangeText={setAddress}
                                multiline
                                numberOfLines={3}
                                className="flex-1 font-bold text-gray-900 ml-2 h-20"
                                placeholderTextColor="#94A3B8"
                                textAlignVertical="top"
                            />
                        </View>
                    </Animated.View>

                    <View className="flex-row gap-4 mb-6">
                        <Animated.View entering={FadeInUp.delay(300)} className="flex-1">
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Pricing / Hr</Text>
                            <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-row items-center">
                                <Text className="text-gray-900 font-bold mr-1">₹</Text>
                                <TextInput
                                    placeholder="0"
                                    value={pricePerHour}
                                    onChangeText={setPricePerHour}
                                    keyboardType="numeric"
                                    className="flex-1 font-bold text-gray-900"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(400)} className="flex-1">
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Total Capacity</Text>
                            <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-row items-center">
                                <Ionicons name="grid-outline" size={16} color="#8B5CF6" className="mr-2" />
                                <TextInput
                                    placeholder="0"
                                    value={totalSlots}
                                    onChangeText={setTotalSlots}
                                    keyboardType="numeric"
                                    className="flex-1 font-bold text-gray-900 ml-1"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </Animated.View>
                    </View>

                    <Animated.View entering={FadeInUp.delay(500)} className="mb-8 items-center">
                        <TouchableOpacity
                            onPress={handleDetectLocation}
                            disabled={detecting}
                            className={`w-full h-16 rounded-2xl border-2 border-dashed items-center justify-center flex-row ${location.lat ? 'bg-emerald-50 border-emerald-200' : 'bg-purple-50 border-purple-200'}`}
                        >
                            {detecting ? (
                                <ActivityIndicator color="#8B5CF6" />
                            ) : (
                                <>
                                    <Ionicons
                                        name={location.lat ? "checkmark-circle" : "locate-outline"}
                                        size={24}
                                        color={location.lat ? "#10B981" : "#8B5CF6"}
                                        className="mr-3"
                                    />
                                    <Text className={`font-black uppercase tracking-widest text-[11px] ${location.lat ? 'text-emerald-600' : 'text-purple-600'}`}>
                                        {location.lat ? '📍 Location Set successfully' : '📍 Detect My Location'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                        {location.lat && (
                            <Text className="text-emerald-500/60 text-[9px] font-bold mt-3 uppercase tracking-tighter">
                                Precision Lock: {location.lat.toFixed(6)}, {location.lng?.toFixed(6)}
                            </Text>
                        )}
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(600)}>
                        <TouchableOpacity
                            onPress={handleSaveSpot}
                            disabled={loading}
                            className="bg-gray-900 h-16 rounded-2xl items-center justify-center shadow-xl shadow-black/20"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-black uppercase tracking-[2px] text-xs">Deploy Terminal</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
