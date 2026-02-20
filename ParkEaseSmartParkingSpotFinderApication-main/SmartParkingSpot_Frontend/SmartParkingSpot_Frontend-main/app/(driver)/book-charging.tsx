import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Dimensions, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../../components/CustomHeader';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../../constants/api';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

const API = BASE_URL;
const { width } = Dimensions.get('window');

export default function BookParkingScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Robust Fallback Logic (User Requirement 1)
    const params = useLocalSearchParams();
    console.log("DEBUG: RECEIVED PARAMS:", JSON.stringify(params));

    const { name, price, type, location } = params;
    // Fix: Match the key 'spotId' seen in terminal logs and include all possible variations
    const finalSpotId = params.spotId || params.spot_id || params.id || params._id || params.parkingId;

    // DEBUG LOG (User Requirement 3)
    console.log("✅ FIXED RECEIVED SPOT ID:", finalSpotId);

    const [duration, setDuration] = useState(1);
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow'>('today');
    const [selectedTime, setSelectedTime] = useState('09:00');

    // Safety Block (User Requirement 1.2)
    if (!finalSpotId) {
        return (
            <View className={`flex-1 justify-center items-center ${isDark ? 'bg-slate-950' : 'bg-white'} p-10`}>
                <Ionicons name="alert-circle" size={80} color="#EF4444" />
                <Text className={`text-xl font-black text-center mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Spot ID Missing</Text>
                <Text className="text-gray-400 text-center mt-2">
                    Debug: {JSON.stringify(params)}
                </Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mt-8 bg-blue-600 px-8 py-4 rounded-2xl"
                >
                    <Text className="text-white font-black uppercase tracking-widest">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // DEBUG LOG FOR SPOT ID (User Requirement 1)
    useEffect(() => {
        console.log("DEBUG: Final Spot ID to be used:", finalSpotId);
    }, [finalSpotId]);

    const pricePerHour = Number(price) || 20;
    const totalCost = duration * pricePerHour;

    const timeSlots = Array.from({ length: 13 }, (_, i) => {
        const hour = i + 9;
        return `${hour.toString().padStart(2, '0')}:00`;
    });

    const loadWallet = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API}/api/driver/wallet`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWalletBalance(res.data.balance || 0);
        } catch (err) {
            console.log("Wallet load error", err);
        } finally {
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadWallet();
        }, [])
    );

    const handleBooking = async () => {
        // Use the robust ID we already extracted
        const actualSpotId = finalSpotId;
        console.log("DEBUG: Final Spot ID to be sent:", actualSpotId);

        if (!actualSpotId) {
            Alert.alert("Invalid Selection", "Please go back to the map and select a valid parking spot.");
            return;
        }

        if (!vehicleNumber.trim()) {
            Alert.alert("Vehicle Number Required", "Please enter your vehicle number to proceed.");
            return;
        }

        if (walletBalance < totalCost) {
            Alert.alert("Insufficient Funds", "Please add funds to your wallet.");
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const userStr = await AsyncStorage.getItem('user');

            if (!userStr || !token) {
                Alert.alert("Session Expired", "Please login again to continue.");
                router.replace('/');
                return;
            }

            const currentUser = JSON.parse(userStr);
            console.log("DEBUG: Current User Entity:", currentUser);

            const driverId = currentUser?._id || currentUser?.id;

            if (!driverId) {
                Alert.alert("Authentication Error", "User session invalid. Please login again.");
                return;
            }

            // Date Calculation - Ensure ISO Strings
            const baseDate = selectedDate === 'today' ? new Date() : new Date(Date.now() + 86400000);
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const startTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes);
            const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

            const payload = {
                driverId: driverId,
                spotId: actualSpotId,
                vehicleNumber: vehicleNumber.toUpperCase(), // Fix: Match Java Entity field name
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                amount: totalCost,
                totalAmount: totalCost,
                paymentStatus: "Paid"
            };

            console.log("🚀 SENDING PAYLOAD TO JAVA:", JSON.stringify(payload));

            const res = await axios.post(`${API}/api/driver/bookings`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 200 || res.status === 201) {
                Alert.alert("Success", "Booking Confirmed! ✅");
                router.replace('/(driver)/bookings');
            }
        } catch (error: any) {
            console.error("Payload mismatch error:", error.response?.data);
            Alert.alert("Booking Failed", error.response?.data?.message || "Check ID mapping");
        } finally {
            setLoading(false);
        }
    };

    const adjustDuration = (delta: number) => {
        setDuration(prev => Math.max(1, Math.min(24, prev + delta)));
    };

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <CustomHeader
                title="Confirm Booking"
                subtitle="Parking Spot"
                role="driver"
                onMenuPress={() => router.back()}
                userName="Driver"
                showBackButton={true}
            />

            <ScrollView
                className="flex-1 px-5 pt-6"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadWallet(); }} />}
            >
                {/* Location Card */}
                <View className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-6">
                    <View className="flex-row justify-between items-start mb-4">
                        <View className="flex-1">
                            <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Confirm Location</Text>
                            <Text className="text-2xl font-black text-gray-900 leading-tight">{name}</Text>
                            <Text className="text-gray-500 font-bold text-xs mt-1">{location}</Text>
                        </View>
                        <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center">
                            <Ionicons name="location" size={24} color="#3B82F6" />
                        </View>
                    </View>
                    <View className="h-px bg-gray-100 my-2" />
                    <View className="flex-row justify-between items-center mt-2">
                        <Text className="text-gray-900 font-bold">Rate</Text>
                        <Text className="text-blue-600 font-black text-lg">₹{pricePerHour}/hr</Text>
                    </View>
                </View>

                {/* Date Selection */}
                <View className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-6">
                    <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-4">Select Date</Text>
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => setSelectedDate('today')}
                            className={`flex-1 py-4 rounded-2xl items-center border ${selectedDate === 'today' ? 'bg-blue-600 border-blue-600' : 'bg-gray-50 border-gray-100'}`}
                        >
                            <Text className={`font-black uppercase tracking-widest text-[10px] ${selectedDate === 'today' ? 'text-white' : 'text-gray-400'}`}>Today</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setSelectedDate('tomorrow')}
                            className={`flex-1 py-4 rounded-2xl items-center border ${selectedDate === 'tomorrow' ? 'bg-blue-600 border-blue-600' : 'bg-gray-50 border-gray-100'}`}
                        >
                            <Text className={`font-black uppercase tracking-widest text-[10px] ${selectedDate === 'tomorrow' ? 'text-white' : 'text-gray-400'}`}>Tomorrow</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Time Selection */}
                <View className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-6">
                    <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-4">Select Start Time (09:00 AM - 09:00 PM)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
                        {timeSlots.map(time => (
                            <TouchableOpacity
                                key={time}
                                onPress={() => setSelectedTime(time)}
                                className={`px-6 py-4 rounded-2xl items-center mr-3 border ${selectedTime === time ? 'bg-blue-600 border-blue-600' : 'bg-gray-50 border-gray-100'}`}
                            >
                                <Text className={`font-black ${selectedTime === time ? 'text-white' : 'text-gray-900'}`}>{time}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Duration */}
                <View className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Duration</Text>
                        <View className="bg-blue-50 px-3 py-1 rounded-full">
                            <Text className="text-blue-600 font-black text-[9px] uppercase tracking-widest">{selectedTime} to {
                                (() => {
                                    const [h, m] = selectedTime.split(':').map(Number);
                                    let endH = h + duration;
                                    return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                })()
                            }</Text>
                        </View>
                    </View>
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity onPress={() => adjustDuration(-1)} className="w-12 h-12 bg-gray-100 rounded-2xl items-center justify-center">
                            <Ionicons name="remove" size={24} color="#1E293B" />
                        </TouchableOpacity>
                        <View className="items-center">
                            <Text className="text-4xl font-black text-gray-900">{duration}</Text>
                            <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest">Hours</Text>
                        </View>
                        <TouchableOpacity onPress={() => adjustDuration(1)} className="w-12 h-12 bg-gray-100 rounded-2xl items-center justify-center">
                            <Ionicons name="add" size={24} color="#1E293B" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Vehicle Input */}
                <View className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-6">
                    <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-3">Vehicle Number</Text>
                    <TextInput
                        className="bg-gray-50 h-14 rounded-2xl px-4 font-black text-lg text-gray-900 border border-gray-100"
                        placeholder="e.g. MH 12 AB 1234"
                        placeholderTextColor="#CBD5E1"
                        value={vehicleNumber}
                        onChangeText={setVehicleNumber}
                        autoCapitalize="characters"
                    />
                </View>

                {/* Wallet Balance Check */}
                <View className={`p-6 rounded-[32px] border mb-6 flex-row items-center justify-between ${walletBalance >= totalCost ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <View>
                        <Text className={`font-bold text-[10px] uppercase tracking-widest ${walletBalance >= totalCost ? 'text-emerald-600' : 'text-rose-600'}`}>Wallet Balance</Text>
                        <Text className={`text-2xl font-black ${walletBalance >= totalCost ? 'text-emerald-700' : 'text-rose-700'}`}>₹{walletBalance.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(driver)/payments')} className="bg-white px-4 py-2 rounded-xl shadow-sm">
                        <Text className="font-bold text-xs text-gray-900">+ Add</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Bottom Pay Bar */}
            <View className="bg-white border-t border-gray-100 p-6 rounded-t-[40px] shadow-2xl">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest">Total to Pay</Text>
                    <Text className="text-4xl font-black text-gray-900">₹{totalCost.toFixed(0)}</Text>
                </View>

                <TouchableOpacity
                    onPress={handleBooking}
                    disabled={loading || !vehicleNumber.trim()}
                    className={`h-16 rounded-[24px] flex-row items-center justify-center shadow-lg ${loading || !vehicleNumber.trim() ? 'bg-gray-400' : 'bg-blue-600 shadow-blue-500/30'}`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={24} color="white" />
                            <Text className="text-white font-black text-lg ml-3 uppercase tracking-widest">Confirm Booking</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
