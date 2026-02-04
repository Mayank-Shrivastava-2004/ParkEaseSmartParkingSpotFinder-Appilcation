import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

type Role = 'driver' | 'provider' | 'admin';

interface UnifiedRegisterProps {
    role: Role;
}

export default function UnifiedRegister({ role }: UnifiedRegisterProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        parkingAreaName: '',
        location: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Config based on role (Subtitles removed)
    const config = {
        driver: {
            title: 'Join ParkEase',
            themeColor: '#00B894', // Teal
            dashRoute: '/(driver)/dashboard',
            loginRoute: '/(driver)',
        },
        provider: {
            title: 'Partner Network',
            themeColor: '#6C5CE7', // Indigo
            dashRoute: '/(provider)/dashboard',
            loginRoute: '/(provider)',
        },
        admin: {
            title: 'Admin Access',
            themeColor: '#2D3436', // Slate
            dashRoute: '/(admin)/dashboard',
            loginRoute: '/(admin)',
        },
    };

    const currentConfig = config[role];

    const handleRegister = () => {
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.phone) {
            Alert.alert('Incomplete', 'Please fill in required fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (role === 'provider' && !formData.location) {
            Alert.alert('Incomplete', 'Location is required for providers');
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            router.push(currentConfig.dashRoute as any);
        }, 1500);
    };

    const renderInput = (
        label: string,
        icon: any,
        value: string,
        key: string,
        isSecure = false,
        keyboardType = 'default',
        showPassState = false,
        setShowPassState?: (val: boolean) => void
    ) => (
        <View className="bg-gray-50 rounded-2xl px-5 py-3 border border-gray-100 mb-4 focus:border-gray-400">
            <Text className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">{label}</Text>
            <View className="flex-row items-center">
                <Ionicons name={icon} size={20} color="#9CA3AF" className="mr-3" />
                <TextInput
                    className="flex-1 text-base text-gray-900 font-bold p-0"
                    value={value}
                    onChangeText={(text) => setFormData({ ...formData, [key]: text })}
                    secureTextEntry={isSecure && !showPassState}
                    keyboardType={keyboardType as any}
                    autoCapitalize="none"
                />
                {isSecure && setShowPassState && (
                    <TouchableOpacity onPress={() => setShowPassState(!showPassState)}>
                        <Ionicons
                            name={showPassState ? 'eye' : 'eye-off'}
                            size={20}
                            color="#9CA3AF"
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <View className="px-6 pt-16 pb-8">
                    <Animated.View entering={FadeInUp.duration(1000)} className="mb-8">
                        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full justify-center items-center mb-6 border border-gray-100">
                            <Ionicons name="arrow-back" size={24} color="#2D3436" />
                        </TouchableOpacity>
                        <Text className="text-3xl font-black text-gray-900">{currentConfig.title}</Text>
                        {/* Subtitle removed as per request */}
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(200).duration(1000)} className="w-full">
                        {renderInput('Full Name', 'person-outline', formData.name, 'name')}

                        {role === 'provider' && (
                            <>
                                {renderInput('Parking Area Name', 'business-outline', formData.parkingAreaName, 'parkingAreaName')}
                                {renderInput('Location', 'location-outline', formData.location, 'location')}
                                {renderInput('Total Capacity (Slots)', 'grid-outline', '', 'capacity', false, 'numeric')}

                                <View className="mb-4">
                                    <Text className="text-[10px] text-gray-500 font-bold mb-2 uppercase tracking-widest ml-1">License Documents</Text>
                                    <TouchableOpacity className="bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-300 items-center flex-row justify-center gap-2">
                                        <Ionicons name="document-attach-outline" size={20} color="#6C5CE7" />
                                        <Text className="text-gray-500 font-bold text-sm">Upload Business License</Text>
                                    </TouchableOpacity>
                                </View>

                                <View className="mb-4">
                                    <Text className="text-[10px] text-gray-500 font-bold mb-2 uppercase tracking-widest ml-1">Parking Lot Photos</Text>
                                    <TouchableOpacity className="bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-300 items-center flex-row justify-center gap-2">
                                        <Ionicons name="camera-outline" size={20} color="#6C5CE7" />
                                        <Text className="text-gray-500 font-bold text-sm">Add Photos</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {renderInput('Email Address', 'mail-outline', formData.email, 'email', false, 'email-address')}
                        {renderInput('Phone Number', 'call-outline', formData.phone, 'phone', false, 'phone-pad')}

                        {renderInput('Password', 'lock-closed-outline', formData.password, 'password', true, 'default', showPassword, setShowPassword)}

                        {renderInput('Confirm Password', 'shield-checkmark-outline', formData.confirmPassword, 'confirmPassword', true, 'default', showConfirmPassword, setShowConfirmPassword)}

                        <TouchableOpacity
                            style={{ backgroundColor: currentConfig.themeColor }}
                            className="rounded-2xl py-4 items-center mt-6 shadow-lg shadow-gray-200"
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-lg font-bold tracking-wide uppercase">Create Account</Text>
                            )}
                        </TouchableOpacity>

                        <View className="flex-row justify-center mt-6 pb-8">
                            <Text className="text-gray-500 font-medium">Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.push(currentConfig.loginRoute as any)}>
                                <Text
                                    style={{ color: currentConfig.themeColor }}
                                    className="font-bold"
                                >
                                    Log In
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
