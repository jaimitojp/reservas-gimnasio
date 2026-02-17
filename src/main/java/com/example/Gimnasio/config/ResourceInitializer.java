package com.example.Gimnasio.config;

import com.example.Gimnasio.entity.GymResource;
import com.example.Gimnasio.repository.GymResourceRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ResourceInitializer {
    @Bean
    public CommandLineRunner seedDefaultResource(GymResourceRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.save(new GymResource("Clases de boxeo", "Entrenamiento técnico y físico de boxeo.", 12));
                repository.save(new GymResource("Clases de gimnasia", "Flexibilidad, equilibrio y fuerza.", 15));
                repository.save(new GymResource("Clases de cardio", "Sesiones de alta energía para mejorar resistencia.", 20));
                repository.save(new GymResource("Clases de levantamiento de pesas", "Técnica y fuerza con cargas.", 10));
            }
        };
    }
}
