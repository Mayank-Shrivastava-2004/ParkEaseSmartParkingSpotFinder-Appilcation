package com.parkease.backend.controller;

import com.parkease.backend.entity.Booking;
import com.parkease.backend.entity.User;
import com.parkease.backend.repository.BookingRepository;
import com.parkease.backend.repository.UserRepository;
import com.parkease.backend.enumtype.BookingStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/driver/bookings")
public class DriverBookingController {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final com.parkease.backend.service.BookingService bookingService;
    private final com.parkease.backend.service.PaymentService paymentService;
    private final com.parkease.backend.repository.ParkingLotRepository parkingLotRepository;
    private final com.parkease.backend.repository.ParkingSlotRepository parkingSlotRepository;
    private final com.parkease.backend.repository.PaymentRepository paymentRepository;

    public DriverBookingController(BookingRepository bookingRepository,
            UserRepository userRepository,
            com.parkease.backend.service.BookingService bookingService,
            com.parkease.backend.service.PaymentService paymentService,
            com.parkease.backend.repository.ParkingLotRepository parkingLotRepository,
            com.parkease.backend.repository.ParkingSlotRepository parkingSlotRepository,
            com.parkease.backend.repository.PaymentRepository paymentRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.bookingService = bookingService;
        this.paymentService = paymentService;
        this.parkingLotRepository = parkingLotRepository;
        this.parkingSlotRepository = parkingSlotRepository;
        this.paymentRepository = paymentRepository;
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<?> getDriverBookings(
            @org.springframework.web.bind.annotation.PathVariable Long driverId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String status) {
        try {
            List<Booking> bookings;
            if (status != null && !status.isEmpty()) {
                try {
                    com.parkease.backend.enumtype.BookingStatus enumStatus = com.parkease.backend.enumtype.BookingStatus
                            .valueOf(status.toUpperCase());
                    bookings = bookingRepository.findByDriverIdAndStatus(driverId, enumStatus);
                } catch (IllegalArgumentException e) {
                    System.out.println("DEBUG: Invalid status '" + status + "', fetching all.");
                    bookings = bookingRepository.findByDriverIdWithParkingLot(driverId);
                }
            } else {
                bookings = bookingRepository.findByDriverIdWithParkingLot(driverId);
            }

            // 🔥 CRITICAL: Convert to Map to kill LazyInitializationException
            List<java.util.Map<String, Object>> cleanData = bookings.stream().map(b -> {
                try {
                    java.util.Map<String, Object> m = new java.util.HashMap<>();
                    m.put("id", b.getId());
                    // Use getParkingLot() and getAddress() as requested
                    m.put("spotName",
                            (b.getParkingLot() != null && b.getParkingLot().getAddress() != null)
                                    ? b.getParkingLot().getAddress()
                                    : "Parking Spot");
                    m.put("location",
                            (b.getParkingLot() != null && b.getParkingLot().getAddress() != null)
                                    ? b.getParkingLot().getAddress()
                                    : "");
                    m.put("name",
                            (b.getParkingLot() != null && b.getParkingLot().getName() != null)
                                    ? b.getParkingLot().getName()
                                    : "Unknown Spot");

                    // Explicit String conversion for dates
                    m.put("startTime", b.getStartTime() != null ? b.getStartTime().toString() : "");
                    m.put("endTime", b.getEndTime() != null ? b.getEndTime().toString() : "");

                    m.put("amount", b.getTotalAmount() != null ? b.getTotalAmount() : 0.0);
                    m.put("totalAmount", b.getTotalAmount() != null ? b.getTotalAmount() : 0.0);
                    m.put("vehicleNumber", b.getVehicleNumber() != null ? b.getVehicleNumber() : "N/A");
                    m.put("vehicleNo", b.getVehicleNumber() != null ? b.getVehicleNumber() : "N/A"); // Alias for
                                                                                                     // frontend

                    // Status normalization
                    String statusStr = b.getStatus() != null ? b.getStatus().toString() : "UNKNOWN";
                    if ("CONFIRMED".equalsIgnoreCase(statusStr) || "ACTIVE".equalsIgnoreCase(statusStr)) {
                        m.put("status", "Active");
                    } else {
                        m.put("status", statusStr);
                    }

                    // Keeping nested objects safely if needed by frontend previously, but flattened
                    // is safer
                    if (b.getParkingLot() != null) {
                        java.util.Map<String, Object> lotMap = new java.util.HashMap<>();
                        lotMap.put("name", b.getParkingLot().getName());
                        lotMap.put("location", b.getParkingLot().getAddress());
                        m.put("parkingLot", lotMap);
                    }

                    return m;
                } catch (Exception e) {
                    System.err.println("Error mapping booking " + b.getId() + ": " + e.getMessage());
                    return null;
                }
            }).filter(java.util.Objects::nonNull).collect(java.util.stream.Collectors.toList());

            System.out.println("Fetching bookings for Driver: " + driverId + " | Found: " + cleanData.size());
            return ResponseEntity.ok(cleanData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error fetching bookings: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getMyBookings(Authentication auth) {
        User driver = null;
        if (auth != null && auth.getPrincipal() instanceof User) {
            driver = (User) auth.getPrincipal(); // Use the authenticated user directly
        } else {
            // Fallback to finding by email if principal isn't User object (rare but
            // possible in some configs)
            String email = auth != null ? auth.getName() : null;
            if (email != null) {
                driver = userRepository.findByEmail(email).orElse(null);
            }
        }

        if (driver == null) {
            throw new RuntimeException("Driver not authenticated");
        }

        // Use the new repository method for consistent sorting and eager loading
        List<Booking> bookings = bookingRepository.findByDriverIdWithParkingLot(driver.getId());

        // Reuse the same safe mapping logic to avoid LazyInitializationException
        List<java.util.Map<String, Object>> cleanData = bookings.stream().map(b -> {
            try {
                java.util.Map<String, Object> m = new java.util.HashMap<>();
                m.put("id", b.getId());
                m.put("spotName",
                        (b.getParkingLot() != null && b.getParkingLot().getAddress() != null)
                                ? b.getParkingLot().getAddress()
                                : "Parking Spot");
                m.put("location",
                        (b.getParkingLot() != null && b.getParkingLot().getAddress() != null)
                                ? b.getParkingLot().getAddress()
                                : "");
                m.put("name",
                        (b.getParkingLot() != null && b.getParkingLot().getName() != null) ? b.getParkingLot().getName()
                                : "Unknown Spot");

                m.put("startTime", b.getStartTime() != null ? b.getStartTime().toString() : "");
                m.put("endTime", b.getEndTime() != null ? b.getEndTime().toString() : "");

                m.put("amount", b.getTotalAmount() != null ? b.getTotalAmount() : 0.0);
                m.put("totalAmount", b.getTotalAmount() != null ? b.getTotalAmount() : 0.0);
                m.put("vehicleNumber", b.getVehicleNumber() != null ? b.getVehicleNumber() : "N/A");
                m.put("vehicleNo", b.getVehicleNumber() != null ? b.getVehicleNumber() : "N/A");

                String statusStr = b.getStatus() != null ? b.getStatus().toString() : "UNKNOWN";
                if ("CONFIRMED".equalsIgnoreCase(statusStr) || "ACTIVE".equalsIgnoreCase(statusStr)) {
                    m.put("status", "Active");
                } else {
                    m.put("status", statusStr);
                }

                if (b.getParkingLot() != null) {
                    java.util.Map<String, Object> lotMap = new java.util.HashMap<>();
                    lotMap.put("name", b.getParkingLot().getName());
                    lotMap.put("location", b.getParkingLot().getAddress());
                    m.put("parkingLot", lotMap);
                }

                return m;
            } catch (Exception e) {
                System.err.println("Error mapping booking " + b.getId() + ": " + e.getMessage());
                return null;
            }
        }).filter(java.util.Objects::nonNull).collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(cleanData);
    }

    @GetMapping("/spends/today")
    public ResponseEntity<?> getTodaySpent(Authentication auth) {
        try {
            User driver = null;
            if (auth != null && auth.getPrincipal() instanceof User) {
                driver = (User) auth.getPrincipal();
            } else if (auth != null) {
                String email = auth.getName();
                driver = userRepository.findByEmail(email).orElse(null);
            }

            if (driver == null) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            Double todayTotal = paymentRepository.getTodayTotalSpent(driver.getId());
            return ResponseEntity.ok(todayTotal != null ? todayTotal : 0.0);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error calculating today's spends: " + e.getMessage());
        }
    }

    @PutMapping("/cancel/{id}")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        try {
            Booking booking = bookingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));

            if (booking.getStatus() == BookingStatus.CANCELLED) {
                return ResponseEntity.badRequest().body("Booking is already cancelled");
            }

            bookingService.cancelBooking(booking);
            return ResponseEntity.ok("Booking Cancelled Successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error cancelling booking: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Map<String, Object> payload, Authentication auth) {
        try {
            System.out.println("DEBUG: Incoming Payload: " + payload);
            User driver = null;

            // Priority 1: Use driver_id or driverId from payload if provided
            Object driverIdObj = payload.get("driver_id");
            if (driverIdObj == null)
                driverIdObj = payload.get("driverId");

            if (driverIdObj != null) {
                try {
                    Long driverId = Long.parseLong(driverIdObj.toString());
                    driver = userRepository.findById(driverId).orElse(null);
                } catch (Exception e) {
                    System.out.println("DEBUG: Failed to parse driver_id from payload: " + driverIdObj);
                }
            }

            // Priority 2: Use user from authentication principal OR email
            if (driver == null && auth != null) {
                if (auth.getPrincipal() instanceof User) {
                    driver = (User) auth.getPrincipal();
                } else {
                    String email = auth.getName();
                    driver = userRepository.findByEmail(email).orElse(null);
                }
            }

            if (driver == null) {
                throw new RuntimeException("Driver not found");
            }

            System.out.println("DEBUG: Booking Payload Received: " + payload);

            // Supporting both legacy and new keys (User Requirement 2)
            Object lotIdObj = payload.get("spot_id");
            if (lotIdObj == null)
                lotIdObj = payload.get("spotId"); // camelCase support
            if (lotIdObj == null)
                lotIdObj = payload.get("parking_lot_id");
            if (lotIdObj == null)
                lotIdObj = payload.get("parkingLotId");

            if (lotIdObj == null)
                throw new RuntimeException("spot_id (or spotId) is required.");

            Long lotId = Long.parseLong(lotIdObj.toString());

            com.parkease.backend.entity.ParkingLot lot = parkingLotRepository.findById(lotId).orElse(null);

            // CRITICAL FIX FOR MOCK DATA (User Requirement 2)
            // If ID is 1001/mock or not found, try to use the first real active lot
            if (lot == null) {
                System.out.println("DEBUG: Lot ID " + lotId + " not found. Attempting fallback to first active lot.");
                lot = parkingLotRepository.findByActiveTrue().stream().findFirst().orElse(null);
            }

            if (lot == null) {
                throw new RuntimeException("Parking Lot not found with ID: " + lotId);
            }

            Object amtObj = payload.get("total_amount");
            if (amtObj == null)
                amtObj = payload.get("amount");
            if (amtObj == null)
                amtObj = payload.get("totalAmount");

            if (amtObj == null)
                throw new RuntimeException("total_amount is required.");
            double totalAmount = Double.parseDouble(amtObj.toString());

            // Check balance
            if (driver.getWalletBalance() < totalAmount) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Insufficient wallet balance"));
            }

            // 1. Parse Start and End Times FIRST (needed for availability check)
            java.time.LocalDateTime reqStartTime = java.time.LocalDateTime.now();
            java.time.LocalDateTime reqEndTime = reqStartTime.plusHours(1);

            try {
                Object startObj = payload.get("startTime") != null ? payload.get("startTime")
                        : payload.get("start_time");
                if (startObj != null) {
                    reqStartTime = java.time.LocalDateTime.parse(startObj.toString().replace("Z", ""));
                }

                // If endTime not provided, default based on duration or fixed time
                Object endObj = payload.get("endTime") != null ? payload.get("endTime") : payload.get("end_time");
                if (endObj != null) {
                    reqEndTime = java.time.LocalDateTime.parse(endObj.toString().replace("Z", ""));
                } else {
                    reqEndTime = reqStartTime.plusHours(1);
                }
            } catch (Exception e) {
                System.out.println("DEBUG: Date parsing error in pre-check: " + e.getMessage());
                // Fallback times already set
            }

            // check that start time is before end time
            if (!reqStartTime.isBefore(reqEndTime)) {
                return ResponseEntity.badRequest()
                        .body(java.util.Map.of("message", "Start time must be before end time."));
            }

            // 2. Check for Overlapping Bookings (The Fix for Double Booking)
            List<Long> occupiedSlotIds = bookingRepository.findOccupiedSlotIds(lot.getId(), reqStartTime, reqEndTime,
                    java.util.List.of(com.parkease.backend.enumtype.BookingStatus.ACTIVE));
            System.out.println("DEBUG: Found occupied slots: " + occupiedSlotIds);

            // Find first available slot in this lot
            // FIX: If no slots exist in DB for this lot, let's create them on the fly
            List<com.parkease.backend.entity.ParkingSlot> allSlots = parkingSlotRepository.findByParkingLot(lot);
            if (allSlots.isEmpty()) {
                System.out.println("DEBUG: No slots found for Lot ID " + lot.getId() + ". Creating "
                        + lot.getTotalSlots() + " slots.");
                for (int i = 1; i <= Math.max(1, lot.getTotalSlots()); i++) {
                    com.parkease.backend.entity.ParkingSlot newSlot = new com.parkease.backend.entity.ParkingSlot();
                    newSlot.setParkingLot(lot);
                    newSlot.setSlotNumber("S-" + lot.getId() + "-" + i);
                    newSlot.setOccupied(false);
                    newSlot.setVehicleType(com.parkease.backend.enumtype.VehicleType.CAR);
                    parkingSlotRepository.save(newSlot);
                    allSlots.add(newSlot);
                }
            }

            com.parkease.backend.entity.ParkingSlot slot = allSlots.stream()
                    .filter(s -> !s.isOccupied()) // Check physical 'current' status flag (if used)
                    .filter(s -> !occupiedSlotIds.contains(s.getId())) // Check temporal availability (DB overlap)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("No available slots found for this time range."));

            // 3. Create Booking
            Object vNoObj = payload.getOrDefault("vehicle_no", payload.get("vehicleNumber"));
            String vehicleNo = vNoObj != null ? vNoObj.toString() : "UNKNOWN";

            Booking booking = bookingService.startBooking(driver, lot, slot, vehicleNo);

            // Set the parsed times explicitly
            booking.setStartTime(reqStartTime);
            booking.setEndTime(reqEndTime);

            // Logic to update actual 'occupied' flag if booking is happening NOW
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            if (reqStartTime.isBefore(now.plusMinutes(5)) && reqEndTime.isAfter(now)) {
                slot.setOccupied(true);
                parkingSlotRepository.save(slot);
            }

            bookingRepository.save(booking);

            // 2. Process Payment (Deductions & Graph Tracking)
            paymentService.createPayment(booking, totalAmount, totalAmount * 0.1, "WALLET");

            // Fix: Return simplified map instead of full Entity to avoid LazyInitException
            return ResponseEntity.ok(java.util.Map.of(
                    "status", "success",
                    "message", "Booking Confirmed! ✅",
                    "bookingId", booking.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }
}
