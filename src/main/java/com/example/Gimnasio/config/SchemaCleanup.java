package com.example.Gimnasio.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class SchemaCleanup {
    @Bean
    ApplicationRunner dropLegacyResourcesTable(JdbcTemplate jdbc) {
        return args -> {
            try {
                jdbc.execute("DROP TABLE IF EXISTS resources");
            } catch (Exception ignored) {
            }
        };
    }
}
