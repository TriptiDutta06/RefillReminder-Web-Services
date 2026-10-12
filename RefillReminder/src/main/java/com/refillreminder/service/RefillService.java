package com.refillreminder.service;

import com.refillreminder.exception.ResourceNotFoundException;
import com.refillreminder.model.Refill;
import com.refillreminder.repository.RefillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class RefillService {

    private final RefillRepository refillRepository;

    @Autowired
    public RefillService(RefillRepository refillRepository) {
        this.refillRepository = refillRepository;
    }

    // GET /api/refills - Read all refills
    public List<Refill> getAllRefills() {
        return refillRepository.findAllByOrderByNextRefillAsc();
    }

    // GET /api/refills/{id} - Read one refill
    public Refill getRefillById(String id) {
        return refillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Refill not found with ID: " + id));
    }

    // POST /api/refills - Create refill
    public Refill createRefill(Refill refill) {
        // Set default status if not provided
        if (refill.getStatus() == null || refill.getStatus().trim().isEmpty()) {
            refill.setStatus("Needed");
        }
        if (refill.getPriority() == null || refill.getPriority().trim().isEmpty()) {
            refill.setPriority("Medium");
        }
        return refillRepository.save(refill);
    }

    // PUT /api/refills/{id} - Update complete refill
    public Refill updateRefill(String id, Refill refillDetails) {
        Refill existingRefill = getRefillById(id);

        existingRefill.setProductName(refillDetails.getProductName());
        existingRefill.setCategory(refillDetails.getCategory());
        existingRefill.setQuantity(refillDetails.getQuantity());
        existingRefill.setUnit(refillDetails.getUnit());
        existingRefill.setPriority(refillDetails.getPriority());
        existingRefill.setLastRefilled(refillDetails.getLastRefilled());
        existingRefill.setNextRefill(refillDetails.getNextRefill());
        existingRefill.setStatus(refillDetails.getStatus());
        existingRefill.setNotes(refillDetails.getNotes());

        return refillRepository.save(existingRefill);
    }

    // DELETE /api/refills/{id} - Delete refill
    public void deleteRefill(String id) {
        Refill existingRefill = getRefillById(id);
        refillRepository.delete(existingRefill);
    }

    // PATCH /api/refills/{id}/status - Update only status
    public Refill updateStatus(String id, String newStatus) {
        if (newStatus == null || newStatus.trim().isEmpty()) {
            throw new IllegalArgumentException("Status cannot be empty");
        }
        Refill existingRefill = getRefillById(id);
        existingRefill.setStatus(newStatus.trim());

        // If marked as Refilled, we can also update lastRefilled to today
        if ("Refilled".equalsIgnoreCase(newStatus.trim())) {
            existingRefill.setLastRefilled(LocalDate.now());
        }

        return refillRepository.save(existingRefill);
    }

    // GET /api/refills/upcoming - Upcoming items due within 7 days or overdue, not yet refilled
    public List<Refill> getUpcomingRefills() {
        LocalDate sevenDaysFromNow = LocalDate.now().plusDays(7);
        return refillRepository.findByNextRefillLessThanEqualAndStatusNotIgnoreCaseOrderByNextRefillAsc(
                sevenDaysFromNow, "Refilled"
        );
    }

    // GET /api/refills/search?name=... - Search by product name
    public List<Refill> searchByProductName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return getAllRefills();
        }
        return refillRepository.findByProductNameContainingIgnoreCase(name.trim());
    }

    // Filter refills
    public List<Refill> filterRefills(String category, String priority, String status) {
        if (category != null && !category.trim().isEmpty()) {
            return refillRepository.findByCategoryIgnoreCase(category.trim());
        }
        if (priority != null && !priority.trim().isEmpty()) {
            return refillRepository.findByPriorityIgnoreCase(priority.trim());
        }
        if (status != null && !status.trim().isEmpty()) {
            return refillRepository.findByStatusIgnoreCase(status.trim());
        }
        return getAllRefills();
    }

    // GET /api/refills/count - Count total documents in MongoDB
    public long getRefillCount() {
        return refillRepository.count();
    }
}
