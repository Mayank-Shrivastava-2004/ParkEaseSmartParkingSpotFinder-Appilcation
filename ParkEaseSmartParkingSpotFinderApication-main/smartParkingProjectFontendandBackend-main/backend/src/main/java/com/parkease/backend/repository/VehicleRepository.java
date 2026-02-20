package com.parkease.backend.repository;

import com.parkease.backend.entity.Vehicle;
import com.parkease.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByDriverId(Long driverId);

    Optional<Vehicle> findByDriverIdAndPrimaryVehicleTrue(Long driverId);
}
