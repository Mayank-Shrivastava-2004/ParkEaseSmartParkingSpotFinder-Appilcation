package com.parkease.backend.controller;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.parkease.backend.entity.*;
import com.parkease.backend.repository.*;

@RestController
@RequestMapping("/api/driver/wallet")
public class DriverWalletController {

    private final UserRepository userRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    public DriverWalletController(UserRepository userRepository,
            WalletTransactionRepository walletTransactionRepository) {
        this.userRepository = userRepository;
        this.walletTransactionRepository = walletTransactionRepository;
    }

    @GetMapping
    public ResponseEntity<?> getWallet(Authentication auth) {
        String email = auth.getName();
        User driver = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("balance", driver.getWalletBalance() != null ? driver.getWalletBalance() : 0.0);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addMoney(@RequestBody Map<String, Object> payload, Authentication auth) {
        String email = auth.getName();
        User driver = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!payload.containsKey("amount")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Amount is required"));
        }

        double amount = Double.parseDouble(payload.get("amount").toString());
        String method = payload.getOrDefault("method", "UPI").toString();
        String upiId = payload.getOrDefault("upiId", "N/A").toString();

        double currentBalance = driver.getWalletBalance() != null ? driver.getWalletBalance() : 0.0;
        driver.setWalletBalance(currentBalance + amount);
        userRepository.save(driver);

        // Record Transaction
        String description = "Deposit via " + method + (upiId.equals("N/A") ? "" : " (" + upiId + ")");
        WalletTransaction txn = new WalletTransaction(driver, amount, "CREDIT", description);
        walletTransactionRepository.save(txn);

        return ResponseEntity.ok(Map.of(
                "message", "Payment Successful! ₹" + amount + " added.",
                "newBalance", driver.getWalletBalance()));
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(Authentication auth) {
        String email = auth.getName();
        User driver = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<WalletTransaction> txns = walletTransactionRepository.findByUserOrderByCreatedAtDesc(driver);

        List<Map<String, Object>> response = txns.stream().map(t -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", t.getId());
            map.put("type", t.getType());
            map.put("description", t.getDescription());
            map.put("amount", t.getAmount());
            map.put("status", "SUCCESS");
            map.put("date", t.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdrawMoney(@RequestBody Map<String, Object> payload, Authentication auth) {
        String email = auth.getName();
        User driver = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!payload.containsKey("amount")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Amount is required"));
        }

        double amount = Double.parseDouble(payload.get("amount").toString());
        String upiId = payload.getOrDefault("upiId", "").toString();

        double currentBalance = driver.getWalletBalance() != null ? driver.getWalletBalance() : 0.0;
        if (amount > currentBalance) {
            return ResponseEntity.badRequest().body(Map.of("message", "Insufficient balance"));
        }

        driver.setWalletBalance(currentBalance - amount);
        userRepository.save(driver);

        // Record Transaction
        WalletTransaction txn = new WalletTransaction(driver, amount, "DEBIT", "Withdrawal to " + upiId);
        walletTransactionRepository.save(txn);

        return ResponseEntity.ok(Map.of(
                "message", "Withdrawal successful",
                "newBalance", driver.getWalletBalance()));
    }
}
