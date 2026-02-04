import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Switch,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BookingHistoryChart from '../../components/driver/BookingHistoryChart';
import BookingModal from '../../components/driver/BookingModal';
import ChatbotModal from '../../components/driver/ChatbotModal';
import ParkingMap from '../../components/driver/ParkingMap';
import SpendingAnalysis from '../../components/driver/SpendingAnalysis';
import UnifiedSidebar from '../../components/shared/UnifiedSidebar';

interface ParkingSlot {
    id: string;
    name: string;
    location: string;
    price: number;
    available: boolean;
    distance: string;
    rating: number;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    type: 'car' | 'bike' | 'truck';
}

interface Booking {
    id: string;
    slotName: string;
    date: string;
    amount: number;
    status: 'Active' | 'Completed';
    vehicle: string;
}

export default function DriverDashboardScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'available' | 'bookings' | 'wallet' | 'profile'>('available');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [showMenu, setShowMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [walletBalance, setWalletBalance] = useState(1250);
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'car' | 'bike' | 'truck'>('car');
    const [topUpAmount, setTopUpAmount] = useState('500');

    // Profile Feature States
    const [activeProfileView, setActiveProfileView] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');

    const [myVehicles, setMyVehicles] = useState([
        { id: '1', name: 'Honda City', number: 'KA 05 MZ 1029', type: 'car' },
        { id: '2', name: 'TVS Jupiter', number: 'KA 01 HG 9988', type: 'bike' }
    ]);
    const [paymentMethods, setPaymentMethods] = useState([
        { id: '1', type: 'MasterCard', last4: '8899', expiry: '12/26' },
        { id: '2', type: 'UPI', id_val: 'alex@upi' }
    ]);
    const [notifications, setNotifications] = useState({ push: true, email: false, promo: true });
    const [privacyParams, setPrivacyParams] = useState({ faceId: true, locationHistory: true });

    // Booking State
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
    const [myBookings, setMyBookings] = useState<Booking[]>([]);

    const [currentUser, setCurrentUser] = useState({
        name: "Alex Driver",
        email: "alex.driver@gmail.com",
        phone: "+91 88776 65544",
        roleTitle: "Premium Partner"
    });

    const parkingSlots: ParkingSlot[] = [
        {
            id: '1', name: 'City Center Hub', location: 'Downtown, Block A', price: 50, available: true, distance: '0.5 km', rating: 4.8,
            coordinates: { latitude: 37.78825, longitude: -122.4324 }, type: 'car'
        },
        {
            id: '2', name: 'Grand Mall Plaza', location: 'Shopping District', price: 40, available: true, distance: '1.2 km', rating: 4.5,
            coordinates: { latitude: 37.79825, longitude: -122.4224 }, type: 'car'
        },
        {
            id: '3', name: 'Airport Premium', location: 'Terminal 3', price: 100, available: false, distance: '5.0 km', rating: 4.9,
            coordinates: { latitude: 37.77825, longitude: -122.4424 }, type: 'car'
        },
        {
            id: '4', name: 'Seaside Parking', location: 'Coastal Road', price: 20, available: true, distance: '3.5 km', rating: 4.2,
            coordinates: { latitude: 37.80825, longitude: -122.4124 }, type: 'bike'
        },
        {
            id: '5', name: 'Tech Park Zone', location: 'IT Corridor', price: 45, available: true, distance: '2.1 km', rating: 4.6,
            coordinates: { latitude: 37.76825, longitude: -122.4524 }, type: 'car'
        },
        {
            id: '6', name: 'Metro Station Bike Zone', location: 'Central Station', price: 15, available: true, distance: '1.0 km', rating: 4.3,
            coordinates: { latitude: 37.75825, longitude: -122.4624 }, type: 'bike'
        },
        {
            id: '7', name: 'Logistics Park', location: 'Industrial Area', price: 150, available: true, distance: '8.0 km', rating: 4.5,
            coordinates: { latitude: 37.81825, longitude: -122.4724 }, type: 'truck'
        },
        {
            id: '8', name: 'Highway Rest Stop', location: 'NH-44', price: 120, available: false, distance: '12.0 km', rating: 4.0,
            coordinates: { latitude: 37.82825, longitude: -122.4824 }, type: 'truck'
        },
    ];

    const filteredSlots = parkingSlots.filter(slot =>
        (slot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            slot.location.toLowerCase().includes(searchQuery.toLowerCase())) &&
        slot.type === selectedCategory
    );

    // Booking History Data
    const bookingHistoryData = [
        { day: 'Mon', bookings: 2 },
        { day: 'Tue', bookings: 1 },
        { day: 'Wed', bookings: 3 },
        { day: 'Thu', bookings: 2 },
        { day: 'Fri', bookings: 4 },
        { day: 'Sat', bookings: 3 },
        { day: 'Sun', bookings: 1 },
    ];

    // Spending Analysis Data
    const spendingData = [
        { label: 'Shopping Malls', amount: 450, color: '#5B5FEF', icon: 'cart' },
        { label: 'Office Parking', amount: 680, color: '#00B894', icon: 'briefcase' },
        { label: 'Airport', amount: 320, color: '#FDCB6E', icon: 'airplane' },
        { label: 'Others', amount: 180, color: '#FF7675', icon: 'ellipsis-horizontal' },
    ];

    const initiateBooking = (slot: ParkingSlot) => {
        if (!slot.available) return;
        setSelectedSlot(slot);
        setShowBookingModal(true);
    };

    const confirmBooking = (hours: number, vehicle: string) => {
        if (!selectedSlot) return;

        const cost = selectedSlot.price * hours;

        if (walletBalance < cost) {
            setShowBookingModal(false);
            Alert.alert("Insufficient Balance", "Please top up your wallet to proceed.");
            return;
        }

        const newBooking: Booking = {
            id: Math.random().toString(),
            slotName: selectedSlot.name,
            date: new Date().toLocaleDateString(),
            amount: cost,
            status: 'Active',
            vehicle: vehicle
        };

        setWalletBalance(prev => prev - cost);
        setMyBookings(prev => [newBooking, ...prev]);
        setShowBookingModal(false);
        setActiveTab('bookings');
        Alert.alert("Success", "Booking confirmed successfully!");
    };

    const handleTopUp = () => {
        const amount = parseInt(topUpAmount);
        if (amount > 0) {
            setWalletBalance(prev => prev + amount);
            setShowTopUpModal(false);
            Alert.alert("Success", `₹${amount} added to wallet successfully.`);
        }
    };

    const renderHeader = () => (
        <LinearGradient
            colors={['#00B894', '#00cec9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="pt-14 pb-8 px-6 rounded-b-[35px] shadow-lg shadow-teal-900/10 z-10"
        >
            <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                        onPress={() => setShowMenu(true)}
                        className="w-12 h-12 bg-white/20 rounded-2xl justify-center items-center backdrop-blur-sm border border-white/20"
                    >
                        <Ionicons name="menu" size={28} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-white/80 text-[10px] font-bold tracking-widest uppercase">Welcome back</Text>
                        <Text className="text-white text-xl font-bold">{currentUser.name}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => setActiveTab('profile')} className="w-10 h-10 bg-white/20 rounded-full justify-center items-center backdrop-blur-sm">
                    <Ionicons name="person-outline" size={20} color="white" />
                </TouchableOpacity>
            </View>

            {/* Wallet Card */}
            <View className="bg-white/10 p-4 rounded-2xl flex-row justify-between items-center border border-white/10 mb-6">
                <View>
                    <Text className="text-white/90 text-xs font-medium mb-1 uppercase tracking-wide">Wallet Balance</Text>
                    <Text className="text-white text-2xl font-bold">₹ {walletBalance.toFixed(2)}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowTopUpModal(true)} className="bg-white px-5 py-2 rounded-xl shadow-sm">
                    <Text className="text-teal-600 font-bold text-xs uppercase">Top Up</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
                <Ionicons name="search" size={20} color="#B2BEC3" />
                <TextInput
                    placeholder="Search parking spots..."
                    className="flex-1 ml-3 text-dark-900 font-bold"
                    placeholderTextColor="#B2BEC3"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
        </LinearGradient>
    );

    const renderSlotItem = ({ item, index }: { item: ParkingSlot; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => initiateBooking(item)}
                className={`bg-white rounded-3xl p-5 mb-4 shadow-sm shadow-gray-200 border border-gray-50 ${!item.available ? 'opacity-60' : ''}`}
            >
                <View className="flex-row justify-between items-start mb-3">
                    <View>
                        <Text className="text-lg font-bold text-dark-900">{item.name}</Text>
                        <View className="flex-row items-center gap-1 mt-1">
                            <Ionicons name="location" size={12} color="#636E72" />
                            <Text className="text-xs text-gray-500 font-medium">{item.location}</Text>
                        </View>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${item.available ? 'bg-teal-50' : 'bg-red-50'}`}>
                        <Text className={`text-[10px] font-bold uppercase ${item.available ? 'text-teal-600' : 'text-red-500'}`}>
                            {item.available ? '● Available' : '● Full'}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-gray-50">
                    <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-lg">
                            <Ionicons name="walk" size={14} color="#636E72" />
                            <Text className="text-xs text-gray-600 ml-1 font-medium">{item.distance}</Text>
                        </View>
                        <View className="flex-row items-center bg-yellow-50 px-2 py-1 rounded-lg">
                            <Ionicons name="star" size={14} color="#FDCB6E" />
                            <Text className="text-xs text-yellow-700 ml-1 font-bold">{item.rating}</Text>
                        </View>
                    </View>
                    <View className="bg-teal-50 px-3 py-1 rounded-lg">
                        <Text className="text-xl font-bold text-teal-600">₹{item.price}<Text className="text-xs text-gray-400 font-normal">/hr</Text></Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'bookings':
                return (
                    <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                        <Text className="text-dark-900 font-bold text-xl mb-4">My Bookings</Text>
                        {myBookings.length === 0 ? (
                            <View className="items-center justify-center py-10 bg-white rounded-3xl border border-gray-100 border-dashed">
                                <Ionicons name="calendar-outline" size={48} color="#B2BEC3" />
                                <Text className="text-gray-400 font-bold mt-4">No active bookings</Text>
                                <TouchableOpacity onPress={() => setActiveTab('available')} className="mt-4 bg-teal-50 px-6 py-2 rounded-xl">
                                    <Text className="text-teal-600 font-bold text-xs">Find a Spot</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            myBookings.map((booking, index) => (
                                <Animated.View key={booking.id} entering={FadeInDown.delay(index * 100).springify()}>
                                    <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
                                        <View className="flex-row justify-between items-center mb-2">
                                            <Text className="font-bold text-lg text-dark-900">{booking.slotName}</Text>
                                            <View className="bg-green-100 px-2 py-1 rounded-md">
                                                <Text className="text-green-700 text-[10px] font-bold uppercase">{booking.status}</Text>
                                            </View>
                                        </View>
                                        <View className="flex-row gap-4 mb-3">
                                            <View className="flex-row items-center">
                                                <Ionicons name="calendar" size={14} color="#B2BEC3" />
                                                <Text className="text-gray-500 text-xs ml-1">{booking.date}</Text>
                                            </View>
                                            <View className="flex-row items-center">
                                                <Ionicons name={booking.vehicle === 'car' ? 'car' : 'bicycle'} size={14} color="#B2BEC3" />
                                                <Text className="text-gray-500 text-xs ml-1 capitalize">{booking.vehicle}</Text>
                                            </View>
                                        </View>
                                        <Text className="text-teal-600 font-bold">Paid: ₹{booking.amount}</Text>
                                    </View>
                                </Animated.View>
                            ))
                        )}

                        {/* Mock History for Visuals */}
                        <Text className="text-gray-400 font-bold text-sm mb-4 mt-8 uppercase tracking-wide">Past History</Text>
                        <View className="bg-gray-50 rounded-2xl p-4 mb-20 opacity-60">
                            <Text className="font-bold text-gray-500 italic text-center">No older records found</Text>
                        </View>
                    </ScrollView>
                );
            case 'wallet':
                return (
                    <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                        <Text className="text-dark-900 font-bold text-xl mb-4">Wallet Transactions</Text>
                        <SpendingAnalysis data={spendingData} />
                        <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-6 mb-20">
                            <Text className="font-bold text-lg mb-4 text-dark-900">Recent Transactions</Text>
                            {[1, 2, 3].map((i) => (
                                <View key={i} className="flex-row justify-between items-center py-4 border-b border-gray-50 last:border-0">
                                    <View className="flex-row items-center">
                                        <View className="w-10 h-10 bg-teal-50 rounded-full justify-center items-center mr-3">
                                            <Ionicons name="arrow-up" size={20} color="#00B894" />
                                        </View>
                                        <View>
                                            <Text className="font-bold text-dark-900">Wallet Top-up</Text>
                                            <Text className="text-gray-400 text-xs">Oct {10 + i}, 2023</Text>
                                        </View>
                                    </View>
                                    <Text className="text-teal-600 font-bold">+₹500</Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                );
            case 'profile':
                if (activeProfileView === 'vehicles') {
                    return (
                        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                            <View className="flex-row items-center mb-6">
                                <TouchableOpacity onPress={() => setActiveProfileView(null)} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
                                    <Ionicons name="arrow-back" size={24} color="#2D3436" />
                                </TouchableOpacity>
                                <Text className="font-bold text-xl text-dark-900 ml-4">My Vehicles</Text>
                            </View>
                            {myVehicles.map((v) => (
                                <View key={v.id} className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100 flex-row justify-between items-center">
                                    <View className="flex-row items-center gap-4">
                                        <View className="w-12 h-12 bg-teal-50 rounded-xl justify-center items-center">
                                            <Ionicons name={v.type === 'car' ? 'car' : 'bicycle'} size={24} color="#00B894" />
                                        </View>
                                        <View>
                                            <Text className="font-bold text-dark-900 text-lg">{v.name}</Text>
                                            <Text className="text-gray-400 font-bold uppercase text-xs">{v.number}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => Alert.alert("Delete", `Remove ${v.name}?`)}>
                                        <Ionicons name="trash-outline" size={20} color="#FF7675" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <TouchableOpacity
                                onPress={() => {
                                    Alert.alert("Success", "Mock Vehicle Added");
                                    setMyVehicles([...myVehicles, { id: Math.random().toString(), name: 'New Car', number: 'NEW 001', type: 'car' }]);
                                }}
                                className="bg-teal-600 py-4 rounded-2xl items-center mt-4 shadow-lg shadow-teal-200"
                            >
                                <Text className="text-white font-bold">Add New Vehicle</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    );
                }
                if (activeProfileView === 'payment') {
                    return (
                        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                            <View className="flex-row items-center mb-6">
                                <TouchableOpacity onPress={() => setActiveProfileView(null)} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
                                    <Ionicons name="arrow-back" size={24} color="#2D3436" />
                                </TouchableOpacity>
                                <Text className="font-bold text-xl text-dark-900 ml-4">Payment Methods</Text>
                            </View>
                            {paymentMethods.map((p) => (
                                <View key={p.id} className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100 flex-row justify-between items-center">
                                    <View className="flex-row items-center gap-4">
                                        <View className="w-12 h-12 bg-indigo-50 rounded-xl justify-center items-center">
                                            <Ionicons name="card" size={24} color="#6C5CE7" />
                                        </View>
                                        <View>
                                            <Text className="font-bold text-dark-900 text-lg">{p.type}</Text>
                                            <Text className="text-gray-400 font-bold uppercase text-xs">
                                                {p.last4 ? `**** ${p.last4}` : p.id_val}
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons name="radio-button-on" size={20} color="#00B894" />
                                </View>
                            ))}
                            <TouchableOpacity
                                onPress={() => setPaymentMethods([...paymentMethods, { id: Math.random().toString(), type: 'Visa', last4: '1234', expiry: '12/28' }])}
                                className="bg-gray-900 py-4 rounded-2xl items-center mt-4"
                            >
                                <Text className="text-white font-bold">Add Payment Method</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    );
                }
                if (activeProfileView === 'notifications') {
                    return (
                        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                            <View className="flex-row items-center mb-6">
                                <TouchableOpacity onPress={() => setActiveProfileView(null)} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
                                    <Ionicons name="arrow-back" size={24} color="#2D3436" />
                                </TouchableOpacity>
                                <Text className="font-bold text-xl text-dark-900 ml-4">Notifications</Text>
                            </View>
                            <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                <View className="flex-row justify-between items-center mb-6">
                                    <View>
                                        <Text className="font-bold text-dark-900 text-lg">Push Notifications</Text>
                                        <Text className="text-gray-400 text-xs">Receive alerts on device</Text>
                                    </View>
                                    <Switch
                                        value={notifications.push}
                                        onValueChange={(v) => setNotifications({ ...notifications, push: v })}
                                        trackColor={{ false: "#dfe6e9", true: "#00B894" }}
                                    />
                                </View>
                                <View className="flex-row justify-between items-center mb-6">
                                    <View>
                                        <Text className="font-bold text-dark-900 text-lg">Email Updates</Text>
                                        <Text className="text-gray-400 text-xs">Booking confirmations</Text>
                                    </View>
                                    <Switch
                                        value={notifications.email}
                                        onValueChange={(v) => setNotifications({ ...notifications, email: v })}
                                        trackColor={{ false: "#dfe6e9", true: "#00B894" }}
                                    />
                                </View>
                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Text className="font-bold text-dark-900 text-lg">Promotions</Text>
                                        <Text className="text-gray-400 text-xs">Deals and offers</Text>
                                    </View>
                                    <Switch
                                        value={notifications.promo}
                                        onValueChange={(v) => setNotifications({ ...notifications, promo: v })}
                                        trackColor={{ false: "#dfe6e9", true: "#00B894" }}
                                    />
                                </View>
                            </View>
                        </ScrollView>
                    );
                }
                if (activeProfileView === 'privacy') {
                    return (
                        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                            <View className="flex-row items-center mb-6">
                                <TouchableOpacity onPress={() => setActiveProfileView(null)} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
                                    <Ionicons name="arrow-back" size={24} color="#2D3436" />
                                </TouchableOpacity>
                                <Text className="font-bold text-xl text-dark-900 ml-4">Privacy & Security</Text>
                            </View>
                            <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                <View className="flex-row justify-between items-center mb-6">
                                    <View>
                                        <Text className="font-bold text-dark-900 text-lg">Face ID / Biometric</Text>
                                        <Text className="text-gray-400 text-xs">Use FaceID to login</Text>
                                    </View>
                                    <Switch
                                        value={privacyParams.faceId}
                                        onValueChange={(v) => setPrivacyParams({ ...privacyParams, faceId: v })}
                                        trackColor={{ false: "#dfe6e9", true: "#00B894" }}
                                    />
                                </View>
                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Text className="font-bold text-dark-900 text-lg">Location History</Text>
                                        <Text className="text-gray-400 text-xs">Save parking history</Text>
                                    </View>
                                    <Switch
                                        value={privacyParams.locationHistory}
                                        onValueChange={(v) => setPrivacyParams({ ...privacyParams, locationHistory: v })}
                                        trackColor={{ false: "#dfe6e9", true: "#00B894" }}
                                    />
                                </View>
                            </View>
                            <TouchableOpacity className="mt-6 bg-red-50 p-4 rounded-xl items-center">
                                <Text className="text-red-500 font-bold">Delete Account</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    );
                }
                if (activeProfileView === 'support') {
                    return (
                        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                            <View className="flex-row items-center mb-6">
                                <TouchableOpacity onPress={() => setActiveProfileView(null)} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
                                    <Ionicons name="arrow-back" size={24} color="#2D3436" />
                                </TouchableOpacity>
                                <Text className="font-bold text-xl text-dark-900 ml-4">Help & Support</Text>
                            </View>
                            <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 items-center text-center">
                                <Ionicons name="headset" size={48} color="#00B894" />
                                <Text className="font-bold text-xl text-dark-900 mt-4">How can we help?</Text>
                                <Text className="text-gray-500 text-center mt-2 mb-6">Our support team is available 24/7 to assist you with any issues.</Text>

                                <TouchableOpacity onPress={() => Alert.alert("Call", "Calling Support...")} className="bg-teal-600 w-full py-3 rounded-xl items-center mb-3">
                                    <Text className="text-white font-bold">Call Support</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => Alert.alert("Chat", "Opening Chat Support...")} className="bg-teal-50 w-full py-3 rounded-xl items-center">
                                    <Text className="text-teal-700 font-bold">Chat with Us</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    );
                }
                if (activeProfileView === 'edit') {
                    return (
                        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                            <View className="flex-row items-center mb-6">
                                <TouchableOpacity onPress={() => setActiveProfileView(null)} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
                                    <Ionicons name="arrow-back" size={24} color="#2D3436" />
                                </TouchableOpacity>
                                <Text className="font-bold text-xl text-dark-900 ml-4">Edit Profile</Text>
                            </View>
                            <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                <View className="mb-4">
                                    <Text className="text-gray-400 font-bold text-xs uppercase mb-2">Full Name</Text>
                                    <TextInput
                                        value={editName}
                                        onChangeText={setEditName}
                                        className="bg-gray-50 p-4 rounded-xl font-bold text-dark-900"
                                    />
                                </View>
                                <View className="mb-6">
                                    <Text className="text-gray-400 font-bold text-xs uppercase mb-2">Phone Number</Text>
                                    <TextInput
                                        value={editPhone}
                                        onChangeText={setEditPhone}
                                        keyboardType="phone-pad"
                                        className="bg-gray-50 p-4 rounded-xl font-bold text-dark-900"
                                    />
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        setCurrentUser(prev => ({ ...prev, name: editName, phone: editPhone }));
                                        setActiveProfileView(null);
                                        Alert.alert("Success", "Profile Updated");
                                    }}
                                    className="bg-teal-600 py-4 rounded-2xl items-center shadow-lg shadow-teal-200"
                                >
                                    <Text className="text-white font-bold">Save Changes</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    );
                }

                return (
                    <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                        <View className="items-center mb-8">
                            <View className="relative">
                                <View className="w-24 h-24 bg-teal-100 rounded-full justify-center items-center mb-4 border-4 border-white shadow-lg">
                                    <Ionicons name="person" size={48} color="#00B894" />
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditName(currentUser.name);
                                        setEditPhone(currentUser.phone);
                                        setActiveProfileView('edit');
                                    }}
                                    className="absolute bottom-4 right-0 bg-dark-900 p-2 rounded-full border-2 border-white"
                                >
                                    <Ionicons name="pencil" size={14} color="white" />
                                </TouchableOpacity>
                            </View>
                            <Text className="text-3xl font-bold text-dark-900">{currentUser.name}</Text>
                            <Text className="text-gray-500 font-medium">{currentUser.email}</Text>
                            <View className="bg-orange-100 px-3 py-1 rounded-full mt-2">
                                <Text className="text-orange-600 font-bold text-xs uppercase">{currentUser.roleTitle}</Text>
                            </View>
                        </View>

                        <View className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 mb-20">
                            {[
                                { icon: 'car-outline', label: 'My Vehicles', action: () => setActiveProfileView('vehicles') },
                                { icon: 'card-outline', label: 'Payment Methods', action: () => setActiveProfileView('payment') },
                                { icon: 'notifications-outline', label: 'Notifications', action: () => setActiveProfileView('notifications') },
                                { icon: 'shield-checkmark-outline', label: 'Privacy & Security', action: () => setActiveProfileView('privacy') },
                                { icon: 'help-circle-outline', label: 'Help & Support', action: () => setActiveProfileView('support') },
                            ].map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={item.action}
                                    className="flex-row items-center p-4 border-b border-gray-50 last:border-0"
                                >
                                    <View className="w-10 h-10 bg-gray-50 rounded-xl justify-center items-center mr-4">
                                        <Ionicons name={item.icon as any} size={22} color="#636E72" />
                                    </View>
                                    <Text className="flex-1 font-bold text-dark-900 text-base">{item.label}</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#B2BEC3" />
                                </TouchableOpacity>
                            ))}

                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="mt-6 mx-4 mb-2 bg-red-50 p-4 rounded-xl items-center flex-row justify-center"
                            >
                                <Ionicons name="log-out-outline" size={20} color="#FF7675" />
                                <Text className="text-red-500 font-bold ml-2">Log Out</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                );
            default:
                return (
                    <ScrollView
                        className="flex-1 px-6 pt-6"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 150 }}
                    >
                        {/* Vehicle Category Tabs */}
                        <View className="flex-row gap-3 mb-6">
                            {[
                                { id: 'car', label: 'Car', icon: 'car' },
                                { id: 'bike', label: 'Bike', icon: 'bicycle' },
                                { id: 'truck', label: 'Truck', icon: 'bus' }
                            ].map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => setSelectedCategory(cat.id as any)}
                                    className={`flex-1 flex-row items-center justify-center py-4 rounded-xl shadow-sm border ${selectedCategory === cat.id ? 'bg-[#FFC107] border-[#FFC107]' : 'bg-white border-gray-100'}`}
                                >
                                    <Ionicons name={cat.icon as any} size={20} color={selectedCategory === cat.id ? '#2D3436' : '#B2BEC3'} />
                                    <Text className={`font-bold ml-2 ${selectedCategory === cat.id ? 'text-dark-900' : 'text-gray-400'}`}>{cat.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Graphs Section */}
                        {searchQuery === '' && viewMode === 'list' && (
                            <View className="mb-6">
                                <BookingHistoryChart data={bookingHistoryData} />
                            </View>
                        )}

                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-dark-900 font-bold text-lg">
                                {searchQuery ? 'Search Results' : 'Nearby Spots'}
                            </Text>

                            <View className="flex-row bg-gray-100 rounded-xl p-1">
                                <TouchableOpacity
                                    onPress={() => setViewMode('list')}
                                    className={`px-3 py-1.5 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                                >
                                    <Ionicons name="list" size={16} color={viewMode === 'list' ? '#00B894' : '#B2BEC3'} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setViewMode('map')}
                                    className={`px-3 py-1.5 rounded-lg ${viewMode === 'map' ? 'bg-white shadow-sm' : ''}`}
                                >
                                    <Ionicons name="map" size={16} color={viewMode === 'map' ? '#00B894' : '#B2BEC3'} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {viewMode === 'map' ? (
                            <ParkingMap
                                slots={filteredSlots}
                                onMarkerPress={(slot) => initiateBooking(slot)}
                            />
                        ) : (
                            filteredSlots.length > 0 ? (
                                filteredSlots.map((item, index) => (
                                    <View key={item.id}>
                                        {renderSlotItem({ item, index })}
                                    </View>
                                ))
                            ) : (
                                <View className="items-center py-10">
                                    <Text className="text-gray-400 font-bold">No parking spots found matching "{searchQuery}"</Text>
                                </View>
                            )
                        )}
                    </ScrollView>
                );
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar barStyle="light-content" />
            {renderHeader()}

            {renderContent()}

            {/* Chatbot FAB */}
            <TouchableOpacity
                onPress={() => setShowChatbot(true)}
                className="absolute bottom-28 right-6 w-14 h-14 bg-teal-600 rounded-full justify-center items-center shadow-lg shadow-teal-500/50 z-20"
            >
                <Ionicons name="chatbubble-ellipses" size={28} color="white" />
            </TouchableOpacity>

            <ChatbotModal visible={showChatbot} onClose={() => setShowChatbot(false)} />

            {/* Bottom Floating Menu */}
            <View className="absolute bottom-8 left-6 right-6 bg-white rounded-2xl shadow-2xl shadow-teal-900/20 p-2 flex-row justify-around items-center border border-gray-50">
                <TouchableOpacity
                    onPress={() => setActiveTab('available')}
                    className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'available' ? 'bg-teal-50' : ''}`}
                >
                    <Ionicons name={activeTab === 'available' ? 'map' : 'map-outline'} size={24} color={activeTab === 'available' ? '#00B894' : '#B2BEC3'} />
                    {activeTab === 'available' && <Text className="text-[10px] font-bold text-teal-600 mt-1 uppercase">Explore</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('bookings')}
                    className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'bookings' ? 'bg-teal-50' : ''}`}
                >
                    <Ionicons name={activeTab === 'bookings' ? 'ticket' : 'ticket-outline'} size={24} color={activeTab === 'bookings' ? '#00B894' : '#B2BEC3'} />
                    {activeTab === 'bookings' && <Text className="text-[10px] font-bold text-teal-600 mt-1 uppercase">Bookings</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('wallet')}
                    className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'wallet' ? 'bg-teal-50' : ''}`}
                >
                    <Ionicons name={activeTab === 'wallet' ? 'wallet' : 'wallet-outline'} size={24} color={activeTab === 'wallet' ? '#00B894' : '#B2BEC3'} />
                    {activeTab === 'wallet' && <Text className="text-[10px] font-bold text-teal-600 mt-1 uppercase">Wallet</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('profile')}
                    className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'profile' ? 'bg-teal-50' : ''}`}
                >
                    <Ionicons name={activeTab === 'profile' ? 'person' : 'person-outline'} size={24} color={activeTab === 'profile' ? '#00B894' : '#B2BEC3'} />
                    {activeTab === 'profile' && <Text className="text-[10px] font-bold text-teal-600 mt-1 uppercase">Profile</Text>}
                </TouchableOpacity>
            </View>

            <UnifiedSidebar
                visible={showMenu}
                onClose={() => setShowMenu(false)}
                role="driver"
                userData={currentUser}
                onUpdate={(name, phone) => setCurrentUser(prev => ({ ...prev, name, phone }))}
                activeTab={activeTab as any}
                onTabChange={setActiveTab as any}
                onLogout={() => router.back()}
            />

            {selectedSlot && (
                <BookingModal
                    visible={showBookingModal}
                    onClose={() => setShowBookingModal(false)}
                    onConfirm={confirmBooking}
                    slotName={selectedSlot.name}
                    pricePerHour={selectedSlot.price}
                />
            )}

            {/* Top Up Modal */}
            <Modal
                visible={showTopUpModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowTopUpModal(false)}
            >
                <View className="flex-1 bg-black/60 justify-center items-center px-6">
                    <View className="bg-white w-full rounded-3xl p-6 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-dark-900">Top Up Wallet</Text>
                            <TouchableOpacity onPress={() => setShowTopUpModal(false)} className="bg-gray-100 p-2 rounded-full">
                                <Ionicons name="close" size={20} color="#2D3436" />
                            </TouchableOpacity>
                        </View>

                        <View className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
                            <Text className="text-gray-500 text-xs font-bold uppercase mb-2">Enter Amount</Text>
                            <View className="flex-row items-center">
                                <Text className="text-2xl font-bold text-dark-900 mr-2">₹</Text>
                                <TextInput
                                    value={topUpAmount}
                                    onChangeText={setTopUpAmount}
                                    keyboardType="numeric"
                                    className="flex-1 text-2xl font-bold text-dark-900"
                                    autoFocus
                                />
                            </View>
                        </View>

                        <View className="flex-row gap-3 mb-6">
                            {['100', '500', '1000'].map(amt => (
                                <TouchableOpacity
                                    key={amt}
                                    onPress={() => setTopUpAmount(amt)}
                                    className={`flex-1 py-2 rounded-xl items-center border ${topUpAmount === amt ? 'bg-teal-50 border-teal-500' : 'bg-white border-gray-200'}`}
                                >
                                    <Text className={`font-bold ${topUpAmount === amt ? 'text-teal-600' : 'text-gray-500'}`}>₹{amt}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={handleTopUp}
                            className="bg-teal-600 w-full py-4 rounded-2xl items-center shadow-lg shadow-teal-200"
                        >
                            <Text className="text-white font-bold text-lg">Add Money</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
