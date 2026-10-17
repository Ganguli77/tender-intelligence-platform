package com.tender.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.tender.backend.configs.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

@SpringBootTest
class SecurityConfigCorsTest {

    @Autowired
    private SecurityConfig securityConfig;

    @Test
    void corsConfigurationAllowsLocalAndProductionOrigins() {
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("OPTIONS");
        request.addHeader("Origin", "http://localhost:5173");

        CorsConfiguration configuration = source.getCorsConfiguration(request);

        assertThat(configuration).isNotNull();
        assertThat(configuration.getAllowedOriginPatterns()).contains(
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "https://ideal-surprise-production-7932.up.railway.app",
            "https://nextender.com",
            "https://www.nextender.com");
        assertThat(configuration.checkOrigin("https://ideal-surprise-production-7932.up.railway.app"))
            .isEqualTo("https://ideal-surprise-production-7932.up.railway.app");
        assertThat(configuration.checkOrigin("https://nextender.com")).isEqualTo("https://nextender.com");
        assertThat(configuration.getAllowedMethods()).contains("GET", "POST", "PUT", "DELETE", "OPTIONS");
    }
}
