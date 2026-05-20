package com.assessment.platform.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendOtpEmail(String to, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Assessment Platform - OTP Verification");
            message.setText("Your OTP code is: " + otp + "\n\nThis code will expire in 5 minutes.\n\nDo not share this code with anyone.");
            mailSender.send(message);
            log.info("OTP email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}", to, e);
        }
    }

    @Async
    public void sendResultEmail(String to, String userName, String testTitle, int score, int totalMarks) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Assessment Platform - Test Results: " + testTitle);
            message.setText(String.format(
                    "Dear %s,\n\n" +
                    "Your results for \"%s\" have been released.\n\n" +
                    "Score: %d / %d\n\n" +
                    "Regards,\nAssessment Platform",
                    userName, testTitle, score, totalMarks
            ));
            mailSender.send(message);
            log.info("Result email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send result email to: {}", to, e);
        }
    }
}
