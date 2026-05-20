package com.assessment.platform.service;

import com.assessment.platform.dto.request.LoginRequest;
import com.assessment.platform.dto.request.OtpVerifyRequest;
import com.assessment.platform.dto.request.RegisterRequest;
import com.assessment.platform.dto.response.AuthResponse;
import com.assessment.platform.entity.Role;
import com.assessment.platform.entity.Team;
import com.assessment.platform.entity.User;
import com.assessment.platform.exception.BadRequestException;
import com.assessment.platform.exception.DuplicateResourceException;
import com.assessment.platform.exception.ResourceNotFoundException;
import com.assessment.platform.exception.UnauthorizedException;
import com.assessment.platform.repository.TeamRepository;
import com.assessment.platform.repository.UserRepository;
import com.assessment.platform.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;
    private final EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered");
        }

        Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));

        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + request.getRole());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .team(team)
                .role(role)
                .teamLeadName(request.getTeamLeadName())
                .description(request.getDescription())
                .using2FA(true)
                .build();

        user = userRepository.save(user);

        String otp = otpService.generateOtp(user.getEmail());
        emailService.sendOtpEmail(user.getEmail(), otp);

        return AuthResponse.builder()
                .email(user.getEmail())
                .name(user.getName())
                .requires2FA(true)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String otp = otpService.generateOtp(user.getEmail());
        emailService.sendOtpEmail(user.getEmail(), otp);

        return AuthResponse.builder()
                .email(user.getEmail())
                .name(user.getName())
                .requires2FA(true)
                .build();
    }

    public AuthResponse verifyOtp(OtpVerifyRequest request) {
        boolean valid = otpService.verifyOtp(request.getEmail(), request.getOtp());
        if (!valid) {
            throw new UnauthorizedException("Invalid or expired OTP");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name(),
                user.getId(),
                user.getTeam() != null ? user.getTeam().getId() : null
        );

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .userId(user.getId())
                .teamId(user.getTeam() != null ? user.getTeam().getId() : null)
                .teamName(user.getTeam() != null ? user.getTeam().getName() : null)
                .requires2FA(false)
                .build();
    }
}
