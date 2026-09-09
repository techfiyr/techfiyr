package com.techfiyr.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.bootstrap")
public record BootstrapProperties(
        String adminUsername,
        String adminPassword,
        String employeeUsername,
        String employeePassword
) {
}
