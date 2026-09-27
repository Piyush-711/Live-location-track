package com.local.travel.common.error;

import java.net.URI;

public record RFC9457ProblemDetail(
        URI type,
        String title,
        int status,
        String detail,
        URI instance,
        String code
) {
    public static RFC9457ProblemDetail of(String code, String title, int status, String detail, String instancePath) {
        return new RFC9457ProblemDetail(
                URI.create("https://api.localapp.internal/errors/" + code.toLowerCase()),
                title,
                status,
                detail,
                URI.create(instancePath),
                code
        );
    }
}
