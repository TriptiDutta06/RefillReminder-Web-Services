package com.refillreminder.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Document(collection = "refills")
public class Refill {

    @Id
    private String id;

    @NotBlank(message = "Product name is required")
    private String productName;

    private String category;

    @NotNull(message = "Quantity is required")
    private Double quantity;

    private String unit;

    private String priority; // High, Medium, Low

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lastRefilled;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate nextRefill;

    private String status; // Needed, Running Low, Due Soon, Refilled

    private String notes;

    // Default constructor
    public Refill() {
    }

    // Parameterized constructor
    public Refill(String productName, String category, Double quantity, String unit,
                  String priority, LocalDate lastRefilled, LocalDate nextRefill,
                  String status, String notes) {
        this.productName = productName;
        this.category = category;
        this.quantity = quantity;
        this.unit = unit;
        this.priority = priority;
        this.lastRefilled = lastRefilled;
        this.nextRefill = nextRefill;
        this.status = status;
        this.notes = notes;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public LocalDate getLastRefilled() {
        return lastRefilled;
    }

    public void setLastRefilled(LocalDate lastRefilled) {
        this.lastRefilled = lastRefilled;
    }

    public LocalDate getNextRefill() {
        return nextRefill;
    }

    public void setNextRefill(LocalDate nextRefill) {
        this.nextRefill = nextRefill;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    @Override
    public String toString() {
        return "Refill{" +
                "id='" + id + '\'' +
                ", productName='" + productName + '\'' +
                ", category='" + category + '\'' +
                ", quantity=" + quantity +
                ", unit='" + unit + '\'' +
                ", priority='" + priority + '\'' +
                ", lastRefilled=" + lastRefilled +
                ", nextRefill=" + nextRefill +
                ", status='" + status + '\'' +
                ", notes='" + notes + '\'' +
                '}';
    }
}
