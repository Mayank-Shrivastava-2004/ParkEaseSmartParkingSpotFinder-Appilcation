package com.parkease.backend.controller;

import com.parkease.backend.entity.ParkingLot;
import com.parkease.backend.repository.ParkingLotRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/parking-lots")
public class ParkingLotController {

    private final ParkingLotRepository parkingLotRepository;

    public ParkingLotController(ParkingLotRepository parkingLotRepository) {
        this.parkingLotRepository = parkingLotRepository;
    }

    @GetMapping("/provider/{providerId}/spaces")
    public ResponseEntity<?> getProviderSpaces(@PathVariable Long providerId) {
        try {
            List<ParkingLot> spaces = parkingLotRepository.findByProviderId(providerId);

            // Map implementation to prevent LazyLoading 500 error
            return ResponseEntity.ok(spaces.stream().map(s -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", s.getId());
                m.put("address", s.getAddress());
                m.put("price", s.getPricePerHour()); // Using getPricePerHour alias
                return m;
            }).collect(Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/provider/{providerId}/list-all")
    public ResponseEntity<?> listProviderSpots(@PathVariable Long providerId) {
        try {
            List<ParkingLot> spots = parkingLotRepository.findByProviderId(providerId);

            // 🔥 TERMINAL LIST LOGGING: Yeh list terminal me line-by-line dikhayega
            System.out.println("\n========== CURRENT SPOTS FOR PROVIDER ID: " + providerId + " ==========");
            if (spots.isEmpty()) {
                System.out.println("No spots found for this provider.");
            } else {
                for (int i = 0; i < spots.size(); i++) {
                    ParkingLot s = spots.get(i);
                    System.out.println((i + 1) + ". Spot ID: " + s.getId() + " | Address: " + s.getAddress()
                            + " | Price: " + s.getPricePerHour());
                }
            }
            System.out.println("============================================================\n");

            // Map to response to prevent lazy loading errors
            return ResponseEntity.ok(spots.stream().map(s -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", s.getId());
                m.put("address", s.getAddress());
                m.put("price", s.getPricePerHour());
                m.put("name", s.getName());
                m.put("totalSlots", s.getTotalSlots());
                return m;
            }).collect(Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Terminal Sync Error: " + e.getMessage());
        }
    }

    @GetMapping("/provider/{providerId}/dashboard")
    public ResponseEntity<?> getProviderDashboard(@PathVariable Long providerId) {
        try {
            // Fetch all spots for the provider
            List<ParkingLot> spots = parkingLotRepository.findByProviderId(providerId);

            // 🚀 TERMINAL LIST LOGGING: Yeh list aapke laptop ke terminal me dikhegi
            System.out.println("\n========== ACTIVE SPOTS FOR PROVIDER ID: " + providerId + " ==========");
            if (spots.isEmpty()) {
                System.out.println("No spots found for this provider.");
            } else {
                for (int i = 0; i < spots.size(); i++) {
                    ParkingLot s = spots.get(i);
                    System.out.println((i + 1) + ". Spot ID: " + s.getId() + " | Address: " + s.getAddress()
                            + " | Rate: " + s.getPricePerHour());
                }
            }
            System.out.println("============================================================\n");

            // Convert to Map to bypass Hibernate Proxy errors (Fixes 500)
            List<Map<String, Object>> spotList = spots.stream().map(s -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", s.getId());
                m.put("address", s.getAddress());
                m.put("price", s.getPricePerHour());
                m.put("isAvailable", s.isAvailable());
                return m;
            }).collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("totalSpots", spots.size());
            response.put("spots", spotList);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/provider/{providerId}/mesh")
    public ResponseEntity<?> getMappingMesh(@PathVariable Long providerId) {
        try {
            List<ParkingLot> spots = parkingLotRepository.findByProviderId(providerId);
            return ResponseEntity.ok(spots.stream().map(s -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", s.getId());
                m.put("name", s.getName());
                m.put("latitude", s.getLatitude());
                m.put("longitude", s.getLongitude());
                m.put("address", s.getAddress());
                m.put("price", s.getPricePerHour());
                m.put("isActive", s.isActive());
                return m;
            }).collect(Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Mesh Error: " + e.getMessage());
        }
    }

    @PutMapping("/space/{id}/toggle")
    public ResponseEntity<?> toggleSpot(@PathVariable Long id, @RequestBody Map<String, Boolean> status) {
        return parkingLotRepository.findById(id).map(spot -> {
            Boolean active = status.get("active");
            if (active == null)
                active = status.get("isAvailable");
            spot.setActive(active != null ? active : !spot.isActive());
            parkingLotRepository.save(spot);
            System.out.println("🔄 TERMINAL: Spot ID " + id + " Toggle: " + (spot.isActive() ? "ON" : "OFF"));
            return ResponseEntity.ok(Map.of("message", "Status Updated", "active", spot.isActive()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/space/{id}")
    public ResponseEntity<?> removeSpot(@PathVariable Long id) {
        try {
            parkingLotRepository.deleteById(id);
            System.out.println("❌ TERMINAL: Removed Spot ID: " + id);
            return ResponseEntity.ok(Map.of("message", "Removed Success"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Removal Error: " + e.getMessage());
        }
    }
}
