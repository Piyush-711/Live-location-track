package com.local.travel.common.error;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final MediaType PROBLEM_JSON = MediaType.parseMediaType("application/problem+json");

    @ExceptionHandler(AppException.class)
    public ResponseEntity<RFC9457ProblemDetail> handleAppException(AppException ex, HttpServletRequest request) {
        String instance = request.getRequestURI() + "?trace=" + UUID.randomUUID().toString().substring(0, 8);
        RFC9457ProblemDetail problem = RFC9457ProblemDetail.of(
                ex.getCode(),
                ex.getTitle(),
                ex.getStatus(),
                ex.getMessage(),
                instance
        );
        return ResponseEntity
                .status(ex.getStatus())
                .contentType(PROBLEM_JSON)
                .body(problem);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<RFC9457ProblemDetail> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String instance = request.getRequestURI() + "?trace=" + UUID.randomUUID().toString().substring(0, 8);
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .orElse("Validation failed on request payload");

        RFC9457ProblemDetail problem = RFC9457ProblemDetail.of(
                "VALIDATION_FAILED",
                "Validation Failed",
                HttpStatus.BAD_REQUEST.value(),
                detail,
                instance
        );
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .contentType(PROBLEM_JSON)
                .body(problem);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<RFC9457ProblemDetail> handleGeneral(Exception ex, HttpServletRequest request) {
        String instance = request.getRequestURI() + "?trace=" + UUID.randomUUID().toString().substring(0, 8);
        // Mask details to adhere to Section 11 security invariant (no stack traces, SQL, or internals)
        RFC9457ProblemDetail problem = RFC9457ProblemDetail.of(
                "INTERNAL_ERROR",
                "Internal Server Error",
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected internal error occurred. Please retry with idempotency token.",
                instance
        );
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(PROBLEM_JSON)
                .body(problem);
    }
}
