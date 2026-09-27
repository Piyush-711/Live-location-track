package com.local.travel.common.error;

public class AppException extends RuntimeException {
    private final String code;
    private final String title;
    private final int status;

    public AppException(String code, String title, int status, String detail) {
        super(detail);
        this.code = code;
        this.title = title;
        this.status = status;
    }

    public String getCode() {
        return code;
    }

    public String getTitle() {
        return title;
    }

    public int getStatus() {
        return status;
    }
}
