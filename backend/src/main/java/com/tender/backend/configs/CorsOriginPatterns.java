package com.tender.backend.configs;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.stream.Collectors;

final class CorsOriginPatterns {

    private static final List<String> PRODUCTION_ORIGINS = List.of(
            "https://ideal-surprise-production-7932.up.railway.app",
            "https://nextender.com",
            "https://www.nextender.com"
    );

    private CorsOriginPatterns() {
    }

    static List<String> fromConfiguredOrigins(String configuredOrigins) {
        LinkedHashSet<String> origins = Arrays.stream(configuredOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        origins.addAll(PRODUCTION_ORIGINS);
        return List.copyOf(origins);
    }
}
