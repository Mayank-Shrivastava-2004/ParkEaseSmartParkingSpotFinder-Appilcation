import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../../components/CustomHeader';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../components/api/axios';
import BASE_URL from '../../constants/api';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const API = BASE_URL;

export default function DriverBookingsScreen() {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    const router = useRouter();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeBooking, setActiveBooking] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState('');



    const loadBookings = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userStr = await AsyncStorage.getItem('user');

            if (!userStr) return;
            const user = JSON.parse(userStr);
            const driverId = user._id || user.id;

            // Updated to use the specific endpoint requested
            const res = await api.get(`/driver/bookings/driver/${driverId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data || [];

            // Backend already sorts by StartTime Desc, ensures robustness
            const sortedData = data.sort((a: any, b: any) => {
                const dateA = new Date(a.startTime || a.createdAt).getTime();
                const dateB = new Date(b.startTime || b.createdAt).getTime();
                return dateB - dateA;
            });
            setBookings(sortedData);
            console.log("✅ BOOKINGS LOADED SUCCESSFULLY:", sortedData.length);

            // Find Active Booking
            const now = new Date();
            const active = data.find((b: any) =>
                (String(b.status).toLowerCase() === 'active' || b.status === 'CONFIRMED') &&
                new Date(b.endTime) > now
            );
            setActiveBooking(active || null);

        } catch (err: any) {
            console.error("❌ STILL FAILING:", err.response?.data || err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadBookings();
        }, [])
    );

    // Live Timer for Active Booking
    useEffect(() => {
        let interval: any;
        if (activeBooking) {
            interval = setInterval(() => {
                const now = new Date();
                const end = new Date(activeBooking.endTime);
                const diff = end.getTime() - now.getTime();

                if (diff <= 0) {
                    setTimeLeft('Expired');
                    clearInterval(interval);
                } else {
                    const hrs = Math.floor(diff / (1000 * 60 * 60));
                    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    setTimeLeft(`${hrs}h ${mins}m remaining`);
                }
            }, 60000);

            // Initial call
            const now = new Date();
            const end = new Date(activeBooking.endTime);
            const diff = end.getTime() - now.getTime();
            if (diff > 0) {
                const hrs = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hrs}h ${mins}m remaining`);
            } else {
                setTimeLeft('Expired');
            }
        }
        return () => clearInterval(interval);
    }, [activeBooking]);

    const onRefresh = () => {
        setRefreshing(true);
        loadBookings();
    };

    const handleNavigate = (booking: any) => {
        Alert.alert(
            "Navigate to Spot",
            "Choose your preferred navigation method:",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "In-App Map",
                    onPress: () => router.push('/(driver)/find')
                },
                {
                    text: "Google Maps",
                    onPress: () => {
                        const query = encodeURIComponent(booking.parkingLot?.location || booking.location || "Parking Spot");
                        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                    }
                }
            ]
        );
    };

    const handleCancel = async (bookingId: number) => {
        Alert.alert(
            "Cancel Booking",
            "Are you sure you want to cancel this booking?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await api.put(`/driver/bookings/cancel/${bookingId}`, {}, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert("Success", "Booking cancelled successfully");
                            loadBookings(); // Refresh list
                        } catch (err: any) {
                            Alert.alert("Error", err.response?.data?.message || "Failed to cancel booking");
                        }
                    }
                }
            ]
        );
    };

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };


    if (!isMounted) return null;

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <CustomHeader
                title="My Bookings"
                subtitle="Trip History"
                role="driver"
                onMenuPress={() => router.back()}
                userName="Driver"
                showBackButton={true}
            />

            <ScrollView
                className="px-5 pt-6"
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Active Session Card */}
                {activeBooking && (
                    <Animated.View entering={FadeInUp} className="bg-blue-600 rounded-[32px] p-6 mb-8 shadow-xl shadow-blue-500/30">
                        <View className="flex-row justify-between items-start mb-4">
                            <View>
                                <View className="bg-white/20 px-3 py-1 rounded-full self-start mb-2">
                                    <Text className="text-white font-black text-[10px] uppercase tracking-widest animate-pulse">Live Session</Text>
                                </View>
                                <Text className="text-white font-black text-2xl tracking-tight">{activeBooking.parkingLot?.name || "Unknown Lot"}</Text>
                                <Text className="text-blue-100 font-bold text-xs mt-1">{activeBooking.vehicleNumber}</Text>
                            </View>
                            <View className="bg-white/20 w-12 h-12 rounded-2xl items-center justify-center">
                                <Ionicons name="timer" size={24} color="white" />
                            </View>
                        </View>

                        <View className="bg-black/20 rounded-2xl p-4 mb-4 border border-white/10">
                            <Text className="text-white font-black text-3xl text-center tracking-widest">{timeLeft}</Text>
                            <Text className="text-blue-200 text-center font-bold text-[10px] uppercase tracking-widest mt-1">Time Remaining</Text>
                        </View>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => handleNavigate(activeBooking)}
                                className="flex-1 bg-white h-12 rounded-xl flex-row items-center justify-center"
                            >
                                <Ionicons name="navigate" size={16} color="#3B82F6" />
                                <Text className="text-blue-600 font-black text-xs uppercase tracking-widest ml-2">Navigate</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-1 bg-rose-500 h-12 rounded-xl flex-row items-center justify-center shadow-lg shadow-rose-500/20">
                                <Ionicons name="stop-circle" size={16} color="white" />
                                <Text className="text-white font-black text-xs uppercase tracking-widest ml-2">End Trip</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}

                <Text className="font-black text-xl text-gray-900 mb-4 px-1">Recent Activity</Text>

                {bookings.filter(b => b.id !== activeBooking?.id).length === 0 ? (
                    <View className="items-center py-10 bg-white rounded-[32px] border border-gray-100 shadow-sm">
                        <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
                        <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-4">No past records found</Text>
                    </View>
                ) : (
                    bookings.filter(b => b.id !== activeBooking?.id).map((booking, i) => (
                        <Animated.View key={i} entering={FadeInUp.delay(i * 100)} className="bg-white p-6 mb-5 rounded-[32px] border border-gray-100 shadow-sm">
                            <View className="flex-row justify-between items-start mb-4">
                                <View className="flex-1">
                                    <View className="flex-row items-center mb-1">
                                        <Ionicons name="location" size={14} color="#3B82F6" />
                                        <Text className="font-black text-lg text-gray-900 ml-1 leading-tight">{booking.parkingLot?.name || booking.name || "Reserved Spot"}</Text>
                                    </View>
                                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest px-1">{booking.parkingLot?.location || booking.location || "Nearby Metro Area"}</Text>
                                </View>
                                <View className={`px-3 py-1 rounded-full ${booking.status === 'COMPLETED' ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                                    <Text className={`${booking.status === 'COMPLETED' ? 'text-emerald-600' : 'text-gray-500'} font-black text-[8px] uppercase tracking-widest`}>
                                        {booking.status}
                                    </Text>
                                </View>
                            </View>

                            <View className="bg-gray-50 rounded-2xl p-4 mb-4 flex-row justify-between items-center">
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-[8px] font-black uppercase tracking-widest mb-1">Schedule</Text>
                                    <View className="flex-row items-center">
                                        <Ionicons name="calendar-outline" size={12} color="#64748B" />
                                        <Text className="text-gray-700 font-bold text-[11px] ml-1">
                                            {formatDateTime(booking.startTime)} - {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="text-gray-400 text-[8px] font-black uppercase tracking-widest mb-1">Total Paid</Text>
                                    <Text className="text-gray-900 font-black text-lg">₹{booking.totalAmount || booking.amount || 0}</Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <View className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center mr-3">
                                        <Ionicons name="car" size={16} color="#475569" />
                                    </View>
                                    <Text className="text-gray-500 font-black text-[11px] uppercase tracking-tighter">
                                        {booking.vehicleNumber || booking.vehicleNo || 'N/A'}
                                    </Text>
                                </View>
                                <View className="flex-row gap-2">
                                    {(String(booking.status).toUpperCase() === 'PENDING' || String(booking.status).toUpperCase() === 'CONFIRMED' || String(booking.status).toUpperCase() === 'ACTIVE') && (
                                        <TouchableOpacity
                                            onPress={() => handleCancel(booking.id)}
                                            className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50"
                                        >
                                            <Text className="text-rose-600 font-black text-[10px] uppercase tracking-widest">Cancel</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        onPress={() => router.push('/(driver)/find')}
                                        className="bg-blue-600 px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/20"
                                    >
                                        <Text className="text-white font-black text-[10px] uppercase tracking-widest">Rebook</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Animated.View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
