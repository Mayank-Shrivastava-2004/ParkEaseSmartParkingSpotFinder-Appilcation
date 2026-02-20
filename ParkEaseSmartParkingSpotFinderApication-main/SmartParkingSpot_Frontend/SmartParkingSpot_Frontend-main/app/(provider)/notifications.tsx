import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../../components/CustomHeader';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import axios from 'axios';
import BASE_URL from '../../constants/api';

const API = BASE_URL;

interface Notification {
    id: number;
    message: string;
    type: string;
    refId: number;
    read: boolean;
    createdAt: string;
}

export default function ProviderNotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [providerName, setProviderName] = useState('Provider');

    const fetchNotifications = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                router.replace('/' as any);
                return;
            }

            const res = await axios.get(`${API}/api/provider/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 200) {
                setNotifications(res.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }

            const storedName = await AsyncStorage.getItem('userName');
            if (storedName) setProviderName(storedName);

        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [router]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const markAsRead = async (id: number) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.put(`${API}/api/provider/notifications/${id}/read`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 200) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            }
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const handleNotificationPress = async (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }

        if (notification.type === 'NEW_BOOKING' || notification.type === 'BOOKING_HUB') {
            router.push('/(provider)/traffic');
        } else if (notification.type === 'CHAT_MESSAGE') {
            router.push('/(provider)/support');
        } else if (notification.type === 'EARNING_CREDIT') {
            router.push('/(provider)/earnings');
        }
    };

    const renderItem = ({ item, index }: { item: Notification, index: number }) => (
        <Animated.View entering={FadeInUp.delay(index * 50)}>
            <TouchableOpacity
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
                className={`flex-row items-center p-4 mb-3 bg-white rounded-2xl border ${item.read ? 'border-gray-100' : 'border-purple-100'} shadow-sm`}
            >
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${item.read ? 'bg-gray-50' : 'bg-purple-50'}`}>
                    <Ionicons
                        name={
                            item.type === 'NEW_BOOKING' ? 'car-sport' :
                                item.type === 'EARNING_CREDIT' ? 'cash' :
                                    item.type === 'CHAT_MESSAGE' ? 'chatbubbles' : 'notifications'
                        }
                        size={18}
                        color={item.read ? '#94A3B8' : '#8B5CF6'}
                    />
                </View>

                <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                        <Text className={`text-[8px] font-black uppercase tracking-widest ${item.read ? 'text-gray-400' : 'text-purple-600'}`}>
                            {item.type || 'SYSTEM'}
                        </Text>
                        <Text className="text-gray-300 text-[8px] font-bold">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    <Text
                        numberOfLines={2}
                        className={`text-sm text-gray-900 ${item.read ? 'font-medium text-gray-500' : 'font-bold'} leading-snug tracking-tight`}
                    >
                        {item.message}
                    </Text>
                </View>

                {!item.read && (
                    <View className="ml-3 w-2 h-2 rounded-full bg-rose-500" />
                )}
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
                title="Event Stream"
                subtitle="Live Information Feed"
                showBackButton={true}
                userName={providerName}
                notificationCount={notifications.filter(n => !n.read).length}
            />

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
                }
                ListHeaderComponent={() => (
                    <View className="mb-6">
                        <Text className="font-black text-2xl text-gray-900 tracking-tighter">Updates</Text>
                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Recent System Activity</Text>
                    </View>
                )}
                ListEmptyComponent={() => (
                    <Animated.View entering={ZoomIn} className="flex-1 items-center justify-center mt-20">
                        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
                            <Ionicons name="notifications-off-outline" size={32} color="#CBD5E1" />
                        </View>
                        <Text className="text-gray-400 font-bold text-xs">No new notifications</Text>
                    </Animated.View>
                )}
            />
        </View>
    );
}
