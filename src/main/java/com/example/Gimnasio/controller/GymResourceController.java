package com.example.Gimnasio.controller;

import com.example.Gimnasio.entity.GymResource;
import com.example.Gimnasio.repository.GymResourceRepository;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clases")
public class GymResourceController {
    private final GymResourceRepository repository;

    public GymResourceController(GymResourceRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<GymResource> list() {
        return repository.findAll();
    }

    @PostMapping
    public GymResource create(@RequestBody Map<String, String> body) {
        String nombre = body.get("nombre");
        String descripcion = body.get("descripcion");
        String instructorNombre = body.get("instructorNombre");
        String hora = body.get("hora");
        Integer capacidad = null;
        if (body.containsKey("capacidad")) {
            try {
                capacidad = Integer.valueOf(body.get("capacidad"));
            } catch (Exception ignored) {}
        }
        if (capacidad == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "capacidad es requerida");
        }
        if (capacidad < 0) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "capacidad debe ser mayor o igual a 0");
        }
        GymResource r = new GymResource(nombre, descripcion, capacidad);
        r.setInstructorNombre(instructorNombre);
        if (hora != null && !hora.isBlank()) {
            r.setHoraClase(LocalTime.parse(hora));
        }
        return repository.save(r);
    }

    @PutMapping("/{id}")
    public GymResource update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        GymResource r = repository.findById(id).orElseThrow(NoSuchElementException::new);
        if (body.containsKey("nombre")) {
            r.setNombre(body.get("nombre"));
        }
        if (body.containsKey("descripcion")) {
            r.setDescripcion(body.get("descripcion"));
        }
        if (body.containsKey("instructorNombre")) {
            r.setInstructorNombre(body.get("instructorNombre"));
        }
        if (body.containsKey("hora")) {
            String hora = body.get("hora");
            r.setHoraClase(hora == null || hora.isBlank() ? null : LocalTime.parse(hora));
        }
        if (body.containsKey("capacidad")) {
            try {
                Integer cap = Integer.valueOf(body.get("capacidad"));
                if (cap < 0) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.BAD_REQUEST, "capacidad debe ser mayor o igual a 0");
                }
                r.setCapacidad(cap);
            } catch (Exception ignored) {}
        }
        return repository.save(r);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
