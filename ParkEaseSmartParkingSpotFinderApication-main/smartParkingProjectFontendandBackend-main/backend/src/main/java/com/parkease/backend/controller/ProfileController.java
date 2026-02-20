package com.parkease.backend.controller;

import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.parkease.backend.entity.User;
import com.parkease.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin
public class ProfileController {

    private final UserRepository userRepository;
    private final com.parkease.backend.repository.BookingRepository bookingRepository;
    private final com.parkease.backend.repository.PaymentRepository paymentRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public ProfileController(UserRepository userRepository,
            com.parkease.backend.repository.BookingRepository bookingRepository,
            com.parkease.backend.repository.PaymentRepository paymentRepository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(Authentication auth) {
        User user;
        if (auth.getPrincipal() instanceof User) {
            user = (User) auth.getPrincipal();
        } else {
            // Fallback for different authentication configurations
            String email = auth.getName();
            user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("name", user.getFullName());
        profile.put("email", user.getEmail());
        profile.put("phone", user.getPhoneNumber());
        profile.put("role", user.getRole().name());
        profile.put("address", user.getLocation() != null ? user.getLocation() : "Not Set");
        profile.put("joinedDate", user.getCreatedAt().toLocalDate().toString());
        profile.put("profileImage", user.getProfileImage());

        if (user.getRole() == com.parkease.backend.enumtype.Role.DRIVER) {
            long bookings = bookingRepository.findByDriver(user).size();
            double spent = paymentRepository.sumTotalSpentByDriver(user.getId());
            profile.put("totalBookings", bookings);
            profile.put("totalSpent", spent);
            profile.put("rating", 4.9);

            // Add Vehicle Info
            profile.put("vehicleName", user.getVehicleName());
            profile.put("vehicleNumber", user.getVehicleNumber());
            profile.put("vehicleType", user.getVehicleType());
        } else if (user.getRole() == com.parkease.backend.enumtype.Role.PROVIDER) {
            // Real calculations for provider
            double totalEarnings = paymentRepository.sumTotalEarningsByProvider(user.getId());
            long totalBookings = bookingRepository.countByProvider(user.getId());
            profile.put("totalEarnings", totalEarnings);
            profile.put("totalBookings", totalBookings);
            profile.put("rating", 4.8);

            // Add Provider Info
            profile.put("parkingAreaName", user.getParkingAreaName());
            profile.put("address", user.getLocation() != null ? user.getLocation() : "Not Set");
        } else if (user.getRole() == com.parkease.backend.enumtype.Role.ADMIN) {
            // Admin specific data
            profile.put("totalEarnings", 0);
            profile.put("totalBookings",
                    bookingRepository.countByStatus(com.parkease.backend.enumtype.BookingStatus.COMPLETED));
            profile.put("rating", 5.0);
            profile.put("supportHotline", "+91-9876543210");
        }

        return ResponseEntity.ok(profile);
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> updates, Authentication auth) {
        return processUpdate(updates, auth);
    }

    @PutMapping("/admin-update")
    public ResponseEntity<?> updateAdminProfile(@RequestBody Map<String, Object> updates, Authentication auth) {
        return processUpdate(updates, auth);
    }

    private ResponseEntity<?> processUpdate(Map<String, Object> updates, Authentication auth) {
        User user;
        if (auth.getPrincipal() instanceof User) {
            user = (User) auth.getPrincipal();
        } else {
            String email = auth.getName();
            user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }

        java.util.Objects.requireNonNull(user, "User cannot be null for profile updates");

        if (updates.containsKey("name"))
            user.setFullName((String) updates.get("name"));
        if (updates.containsKey("phone"))
            user.setPhoneNumber((String) updates.get("phone"));
        if (updates.containsKey("address")) {
            user.setLocation((String) updates.get("address"));
        }
        if (updates.containsKey("profileImage")) {
            user.setProfileImage((String) updates.get("profileImage"));
        }

        // Provider specific fields
        if (updates.containsKey("parkingAreaName")) {
            user.setParkingAreaName((String) updates.get("parkingAreaName"));
        }
        if (updates.containsKey("aadharNumber")) {
            user.setAadharNumber((String) updates.get("aadharNumber"));
        }
        if (updates.containsKey("propertyPermitNumber")) {
            user.setPropertyPermitNumber((String) updates.get("propertyPermitNumber"));
        }
        if (updates.containsKey("bankName")) {
            user.setBankName((String) updates.get("bankName"));
        }
        if (updates.containsKey("accountNumber")) {
            user.setAccountNumber((String) updates.get("accountNumber"));
        }
        if (updates.containsKey("ifscCode")) {
            user.setIfscCode((String) updates.get("ifscCode"));
        }

        // Update Vehicle Info (Driver)
        if (updates.containsKey("vehicleName"))
            user.setVehicleName((String) updates.get("vehicleName"));
        if (updates.containsKey("vehicleNumber"))
            user.setVehicleNumber((String) updates.get("vehicleNumber"));
        if (updates.containsKey("vehicleType"))
            user.setVehicleType((String) updates.get("vehicleType"));

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("success", true, "message", "Profile updated successfully"));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request, Authentication auth) {
        User user;
        if (auth.getPrincipal() instanceof User) {
            user = (User) auth.getPrincipal();
        } else {
            String email = auth.getName();
            user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }

        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        if (currentPassword == null || newPassword == null) {
            return ResponseEntity.status(400).body(Map.of("message", "Missing password fields"));
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.status(400).body(Map.of("message", "Incorrect current password"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("success", true, "message", "Password updated successfully"));
    }
}
