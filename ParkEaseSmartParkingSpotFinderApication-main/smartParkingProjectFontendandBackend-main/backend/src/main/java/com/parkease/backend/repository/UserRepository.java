package com.parkease.backend.repository;

import com.parkease.backend.entity.User;
import com.parkease.backend.enumtype.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // 🔍 Find user by email (login, forgot password)
    Optional<User> findByEmail(String email);

    // 🔍 Find user by phone number
    Optional<User> findByPhoneNumber(String phoneNumber);

    // 🔍 Check if email already exists (registration)
    boolean existsByEmail(String email);

    // 🔍 Check if phone number already exists (registration)
    boolean existsByPhoneNumber(String phoneNumber);

    // 🔍 Get all users by role (admin use)
    List<User> findByRole(Role role);

    List<User> findByRoleIn(List<Role> roles);

    boolean existsByRole(Role role);

    // 🔍 Get providers pending approval (admin use)
    List<User> findByRoleAndApproved(Role role, boolean approved);

    long countByRole(Role role);

    long countByRoleAndCreatedAtAfter(Role role, LocalDateTime date);

    // Count registrations in date range [start, end) for daily chart
    long countByRoleAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(Role role, LocalDateTime start, LocalDateTime end);

    long countByCreatedAtAfter(LocalDateTime date);

    List<User> findByRoleAndApprovedTrue(Role role);

    long countByRoleAndCreatedAtBefore(Role role, LocalDateTime date);

    long countByRoleAndEnabled(Role role, boolean enabled);

    // 🛠️ Fix for AdminDashboardController using Strings
    default long countByRoleAndStatus(String roleStr, String statusStr) {
        try {
            Role role = Role.valueOf(roleStr.toUpperCase());
            boolean isEnabled = "ACTIVE".equalsIgnoreCase(statusStr);
            return countByRoleAndEnabled(role, isEnabled);
        } catch (Exception e) {
            return 0;
        }
    }

    // 🛠️ Fix for AdminDashboardController Graph
    @org.springframework.data.jpa.repository.Query("SELECT new map(FUNCTION('FORMATDATETIME', u.createdAt, 'yyyy-MM-dd') as date, COUNT(u) as count) FROM User u WHERE u.role = :role AND u.createdAt >= :date GROUP BY FUNCTION('FORMATDATETIME', u.createdAt, 'yyyy-MM-dd')")
    List<java.util.Map<String, Object>> getRegistrationStatsByRole(
            @org.springframework.data.repository.query.Param("role") Role role,
            @org.springframework.data.repository.query.Param("date") LocalDateTime date);

}
