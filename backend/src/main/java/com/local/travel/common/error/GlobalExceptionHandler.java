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
import jakarta.validation.ConstraintViolationException;
import org.springframework.web.ErrorResponse;

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
                .headers(ex.getStatus() == 429 ? retryHeaders() : new HttpHeaders())
                .contentType(PROBLEM_JSON)
                .body(problem);
    }

    private HttpHeaders retryHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Retry-After", "60");
        return headers;
    }

    @ExceptionHandler({org.springframework.http.converter.HttpMessageNotReadableException.class,
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class})
    public ResponseEntity<RFC9457ProblemDetail> handleMalformed(Exception ex, HttpServletRequest request) {
        return ResponseEntity.badRequest().contentType(PROBLEM_JSON).body(RFC9457ProblemDetail.of(
                "VALIDATION_FAILED", "Validation Failed", 400, "The request contains malformed JSON or an invalid parameter type.", request.getRequestURI()));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<RFC9457ProblemDetail> handleConstraints(ConstraintViolationException ex, HttpServletRequest request) {
        return ResponseEntity.badRequest().contentType(PROBLEM_JSON).body(RFC9457ProblemDetail.of(
                "VALIDATION_FAILED", "Validation Failed", 400, "A request parameter is outside its allowed range or format.", request.getRequestURI()));
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
        if (ex instanceof ErrorResponse error && error.getStatusCode().is4xxClientError()) {
            int status = error.getStatusCode().value();
            String code = status == 404 ? "OBJECT_NOT_FOUND" : "VALIDATION_FAILED";
            String title = HttpStatus.valueOf(status).getReasonPhrase();
            return ResponseEntity.status(status).headers(error.getHeaders()).contentType(PROBLEM_JSON).body(
                    RFC9457ProblemDetail.of(code, title, status, "The request could not be processed. Check its body, parameters and method.", instance));
        }
        // Mask details to adhere to Section 11 security invariant (no stack traces, SQL, or internals)
        RFC9457ProblemDetail problem = RFC9457ProblemDetail.of(
                "INTERNAL_ERROR",
                "Internal Server Error",
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected internal error occurred.",
                instance
        );
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(PROBLEM_JSON)
                .body(problem);
    }
}
