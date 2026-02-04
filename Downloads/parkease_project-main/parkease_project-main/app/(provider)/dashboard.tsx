import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import BookingHistory from '../../components/provider/BookingHistory';
import EarningsTracker from '../../components/provider/EarningsTracker';
import LiveStatus from '../../components/provider/LiveStatus';
import ProviderProfile from '../../components/provider/ProviderProfile';
import SpaceManagement from '../../components/provider/SpaceManagement';
import UnifiedSidebar from '../../components/shared/UnifiedSidebar';

const { width } = Dimensions.get('window');

type ProviderTab = 'dashboard' | 'spaces' | 'live' | 'bookings' | 'earnings' | 'profile' | 'messages' | 'ev' | 'settings';

export default function ProviderDashboardScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<ProviderTab>('dashboard');
    const [showMenu, setShowMenu] = useState(false);
    const [currentUser, setCurrentUser] = useState({
        name: "Rajesh Kumar",
        email: "rajesh@cityplaza.com",
        phone: "+91 98765 43210",
        roleTitle: "Landlord Partner"
    });

    const renderDashboardSummary = () => (
        <ScrollView className="flex-1 px-6 pt-24 pb-32" showsVerticalScrollIndicator={false}>
            <View className="mb-8 mt-12">
                <Text className="text-indigo-600 font-bold uppercase tracking-widest text-[10px] mb-1">Overview</Text>
                <Text className="text-gray-900 text-3xl font-black">Dashboard</Text>
            </View>

            {/* Quick Stats Grid */}
            <View className="flex-row flex-wrap justify-between mb-8">
                <View className="bg-indigo-600 w-[48%] p-6 rounded-[32px] shadow-lg shadow-indigo-100 mb-4">
                    <Ionicons name="wallet-outline" size={24} color="white" />
                    <Text className="text-indigo-100 font-bold text-[10px] uppercase mt-4">Earnings Today</Text>
                    <Text className="text-white text-2xl font-black">₹4,500</Text>
                </View>
                <View className="bg-white w-[48%] p-6 rounded-[32px] border border-gray-100 shadow-sm mb-4">
                    <Ionicons name="car-outline" size={24} color="#6C5CE7" />
                    <Text className="text-gray-400 font-bold text-[10px] uppercase mt-4">Active Cars</Text>
                    <Text className="text-gray-900 text-2xl font-black">12/20</Text>
                </View>
                <View className="bg-white w-[48%] p-6 rounded-[32px] border border-gray-100 shadow-sm mb-4">
                    <Ionicons name="star-outline" size={24} color="#FF9F43" />
                    <Text className="text-gray-400 font-bold text-[10px] uppercase mt-4">Ratings</Text>
                    <Text className="text-gray-900 text-2xl font-black">4.8/5.0</Text>
                </View>
                <View className="bg-indigo-50 w-[48%] p-6 rounded-[32px] border border-indigo-100 shadow-sm mb-4">
                    <Ionicons name="flash-outline" size={24} color="#6C5CE7" />
                    <Text className="text-indigo-600 font-bold text-[10px] uppercase mt-4">EV Usage</Text>
                    <Text className="text-indigo-600 text-2xl font-black">85%</Text>
                </View>
            </View>

            {/* Communication with Admin Card */}
            <TouchableOpacity
                onPress={() => setActiveTab('messages')}
                className="bg-white rounded-[32px] p-6 mb-8 border border-indigo-100 shadow-sm flex-row items-center"
            >
                <View className="bg-indigo-100 w-12 h-12 rounded-2xl justify-center items-center">
                    <Ionicons name="headset-outline" size={24} color="#6C5CE7" />
                </View>
                <View className="ml-4 flex-1">
                    <Text className="text-gray-900 font-black text-lg">Support Center</Text>
                    <Text className="text-gray-400 font-bold text-xs">Chat directly with the Admin</Text>
                </View>
                <View className="w-6 h-6 bg-red-500 rounded-full justify-center items-center">
                    <Text className="text-white text-[10px] font-bold">1</Text>
                </View>
            </TouchableOpacity>

            <Text className="text-gray-900 font-black text-xl mb-6">Today's Activity</Text>
            {[1, 2, 3].map((_, i) => (
                <View key={i} className="bg-white rounded-3xl p-5 mb-4 border border-gray-50 flex-row items-center">
                    <View className="w-10 h-10 bg-gray-50 rounded-xl justify-center items-center mr-4">
                        <Ionicons name="time-outline" size={20} color="#9CA3AF" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-gray-900 font-bold">Booking #{1024 + i}</Text>
                        <Text className="text-gray-400 text-xs">2 hours ago • Slot A{i + 1}</Text>
                    </View>
                    <Text className="text-indigo-600 font-black">+₹150</Text>
                </View>
            ))}
        </ScrollView>
    );

    const renderSupport = () => (
        <View className="flex-1 px-6 pt-24 items-center justify-center">
            <View className="w-24 h-24 bg-indigo-50 rounded-[40px] justify-center items-center mb-6">
                <Ionicons name="chatbubbles-outline" size={48} color="#6C5CE7" />
            </View>
            <Text className="text-2xl font-black text-gray-900 text-center">Admin Support</Text>
            <Text className="text-gray-500 text-center mt-2 px-10">Have a question or issue? Start a conversation with our admin team.</Text>
            <TouchableOpacity className="mt-10 bg-indigo-600 px-12 py-5 rounded-[24px] shadow-xl shadow-indigo-200">
                <Text className="text-white font-black uppercase tracking-wider">Start Chat</Text>
            </TouchableOpacity>
        </View>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'spaces':
                return <SpaceManagement />;
            case 'live':
                return <LiveStatus />;
            case 'bookings':
                return <BookingHistory />;
            case 'earnings':
                return <EarningsTracker />;
            case 'profile':
                return <ProviderProfile />;
            case 'messages':
                return renderSupport();
            case 'ev':
                return (
                    <View className="flex-1 px-6 pt-24 items-center justify-center">
                        <Ionicons name="flash-outline" size={64} color="#6C5CE7" />
                        <Text className="text-xl font-bold text-gray-900 mt-4">EV Management</Text>
                        <Text className="text-gray-500 text-center mt-2 px-10">Monitor and manage your EV charging stations here.</Text>
                        <TouchableOpacity className="mt-6 bg-indigo-600 px-8 py-3 rounded-2xl">
                            <Text className="text-white font-bold">Add New Charger</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'settings':
                return (
                    <ScrollView className="flex-1 px-6 pt-32 pb-32">
                        <Text className="text-gray-900 font-bold text-xl mb-6">Lot Settings</Text>
                        <View className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                            {[
                                { icon: 'time-outline', label: 'Operating Hours' },
                                { icon: 'cash-outline', label: 'Pricing Rules' },
                                { icon: 'business-outline', label: 'Business Profile' },
                                { icon: 'notifications-outline', label: 'Notification Settings' },
                            ].map((item, i) => (
                                <TouchableOpacity key={i} className={`flex-row items-center p-4 ${i !== 3 ? 'border-b border-gray-50' : ''}`}>
                                    <Ionicons name={item.icon as any} size={24} color="#636E72" />
                                    <Text className="ml-4 flex-1 font-bold text-gray-900">{item.label}</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#B2BEC3" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                );
            case 'dashboard':
            default:
                return renderDashboardSummary();
        }
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

            {/* Minimal Header with Toggle */}
            <View className="absolute top-0 left-0 right-0 z-50 flex-row justify-between items-center px-6 pt-12 pb-4 bg-white/80 backdrop-blur-md">
                <TouchableOpacity
                    onPress={() => setShowMenu(true)}
                    className="w-12 h-12 bg-indigo-50 rounded-2xl justify-center items-center"
                >
                    <Ionicons name="menu" size={28} color="#6C5CE7" />
                </TouchableOpacity>
                <View className="items-center">
                    <Text className="text-indigo-600 font-black text-xl tracking-tighter">ParkEase</Text>
                    <Text className="text-gray-400 font-bold text-[8px] uppercase tracking-widest">Provider Hub</Text>
                </View>
                <TouchableOpacity
                    onPress={() => setActiveTab('profile')}
                    className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-indigo-100"
                >
                    <View className="w-full h-full bg-indigo-50 items-center justify-center">
                        <Text className="text-indigo-600 font-black">RK</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {renderContent()}

            <UnifiedSidebar
                visible={showMenu}
                onClose={() => setShowMenu(false)}
                role="provider"
                userData={currentUser}
                onUpdate={(name, phone) => setCurrentUser(prev => ({ ...prev, name, phone }))}
                activeTab={activeTab as any}
                onTabChange={setActiveTab as any}
                onLogout={() => router.replace('/(provider)')}
            />
        </View>
    );
}
