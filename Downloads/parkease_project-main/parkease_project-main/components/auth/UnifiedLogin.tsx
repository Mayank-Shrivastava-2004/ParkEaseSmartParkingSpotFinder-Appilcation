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
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

type Role = 'driver' | 'provider' | 'admin';

interface UnifiedLoginProps {
    role: Role;
}

export default function UnifiedLogin({ role }: UnifiedLoginProps) {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Config based on role (Distinct Professional Colors)
    const config = {
        driver: {
            title: 'Welcome Back',
            subtitle: 'Log in to find parking spots',
            icon: 'car-sport' as const,
            themeColor: '#00B894', // Teal
            lightColor: '#E8F6F3',
            dashRoute: '/(driver)/dashboard',
            forgotRoute: '/(driver)/forgot-password',
            registerRoute: '/(driver)/register',
        },
        provider: {
            title: 'Partner Login',
            subtitle: 'Manage your parking assets',
            icon: 'business' as const,
            themeColor: '#6C5CE7', // Indigo
            lightColor: '#F3F0FF',
            dashRoute: '/(provider)/dashboard',
            forgotRoute: '/(provider)/forgot-password',
            registerRoute: '/(provider)/register',
        },
        admin: {
            title: 'Admin Console',
            subtitle: 'Secure system gateway',
            icon: 'shield-checkmark' as const,
            themeColor: '#2D3436', // Dark Slate
            lightColor: '#F5F6FA',
            dashRoute: '/(admin)/dashboard',
            forgotRoute: '/(admin)/forgot-password',
            registerRoute: '/(admin)/register',
        },
    };

    const currentConfig = config[role];

    const handleLogin = () => {
        if (!email || !password) {
            Alert.alert('Incomplete', 'Please fill in both email and password.');
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            router.push(currentConfig.dashRoute as any);
        }, 1500);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                {/* Header Decoration */}
                <View className="h-64 justify-end pb-8 items-center relative overflow-hidden">
                    <View
                        className="absolute -top-32 -left-10 w-64 h-64 rounded-full opacity-10"
                        style={{ backgroundColor: currentConfig.themeColor }}
                    />
                    <View
                        className="absolute top-10 -right-20 w-80 h-80 rounded-full opacity-5"
                        style={{ backgroundColor: currentConfig.themeColor }}
                    />

                    <Animated.View entering={FadeInUp.duration(1000).springify()} className="items-center z-10">
                        <View
                            className="w-24 h-24 rounded-3xl justify-center items-center mb-6 shadow-xl shadow-gray-200"
                            style={{ backgroundColor: 'white' }}
                        >
                            <Ionicons name={currentConfig.icon} size={48} color={currentConfig.themeColor} />
                        </View>
                        <Text className="text-3xl font-black text-gray-900">{currentConfig.title}</Text>
                        <Text className="text-gray-500 mt-2 text-base font-medium">{currentConfig.subtitle}</Text>
                    </Animated.View>
                </View>

                {/* Form Container */}
                <View className="px-8 flex-1">
                    <Animated.View entering={FadeInDown.delay(200).duration(1000).springify()} className="w-full gap-5">
                        <View className="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100 focus:border-gray-400">
                            <Text className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Email Address</Text>
                            <View className="flex-row items-center">
                                <Ionicons name="mail" size={20} color="#9CA3AF" className="mr-3" />
                                <TextInput
                                    className="flex-1 text-base text-gray-900 font-bold p-0"
                                    placeholder="name@example.com"
                                    placeholderTextColor="#9CA3AF"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View className="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100 focus:border-gray-400">
                            <Text className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Password</Text>
                            <View className="flex-row items-center">
                                <Ionicons name="lock-closed" size={20} color="#9CA3AF" className="mr-3" />
                                <TextInput
                                    className="flex-1 text-base text-gray-900 font-bold p-0"
                                    placeholder="••••••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? 'eye' : 'eye-off'}
                                        size={20}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            className="items-end"
                            onPress={() => router.push(currentConfig.forgotRoute as any)}
                        >
                            <Text
                                style={{ color: currentConfig.themeColor }}
                                className="text-xs font-bold uppercase tracking-wide"
                            >
                                Forgot Password?
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ backgroundColor: currentConfig.themeColor }}
                            className="rounded-2xl py-4 items-center mt-4 shadow-lg shadow-gray-300"
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-lg font-bold tracking-wide">LOG IN</Text>
                            )}
                        </TouchableOpacity>

                        <View className="flex-row justify-center mt-6">
                            <Text className="text-gray-500 font-medium">Don't have an account? </Text>
                            <TouchableOpacity onPress={() => router.push(currentConfig.registerRoute as any)}>
                                <Text
                                    style={{ color: currentConfig.themeColor }}
                                    className="font-bold"
                                >
                                    Sign Up
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>

                {/* Footer */}
                <Animated.View entering={FadeInUp.delay(400).duration(1000)} className="pb-8 items-center">
                    <TouchableOpacity
                        onPress={() => router.navigate('/')}
                        className="flex-row items-center px-5 py-3 bg-gray-50 rounded-full"
                    >
                        <Ionicons name="apps" size={16} color="#636E72" />
                        <Text className="text-gray-500 text-xs ml-2 font-bold uppercase tracking-wide">Switch Workspace</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
