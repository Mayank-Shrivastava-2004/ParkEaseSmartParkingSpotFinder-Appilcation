package com.parkease.backend.controller;

import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.parkease.backend.repository.UserRepository;
import com.parkease.backend.entity.User;
import com.parkease.backend.repository.BookingRepository;
import com.parkease.backend.repository.ParkingLotRepository;
import com.parkease.backend.repository.PaymentRepository;

import com.parkease.backend.repository.WalletTransactionRepository; // Added missing import
import com.parkease.backend.entity.Booking;

import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import com.parkease.backend.entity.Payment;
import com.parkease.backend.entity.Withdrawal;
import com.parkease.backend.repository.WithdrawalRepository;

@RestController
@RequestMapping("/api/provider")
@PreAuthorize("hasRole('PROVIDER')")
public class ProviderDashboardController {

        private final UserRepository userRepository;
        private final BookingRepository bookingRepository;
        private final PaymentRepository paymentRepository;
        private final ParkingLotRepository parkingLotRepository;
        private final WithdrawalRepository withdrawalRepository;
        private final WalletTransactionRepository walletTransactionRepository;
        private final com.parkease.backend.repository.ReviewRepository reviewRepository;

        public ProviderDashboardController(
                        UserRepository userRepository,
                        BookingRepository bookingRepository,
                        PaymentRepository paymentRepository,
                        ParkingLotRepository parkingLotRepository,
                        WithdrawalRepository withdrawalRepository,
                        WalletTransactionRepository walletTransactionRepository,
                        com.parkease.backend.repository.ReviewRepository reviewRepository) {
                this.userRepository = userRepository;
                this.bookingRepository = bookingRepository;
                this.paymentRepository = paymentRepository;
                this.parkingLotRepository = parkingLotRepository;
                this.withdrawalRepository = withdrawalRepository;
                this.walletTransactionRepository = walletTransactionRepository;
                this.reviewRepository = reviewRepository;
        }

        /*
         * =====================================================
         * GET DASHBOARD SUMMARY
         * =====================================================
         */
        @GetMapping({ "/dashboard", "/dashboard-stats" })
        public ResponseEntity<?> getDashboard(
                        @RequestParam(value = "timeframe", defaultValue = "month") String timeframe,
                        Authentication auth) {
                String email = auth.getName();
                User provider = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("Account not found for: " + email
                                                + ". Since the database was reset, please Register again."));

                try {
                        // 1. Total Revenue
                        double totalRevenue = paymentRepository.sumTotalEarningsByProvider(provider.getId());

                        // 2. Today's Earnings
                        java.time.LocalDateTime startOfDay = java.time.LocalDate.now().atStartOfDay();
                        java.time.LocalDateTime endOfDay = java.time.LocalDate.now().atTime(java.time.LocalTime.MAX);
                        double todayEarnings = paymentRepository.sumProviderEarningBetweenForProvider(startOfDay,
                                        endOfDay, provider.getId());

                        // 3. Month to Date Earnings (excluding today to avoid double-counting with
                        // todayEarnings)
                        java.time.LocalDateTime startOfMonth = java.time.LocalDate.now().withDayOfMonth(1)
                                        .atStartOfDay();
                        double monthToDateEarnings = paymentRepository.sumProviderEarningBetweenForProvider(
                                        startOfMonth, startOfDay, provider.getId());

                        // 4. Active Cars (Active Bookings)
                        long activeCars = bookingRepository.countActiveBookingsByProvider(provider.getId());

                        // 5. Total Slots & Lots
                        int totalSlots = parkingLotRepository.sumTotalSlotsByProvider(provider.getId());
                        long totalLots = parkingLotRepository.countByProviderId(provider.getId());

                        // 6. Occupancy Rate
                        long occupancyRate = (totalSlots > 0) ? (activeCars * 100) / totalSlots : 0;

                        // 7. Recent Activity (wrapped in try-catch for lazy loading safety)
                        List<Map<String, Object>> recentActivity = new ArrayList<>();
                        try {
                                recentActivity = bookingRepository
                                                .findRecentBookingsByProvider(provider.getId(), PageRequest.of(0, 5))
                                                .stream()
                                                .map(b -> {
                                                        Map<String, Object> map = new HashMap<>();
                                                        map.put("type",
                                                                        b.getEndTime() == null ? "check-in"
                                                                                        : "check-out");
                                                        map.put("slotCode",
                                                                        b.getParkingSlot() != null
                                                                                        ? b.getParkingSlot()
                                                                                                        .getSlotNumber()
                                                                                        : "N/A");
                                                        map.put("time", b.getCreatedAt()
                                                                        .format(DateTimeFormatter
                                                                                        .ofPattern("hh:mm a")));
                                                        map.put("customerName",
                                                                        b.getDriver() != null
                                                                                        ? b.getDriver().getFullName()
                                                                                        : "Unknown");
                                                        return map;
                                                })
                                                .collect(Collectors.toList());
                        } catch (Exception e) {
                                System.err.println("⚠️ Could not load recent activity: " + e.getMessage());
                        }

                        // 8. Monthly Performance: Day-by-day for current month
                        List<Map<String, Object>> revenueTrend = new ArrayList<>();
                        java.time.LocalDate today = java.time.LocalDate.now();
                        int daysInMonth = today.getDayOfMonth();

                        for (int d = 1; d <= daysInMonth; d++) {
                                java.time.LocalDateTime dayStart = today.withDayOfMonth(d).atStartOfDay();
                                java.time.LocalDateTime dayEnd = today.withDayOfMonth(d)
                                                .atTime(java.time.LocalTime.MAX);

                                Double dayCredit = walletTransactionRepository.sumCreditsBetween(provider.getId(),
                                                dayStart, dayEnd);
                                Map<String, Object> map = new HashMap<>();
                                map.put("label", String.valueOf(d));
                                map.put("value", dayCredit != null ? dayCredit.intValue() : 0);
                                revenueTrend.add(map);
                        }

                        Map<String, Object> summary = new HashMap<>();
                        summary.put("totalRevenue", totalRevenue);
                        summary.put("todayEarnings", todayEarnings);
                        summary.put("monthToDateEarnings", monthToDateEarnings);
                        summary.put("occupancyRate", occupancyRate);
                        summary.put("activeCars", activeCars);
                        summary.put("totalSlots", totalSlots);
                        summary.put("totalLots", totalLots);

                        // Real Rating calculation
                        double avgRating = 0.0;
                        int totalReviews = 0;
                        try {
                                List<com.parkease.backend.entity.Review> reviews = reviewRepository
                                                .findByProviderOrderByCreatedAtDesc(provider);
                                avgRating = reviews.stream()
                                                .mapToInt(com.parkease.backend.entity.Review::getRating).average()
                                                .orElse(0.0);
                                totalReviews = reviews.size();
                        } catch (Exception e) {
                                System.err.println("⚠️ Could not load reviews: " + e.getMessage());
                        }
                        summary.put("rating", Math.round(avgRating * 10.0) / 10.0);
                        summary.put("totalReviews", totalReviews);

                        // Calculate Completion Rate
                        long totalBookingsCount = bookingRepository.countByProvider(provider.getId());
                        long cancelledBookingsCount = bookingRepository.countByProviderAndStatus(provider.getId(),
                                        com.parkease.backend.enumtype.BookingStatus.CANCELLED);
                        double completionRate = (totalBookingsCount > 0)
                                        ? ((double) (totalBookingsCount - cancelledBookingsCount) / totalBookingsCount)
                                                        * 100
                                        : 100.0;
                        summary.put("completionRate", Math.round(completionRate));

                        Map<String, Object> response = new HashMap<>();
                        response.put("summary", summary);
                        response.put("recentActivity", recentActivity);
                        response.put("revenueTrend", revenueTrend);
                        response.put("online", provider.isEnabled());
                        response.put("approved", provider.isApproved());
                        response.put("providerName",
                                        provider.getFullName() != null ? provider.getFullName() : "Provider");

                        System.out.println("✅ Dashboard loaded for: " + email + " | totalLots=" + totalLots
                                        + " | activeCars=" + activeCars + " | todayEarnings=" + todayEarnings);

                        return ResponseEntity.ok(response);

                } catch (Exception e) {
                        System.err.println("❌ Dashboard error for " + email + ": " + e.getMessage());
                        e.printStackTrace();
                        // Return a safe response with empty/zero values
                        Map<String, Object> summary = new HashMap<>();
                        summary.put("totalRevenue", 0);
                        summary.put("todayEarnings", 0);
                        summary.put("monthToDateEarnings", 0);
                        summary.put("occupancyRate", 0);
                        summary.put("activeCars", 0);
                        summary.put("totalSlots", 0);
                        summary.put("totalLots", 0);
                        summary.put("rating", 0);
                        summary.put("totalReviews", 0);
                        summary.put("completionRate", 100);

                        Map<String, Object> response = new HashMap<>();
                        response.put("summary", summary);
                        response.put("recentActivity", new ArrayList<>());
                        response.put("revenueTrend", new ArrayList<>());
                        response.put("online", true);
                        response.put("approved", true);
                        response.put("providerName", "Provider");
                        response.put("error", e.getMessage());

                        return ResponseEntity.ok(response);
                }
        }

        /*
         * =====================================================
         * UPDATE ONLINE STATUS
         * =====================================================
         */
        @PutMapping("/status")
        public ResponseEntity<?> updateStatus(
                        @RequestBody Map<String, Boolean> payload,
                        Authentication auth) {
                String email = auth.getName();
                User provider = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("Provider not found"));

                Boolean online = payload.get("online");
                if (online == null) {
                        online = payload.get("is_online");
                }

                provider.setEnabled(online != null ? online : true);
                userRepository.save(provider);

                return ResponseEntity.ok(Map.of("message", "Status updated", "online", provider.isEnabled()));
        }

        /*
         * =====================================================
         * GET TODAY'S BOOKINGS
         * =====================================================
         */
        @GetMapping("/occupancy")
        public ResponseEntity<?> getOccupancy(Authentication auth) {
                String email = auth.getName();
                User provider = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("Provider not found"));

                long activeCars = bookingRepository.countActiveBookingsByProvider(provider.getId());
                int totalSlots = parkingLotRepository.sumTotalSlotsByProvider(provider.getId());
                long occupancyRate = (totalSlots > 0) ? (activeCars * 100) / totalSlots : 0;

                Map<String, Object> current = new HashMap<>();
                current.put("totalSlots", totalSlots);
                current.put("occupied", activeCars);
                current.put("available", Math.max(0, totalSlots - activeCars));
                current.put("occupancyRate", occupancyRate);

                // Real Hourly Data & Peak Hours
                java.time.LocalDateTime startOfDay = java.time.LocalDate.now().atStartOfDay();
                java.time.LocalDateTime endOfDay = java.time.LocalDate.now().atTime(java.time.LocalTime.MAX);

                List<Booking> todayBookings = bookingRepository.findByParkingLot_Provider_IdAndStartTimeBetween(
                                provider.getId(), startOfDay, endOfDay);

                Map<Integer, Integer> hourCounts = new HashMap<>();
                for (Booking b : todayBookings) {
                        int hour = b.getStartTime().getHour();
                        hourCounts.put(hour, hourCounts.getOrDefault(hour, 0) + 1);
                }

                List<Map<String, Object>> hourlyData = new ArrayList<>();
                int[] hoursToCheck = { 8, 10, 12, 14, 16, 18, 20 };

                for (int h : hoursToCheck) {
                        Map<String, Object> map = new HashMap<>();
                        map.put("label", (h > 12 ? (h - 12) + "PM" : h + "AM"));
                        // Sum previous hour and current hour for a 2-hour block logic or just take
                        // current
                        int count = hourCounts.getOrDefault(h, 0) + hourCounts.getOrDefault(h + 1, 0);
                        map.put("value", count);
                        hourlyData.add(map);
                }

                // Calculate Real Peak Hours
                List<Map<String, Object>> peakHours = new ArrayList<>();

                // Find max hour
                int maxHour = -1;
                int maxCount = -1;

                for (Map.Entry<Integer, Integer> entry : hourCounts.entrySet()) {
                        if (entry.getValue() > maxCount) {
                                maxCount = entry.getValue();
                                maxHour = entry.getKey();
                        }
                }

                if (maxHour != -1) {
                        Map<String, Object> p1 = new HashMap<>();
                        String timeLabel = (maxHour > 12 ? (maxHour - 12) + " PM" : maxHour + " AM") + " - " +
                                        ((maxHour + 1) > 12 ? ((maxHour + 1) - 12) + " PM" : (maxHour + 1) + " AM");
                        p1.put("timeRange", timeLabel);
                        p1.put("bookings", maxCount);
                        p1.put("load", maxCount > 5 ? "High" : "Medium"); // Threshold logic
                        peakHours.add(p1);
                } else {
                        // Fallback if no bookings yet
                        Map<String, Object> p1 = new HashMap<>();
                        p1.put("timeRange", "No Data Yet");
                        p1.put("bookings", 0);
                        p1.put("load", "Low");
                        peakHours.add(p1);
                }

                Map<String, Object> response = new HashMap<>();
                response.put("current", current);
                response.put("hourlyData", hourlyData);
                response.put("peakHours", peakHours);

                return ResponseEntity.ok(response);
        }

        /*
         * =====================================================
         * GET TODAY'S BOOKINGS
         * =====================================================
         */
        @GetMapping("/bookings/today")
        public ResponseEntity<?> getTodayBookings(Authentication auth) {
                String email = auth.getName();
                User provider = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("Provider not found"));

                List<Map<String, Object>> bookings = bookingRepository
                                .findRecentBookingsByProvider(provider.getId(), PageRequest.of(0, 50))
                                .stream()
                                .filter(b -> b.getCreatedAt().toLocalDate().isEqual(java.time.LocalDate.now()))
                                .map(b -> {
                                        Map<String, Object> map = new HashMap<>();
                                        map.put("id", b.getId().toString());
                                        map.put("slot", b.getParkingSlot().getSlotNumber());
                                        map.put("time", b.getCreatedAt()
                                                        .format(DateTimeFormatter.ofPattern("hh:mm a")));

                                        double earnings = paymentRepository.findByBooking(b)
                                                        .map(Payment::getProviderEarning)
                                                        .orElse(0.0);
                                        map.put("earnings", earnings);

                                        map.put("status", b.getStatus());
                                        return map;
                                })
                                .collect(Collectors.toList());

                return ResponseEntity.ok(bookings);
        }

        /*
         * =====================================================
         * GET EARNINGS
         * =====================================================
         */
        @GetMapping("/earnings")
        public ResponseEntity<?> getEarnings(Authentication auth) {
                String email = auth.getName();
                User provider = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("Account not found for: " + email
                                                + ". Since the database was reset, please Register again."));

                // 1. Summary
                double totalEarnings = paymentRepository.sumTotalEarningsByProvider(provider.getId());

                java.time.LocalDateTime startOfMonth = java.time.LocalDate.now().withDayOfMonth(1).atStartOfDay();
                double thisMonth = paymentRepository.sumProviderEarningBetweenForProvider(
                                startOfMonth, java.time.LocalDateTime.now().plusDays(1), provider.getId());

                java.time.LocalDateTime startOfLastMonth = java.time.LocalDate.now().minusMonths(1).withDayOfMonth(1)
                                .atStartOfDay();
                java.time.LocalDateTime endOfLastMonth = startOfMonth.minusSeconds(1);
                double lastMonth = paymentRepository.sumProviderEarningBetweenForProvider(
                                startOfLastMonth, endOfLastMonth, provider.getId());

                double growth = (lastMonth > 0) ? ((thisMonth - lastMonth) / lastMonth) * 100 : 100;

                // Balance calculations — totalEarnings already includes all provider earnings
                // Do NOT add walletBalance again as it represents the same money
                double processedWithdrawals = withdrawalRepository.sumProcessedWithdrawalsByProvider(provider.getId());
                double pendingWithdrawals = withdrawalRepository.sumPendingWithdrawalsByProvider(provider.getId());
                double availableBalance = totalEarnings - processedWithdrawals - pendingWithdrawals;

                Map<String, Object> summary = new HashMap<>();
                summary.put("totalEarnings", totalEarnings);
                summary.put("thisMonth", thisMonth);
                summary.put("lastMonth", lastMonth);
                summary.put("growth", String.format("%.1f", growth));
                summary.put("pendingPayout", pendingWithdrawals);
                summary.put("availableBalance", availableBalance);

                // 2. Weekly Data (Real from Wallet Transactions)
                List<Map<String, Object>> weeklyData = new ArrayList<>();
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                String[] dayLabels = { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" };
                for (int i = 6; i >= 0; i--) {
                        java.time.LocalDateTime dayStart = now.minusDays(i).with(java.time.LocalTime.MIN);
                        java.time.LocalDateTime dayEnd = now.minusDays(i).with(java.time.LocalTime.MAX);

                        Double dayCredit = walletTransactionRepository.sumCreditsBetween(provider.getId(), dayStart,
                                        dayEnd);
                        if (dayCredit == null)
                                dayCredit = 0.0;

                        Map<String, Object> map = new HashMap<>();
                        map.put("label", dayLabels[dayStart.getDayOfWeek().getValue() % 7]);
                        map.put("value", dayCredit.intValue());
                        weeklyData.add(map);
                }

                // 3. Monthly Trend (Real from Wallet Transactions)
                List<Map<String, Object>> monthlyTrend = new ArrayList<>();
                String[] monthLabels = { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov",
                                "Dec" };
                for (int i = 4; i >= 0; i--) {
                        java.time.LocalDate monthDate = java.time.LocalDate.now().minusMonths(i);
                        java.time.LocalDateTime monthStart = monthDate.withDayOfMonth(1).atStartOfDay();
                        java.time.LocalDateTime monthEnd = monthDate.withDayOfMonth(monthDate.lengthOfMonth())
                                        .atTime(23, 59, 59);

                        Double monthCredit = walletTransactionRepository.sumCreditsBetween(provider.getId(), monthStart,
                                        monthEnd);
                        if (monthCredit == null)
                                monthCredit = 0.0;

                        Map<String, Object> map = new HashMap<>();
                        map.put("label", monthLabels[monthDate.getMonthValue() - 1]);
                        map.put("value", monthCredit.intValue());
                        monthlyTrend.add(map);
                }

                // 4. Transactions (Real)
                List<Map<String, Object>> transactions = paymentRepository
                                .findRecentPaymentsByProvider(provider.getId())
                                .stream()
                                .limit(10)
                                .map(p -> {
                                        Map<String, Object> map = new HashMap<>();
                                        map.put("id", "TXN" + p.getId());
                                        map.put("date", p.getPaidAt().toLocalDate().toString());
                                        map.put("amount", p.getProviderEarning());
                                        map.put("slot", p.getBooking().getParkingSlot().getSlotNumber());
                                        map.put("status", "completed");
                                        return map;
                                })
                                .collect(Collectors.toList());

                Map<String, Object> response = new HashMap<>();
                response.put("summary", summary);
                response.put("weeklyData", weeklyData);
                response.put("monthlyTrend", monthlyTrend);
                response.put("transactions", transactions);

                return ResponseEntity.ok(response);
        }

        /*
         * =====================================================
         * GET HISTORY
         * =====================================================
         */
        @GetMapping("/history")
        public ResponseEntity<?> getHistory(Authentication auth) {
                String email = auth.getName();
                User provider = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("Account not found for: " + email
                                                + ". Since the database was reset, please Register again."));

                List<Map<String, Object>> history = bookingRepository
                                .findRecentBookingsByProvider(provider.getId(), PageRequest.of(0, 100))
                                .stream()
                                .map(b -> {
                                        Map<String, Object> map = new HashMap<>();
                                        map.put("id", "BK-" + b.getId());
                                        map.put("date", b.getCreatedAt().toLocalDate().toString());
                                        map.put("slot", b.getParkingSlot().getSlotNumber());

                                        double amount = paymentRepository.findByBooking(b)
                                                        .map(Payment::getTotalAmount)
                                                        .orElse(0.0);
                                        map.put("amount", amount);

                                        map.put("customer", b.getDriver().getFullName());
                                        map.put("vehicleNumber", b.getDriver().getVehicleNumber());
                                        map.put("vehicleType", b.getDriver().getVehicleType());

                                        // Calculate duration
                                        String duration = "N/A";
                                        if (b.getEndTime() != null) {
                                                long diff = java.time.Duration.between(b.getCreatedAt(), b.getEndTime())
                                                                .toMinutes();
                                                long hours = diff / 60;
                                                long minutes = diff % 60;
                                                duration = (hours > 0 ? hours + "h " : "") + minutes + "m";
                                        }
                                        map.put("duration", duration);

                                        map.put("status", b.getStatus().toString().toLowerCase());
                                        return map;
                                })
                                .collect(Collectors.toList());

                return ResponseEntity.ok(history);
        }

        /*
         * =====================================================
         * REQUEST WITHDRAWAL
         * =====================================================
         */
        @PostMapping("/withdraw")
        public ResponseEntity<?> requestWithdrawal(@RequestBody Map<String, Object> payload, Authentication auth) {
                String email = auth.getName();
                User provider = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("Account not found for: " + email
                                                + ". Since the database was reset, please Register again."));

                if (!payload.containsKey("amount") || !payload.containsKey("upiId")) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Amount and UPI ID are required"));
                }

                double amount;
                try {
                        amount = Double.parseDouble(payload.get("amount").toString());
                } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Invalid amount format"));
                }

                String upiId = payload.get("upiId").toString();

                // Check balance
                double totalEarnings = paymentRepository.sumTotalEarningsByProvider(provider.getId());
                double processed = withdrawalRepository.sumProcessedWithdrawalsByProvider(provider.getId());
                double pending = withdrawalRepository.sumPendingWithdrawalsByProvider(provider.getId());
                double available = totalEarnings - processed - pending;

                if (amount <= 0) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Amount must be positive"));
                }

                if (amount > available) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Insufficient funds"));
                }

                Withdrawal withdrawal = new Withdrawal();
                withdrawal.setProvider(provider);
                withdrawal.setAmount(amount);
                withdrawal.setUpiId(upiId);
                withdrawal.setStatus("PENDING");
                withdrawal.setRequestedAt(java.time.LocalDateTime.now());
                withdrawalRepository.save(withdrawal);

                return ResponseEntity.ok(Map.of("message", "Withdrawal requested successfully", "remainingBalance",
                                available - amount));
        }

        /*
         * =====================================================
         * ADD MONEY TO WALLET
         * =====================================================
         */
        @PostMapping("/add-money")
        public ResponseEntity<?> addMoney(@RequestBody Map<String, Object> payload, Authentication auth) {
                String email = auth.getName();
                User provider = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("Account not found for: " + email
                                                + ". Since the database was reset, please Register again."));

                if (!payload.containsKey("amount")) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Amount is required"));
                }

                double amount;
                try {
                        amount = Double.parseDouble(payload.get("amount").toString());
                } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Invalid amount format"));
                }

                if (amount <= 0) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Amount must be positive"));
                }

                provider.setWalletBalance(provider.getWalletBalance() + amount);
                userRepository.save(provider);

                return ResponseEntity.ok(Map.of(
                                "message", "Money added successfully",
                                "newWalletBalance", provider.getWalletBalance()));
        }
}
