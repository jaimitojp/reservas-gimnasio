package com.example.Gimnasio.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;

public class BookingRequest {
    private Long resourceId;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fecha;
    private Boolean conInstructor;

    public BookingRequest() {
    }

    public Long getResourceId() {
        return resourceId;
    }

    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public Boolean getConInstructor() {
        return conInstructor;
    }

    public void setConInstructor(Boolean conInstructor) {
        this.conInstructor = conInstructor;
    }
}
