import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import AnalyticsDashboard from '../../components/admin/AnalyticsDashboard';
import DisputeManagement from '../../components/admin/DisputeManagement';
import DriverManagement from '../../components/admin/DriverManagement';
import OccupancyDonutChart from '../../components/admin/OccupancyDonutChart';
import ParkingDurationChart from '../../components/admin/ParkingDurationChart';
import ParkingSlotGrid from '../../components/admin/ParkingSlotGrid';
import ProviderManagement from '../../components/admin/ProviderManagement';
import UnifiedSidebar from '../../components/shared/UnifiedSidebar';

const { width } = Dimensions.get('window');

interface Metric {
    label: string;
    value: string;
    icon: string;
    color: string;
    bg: string;
    trend?: string;
    trendUp?: boolean;
}

interface Provider {
    id: string;
    name: string;
    location: string;
    slots: number;
    status: 'pending' | 'approved' | 'rejected';
    appliedDate: string;
}

interface Activity {
    id: string;
    title: string;
    desc: string;
    time: string;
    status: 'pending' | 'success' | 'warning' | 'error';
}

export default function AdminDashboardScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'analytics' | 'drivers' | 'disputes' | 'settings'>('overview');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [showRevenueReport, setShowRevenueReport] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [currentUser, setCurrentUser] = useState({
        name: "Admin Root",
        email: "admin@partease.com",
        phone: "+91 99999 88888",
        roleTitle: "Super Administrator"
    });

    // Top Summary Metrics
    const metrics: Metric[] = [
        {
            label: 'Total Providers',
            value: '142',
            icon: 'business',
            color: '#6C5CE7',
            bg: '#E3E1FC',
            trend: '+8',
            trendUp: true
        },
        {
            label: 'Pending Approvals',
            value: '12',
            icon: 'hourglass',
            color: '#FDCB6E',
            bg: '#FFF4DB',
            trend: '3 urgent',
            trendUp: false
        },
        {
            label: 'Active Drivers',
            value: '1,847',
            icon: 'car-sport',
            color: '#00B894',
            bg: '#E8F6F3',
            trend: '+124',
            trendUp: true
        },
        {
            label: "Today's Bookings",
            value: '356',
            icon: 'calendar',
            color: '#0984E3',
            bg: '#E3F2FD',
            trend: '+18%',
            trendUp: true
        },
        {
            label: 'Total Revenue',
            value: '₹8.4L',
            icon: 'wallet',
            color: '#00B894',
            bg: '#E8F6F3',
            trend: '+12% vs last week',
            trendUp: true
        },
        {
            label: 'Available Slots',
            value: '4,285',
            icon: 'grid',
            color: '#2D3436',
            bg: '#DFE6E9',
            trend: 'Across 142 providers',
            trendUp: true
        },
    ];

    // Pending Provider Approvals
    const [pendingProvidersData, setPendingProvidersData] = useState<Provider[]>([
        { id: '1', name: 'City Center Plaza', location: 'Downtown District', slots: 150, status: 'pending', appliedDate: '2 hrs ago' },
        { id: '2', name: 'Grand Mall Parking', location: 'Shopping Complex', slots: 200, status: 'pending', appliedDate: '5 hrs ago' },
        { id: '3', name: 'Airport Premium Lot', location: 'Terminal 3', slots: 300, status: 'pending', appliedDate: '1 day ago' },
    ]);

    // Recent Activity & Alerts
    const recentActivity: Activity[] = [
        { id: '1', title: 'Dispute Reported #D402', desc: 'Refund request from Driver ID #8472', time: '10 min ago', status: 'warning' },
        { id: '2', title: 'New Provider Registration', desc: 'City Mall Parking applied for approval', time: '1 hr ago', status: 'pending' },
        { id: '3', title: 'Payment Processed', desc: 'Monthly settlement ₹2.4L to 85 providers', time: '2 hrs ago', status: 'success' },
        { id: '4', title: 'System Alert', desc: 'High traffic detected in Zone A', time: '3 hrs ago', status: 'error' },
        { id: '5', title: 'Provider Approved', desc: 'Airport Premium Lot - 300 slots added', time: '5 hrs ago', status: 'success' },
    ];

    // Booking Trend Data (Mock - for visualization)
    const bookingTrendData = [
        { day: 'Mon', bookings: 280 },
        { day: 'Tue', bookings: 320 },
        { day: 'Wed', bookings: 298 },
        { day: 'Thu', bookings: 356 },
        { day: 'Fri', bookings: 420 },
        { day: 'Sat', bookings: 485 },
        { day: 'Sun', bookings: 390 },
    ];

    // Peak Hours Data
    const peakHours = [
        { hour: '8-10 AM', percentage: 85, bookings: 124 },
        { hour: '12-2 PM', percentage: 72, bookings: 98 },
        { hour: '6-8 PM', percentage: 95, bookings: 142 },
    ];

    // Occupancy Data for Donut Chart
    const occupancyData = {
        available: 98,
        occupied: 198,
        total: 296
    };

    // Parking Duration Data for Bar Chart
    const parkingDurationData = [
        { label: 'Available', count: 98, color: '#00B894' },
        { label: '<5 min', count: 24, color: '#FDCB6E' },
        { label: '5-15 min', count: 32, color: '#FFA502' },
        { label: '15min-1hr', count: 67, color: '#FF7675' },
        { label: '1hr-3hrs', count: 85, color: '#E17055' },
        { label: '>3 hours', count: 28, color: '#D63031' },
    ];

    // Parking Slots for Grid View
    const parkingSlots = Array.from({ length: 64 }, (_, i) => {
        const row = String.fromCharCode(65 + Math.floor(i / 8)); // A, B, C, etc.
        const col = (i % 8) + 1;
        const isOccupied = Math.random() > 0.4;
        const isReserved = !isOccupied && Math.random() > 0.8;

        return {
            id: `${row}${col}`,
            label: `${row}${col < 10 ? '0' : ''}${col}`,
            status: isReserved ? ('reserved' as const) : isOccupied ? ('occupied' as const) : ('available' as const),
        };
    });

    const handleApproveProvider = (id: string, name: string) => {
        Alert.alert(
            "Approve Provider",
            `Are you sure you want to approve ${name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Approve",
                    onPress: () => {
                        setPendingProvidersData(prev => prev.filter(p => p.id !== id));
                        Alert.alert("Success", `${name} has been approved.`);
                    },
                    style: "default"
                }
            ]
        );
    };

    const handleRejectProvider = (id: string, name: string) => {
        Alert.alert(
            "Reject Provider",
            `Are you sure you want to reject ${name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reject",
                    onPress: () => {
                        setPendingProvidersData(prev => prev.filter(p => p.id !== id));
                        Alert.alert("Rejected", `${name} application has been declined.`);
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const renderHeader = () => (
        <LinearGradient
            colors={['#2D3436', '#636E72']} // Slate Gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="pt-16 pb-8 px-6"
        >
            <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => setShowMenu(true)}
                        className="w-12 h-12 bg-white/10 rounded-2xl justify-center items-center backdrop-blur-md border border-white/10 mr-4"
                    >
                        <Ionicons name="menu-outline" size={28} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-gray-300 font-bold text-[10px] uppercase tracking-widest">Administrator</Text>
                        <Text className="text-white text-3xl font-black">{currentUser.name.split(' ')[0]}</Text>
                    </View>
                </View>
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={() => setShowNotifications(true)}
                        className="w-10 h-10 bg-white/10 rounded-full justify-center items-center backdrop-blur-md border border-white/10"
                    >
                        <Ionicons name="notifications-outline" size={22} color="white" />
                        <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full justify-center items-center border-2 border-slate-700">
                            <Text className="text-white text-[10px] font-bold">8</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                        setActiveTab('settings');
                        setShowMenu(false);
                    }} className="w-10 h-10 bg-white/10 rounded-full justify-center items-center backdrop-blur-md border border-white/10">
                        <Ionicons name="settings-outline" size={22} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
            <Text className="text-gray-400 text-xs mt-1 ml-16">System operational: <Text className="text-green-400">Stable</Text></Text>
        </LinearGradient>
    );

    const renderMetricsGrid = () => (
        <View className="px-6 mt-6">
            <Text className="text-dark-900 font-bold text-xl mb-4">Summary Metrics</Text>
            <View className="flex-row flex-wrap gap-3">
                {metrics.map((metric, index) => (
                    <Animated.View
                        key={index}
                        entering={FadeInDown.delay(index * 100).springify()}
                        style={{ width: (width - 60) / 2 }}
                    >
                        <TouchableOpacity
                            onPress={() => setSelectedMetric(metric)}
                            activeOpacity={0.7}
                            className="bg-white rounded-3xl p-5 shadow-sm shadow-gray-200 border border-gray-100"
                        >
                            <View className="w-12 h-12 rounded-2xl justify-center items-center mb-3" style={{ backgroundColor: metric.bg }}>
                                <Ionicons name={metric.icon as any} size={24} color={metric.color} />
                            </View>
                            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">{metric.label}</Text>
                            <Text className="text-3xl font-black text-dark-900 mt-1">{metric.value}</Text>
                            {metric.trend && (
                                <View className="flex-row items-center mt-2">
                                    <Ionicons
                                        name={metric.trendUp ? 'trending-up' : 'information-circle'}
                                        size={12}
                                        color={metric.trendUp ? '#00B894' : '#636E72'}
                                    />
                                    <Text className={`text-[10px] font-bold ml-1 ${metric.trendUp ? 'text-teal-500' : 'text-gray-500'}`}>
                                        {metric.trend}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>
        </View>
    );

    const renderBookingTrend = () => {
        const maxBookings = Math.max(...bookingTrendData.map(d => d.bookings));

        return (
            <View className="px-6 mt-8">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-dark-900 font-bold text-xl">Booking Trend</Text>
                    <TouchableOpacity className="bg-slate-50 px-4 py-2 rounded-xl">
                        <Text className="text-slate-700 font-bold text-xs uppercase">7 Days</Text>
                    </TouchableOpacity>
                </View>
                <View className="bg-white rounded-3xl p-5 shadow-sm shadow-gray-200 border border-gray-100">
                    <View className="flex-row items-end justify-between h-40 mb-4">
                        {bookingTrendData.map((item, index) => {
                            const heightPercentage = (item.bookings / maxBookings) * 100;
                            return (
                                <Animated.View
                                    key={index}
                                    entering={FadeInDown.delay(index * 100).springify()}
                                    className="flex-1 items-center"
                                >
                                    <Text className="text-xs font-bold text-slate-600 mb-2">{item.bookings}</Text>
                                    <View
                                        className="w-8 bg-slate-600 rounded-t-lg"
                                        style={{
                                            height: `${heightPercentage}%`,
                                            backgroundColor: index === bookingTrendData.length - 1 ? '#2D3436' : '#636E72'
                                        }}
                                    />
                                    <Text className="text-[10px] font-bold text-gray-400 mt-2 uppercase">{item.day}</Text>
                                </Animated.View>
                            );
                        })}
                    </View>
                    <View className="border-t border-gray-100 pt-3 flex-row justify-between">
                        <View>
                            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">Avg Daily</Text>
                            <Text className="text-dark-900 text-lg font-bold">364</Text>
                        </View>
                        <View>
                            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">Peak Day</Text>
                            <Text className="text-dark-900 text-lg font-bold">Sat (485)</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderPeakHours = () => (
        <View className="px-6 mt-8">
            <Text className="text-dark-900 font-bold text-xl mb-4">Peak Parking Hours</Text>
            <View className="gap-3">
                {peakHours.map((item, index) => (
                    <Animated.View
                        key={index}
                        entering={FadeInRight.delay(index * 100).springify()}
                        className="bg-white rounded-2xl p-4 shadow-sm shadow-gray-200 border border-gray-100"
                    >
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-dark-900 font-bold text-base">{item.hour}</Text>
                            <Text className="text-slate-600 font-black text-lg">{item.percentage}%</Text>
                        </View>
                        <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <Animated.View
                                entering={FadeInRight.delay((index + 1) * 200).springify()}
                                className="h-full bg-slate-600 rounded-full"
                                style={{ width: `${item.percentage}%` }}
                            />
                        </View>
                        <Text className="text-gray-400 text-xs font-medium mt-2">{item.bookings} bookings</Text>
                    </Animated.View>
                ))}
            </View>
        </View>
    );

    const renderPendingProviders = () => (
        <View className="px-6 mt-8">
            <View className="flex-row justify-between items-center mb-4">
                <View>
                    <Text className="text-dark-900 font-bold text-xl">Pending Approvals</Text>
                    <Text className="text-gray-500 text-xs mt-1">{pendingProvidersData.length} providers awaiting review</Text>
                </View>
                <TouchableOpacity
                    onPress={() => setActiveTab('providers')}
                    className="bg-slate-100 px-4 py-2 rounded-xl"
                >
                    <Text className="text-slate-700 font-bold text-xs uppercase">View All</Text>
                </TouchableOpacity>
            </View>
            <View className="gap-3">
                {pendingProvidersData.length === 0 ? (
                    <View className="bg-white rounded-2xl p-8 items-center border border-dashed border-gray-300">
                        <Ionicons name="checkmark-circle-outline" size={48} color="#00B894" />
                        <Text className="text-gray-500 mt-2 font-bold">All caught up!</Text>
                        <Text className="text-gray-400 text-xs text-center">No pending provider approvals.</Text>
                    </View>
                ) : (
                    pendingProvidersData.map((provider, index) => (
                        <Animated.View
                            key={provider.id}
                            entering={FadeInRight.delay(index * 100).springify()}
                            className="bg-white rounded-2xl p-4 shadow-sm shadow-gray-200 border border-gray-100"
                        >
                            <View className="flex-row justify-between items-start mb-3">
                                <View className="flex-1">
                                    <Text className="text-dark-900 font-bold text-base">{provider.name}</Text>
                                    <View className="flex-row items-center gap-1 mt-1">
                                        <Ionicons name="location" size={12} color="#636E72" />
                                        <Text className="text-gray-500 text-xs">{provider.location}</Text>
                                    </View>
                                    <View className="flex-row items-center gap-3 mt-2">
                                        <View className="bg-indigo-50 px-2 py-1 rounded-lg">
                                            <Text className="text-indigo-600 text-[10px] font-bold">{provider.slots} slots</Text>
                                        </View>
                                        <Text className="text-gray-400 text-[10px] font-medium">{provider.appliedDate}</Text>
                                    </View>
                                </View>
                            </View>
                            <View className="flex-row gap-2 mt-3 border-t border-gray-100 pt-3">
                                <TouchableOpacity
                                    onPress={() => handleApproveProvider(provider.id, provider.name)}
                                    className="flex-1 bg-teal-500 py-2.5 rounded-xl items-center"
                                >
                                    <Text className="text-white font-bold text-xs uppercase tracking-wide">Approve</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleRejectProvider(provider.id, provider.name)}
                                    className="flex-1 bg-red-50 py-2.5 rounded-xl items-center"
                                >
                                    <Text className="text-red-500 font-bold text-xs uppercase tracking-wide">Reject</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setActiveTab('providers')}
                                    className="bg-gray-50 px-4 py-2.5 rounded-xl items-center justify-center"
                                >
                                    <Ionicons name="eye-outline" size={18} color="#636E72" />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    ))
                )}
            </View>
        </View>
    );

    const renderRecentActivity = () => (
        <View className="px-6 mt-8">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-dark-900 font-bold text-xl">Recent Activity</Text>
                <Text className="text-gray-500 font-bold text-xs uppercase tracking-wide">Live Feed</Text>
            </View>
            <View className="gap-3">
                {recentActivity.map((item, index) => (
                    <Animated.View
                        key={item.id}
                        entering={FadeInRight.delay(index * 100).springify()}
                        className="bg-white p-4 rounded-2xl shadow-sm shadow-gray-100 border border-gray-100 flex-row items-center"
                    >
                        <View className={`w-1 h-12 rounded-full mr-4 ${item.status === 'success' ? 'bg-green-500' :
                            item.status === 'warning' ? 'bg-orange-400' :
                                item.status === 'error' ? 'bg-red-500' : 'bg-blue-400'
                            }`} />
                        <View className="flex-1">
                            <Text className="text-dark-900 font-bold text-sm">{item.title}</Text>
                            <Text className="text-gray-400 text-xs mt-1">{item.desc}</Text>
                        </View>
                        <Text className="text-gray-300 text-[10px] font-bold uppercase">{item.time}</Text>
                    </Animated.View>
                ))}
            </View>
        </View>
    );

    const renderQuickActions = () => (
        <View className="px-6 mt-8">
            <Text className="text-dark-900 font-bold text-xl mb-4">Quick Actions</Text>
            <View className="flex-row flex-wrap gap-3">
                <TouchableOpacity
                    onPress={() => setActiveTab('drivers')}
                    className="flex-1 bg-slate-800 rounded-2xl p-4 min-w-[45%] shadow-lg shadow-slate-200"
                >
                    <Ionicons name="people" size={28} color="white" />
                    <Text className="text-white font-bold text-sm mt-3">Manage Drivers</Text>
                    <Text className="text-white/70 text-[10px] mt-1">View & monitor all drivers</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab('disputes')}
                    className="flex-1 bg-orange-500 rounded-2xl p-4 min-w-[45%] shadow-lg shadow-orange-200"
                >
                    <Ionicons name="alert-circle" size={28} color="white" />
                    <Text className="text-white font-bold text-sm mt-3">Handle Disputes</Text>
                    <Text className="text-white/70 text-[10px] mt-1">8 pending disputes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab('analytics')}
                    className="flex-1 bg-teal-600 rounded-2xl p-4 min-w-[45%] shadow-lg shadow-teal-200"
                >
                    <Ionicons name="stats-chart" size={28} color="white" />
                    <Text className="text-white font-bold text-sm mt-3">Analytics</Text>
                    <Text className="text-white/70 text-[10px] mt-1">Detailed revenue reports</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab('settings')}
                    className="flex-1 bg-indigo-600 rounded-2xl p-4 min-w-[45%] shadow-lg shadow-indigo-200"
                >
                    <Ionicons name="settings" size={28} color="white" />
                    <Text className="text-white font-bold text-sm mt-3">System Settings</Text>
                    <Text className="text-white/70 text-[10px] mt-1">Configure platform</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderSettings = () => (
        <View className="flex-1 bg-gray-50 pb-10">
            <View className="px-6 pt-6">
                <View className="flex-row items-center mb-6">
                    <TouchableOpacity onPress={() => setActiveTab('overview')} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color="#2D3436" />
                    </TouchableOpacity>
                    <Text className="text-dark-900 font-bold text-2xl">System Settings</Text>
                </View>

                <View className="bg-white rounded-3xl p-6 shadow-sm shadow-gray-200 border border-gray-100 mb-6">
                    <Text className="text-dark-900 font-bold text-lg mb-4">Platform Configuration</Text>

                    <View className="gap-6">
                        <View className="flex-row justify-between items-center">
                            <View>
                                <Text className="text-dark-900 font-bold">Maintenance Mode</Text>
                                <Text className="text-gray-400 text-xs">Disable public access</Text>
                            </View>
                            <TouchableOpacity className="w-12 h-6 bg-gray-200 rounded-full">
                                <View className="w-6 h-6 bg-white rounded-full shadow-sm" />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row justify-between items-center">
                            <View>
                                <Text className="text-dark-900 font-bold">New Registrations</Text>
                                <Text className="text-gray-400 text-xs">Aallow new providers/drivers</Text>
                            </View>
                            <TouchableOpacity className="w-12 h-6 bg-green-500 rounded-full items-end p-0.5">
                                <View className="w-5 h-5 bg-white rounded-full" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View className="bg-white rounded-3xl p-6 shadow-sm shadow-gray-200 border border-gray-100 mb-6">
                    <Text className="text-dark-900 font-bold text-lg mb-4">Pricing Rules</Text>
                    <View className="gap-4">
                        <View>
                            <Text className="text-gray-500 text-xs mb-1">Base Platform Fee (%)</Text>
                            <TextInput
                                className="bg-gray-50 p-3 rounded-xl border border-gray-100 font-bold"
                                placeholder="15"
                                defaultValue="15"
                            />
                        </View>
                        <View>
                            <Text className="text-gray-500 text-xs mb-1">Min Booking Amount (₹)</Text>
                            <TextInput
                                className="bg-gray-50 p-3 rounded-xl border border-gray-100 font-bold"
                                placeholder="50"
                                defaultValue="50"
                            />
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => Alert.alert("Success", "System settings updated.")}
                    className="bg-slate-800 py-4 rounded-2xl items-center shadow-lg shadow-slate-200"
                >
                    <Text className="text-white font-black uppercase">Save Configuration</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'providers':
                return (
                    <View className="flex-1">
                        <TouchableOpacity onPress={() => setActiveTab('overview')} className="p-4 flex-row items-center">
                            <Ionicons name="arrow-back" size={24} color="#2D3436" />
                            <Text className="ml-2 font-bold text-dark-900">Back to Overview</Text>
                        </TouchableOpacity>
                        <ProviderManagement />
                    </View>
                );
            case 'drivers':
                return (
                    <View className="flex-1">
                        <TouchableOpacity onPress={() => setActiveTab('overview')} className="p-4 flex-row items-center">
                            <Ionicons name="arrow-back" size={24} color="#2D3436" />
                            <Text className="ml-2 font-bold text-dark-900">Back to Overview</Text>
                        </TouchableOpacity>
                        <DriverManagement />
                    </View>
                );
            case 'disputes':
                return (
                    <View className="flex-1">
                        <TouchableOpacity onPress={() => setActiveTab('overview')} className="p-4 flex-row items-center">
                            <Ionicons name="arrow-back" size={24} color="#2D3436" />
                            <Text className="ml-2 font-bold text-dark-900">Back to Overview</Text>
                        </TouchableOpacity>
                        <DisputeManagement />
                    </View>
                );
            case 'analytics':
                return (
                    <View className="flex-1">
                        <TouchableOpacity onPress={() => setActiveTab('overview')} className="p-4 flex-row items-center">
                            <Ionicons name="arrow-back" size={24} color="#2D3436" />
                            <Text className="ml-2 font-bold text-dark-900">Back to Overview</Text>
                        </TouchableOpacity>
                        <AnalyticsDashboard />
                    </View>
                );
            case 'settings':
                return renderSettings();
            default:
                return (
                    <ScrollView
                        className="flex-1 -mt-4 bg-gray-50 rounded-t-[30px]"
                        showsVerticalScrollIndicator={false}
                    >
                        {renderMetricsGrid()}
                        {renderBookingTrend()}
                        {renderPeakHours()}

                        {/* NEW PROFESSIONAL GRAPHS */}
                        <View className="px-6 mt-8">
                            <OccupancyDonutChart data={occupancyData} size={180} />
                        </View>
                        <View className="px-6 mt-8">
                            <ParkingDurationChart data={parkingDurationData} maxHeight={200} />
                        </View>
                        <View className="px-6 mt-8">
                            <ParkingSlotGrid slots={parkingSlots} columns={8} />
                        </View>

                        {renderPendingProviders()}
                        {renderRecentActivity()}
                        {renderQuickActions()}

                        {/* Revenue Trend Section */}
                        <View className="px-6 mt-8">
                            <Text className="text-dark-900 font-bold text-xl mb-4">Revenue Trend</Text>
                            <View className="bg-white rounded-3xl p-6 shadow-sm shadow-gray-200 border border-gray-100">
                                <View className="flex-row justify-between items-start mb-6">
                                    <View>
                                        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wide mb-2">This Month</Text>
                                        <Text className="text-dark-900 text-3xl font-black">₹8.4L</Text>
                                        <View className="flex-row items-center mt-2">
                                            <Ionicons name="trending-up" size={16} color="#00B894" />
                                            <Text className="text-teal-500 text-sm font-bold ml-1">+12% from last month</Text>
                                        </View>
                                    </View>
                                    <View className="bg-teal-50 px-3 py-2 rounded-xl">
                                        <Text className="text-teal-600 font-bold text-xs">Target: 85%</Text>
                                    </View>
                                </View>
                                <View className="border-t border-gray-100 pt-4 gap-3">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-500 text-xs font-medium">Platform Fees</Text>
                                        <Text className="text-dark-900 text-sm font-bold">₹2.1L</Text>
                                    </View>
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-500 text-xs font-medium">Provider Earnings</Text>
                                        <Text className="text-dark-900 text-sm font-bold">₹6.3L</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* System Health */}
                        <View className="px-6 mt-8 mb-8">
                            <Text className="text-dark-900 font-bold text-xl mb-4">System Health</Text>
                            <View className="bg-white rounded-3xl p-5 shadow-sm shadow-gray-200 border border-gray-100">
                                <View className="flex-row justify-between items-center mb-4">
                                    <View className="flex-row items-center">
                                        <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                                        <Text className="text-dark-900 font-bold text-base">All Systems Operational</Text>
                                    </View>
                                    <Text className="text-gray-400 text-xs">Updated 2 min ago</Text>
                                </View>
                                <View className="gap-2">
                                    <View className="flex-row justify-between items-center py-2">
                                        <Text className="text-gray-500 text-xs">Database</Text>
                                        <View className="flex-row items-center">
                                            <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                                            <Text className="text-green-600 text-xs font-bold">Healthy</Text>
                                        </View>
                                    </View>
                                    <View className="flex-row justify-between items-center py-2">
                                        <Text className="text-gray-500 text-xs">Payment Gateway</Text>
                                        <View className="flex-row items-center">
                                            <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                                            <Text className="text-green-600 text-xs font-bold">Healthy</Text>
                                        </View>
                                    </View>
                                    <View className="flex-row justify-between items-center py-2">
                                        <Text className="text-gray-500 text-xs">API Response Time</Text>
                                        <Text className="text-gray-600 text-xs font-bold">124ms</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="flex-row items-center justify-center py-4 mb-8 mx-6 opacity-50"
                        >
                            <Ionicons name="log-out-outline" size={20} color="#2D3436" />
                            <Text className="ml-2 text-dark-900 font-bold uppercase text-xs tracking-wide">Logout Session</Text>
                        </TouchableOpacity>
                    </ScrollView>
                );
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar barStyle="light-content" />
            {renderHeader()}

            {renderContent()}

            <UnifiedSidebar
                visible={showMenu}
                onClose={() => setShowMenu(false)}
                role="admin"
                userData={currentUser}
                onUpdate={(name, phone) => setCurrentUser(prev => ({ ...prev, name, phone }))}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onLogout={() => router.back()}
            />

            {/* Broadcast Modal */}
            <Modal
                visible={showBroadcastModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowBroadcastModal(false)}
            >
                <View className="flex-1 bg-black/60 justify-center px-6">
                    <View className="bg-white rounded-3xl p-6 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-indigo-500 rounded-xl justify-center items-center">
                                    <Ionicons name="megaphone" size={20} color="white" />
                                </View>
                                <Text className="text-slate-900 font-bold text-xl ml-3">System Broadcast</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowBroadcastModal(false)}>
                                <Ionicons name="close" size={24} color="#2D3436" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-gray-500 text-sm mb-4">Send a push notification to all active drivers and providers.</Text>

                        <TextInput
                            placeholder="Type your message here..."
                            multiline
                            numberOfLines={4}
                            value={broadcastMessage}
                            onChangeText={setBroadcastMessage}
                            className="bg-gray-50 rounded-2xl p-4 text-slate-900 min-h-[120px] border border-gray-100"
                            textAlignVertical="top"
                        />

                        <View className="flex-row gap-3 mt-6">
                            <TouchableOpacity
                                onPress={() => setShowBroadcastModal(false)}
                                className="flex-1 bg-gray-100 py-4 rounded-xl items-center"
                            >
                                <Text className="text-gray-600 font-bold uppercase tracking-widest text-xs">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (!broadcastMessage) return;
                                    setShowBroadcastModal(false);
                                    Alert.alert("Success", "Broadcast sent to 2,482 users successfully.");
                                    setBroadcastMessage('');
                                }}
                                className="flex-1 bg-indigo-600 py-4 rounded-xl items-center shadow-lg shadow-indigo-200"
                            >
                                <Text className="text-white font-bold uppercase tracking-widest text-xs">Send Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Quick Revenue Report Modal */}
            <Modal
                visible={showRevenueReport}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowRevenueReport(false)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-[40px] p-8">
                        <View className="flex-row justify-between items-center mb-8">
                            <View>
                                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Financial Snapshot</Text>
                                <Text className="text-slate-900 font-black text-2xl">Daily Earnings</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowRevenueReport(false)} className="bg-gray-100 w-10 h-10 rounded-full justify-center items-center">
                                <Ionicons name="close" size={24} color="#2D3436" />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row bg-teal-50 p-6 rounded-3xl border border-teal-100 mb-6">
                            <View className="flex-1">
                                <Text className="text-teal-600 text-xs font-bold uppercase mb-1">Total Revenue</Text>
                                <Text className="text-teal-700 text-4xl font-black">₹ 14.2k</Text>
                            </View>
                            <View className="bg-white/50 px-3 py-1 rounded-full self-start flex-row items-center">
                                <Ionicons name="trending-up" size={14} color="#00B894" />
                                <Text className="text-teal-600 font-bold text-xs ml-1">+18%</Text>
                            </View>
                        </View>

                        <View className="gap-4">
                            <View className="flex-row justify-between items-center py-4 border-b border-gray-50">
                                <View className="flex-row items-center">
                                    <View className="w-8 h-8 bg-indigo-50 rounded-lg justify-center items-center">
                                        <Ionicons name="business" size={16} color="#6C5CE7" />
                                    </View>
                                    <Text className="ml-3 text-slate-600 font-medium">Merchant Fees</Text>
                                </View>
                                <Text className="text-slate-900 font-bold">₹ 4,260</Text>
                            </View>
                            <View className="flex-row justify-between items-center py-4 border-b border-gray-50">
                                <View className="flex-row items-center">
                                    <View className="w-8 h-8 bg-orange-50 rounded-lg justify-center items-center">
                                        <Ionicons name="wallet" size={16} color="#E17055" />
                                    </View>
                                    <Text className="ml-3 text-slate-600 font-medium">Platform Charges (5%)</Text>
                                </View>
                                <Text className="text-slate-900 font-bold">₹ 710</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                setShowRevenueReport(false);
                                Alert.alert("Exporting", "Financial report has been emailed to your registered address.");
                            }}
                            className="bg-teal-600 py-5 rounded-2xl items-center mt-8 shadow-xl shadow-teal-100"
                        >
                            <Text className="text-white font-bold uppercase tracking-widest text-sm">Download Full PDF</Text>
                        </TouchableOpacity>
                        <View className="h-6" />
                    </View>
                </View>
            </Modal>

            {/* Notification Modal */}
            <Modal
                transparent={true}
                visible={showNotifications}
                animationType="fade"
                onRequestClose={() => setShowNotifications(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/50 justify-center items-center p-6"
                    activeOpacity={1}
                    onPress={() => setShowNotifications(false)}
                >
                    <Animated.View
                        entering={FadeInDown}
                        className="bg-white rounded-3xl w-full max-h-[80%] shadow-2xl overflow-hidden"
                    >
                        <View className="bg-slate-800 p-6 flex-row justify-between items-center">
                            <Text className="text-white font-black text-xl">System Notifications</Text>
                            <TouchableOpacity onPress={() => setShowNotifications(false)}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
                            {recentActivity.map((activity, i) => (
                                <View key={i} className="flex-row items-start border-b border-gray-100 py-4">
                                    <View className={`w-2 h-2 rounded-full mt-2 mr-3 ${activity.status === 'success' ? 'bg-green-500' :
                                        activity.status === 'warning' ? 'bg-orange-400' :
                                            activity.status === 'error' ? 'bg-red-500' : 'bg-blue-400'
                                        }`} />
                                    <View className="flex-1">
                                        <Text className="text-dark-900 font-bold">{activity.title}</Text>
                                        <Text className="text-gray-500 text-xs mt-1">{activity.desc}</Text>
                                        <Text className="text-gray-300 text-[10px] uppercase font-black mt-2">{activity.time}</Text>
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity
                                onPress={() => setShowNotifications(false)}
                                className="bg-gray-100 py-3 rounded-xl items-center mt-4 mb-6"
                            >
                                <Text className="text-gray-600 font-bold">Clear All</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </Animated.View>
                </TouchableOpacity>
            </Modal>

            {/* Metric Detail Modal */}
            <Modal
                transparent={true}
                visible={!!selectedMetric}
                animationType="slide"
                onRequestClose={() => setSelectedMetric(null)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/40 justify-end"
                    activeOpacity={1}
                    onPress={() => setSelectedMetric(null)}
                >
                    <Animated.View
                        entering={FadeInDown}
                        className="bg-white rounded-t-[40px] p-8 pb-12 w-full"
                    >
                        {selectedMetric && (
                            <>
                                <View className="flex-row justify-between items-start mb-6">
                                    <View className="w-16 h-16 rounded-3xl justify-center items-center" style={{ backgroundColor: selectedMetric.bg }}>
                                        <Ionicons name={selectedMetric.icon as any} size={32} color={selectedMetric.color} />
                                    </View>
                                    <TouchableOpacity onPress={() => setSelectedMetric(null)}>
                                        <Ionicons name="close-circle" size={32} color="#DFE6E9" />
                                    </TouchableOpacity>
                                </View>
                                <Text className="text-gray-400 font-bold uppercase tracking-widest text-xs">{selectedMetric.label}</Text>
                                <Text className="text-dark-900 text-5xl font-black mt-2">{selectedMetric.value}</Text>
                                <View className="flex-row items-center mt-4 mb-8">
                                    <View className="bg-green-100 px-3 py-1 rounded-full flex-row items-center">
                                        <Ionicons name="trending-up" size={14} color="#00B894" />
                                        <Text className="text-teal-600 font-bold text-sm ml-1">+12.5% increase</Text>
                                    </View>
                                    <Text className="text-gray-400 text-xs ml-3 font-medium">Since last month</Text>
                                </View>

                                <View className="gap-4">
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedMetric(null);
                                            // Action based on metric
                                        }}
                                        className="bg-slate-800 py-4 rounded-2xl items-center shadow-lg shadow-slate-200"
                                    >
                                        <Text className="text-white font-black uppercase">View Detailed Report</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity className="border border-gray-100 py-4 rounded-2xl items-center">
                                        <Text className="text-gray-500 font-black uppercase">Export PDF Data</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </Animated.View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
