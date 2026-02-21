import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    BackHandler
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../../components/CustomHeader';
import UnifiedSidebar from '../../components/UnifiedSidebar';
import BASE_URL from '../../constants/api';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import axios from 'axios';

const API = BASE_URL;

export default function ProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [profile, setProfile] = useState<any>({
        name: 'Provider',
        email: '',
        phone: '',
        address: '',
        role: 'PROVIDER',
        joinedDate: '-',
        aadharNumber: '-',
        permitNumber: '-',
        bankName: '-',
        accountNumber: '-',
        ifscCode: '-',
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [editedProfile, setEditedProfile] = useState<any>({});

    const providerGradient: readonly [string, string, ...string[]] = ['#8B5CF6', '#6D28D9'];

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API}/api/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 200) {
                setProfile(res.data);
                setEditedProfile(res.data);
            }
        } catch (err) {
            console.error('Profile load failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const saveProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.put(`${API}/api/profile`, editedProfile, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            if (res.status === 200) {
                setProfile(editedProfile);
                setEditMode(false);
                Alert.alert('Protocol Success', 'Provider identity updated.');
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to update provider records');
        }
    };

    const handleShutdown = () => {
        Alert.alert(
            "Shutdown Hub",
            "Are you sure you want to terminate the terminal session?",
            [
                { text: "Abort", style: "cancel" },
                { text: "Shutdown", onPress: () => BackHandler.exitApp(), style: "destructive" }
            ]
        );
    };

    const handleLogout = async () => {
        Alert.alert(
            "Terminal Exit",
            "Securely log out of the mainframe?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    onPress: async () => {
                        await AsyncStorage.clear();
                        router.replace('/' as any);
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text className="mt-4 text-purple-600 font-black uppercase tracking-widest text-[8px]">Syncing Identity...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="light-content" />

            <CustomHeader
                title="Identity Hub"
                subtitle="ACCOUNT PROTOCOL"
                onMenuPress={() => setIsSidebarOpen(true)}
                userName={profile?.name}
            />

            <UnifiedSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                userName={profile.name}
                userRole="Service Provider"
                userStatus="STABLE"
                gradientColors={providerGradient}
                dark={false}
                onLogout={handleLogout}
                menuItems={[
                    { icon: 'grid', label: 'Dashboard', route: '/(provider)/dashboard' },
                    { icon: 'calendar', label: 'Bookings', route: '/(provider)/history' },
                    { icon: 'cash', label: 'Revenue Hub', route: '/(provider)/earnings' },
                    { icon: 'person', label: 'Profile', route: '/(provider)/profile' },
                ]}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
                {/* IDENTITY OVERVIEW */}
                <View className="px-5 mt-6">
                    <View className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            <View className="w-16 h-16 bg-purple-100 rounded-2xl items-center justify-center border border-purple-200">
                                <Text className="text-purple-600 text-2xl font-black">{profile?.name?.charAt(0) || 'P'}</Text>
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className="text-gray-900 text-xl font-black tracking-tight" numberOfLines={1}>{profile?.name}</Text>
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Verified Multi-node Partner</Text>
                            </View>
                        </View>
                        {!editMode ? (
                            <TouchableOpacity onPress={() => setEditMode(true)} className="bg-gray-900 w-10 h-10 rounded-xl items-center justify-center">
                                <Ionicons name="create-outline" size={20} color="white" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={saveProfile} className="bg-emerald-600 w-10 h-10 rounded-xl items-center justify-center">
                                <Ionicons name="checkmark" size={20} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* FIELDS */}
                <View className="px-5 mt-8">
                    <Text className="font-black text-lg text-gray-900 mb-4 ml-2">Mainframe Access</Text>
                    <View className="bg-white rounded-[40px] p-8 border border-gray-100">
                        {[
                            { label: 'Cloud Identity', key: 'email', icon: 'mail-outline', editable: false },
                            { label: 'Contact Node', key: 'phone', icon: 'phone-portrait-outline', editable: true },
                            { label: 'Postal Sector', key: 'address', icon: 'location-outline', editable: true },
                        ].map((field, i) => (
                            <View key={field.key} className={i !== 0 ? 'mt-8' : ''}>
                                <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-2 ml-1">{field.label}</Text>
                                <View className={`bg-gray-50 rounded-2xl p-4 border border-gray-100 flex-row items-center`}>
                                    <Ionicons name={field.icon as any} size={18} color="#94A3B8" className="mr-3" />
                                    {editMode && field.editable ? (
                                        <TextInput
                                            className="flex-1 font-bold text-gray-900 text-sm"
                                            value={editedProfile[field.key]}
                                            onChangeText={(val) => setEditedProfile({ ...editedProfile, [field.key]: val })}
                                        />
                                    ) : (
                                        <Text className="font-bold text-gray-900 text-sm flex-1">{profile[field.key] || 'N/A'}</Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* FINANCIAL NODES */}
                <View className="px-5 mt-8">
                    <Text className="font-black text-lg text-gray-900 mb-4 ml-2">Settlement Credentials</Text>
                    <View className="bg-gray-900 rounded-[40px] p-8">
                        {[
                            { label: 'Bank Institution', key: 'bankName', icon: 'business' },
                            { label: 'Account Segment', key: 'accountNumber', icon: 'card' },
                            { label: 'IFSC Routing', key: 'ifscCode', icon: 'finger-print' },
                        ].map((field, i) => (
                            <View key={field.key} className={i !== 0 ? 'mt-8' : ''}>
                                <Text className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-2 ml-1">{field.label}</Text>
                                <View className="bg-white/5 rounded-2xl p-4 border border-white/5 flex-row items-center">
                                    <Ionicons name={field.icon as any} size={18} color="rgba(255,255,255,0.2)" className="mr-3" />
                                    {editMode ? (
                                        <TextInput
                                            className="flex-1 font-bold text-white text-sm"
                                            value={editedProfile[field.key]}
                                            onChangeText={(val) => setEditedProfile({ ...editedProfile, [field.key]: val })}
                                            placeholder="..." placeholderTextColor="rgba(255,255,255,0.1)"
                                        />
                                    ) : (
                                        <Text className="font-bold text-white text-sm flex-1">{profile[field.key] || 'NOT SET'}</Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* TERMINAL ACTIONS */}
                <View className="px-5 mt-10 gap-4">
                    <TouchableOpacity onPress={handleLogout} className="bg-white h-16 rounded-3xl items-center justify-center border border-rose-100 flex-row">
                        <Ionicons name="log-out-outline" size={20} color="#F43F5E" />
                        <Text className="text-rose-600 font-black uppercase tracking-widest text-xs ml-3">Terminal Exit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShutdown} className="bg-rose-50 h-16 rounded-3xl items-center justify-center border border-rose-100 flex-row">
                        <Ionicons name="power" size={20} color="#F43F5E" />
                        <Text className="text-rose-600 font-black uppercase tracking-widest text-xs ml-3">Shutdown Hub</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
