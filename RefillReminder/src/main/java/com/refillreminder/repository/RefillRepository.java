package com.refillreminder.repository;

import com.refillreminder.model.Refill;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RefillRepository extends MongoRepository<Refill, String> {

    // Search by product name (case-insensitive substring)
    List<Refill> findByProductNameContainingIgnoreCase(String productName);

    // Filter by Category
    List<Refill> findByCategoryIgnoreCase(String category);

    // Filter by Priority
    List<Refill> findByPriorityIgnoreCase(String priority);

    // Filter by Status
    List<Refill> findByStatusIgnoreCase(String status);

    // Find upcoming refills: next refill date on or before given date, and not already refilled
    List<Refill> findByNextRefillLessThanEqualAndStatusNotIgnoreCaseOrderByNextRefillAsc(LocalDate date, String status);

    // Get all ordered by next refill date
    List<Refill> findAllByOrderByNextRefillAsc();
}
