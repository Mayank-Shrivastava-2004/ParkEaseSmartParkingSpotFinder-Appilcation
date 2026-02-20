package com.parkease.backend.repository;

import com.parkease.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProviderId(Long providerId);

    List<Review> findByProviderOrderByCreatedAtDesc(com.parkease.backend.entity.User provider);
}
