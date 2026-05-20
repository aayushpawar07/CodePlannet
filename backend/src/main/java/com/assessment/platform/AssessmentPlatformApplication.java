package com.assessment.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AssessmentPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(AssessmentPlatformApplication.class, args);
    }
}
