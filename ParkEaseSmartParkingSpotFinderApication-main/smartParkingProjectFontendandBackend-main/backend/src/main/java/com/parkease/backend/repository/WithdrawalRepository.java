package com.parkease.backend.repository;

import com.parkease.backend.entity.Withdrawal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WithdrawalRepository extends JpaRepository<Withdrawal, Long> {
    List<Withdrawal> findByProviderId(Long providerId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdrawal w WHERE w.provider.id = :providerId AND w.status = 'PENDING'")
    Double sumPendingWithdrawalsByProvider(
            @org.springframework.data.repository.query.Param("providerId") Long providerId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdrawal w WHERE w.provider.id = :providerId AND w.status = 'APPROVED'")
    Double sumProcessedWithdrawalsByProvider(
            @org.springframework.data.repository.query.Param("providerId") Long providerId);
}
