package com.example.Gimnasio.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
@Table(name = "reservas")
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reserva")
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "resource_id", nullable = false)
    private GymResource resource;

    @Column(name = "fecha_reserva", nullable = false)
    private LocalDate fechaReserva;

    @Column(name = "con_instructor")
    private Boolean conInstructor;

    @Column(name = "instructor_nombre", length = 120)
    private String instructorNombre;

    public Booking() {
    }

    public Booking(User user, GymResource resource, LocalDate fechaReserva) {
        this.user = user;
        this.resource = resource;
        this.fechaReserva = fechaReserva;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public GymResource getResource() {
        return resource;
    }

    public void setResource(GymResource resource) {
        this.resource = resource;
    }

    public LocalDate getFechaReserva() {
        return fechaReserva;
    }

    public void setFechaReserva(LocalDate fechaReserva) {
        this.fechaReserva = fechaReserva;
    }

    public Boolean getConInstructor() {
        return conInstructor;
    }

    public void setConInstructor(Boolean conInstructor) {
        this.conInstructor = conInstructor;
    }

    public String getInstructorNombre() {
        return instructorNombre;
    }

    public void setInstructorNombre(String instructorNombre) {
        this.instructorNombre = instructorNombre;
    }
}
