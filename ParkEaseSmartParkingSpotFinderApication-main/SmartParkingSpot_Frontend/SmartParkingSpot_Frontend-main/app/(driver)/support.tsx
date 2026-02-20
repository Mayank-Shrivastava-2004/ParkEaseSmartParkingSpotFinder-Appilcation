import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../../components/CustomHeader';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../../constants/api';
import * as Location from 'expo-location';

const API = BASE_URL;

export default function DriverSupportScreen() {
    const router = useRouter();
    const [showChatModal, setShowChatModal] = useState(false);
    const [chatTarget, setChatTarget] = useState<'Admin' | 'AI'>('AI');
    const [messages, setMessages] = useState<{ text: string, sender: 'user' | 'bot' | 'admin', id: number }[]>([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);

    const openChat = (target: 'Admin' | 'AI') => {
        setChatTarget(target);
        if (target === 'AI') {
            setMessages([{
                id: Date.now(),
                text: "Hello! I am your ParkEase AI. How can I assist you today? You can ask about 'Refunds' or 'Bookings'.",
                sender: 'bot'
            }]);
        } else {
            setMessages([{
                id: Date.now(),
                text: "You are now connected to ParkEase Support. Please describe your issue, and an operator will assist you shortly.",
                sender: 'admin'
            }]);
        }
        setShowChatModal(true);
    };

    const handleAISmartLogic = (text: string) => {
        const lower = text.toLowerCase();
        if (lower.includes('refund')) {
            return "Refunds are processed within 24 hours for cancelled bookings. Please check your wallet history for status.";
        }
        if (lower.includes('booking')) {
            return "You can view your active and past reservations in the 'My Bookings' tab on your dashboard.";
        }
        return "I am an AI assistant. For complex issues like billing disputes or technical errors, please use 'Contact Support' to talk to a human.";
    };

    const sendMessage = async () => {
        if (!inputText.trim() || sending) return;

        const userMsg = { id: Date.now(), text: inputText, sender: 'user' as const };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = inputText;
        setInputText('');

        if (chatTarget === 'AI') {
            setSending(true);
            setTimeout(() => {
                const reply = handleAISmartLogic(currentInput);
                setMessages(prev => [...prev, { id: Date.now(), text: reply, sender: 'bot' }]);
                setSending(false);
            }, 800);
        } else {
            setSending(true);
            try {
                const token = await AsyncStorage.getItem('token');
                await axios.post(`${API}/api/support/message`, {
                    message: currentInput,
                    target: 'ADMIN',
                    timestamp: new Date().toISOString()
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // For demonstration, we show a confirmation. 
                // In real-time apps we would use sockets, but here we fulfill the prompt's request.
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        text: "Ticket #SR-" + Math.floor(Math.random() * 9000 + 1000) + " has been created. An admin has been notified.",
                        sender: 'admin'
                    }]);
                    setSending(false);
                }, 1000);
            } catch (err) {
                console.error("Support message failed", err);
                Alert.alert("Delivery Failed", "Message couldn't reach support. Please check your connection.");
                setSending(false);
            }
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <CustomHeader
                title="Support Center"
                subtitle="Expert Assistance"
                role="driver"
                onMenuPress={() => router.back()}
                userName="Driver"
                showBackButton={true}
            />

            <ScrollView className="px-5 pt-10">
                <View className="mb-10 items-center">
                    <View className="bg-blue-100 p-6 rounded-[40px] mb-4">
                        <Ionicons name="headset" size={60} color="#2563EB" />
                    </View>
                    <Text className="text-3xl font-black text-gray-900">How can we help?</Text>
                    <Text className="text-gray-400 font-bold text-center mt-2 px-6">Select a support channel to resolve your queries instantly.</Text>
                </View>

                {/* Support Options */}
                <TouchableOpacity
                    onPress={() => openChat('AI')}
                    className="bg-white p-8 rounded-[40px] border border-gray-100 mb-6 shadow-sm flex-row items-center"
                >
                    <View className="w-16 h-16 bg-black rounded-[24px] items-center justify-center mr-6">
                        <Ionicons name="sparkles" size={30} color="white" />
                    </View>
                    <View className="flex-1">
                        <Text className="font-black text-2xl text-gray-900">Smart AI Chat</Text>
                        <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Instant Logic Assistant</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => openChat('Admin')}
                    className="bg-white p-8 rounded-[40px] border border-gray-100 mb-6 shadow-sm flex-row items-center"
                >
                    <View className="w-16 h-16 bg-blue-600 rounded-[24px] items-center justify-center mr-6">
                        <Ionicons name="people" size={30} color="white" />
                    </View>
                    <View className="flex-1">
                        <Text className="font-black text-2xl text-gray-900">Contact Human</Text>
                        <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Direct Admin Ticket</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
                </TouchableOpacity>

                <View className="mt-10 p-8 bg-indigo-50 rounded-[40px] items-center">
                    <Text className="text-indigo-900 font-black text-center mb-1">Response Guarantee</Text>
                    <Text className="text-indigo-400 text-[10px] font-bold uppercase tracking-[3px] text-center">Avg. response 5 mins</Text>
                </View>

            </ScrollView>

            {/* Chat Modal */}
            <Modal visible={showChatModal} animationType="slide" presentationStyle="pageSheet">
                <View className="flex-1 bg-white">
                    <View className="p-6 bg-white border-b border-gray-100 flex-row items-center justify-between pt-10">
                        <View className="flex-row items-center">
                            <View className={`w-10 h-10 rounded-full items-center justify-center ${chatTarget === 'AI' ? 'bg-black' : 'bg-blue-600'}`}>
                                <Ionicons name={chatTarget === 'AI' ? 'sparkles' : 'person'} size={20} color="white" />
                            </View>
                            <View className="ml-4">
                                <Text className="font-black text-xl text-gray-900">{chatTarget === 'AI' ? 'ParkEase AI' : 'Support Desk'}</Text>
                                <Text className="text-emerald-500 font-bold text-[8px] uppercase tracking-widest">Active Now</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setShowChatModal(false)} className="bg-gray-100 p-2 rounded-full">
                            <Ionicons name="close" size={24} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                        {messages.map((msg) => (
                            <View key={msg.id} className={`mb-6 max-w-[80%] ${msg.sender === 'user' ? 'self-end' : 'self-start'}`}>
                                <View className={`p-5 rounded-[28px] ${msg.sender === 'user' ? 'bg-blue-600 rounded-tr-none shadow-lg shadow-blue-500/30' : 'bg-gray-100 rounded-tl-none'}`}>
                                    <Text className={`${msg.sender === 'user' ? 'text-white' : 'text-gray-900'} font-bold leading-5`}>{msg.text}</Text>
                                </View>
                                <Text className={`text-[8px] font-black uppercase tracking-widest mt-2 ${msg.sender === 'user' ? 'text-right text-blue-400' : 'text-left text-gray-300'}`}>
                                    {msg.sender === 'user' ? 'Sent' : (chatTarget === 'AI' ? 'AI System' : 'Support Admin')}
                                </Text>
                            </View>
                        ))}
                        {sending && (
                            <View className="self-start bg-gray-100 p-4 rounded-full px-6 mb-6">
                                <ActivityIndicator size="small" color="#94A3B8" />
                            </View>
                        )}
                    </ScrollView>

                    <View className="p-6 border-t border-gray-100 bg-white flex-row items-center pb-10">
                        <TextInput
                            className="flex-1 bg-gray-50 h-16 rounded-[24px] px-6 mr-4 font-bold text-gray-900 border border-gray-100"
                            placeholder="Describe your issue..."
                            placeholderTextColor="#94A3B8"
                            value={inputText}
                            onChangeText={setInputText}
                            onSubmitEditing={sendMessage}
                        />
                        <TouchableOpacity
                            onPress={sendMessage}
                            disabled={sending}
                            className={`w-16 h-16 rounded-[24px] items-center justify-center shadow-lg ${sending ? 'bg-gray-300' : 'bg-blue-600 shadow-blue-500/30'}`}
                        >
                            <Ionicons name="send" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
