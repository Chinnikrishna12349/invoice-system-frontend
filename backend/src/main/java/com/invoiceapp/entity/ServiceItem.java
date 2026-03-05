package com.invoiceapp.entity;

public class ServiceItem {
    private String id;
    private String description;
    private Double hours;
    private Double rate;
    
    public ServiceItem() {}
    
    public ServiceItem(String id, String description, Double hours, Double rate) {
        this.id = id;
        this.description = description;
        this.hours = hours;
        this.rate = rate;
    }
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Double getHours() { return hours; }
    public void setHours(Double hours) { this.hours = hours; }
    
    public Double getRate() { return rate; }
    public void setRate(Double rate) { this.rate = rate; }
    
    public Double getTotal() {
        return hours * rate;
    }
}
