import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../../components/CustomHeader';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../../constants/api';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

const API = BASE_URL;

export default function DriverPaymentsScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [balance, setBalance] = useState(0);
    const [amount, setAmount] = useState('');
    const [showAddFunds, setShowAddFunds] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [upiId, setUpiId] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [userName, setUserName] = useState('Driver');

    const loadWalletData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const storedName = await AsyncStorage.getItem('userName');
            if (storedName) setUserName(storedName);

            const [walletRes, txRes] = await Promise.all([
                axios.get(`${API}/api/driver/wallet`, { headers: { Authorization: `Bearer ${token}` } }).catch(e => ({ data: { balance: 0 } })),
                axios.get(`${API}/api/driver/wallet/transactions`, { headers: { Authorization: `Bearer ${token}` } }).catch(e => ({ data: [] }))
            ]);

            setBalance(walletRes.data.balance || 0);
            setTransactions(Array.isArray(txRes.data) ? txRes.data : []);

        } catch (err) {
            console.error('Wallet load failed:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadWalletData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadWalletData();
    };

    const handleTransaction = async (type: 'CREDIT' | 'DEBIT') => {
        const numAmount = Number(amount);
        if (!amount || isNaN(numAmount) || numAmount <= 0) {
            return Alert.alert('Invalid Amount', 'Please enter a valid amount.');
        }
        if (type === 'DEBIT' && numAmount > balance) {
            return Alert.alert('Insufficient Balance', 'You do not have enough funds.');
        }
        if (!upiId.trim()) {
            return Alert.alert('Input Required', 'Please enter a UPI ID or Mobile Number.');
        }

        setIsProcessing(true);

        try {
            const token = await AsyncStorage.getItem('token');

            if (type === 'CREDIT') {
                // DIRECT SIMULATION AS REQUESTED
                // 1. Simulate Bank Processing Delay
                setTimeout(async () => {
                    try {
                        // 2. API Call
                        const res = await axios.post(`${API}/api/driver/wallet/add`, {
                            amount: numAmount,
                            method: 'UPI',
                            upiId: upiId.trim()
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        if (res.status === 200 || res.status === 201) {
                            // 3. Success Feedback
                            Alert.alert("Payment Successful!", `₹${numAmount} added to your wallet.`);
                            resetState();
                        } else {
                            throw new Error("API failed");
                        }
                    } catch (e) {
                        console.error("Direct Add Failed", e);
                        Alert.alert("Transaction Failed", "Could not complete the deposit. Please check your credentials.");
                        setIsProcessing(false);
                    }
                }, 1500); // 1.5 second delay

            } else {
                // Withdrawal Flow
                const res = await axios.post(`${API}/api/driver/wallet/withdraw`, {
                    amount: numAmount,
                    upiId: upiId.trim()
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.status === 200 || res.status === 201) {
                    Alert.alert("Request Received", "Withdrawal request is being processed.");
                    resetState();
                }
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Transaction Failed", "System synchronization failed. Please try again.");
            setIsProcessing(false);
        }
    };

    const resetState = () => {
        setAmount('');
        setUpiId('');
        setShowAddFunds(false);
        setShowWithdraw(false);
        setIsProcessing(false);
        loadWalletData(); // Immediately updates balance and transactions
    };

    if (loading) {
        return (
            <View className={`flex-1 justify-center items-center ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-4 text-blue-600 font-bold uppercase tracking-widest text-[8px]">Syncing Wallet Data...</Text>
            </View>
        );
    }

    return (
        <View className={`flex-1 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            <StatusBar style={isDark ? "light" : "dark"} />
            <CustomHeader
                title="Smart Wallet"
                subtitle="Financial Center"
                role="driver"
                onMenuPress={() => router.back()}
                userName={userName}
                showBackButton={true}
            />

            <ScrollView
                className="px-5"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* WALLET CARD */}
                <View className="bg-blue-600 rounded-[32px] p-8 mt-6 shadow-xl shadow-blue-500/30">
                    <Text className="text-blue-100 font-bold uppercase tracking-widest text-[8px] mb-2">Total Balance</Text>
                    <Text className="text-white text-4xl font-black">₹{Number(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                    <View className="flex-row mt-6 gap-3">
                        <TouchableOpacity onPress={() => setShowAddFunds(true)} className="bg-white/20 px-6 py-3 rounded-xl flex-1 items-center">
                            <Text className="text-white font-black text-[10px] uppercase tracking-widest">+ Add Funds</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowWithdraw(true)} className="bg-white px-6 py-3 rounded-xl flex-1 items-center">
                            <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Withdraw</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* MODALS */}
                {[
                    { visible: showAddFunds, close: () => setShowAddFunds(false), title: "Direct Cloud Deposit", action: () => handleTransaction('CREDIT'), btnText: "Add Money Instantly", inputLabel: "Enter UPI ID / Mobile Number" },
                    { visible: showWithdraw, close: () => setShowWithdraw(false), title: "Withdraw Funds", action: () => handleTransaction('DEBIT'), btnText: "Withdraw Now", inputLabel: "Receiver VPA / UPI ID" }
                ].map((modal, i) => (
                    <Modal key={i} visible={modal.visible} transparent animationType="slide">
                        <View className="flex-1 bg-black/50 justify-end">
                            <View className={`${isDark ? 'bg-slate-900' : 'bg-white'} rounded-t-[32px] p-8`}>
                                <View className="flex-row justify-between items-center mb-6">
                                    <View>
                                        <Text className={`font-black text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{modal.title}</Text>
                                        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Cross-platform Gateway</Text>
                                    </View>
                                    <TouchableOpacity onPress={modal.close}>
                                        <Ionicons name="close-circle" size={30} color="#CBD5E1" />
                                    </TouchableOpacity>
                                </View>

                                <View className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#F5F5F5] border-gray-100'} px-4 rounded-2xl mb-4 border h-[50px] justify-center`}>
                                    <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Enter Amount (₹)</Text>
                                    <View className="flex-row items-center">
                                        <TextInput
                                            className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'} flex-1 h-8`}
                                            placeholder="0.00"
                                            placeholderTextColor={isDark ? "#475569" : "#AED0E1"}
                                            keyboardType="numeric"
                                            value={amount}
                                            onChangeText={setAmount}
                                        />
                                    </View>
                                </View>

                                <View className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#F5F5F5] border-gray-100'} px-4 rounded-2xl mb-6 border h-[50px] justify-center`}>
                                    <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{modal.inputLabel}</Text>
                                    <TextInput
                                        className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'} h-8`}
                                        placeholder="e.g. 9876543210 or user@bank"
                                        placeholderTextColor={isDark ? "#475569" : "#CBD5E1"}
                                        value={upiId}
                                        onChangeText={setUpiId}
                                        autoCapitalize="none"
                                    />
                                </View>

                                <TouchableOpacity onPress={modal.action} disabled={isProcessing} className="bg-blue-600 h-14 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/20">
                                    {isProcessing ? <ActivityIndicator color="white" /> : <Text className="text-white font-black uppercase tracking-widest text-xs">{modal.btnText}</Text>}
                                </TouchableOpacity>
                                <Text className="text-gray-400 text-[8px] text-center mt-4 font-bold uppercase tracking-widest">Secured by 256-bit encryption</Text>
                            </View>
                        </View>
                    </Modal>
                ))}

                {/* HISTORY */}
                <Text className={`font-black text-xl mt-8 mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Transactions</Text>
                {transactions.length === 0 ? (
                    <View className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} items-center py-10 rounded-3xl border border-dashed`}>
                        <Ionicons name="receipt-outline" size={40} color="#CBD5E1" />
                        <Text className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mt-2">Zero flux detected</Text>
                    </View>
                ) : (
                    transactions.map((txn, i) => (
                        <View key={i} className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} p-5 mb-3 rounded-3xl border flex-row items-center justify-between shadow-sm`}>
                            <View className="flex-row items-center">
                                <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${txn.type === 'CREDIT' ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100') : (isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100')} border`}>
                                    <Ionicons name={txn.type === 'CREDIT' ? 'arrow-down' : 'arrow-up'} size={24} color={txn.type === 'CREDIT' ? '#10B981' : '#EF4444'} />
                                </View>
                                <View>
                                    <Text className={`font-black ${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>{txn.description || (txn.type === 'CREDIT' ? 'Wallet Top-up' : 'Service Payment')}</Text>
                                    <Text className="text-gray-400 text-[9px] font-bold uppercase tracking-wide">
                                        {txn.date ? new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'STABLE'} • {txn.status || 'SUCCESS'}
                                    </Text>
                                </View>
                            </View>
                            <Text className={`font-black text-lg ${txn.type === 'CREDIT' ? 'text-emerald-500' : (isDark ? 'text-white' : 'text-gray-900')}`}>
                                {txn.type === 'CREDIT' ? '+' : '-'}₹{txn.amount || 0}
                            </Text>
                        </View>
                    ))
                )}
                <View className="h-20" />
            </ScrollView>
        </View>
    );
}
