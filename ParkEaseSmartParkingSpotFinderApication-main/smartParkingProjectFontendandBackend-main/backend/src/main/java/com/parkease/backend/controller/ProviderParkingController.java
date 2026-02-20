package com.parkease.backend.controller;

import com.parkease.backend.entity.ParkingLot;
import com.parkease.backend.entity.User;
import com.parkease.backend.repository.ParkingLotRepository;
import com.parkease.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/provider")
@PreAuthorize("hasRole('PROVIDER')")
public class ProviderParkingController {

    private final UserRepository userRepository;
    private final ParkingLotRepository parkingLotRepository;

    public ProviderParkingController(UserRepository userRepository, ParkingLotRepository parkingLotRepository) {
        this.userRepository = userRepository;
        this.parkingLotRepository = parkingLotRepository;
    }

    /**
     * Add or Update a Parking Spot (Lot) for the provider.
     * Supports multiple spots per provider.
     */
    @PostMapping("/parking/add")
    public ResponseEntity<?> addOrUpdateParkingLot(@RequestBody Map<String, Object> payload, Authentication auth) {
        User provider = null;

        // Try getting by providerId from payload first (if explicitly sent)
        if (payload.containsKey("providerId") && payload.get("providerId") != null) {
            try {
                Long pId = Long.parseLong(String.valueOf(payload.get("providerId")));
                provider = userRepository.findById(pId).orElse(null);
            } catch (Exception e) {
                System.out.println("DEBUG: Failed to parse providerId: " + payload.get("providerId"));
            }
        }

        // Fallback to Auth Token
        if (provider == null && auth != null) {
            String email = auth.getName();
            provider = userRepository.findByEmail(email).orElse(null);
        }

        if (provider == null) {
            System.err.println("CRITICAL: Provider not found for deployment. Payload: " + payload);
            return ResponseEntity.status(404).body(Map.of("message", "Provider not found"));
        }

        // Multi-Spot Logic: If an ID is provided, update that specific spot.
        // If no ID is provided, create a NEW spot.
        ParkingLot lot = null;
        Object idObj = payload.get("id") != null ? payload.get("id") : payload.get("lotId");

        if (idObj != null) {
            try {
                Long lotId = Long.parseLong(String.valueOf(idObj));
                lot = parkingLotRepository.findById(lotId).orElse(null);
            } catch (Exception e) {
                System.out.println("DEBUG: Failed to parse lotId: " + idObj);
            }
        }

        // If no existing lot found (or no ID provided), initialize new one
        if (lot == null) {
            lot = new ParkingLot();
            System.out.println("DEBUG: Creating NEW parking node for provider: " + provider.getEmail());
        } else {
            System.out.println("DEBUG: Updating EXISTING parking node ID: " + lot.getId());
        }

        lot.setProvider(provider);

        // Update fields from payload
        lot.setName(String.valueOf(payload.get("name")));
        lot.setAddress(String.valueOf(payload.get("address")));

        if (payload.containsKey("pricePerHour") || payload.containsKey("price")) {
            // Support both camelCase and legacy price keys
            Object priceVal = payload.get("pricePerHour") != null ? payload.get("pricePerHour") : payload.get("price");
            lot.setBasePrice(Double.parseDouble(String.valueOf(priceVal)));
        }

        if (payload.containsKey("totalSpots") || payload.containsKey("totalSlots")) {
            Object spotsVal = payload.get("totalSpots") != null ? payload.get("totalSpots") : payload.get("totalSlots");
            lot.setTotalSlots(Integer.parseInt(String.valueOf(spotsVal)));
        }

        if (payload.containsKey("latitude") && payload.get("latitude") != null) {
            lot.setLatitude(Double.parseDouble(String.valueOf(payload.get("latitude"))));
        }

        if (payload.containsKey("longitude") && payload.get("longitude") != null) {
            lot.setLongitude(Double.parseDouble(String.valueOf(payload.get("longitude"))));
        }

        lot.setActive(true);

        parkingLotRepository.save(lot);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Parking node synchronized successfully");
        response.put("lotId", lot.getId());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/spaces")
    public ResponseEntity<?> getProviderSpaces(Authentication auth) {
        try {
            String email = auth.getName();
            User provider = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Provider not found"));

            List<ParkingLot> spaces = parkingLotRepository.findByProvider(provider);

            // Map to prevent LazyLoading 500 errors
            return ResponseEntity.ok(spaces.stream().map(s -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", s.getId());
                m.put("title", s.getName());
                m.put("location", s.getAddress());
                m.put("price", s.getBasePrice());
                m.put("totalSlots", s.getTotalSlots());
                m.put("status", s.isActive() ? "AVAILABLE" : "OFFLINE");
                m.put("isActive", s.isActive());
                m.put("lat", s.getLatitude());
                m.put("lng", s.getLongitude());
                m.put("createdAt", s.getCreatedAt() != null ? s.getCreatedAt().toString() : null);
                return m;
            }).collect(java.util.stream.Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/space/{id}")
    public ResponseEntity<?> updateSpace(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return parkingLotRepository.findById(id).map(lot -> {
            if (payload.containsKey("price")) {
                lot.setBasePrice(Double.parseDouble(String.valueOf(payload.get("price"))));
            }
            if (payload.containsKey("name")) {
                lot.setName(String.valueOf(payload.get("name")));
            }
            parkingLotRepository.save(lot);
            return ResponseEntity.ok(Map.of("message", "Space updated successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/space/{id}/status")
    public ResponseEntity<?> toggleSpaceStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return parkingLotRepository.findById(id).map(lot -> {
            Boolean isActive = (Boolean) payload.get("isActive");
            lot.setActive(isActive != null ? isActive : !lot.isActive());
            parkingLotRepository.save(lot);
            return ResponseEntity.ok(Map.of("message", "Status updated", "isActive", lot.isActive()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/space/{id}")
    public ResponseEntity<?> deleteSpace(@PathVariable Long id) {
        try {
            parkingLotRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Space removed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Deletion error: " + e.getMessage());
        }
    }
}
