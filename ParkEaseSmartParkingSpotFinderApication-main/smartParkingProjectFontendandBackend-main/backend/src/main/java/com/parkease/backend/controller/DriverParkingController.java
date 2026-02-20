package com.parkease.backend.controller;

import com.parkease.backend.entity.ParkingLot;
import com.parkease.backend.entity.User;
import com.parkease.backend.repository.ParkingLotRepository;
import com.parkease.backend.repository.ParkingSlotRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/driver/parking")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DriverParkingController {

    private final ParkingLotRepository parkingLotRepository;
    private final ParkingSlotRepository parkingSlotRepository;

    public DriverParkingController(ParkingLotRepository parkingLotRepository,
            ParkingSlotRepository parkingSlotRepository) {
        this.parkingLotRepository = parkingLotRepository;
        this.parkingSlotRepository = parkingSlotRepository;
    }

    @GetMapping({ "/search", "" })
    public ResponseEntity<?> getActiveProviders() {
        System.out.println("DEBUG: Incoming request for /api/driver/parking/search");
        try {
            List<ParkingLot> activeLots = parkingLotRepository.findAll();
            System.out.println("DEBUG: Successfully fetched " + activeLots.size() + " active lots from DB");

            List<Map<String, Object>> response = activeLots.stream()
                    .filter(lot -> {
                        boolean valid = lot != null && lot.getProvider() != null && lot.getProvider().isApproved();
                        if (!valid && lot != null) {
                            System.out.println(
                                    "DEBUG: Skipping Lot ID " + lot.getId() + " - Provider not approved or null");
                        }
                        return valid;
                    })
                    .map(lot -> {
                        try {
                            Map<String, Object> map = new HashMap<>();
                            User provider = lot.getProvider();

                            map.put("id", lot.getId());
                            map.put("name", (lot.getName() != null) ? lot.getName() : "Unnamed Spot");
                            map.put("ownerName",
                                    (provider.getFullName() != null) ? provider.getFullName() : "Unknown Provider");
                            map.put("location", (lot.getAddress() != null ? lot.getAddress() : "") +
                                    (lot.getCity() != null ? ", " + lot.getCity() : ""));
                            map.put("totalSlots", lot.getTotalSlots());

                            // Efficient count via Repository
                            long occupiedCount = parkingSlotRepository.countByParkingLotAndOccupiedTrue(lot);

                            map.put("availableSlots", Math.max(0, lot.getTotalSlots() - (int) occupiedCount));
                            map.put("type", lot.isEvSupported() ? "EV Hub" : "Standard");
                            map.put("rating", 4.0 + (Math.random() * 1.0));
                            map.put("status", (lot.getTotalSlots() - (int) occupiedCount) > 0 ? "available" : "busy");
                            map.put("price", lot.getBasePrice() != null ? lot.getBasePrice() : 40.0);

                            Long lotId = lot.getId();
                            int seed = (lotId != null) ? lotId.intValue() : 0;

                            // Coordinates: Prefer real latitude/longitude if available
                            map.put("latitude", lot.getLatitude());
                            map.put("longitude", lot.getLongitude());

                            // Fallback for custom SVG grid "Smart Deck"
                            map.put("coords",
                                    Map.of("x", (int) (50 + (seed * 77) % 300), "y", (int) (50 + (seed * 93) % 450)));

                            return map;
                        } catch (Exception e) {
                            System.err.println("DEBUG: Error mapping lot record: " + e.getMessage());
                            return null;
                        }
                    })
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toList());

            System.out.println("DEBUG: Returning " + response.size() + " processed parking spots");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR in DriverParkingController: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal Server Error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
