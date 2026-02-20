package com.parkease.backend.controller;

import com.parkease.backend.entity.ParkingLot;
import com.parkease.backend.repository.ParkingLotRepository;
import com.parkease.backend.repository.ParkingSlotRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/parking")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ParkingController {

    private final ParkingLotRepository parkingLotRepository;
    private final ParkingSlotRepository parkingSlotRepository;

    public ParkingController(ParkingLotRepository parkingLotRepository,
            ParkingSlotRepository parkingSlotRepository) {
        this.parkingLotRepository = parkingLotRepository;
        this.parkingSlotRepository = parkingSlotRepository;
    }

    @GetMapping("/all")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> getAllSpots() {
        try {
            List<ParkingLot> allLots = parkingLotRepository.findAll();

            List<Map<String, Object>> response = allLots.stream()
                    .filter(lot -> lot != null && lot.getProvider() != null && lot.getProvider().isApproved())
                    .map(lot -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", lot.getId());
                        map.put("_id", lot.getId()); // Support both formats
                        map.put("name", lot.getName() != null ? lot.getName() : "Unnamed Spot");
                        map.put("location", (lot.getAddress() != null ? lot.getAddress() : "") +
                                (lot.getCity() != null ? ", " + lot.getCity() : ""));
                        map.put("price", lot.getPricePerHour() != null ? lot.getPricePerHour()
                                : (lot.getBasePrice() != null ? lot.getBasePrice() : 40.0));
                        map.put("latitude", lot.getLatitude());
                        map.put("longitude", lot.getLongitude());
                        map.put("status", lot.isActive() ? "available" : "busy");

                        long occupiedCount = parkingSlotRepository.countByParkingLotAndOccupiedTrue(lot);
                        map.put("availableSlots", Math.max(0, lot.getTotalSlots() - (int) occupiedCount));
                        map.put("totalSlots", lot.getTotalSlots());
                        map.put("type", lot.isEvSupported() ? "EV Hub" : "Standard");
                        map.put("rating", 4.0 + (Math.random() * 1.0));

                        // Specific to the SVG grid in frontend
                        Long lotId = lot.getId();
                        int seed = (lotId != null) ? lotId.intValue() : 0;
                        map.put("coords", Map.of(
                                "x", (int) (50 + (seed * 77) % 300),
                                "y", (int) (50 + (seed * 93) % 450)));

                        return map;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
