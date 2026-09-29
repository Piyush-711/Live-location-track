package com.local.travel.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.local.travel.common.error.RFC9457ProblemDetail;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.*;
import java.nio.charset.StandardCharsets;

/** Bound JSON bodies, including chunked requests, before Jackson allocates objects. */
final class RequestSizeFilter extends OncePerRequestFilter {
    private static final int MAX_BYTES = 65_536;
    private final ObjectMapper mapper;

    RequestSizeFilter(ObjectMapper mapper) { this.mapper = mapper; }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!request.getRequestURI().startsWith("/v1/")) {
            chain.doFilter(request, response);
            return;
        }
        if (request.getContentLengthLong() > MAX_BYTES) {
            reject(request, response);
            return;
        }
        byte[] body = request.getInputStream().readNBytes(MAX_BYTES + 1);
        if (body.length > MAX_BYTES) {
            reject(request, response);
            return;
        }
        chain.doFilter(new HttpServletRequestWrapper(request) {
            @Override public ServletInputStream getInputStream() {
                ByteArrayInputStream input = new ByteArrayInputStream(body);
                return new ServletInputStream() {
                    @Override public int read() { return input.read(); }
                    @Override public int read(byte[] b, int off, int len) { return input.read(b, off, len); }
                    @Override public boolean isFinished() { return input.available() == 0; }
                    @Override public boolean isReady() { return true; }
                    @Override public void setReadListener(ReadListener listener) {
                        throw new UnsupportedOperationException("Asynchronous body reading is unsupported");
                    }
                };
            }
            @Override public BufferedReader getReader() {
                return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
            }
        }, response);
    }

    private void reject(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setStatus(413);
        response.setContentType("application/problem+json");
        mapper.writeValue(response.getOutputStream(), RFC9457ProblemDetail.of(
                "PAYLOAD_TOO_LARGE", "Payload Too Large", 413, "JSON request bodies must not exceed 64 KiB.", request.getRequestURI()));
    }
}
