package com.parkease.backend.controller;

import com.parkease.backend.entity.User;
import com.parkease.backend.entity.Vehicle;
import com.parkease.backend.repository.UserRepository;
import com.parkease.backend.repository.VehicleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/driver/vehicles")
public class VehicleController {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public VehicleController(VehicleRepository vehicleRepository, UserRepository userRepository) {
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getMyVehicles(Authentication auth) {
        User driver = getAuthenticatedUser();
        return ResponseEntity.ok(vehicleRepository.findByDriverId(driver.getId()));
    }

    // Fixed Add Vehicle Persistence & Field Mapping
    @PostMapping
    public ResponseEntity<?> addVehicle(@RequestBody Map<String, String> payload, Authentication auth) {
        try {
            User driver = getAuthenticatedUser();

            // Handle both 'plate' and 'plateNumber' from frontend
            String plate = payload.containsKey("plate") ? payload.get("plate") : payload.get("plateNumber");

            Vehicle vehicle = Vehicle.builder()
                    .name(payload.get("name"))
                    .plate(plate)
                    .type(payload.get("type"))
                    .primaryVehicle(false)
                    .driver(driver)
                    .build();

            Vehicle saved = vehicleRepository.save(vehicle);
            System.out.println("🚗 VEHICLE PERSISTED: " + saved.getName() + " for " + driver.getEmail());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // Alias for specific user request
    @PostMapping("/add")
    public ResponseEntity<?> addVehicleAlias(@RequestBody Map<String, String> payload, Authentication auth) {
        return addVehicle(payload, auth);
    }

    @PutMapping("/{id}/primary")
    public ResponseEntity<?> setPrimary(@PathVariable Long id, Authentication auth) {
        User driver = getAuthenticatedUser();
        List<Vehicle> vehicles = vehicleRepository.findByDriverId(driver.getId());
        for (Vehicle v : vehicles) {
            v.setPrimaryVehicle(v.getId().equals(id));
        }
        vehicleRepository.saveAll(vehicles);
        return ResponseEntity.ok(Map.of("message", "Primary vehicle updated"));
    }

    // Fixed Remove endpoint with specific alias
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVehicle(@PathVariable Long id, Authentication auth) {
        vehicleRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Vehicle removed"));
    }

    @DeleteMapping("/remove/{id}")
    public ResponseEntity<?> removeVehicle(@PathVariable Long id, Authentication auth) {
        return deleteVehicle(id, auth);
    }

    @GetMapping("/primary")
    public ResponseEntity<?> getPrimaryVehicle(Authentication auth) {
        User driver = getAuthenticatedUser();
        return ResponseEntity.ok(vehicleRepository.findByDriverIdAndPrimaryVehicleTrue(driver.getId())
                .orElse(null));
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        System.out.println("✅ Database Querying for Email String: " + email);

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("CRITICAL: User " + email + " not found in DB"));
    }
}
