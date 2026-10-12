package com.refillreminder.controller;

import com.refillreminder.model.Refill;
import com.refillreminder.service.RefillService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/refills")
@CrossOrigin(origins = "*") // Allows cross-origin if frontend is run separately
public class RefillController {

    private final RefillService refillService;

    @Autowired
    public RefillController(RefillService refillService) {
        this.refillService = refillService;
    }

    // 1. GET /api/refills - Read all refills (with optional filtering)
    @GetMapping
    public ResponseEntity<List<Refill>> getAllRefills(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String status) {

        if (category != null || priority != null || status != null) {
            return ResponseEntity.ok(refillService.filterRefills(category, priority, status));
        }
        return ResponseEntity.ok(refillService.getAllRefills());
    }

    // 2. GET /api/refills/count - Count total documents in MongoDB
    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getRefillCount() {
        Map<String, Object> response = new HashMap<>();
        response.put("count", refillService.getRefillCount());
        response.put("database", "refillreminder");
        response.put("collection", "refills");
        response.put("status", "connected");
        return ResponseEntity.ok(response);
    }

    // 3. GET /api/refills/upcoming - Read upcoming refills
    @GetMapping("/upcoming")
    public ResponseEntity<List<Refill>> getUpcomingRefills() {
        List<Refill> upcoming = refillService.getUpcomingRefills();
        return ResponseEntity.ok(upcoming);
    }

    // 4. GET /api/refills/search?name=... - Search refills by name
    @GetMapping("/search")
    public ResponseEntity<List<Refill>> searchRefills(@RequestParam("name") String name) {
        List<Refill> results = refillService.searchByProductName(name);
        return ResponseEntity.ok(results);
    }

    // 5. GET /api/refills/{id} - Read one refill by ID
    @GetMapping("/{id}")
    public ResponseEntity<Refill> getRefillById(@PathVariable String id) {
        Refill refill = refillService.getRefillById(id);
        return ResponseEntity.ok(refill);
    }

    // 6. POST /api/refills - Create a new refill
    @PostMapping
    public ResponseEntity<Refill> createRefill(@Valid @RequestBody Refill refill) {
        Refill createdRefill = refillService.createRefill(refill);
        return new ResponseEntity<>(createdRefill, HttpStatus.CREATED);
    }

    // 7. PUT /api/refills/{id} - Update an existing refill
    @PutMapping("/{id}")
    public ResponseEntity<Refill> updateRefill(
            @PathVariable String id,
            @Valid @RequestBody Refill refillDetails) {
        Refill updatedRefill = refillService.updateRefill(id, refillDetails);
        return ResponseEntity.ok(updatedRefill);
    }

    // 8. DELETE /api/refills/{id} - Delete a refill
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteRefill(@PathVariable String id) {
        refillService.deleteRefill(id);
        Map<String, Object> response = new HashMap<>();
        response.put("status", HttpStatus.OK.value());
        response.put("message", "Refill with ID " + id + " was deleted successfully.");
        response.put("deletedId", id);
        return ResponseEntity.ok(response);
    }

    // 9. PATCH /api/refills/{id}/status - Change refill status
    @PatchMapping("/{id}/status")
    public ResponseEntity<Refill> updateRefillStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> statusPayload) {
        String newStatus = statusPayload.get("status");
        if (newStatus == null || newStatus.trim().isEmpty()) {
            throw new IllegalArgumentException("Status value is required in the request body");
        }
        Refill updatedRefill = refillService.updateStatus(id, newStatus);
        return ResponseEntity.ok(updatedRefill);
    }
}
