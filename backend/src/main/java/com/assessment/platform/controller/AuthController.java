package com.assessment.platform.controller;

import com.assessment.platform.dto.request.LoginRequest;
import com.assessment.platform.dto.request.OtpVerifyRequest;
import com.assessment.platform.dto.request.RegisterRequest;
import com.assessment.platform.dto.response.ApiResponse;
import com.assessment.platform.dto.response.AuthResponse;
import com.assessment.platform.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        String message = response.isRequires2FA() ? "OTP sent to your email" : "Login successful";
        return ResponseEntity.ok(ApiResponse.success(message, response));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        AuthResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP verified successfully", response));
    }
}
