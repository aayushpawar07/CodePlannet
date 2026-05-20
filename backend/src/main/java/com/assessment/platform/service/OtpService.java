package com.assessment.platform.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OtpService {

    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    @Value("${app.otp.expiration-minutes}")
    private int expirationMinutes;

    public String generateOtp(String email) {
        String otp = String.format("%06d", random.nextInt(1000000));
        otpStore.put(email, new OtpEntry(otp, LocalDateTime.now().plusMinutes(expirationMinutes)));
        log.debug("OTP generated for: {}", email);
        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        OtpEntry entry = otpStore.get(email);
        if (entry == null) {
            return false;
        }
        if (entry.expiresAt().isBefore(LocalDateTime.now())) {
            otpStore.remove(email);
            return false;
        }
        if (entry.otp().equals(otp)) {
            otpStore.remove(email);
            return true;
        }
        return false;
    }

    private record OtpEntry(String otp, LocalDateTime expiresAt) {}
}
