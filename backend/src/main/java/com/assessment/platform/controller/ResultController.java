package com.assessment.platform.controller;

import com.assessment.platform.dto.response.ApiResponse;
import com.assessment.platform.dto.response.SubmissionResponse;
import com.assessment.platform.service.TestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/results")
@RequiredArgsConstructor
public class ResultController {

    private final TestService testService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubmissionResponse>>> getMyResults() {
        List<SubmissionResponse> results = testService.getMyResults();
        return ResponseEntity.ok(ApiResponse.success(results));
    }
}
